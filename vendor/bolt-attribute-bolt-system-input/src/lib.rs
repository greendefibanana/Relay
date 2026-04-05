use proc_macro::TokenStream;

use quote::quote;
use syn::{parse_macro_input, Fields, ItemStruct, Lit, Meta, NestedMeta};

/// This macro attribute is used to define a BOLT system input.
///
/// The input can be defined as a struct and will be transformed into an Anchor context.
///
///
/// # Example
/// ```ignore
///#[system_input]
///pub struct Components {
///    pub position: Position,
///}
///
/// ```
#[proc_macro_attribute]
pub fn system_input(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input TokenStream (the struct) into a Rust data structure
    let input = parse_macro_input!(item as ItemStruct);

    // Ensure the struct has named fields
    let fields = match &input.fields {
        Fields::Named(fields) => &fields.named,
        _ => panic!("system_input macro only supports structs with named fields"),
    };
    let name = &input.ident;
    let delegated_account_name =
        syn::Ident::new(&format!("{}DelegatedAccount", name), name.span());
    let bumps_name = syn::Ident::new(&format!("{}Bumps", name), name.span());
    let field_names: Vec<_> = fields.iter().filter_map(|f| f.ident.clone()).collect();

    // Collect imports for components
    let components_imports: Vec<_> = fields
        .iter()
        .filter_map(|field| {
            field.attrs.iter().find_map(|attr| {
                if let Ok(Meta::List(meta_list)) = attr.parse_meta() {
                    if meta_list.path.is_ident("component_id") {
                        meta_list.nested.first().and_then(|nested_meta| {
                            if let NestedMeta::Lit(Lit::Str(lit_str)) = nested_meta {
                                let component_type =
                                    format!("bolt_types::Component{}", lit_str.value());
                                if let Ok(parsed_component_type) =
                                    syn::parse_str::<syn::Type>(&component_type)
                                {
                                    let field_type = &field.ty;
                                    let component_import = quote! {
                                        use #parsed_component_type as #field_type;
                                    };
                                    return Some(component_import);
                                }
                            }
                            None
                        })
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
        })
        .collect();

    // Transform fields for the struct definition
    let transformed_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        let field_type = &f.ty;
        quote! {
            pub #field_name: #delegated_account_name<'info, #field_type>,
        }
    });

    // Generate the new struct used inside the system execution context
    let output_struct = quote! {
        pub struct #name<'info> {
            #(#transformed_fields)*
            pub authority: AccountInfo<'info>,
        }

        #[derive(Default, Debug)]
        pub struct #bumps_name {}
    };

    // Generate the try_to_vec method
    let try_to_vec_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        quote! {
            self.#field_name.try_to_vec()?
        }
    });

    let try_from_fields = fields.iter().enumerate().map(|(i, f)| {
        let field_name = &f.ident;
        quote! {
            #field_name: #delegated_account_name::try_from(
                context
                    .remaining_accounts
                    .as_ref()
                    .get(#i)
                    .ok_or_else(|| ErrorCode::ConstraintAccountIsNone)?,
            )?,
        }
    });

    let try_accounts_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        quote! {
            #field_name: {
                if accounts.is_empty() {
                    return Err(ErrorCode::AccountNotEnoughKeys.into());
                }
                let account = &accounts[0];
                *accounts = &accounts[1..];
                #delegated_account_name::try_from(account)?
            },
        }
    });

    let number_of_components = fields.len();

    let output_trait = quote! {
        pub trait NumberOfComponents<'a, 'b, 'c, 'info, T> {
            const NUMBER_OF_COMPONENTS: usize;
        }
    };

    let output_trait_implementation = quote! {
        impl<'a, 'b, 'c, 'info, T: bolt_lang::Bumps> NumberOfComponents<'a, 'b, 'c, 'info, T> for Context<'a, 'b, 'c, 'info, T> {
            const NUMBER_OF_COMPONENTS: usize = #number_of_components;
        }
    };

    // Generate the implementation of try_to_vec for the struct
    let output_impl = quote! {
        #[derive(Clone)]
        pub struct #delegated_account_name<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> {
            info: AccountInfo<'info>,
            account: T,
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> #delegated_account_name<'info, T> {
            pub fn try_from(info: &AccountInfo<'info>) -> Result<Self> {
                if info.owner == &bolt_lang::solana_program::system_program::ID && info.lamports() == 0 {
                    return Err(ErrorCode::AccountNotInitialized.into());
                }
                let mut data: &[u8] = &info.try_borrow_data()?;
                Ok(Self {
                    info: info.clone(),
                    account: T::try_deserialize(&mut data)?,
                })
            }
        }

        impl<'info, B, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> Accounts<'info, B>
            for #delegated_account_name<'info, T>
        {
            fn try_accounts(
                _program_id: &Pubkey,
                accounts: &mut &'info [AccountInfo<'info>],
                _ix_data: &[u8],
                _bumps: &mut B,
                _reallocs: &mut std::collections::BTreeSet<Pubkey>,
            ) -> Result<Self> {
                if accounts.is_empty() {
                    return Err(ErrorCode::AccountNotEnoughKeys.into());
                }
                let account = &accounts[0];
                *accounts = &accounts[1..];
                Self::try_from(account)
            }
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> AccountsExit<'info>
            for #delegated_account_name<'info, T>
        {
            fn exit(&self, _program_id: &Pubkey) -> Result<()> {
                Ok(())
            }
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> ToAccountMetas
            for #delegated_account_name<'info, T>
        {
            fn to_account_metas(&self, is_signer: Option<bool>) -> Vec<AccountMeta> {
                let is_signer = is_signer.unwrap_or(self.info.is_signer);
                let meta = match self.info.is_writable {
                    false => AccountMeta::new_readonly(*self.info.key, is_signer),
                    true => AccountMeta::new(*self.info.key, is_signer),
                };
                vec![meta]
            }
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> ToAccountInfos<'info>
            for #delegated_account_name<'info, T>
        {
            fn to_account_infos(&self) -> Vec<AccountInfo<'info>> {
                vec![self.info.clone()]
            }
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> AsRef<AccountInfo<'info>>
            for #delegated_account_name<'info, T>
        {
            fn as_ref(&self) -> &AccountInfo<'info> {
                &self.info
            }
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> std::ops::Deref
            for #delegated_account_name<'info, T>
        {
            type Target = T;

            fn deref(&self) -> &Self::Target {
                &self.account
            }
        }

        impl<'info, T: bolt_lang::AccountSerialize + bolt_lang::AccountDeserialize + Clone> std::ops::DerefMut
            for #delegated_account_name<'info, T>
        {
            fn deref_mut(&mut self) -> &mut Self::Target {
                &mut self.account
            }
        }

        impl<'info> #name<'info> {
            pub fn try_to_vec(&self) -> Result<Vec<Vec<u8>>> {
                Ok(vec![#(#try_to_vec_fields,)*])
            }

            #[cfg(feature = "idl-build")]
            pub fn __anchor_private_gen_idl_accounts(
                _accounts: &mut std::collections::BTreeMap<String, anchor_lang::idl::types::IdlAccount>,
                _types: &mut std::collections::BTreeMap<String, anchor_lang::idl::types::IdlTypeDef>,
                ) -> Vec<anchor_lang::idl::types::IdlInstructionAccountItem> {
                Vec::new()
            }

            fn try_from<'a, 'b>(context: &Context<'a, 'b, 'info, 'info, VariadicBoltComponents<'info>>) -> Result<Self> {
                Ok(Self {
                    authority: context.accounts.authority.clone(),
                    #(#try_from_fields)*
                })
            }
        }

        impl<'info> Bumps for #name<'info> {
            type Bumps = #bumps_name;
        }

        impl<'info> Accounts<'info, #bumps_name> for #name<'info> {
            fn try_accounts(
                _program_id: &Pubkey,
                accounts: &mut &'info [AccountInfo<'info>],
                _ix_data: &[u8],
                _bumps: &mut #bumps_name,
                _reallocs: &mut std::collections::BTreeSet<Pubkey>,
            ) -> Result<Self> {
                Ok(Self {
                    #(#try_accounts_fields)*
                    authority: {
                        if accounts.is_empty() {
                            return Err(ErrorCode::AccountNotEnoughKeys.into());
                        }
                        let account = accounts[0].clone();
                        *accounts = &accounts[1..];
                        account
                    },
                })
            }
        }

        impl<'info> AccountsExit<'info> for #name<'info> {
            fn exit(&self, _program_id: &Pubkey) -> Result<()> {
                Ok(())
            }
        }

        impl<'info> ToAccountMetas for #name<'info> {
            fn to_account_metas(&self, is_signer: Option<bool>) -> Vec<AccountMeta> {
                let mut metas = Vec::new();
                #(metas.extend(self.#field_names.to_account_metas(None));)*
                metas.extend(match self.authority.is_writable {
                    false => vec![AccountMeta::new_readonly(*self.authority.key, is_signer.unwrap_or(self.authority.is_signer))],
                    true => vec![AccountMeta::new(*self.authority.key, is_signer.unwrap_or(self.authority.is_signer))],
                });
                metas
            }
        }

        impl<'info> ToAccountInfos<'info> for #name<'info> {
            fn to_account_infos(&self) -> Vec<AccountInfo<'info>> {
                let mut infos = Vec::new();
                #(infos.extend(self.#field_names.to_account_infos());)*
                infos.push(self.authority.clone());
                infos
            }
        }
    };

    // Combine the struct definition and its implementation into the final TokenStream
    let output = quote! {
        #output_struct
        #output_impl
        #output_trait
        #output_trait_implementation
        #(#components_imports)*

        pub(crate) mod __client_accounts_components {
            use super::*;
            use anchor_lang::prelude::borsh;

            #[derive(anchor_lang::AnchorSerialize)]
            pub struct Components {
                #(pub #field_names: Pubkey,)*
                pub authority: Pubkey,
            }

            #[automatically_derived]
            impl anchor_lang::ToAccountMetas for Components {
                fn to_account_metas(&self, _is_signer: Option<bool>) -> Vec<anchor_lang::solana_program::instruction::AccountMeta> {
                    let mut account_metas = vec![];
                    #(account_metas.push(anchor_lang::solana_program::instruction::AccountMeta::new_readonly(self.#field_names, false));)*
                    account_metas.push(anchor_lang::solana_program::instruction::AccountMeta::new_readonly(self.authority, false));
                    account_metas
                }
            }
        }

        pub(crate) mod __cpi_client_accounts_components {
            use super::*;

            pub struct Components<'info> {
                #(pub #field_names: anchor_lang::solana_program::account_info::AccountInfo<'info>,)*
                pub authority: anchor_lang::solana_program::account_info::AccountInfo<'info>,
            }

            #[automatically_derived]
            impl<'info> anchor_lang::ToAccountMetas for Components<'info> {
                fn to_account_metas(&self, _is_signer: Option<bool>) -> Vec<anchor_lang::solana_program::instruction::AccountMeta> {
                    let mut account_metas = vec![];
                    #(account_metas.extend(anchor_lang::ToAccountMetas::to_account_metas(&self.#field_names, None));)*
                    account_metas.extend(anchor_lang::ToAccountMetas::to_account_metas(&self.authority, None));
                    account_metas
                }
            }

            #[automatically_derived]
            impl<'info> anchor_lang::ToAccountInfos<'info> for Components<'info> {
                fn to_account_infos(&self) -> Vec<anchor_lang::solana_program::account_info::AccountInfo<'info>> {
                    let mut account_infos = vec![];
                    #(account_infos.extend(anchor_lang::ToAccountInfos::to_account_infos(&self.#field_names));)*
                    account_infos.extend(anchor_lang::ToAccountInfos::to_account_infos(&self.authority));
                    account_infos
                }
            }
        }

        #[derive(Accounts)]
        pub struct VariadicBoltComponents<'info> {
            /// CHECK: Authority check
            #[account()]
            pub authority: AccountInfo<'info>,
        }
    };

    TokenStream::from(output)
}
