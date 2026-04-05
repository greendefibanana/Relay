use proc_macro::TokenStream;

use proc_macro2::TokenStream as TokenStream2;
use quote::quote;
use syn::{parse_macro_input, AttributeArgs, ItemMod, NestedMeta, Type};

#[proc_macro_attribute]
pub fn delegate(args: TokenStream, input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as syn::ItemMod);
    let args = parse_macro_input!(args as syn::AttributeArgs);
    let component_type =
        extract_type_name(&args).expect("Expected a component type in macro arguments");
    let modified = modify_component_module(ast, &component_type);
    TokenStream::from(quote! {
        #modified
    })
}

fn modify_component_module(mut module: ItemMod, component_type: &Type) -> ItemMod {
    let (delegate_fn, delegate_struct) = generate_delegate(component_type);
    let (reinit_undelegate_fn, reinit_undelegate_struct) = generate_reinit_after_undelegate();
    let (undelegate_fn, undelegate_struct) = generate_undelegate();
    let undelegate_with_actions_items = if supports_post_commit_actions(component_type) {
        let (
            undelegate_with_actions_fn,
            undelegate_with_actions_struct,
            undelegate_with_actions_args_struct,
            undelegate_with_actions_meta_struct,
        ) = generate_undelegate_with_actions();
        vec![
            undelegate_with_actions_fn,
            undelegate_with_actions_struct,
            undelegate_with_actions_args_struct,
            undelegate_with_actions_meta_struct,
        ]
    } else {
        vec![]
    };
    module.content = module.content.map(|(brace, mut items)| {
        items.extend(
            vec![
                delegate_fn,
                delegate_struct,
                reinit_undelegate_fn,
                reinit_undelegate_struct,
                undelegate_fn,
                undelegate_struct,
            ]
            .into_iter()
            .chain(undelegate_with_actions_items)
            .into_iter()
            .map(|item| syn::parse2(item).unwrap())
            .collect::<Vec<_>>(),
        );
        (brace, items)
    });
    module
}

fn supports_post_commit_actions(component_type: &Type) -> bool {
    match component_type {
        Type::Path(type_path) => type_path
            .path
            .segments
            .last()
            .map(|segment| segment.ident == "AssetRegistry")
            .unwrap_or(false),
        _ => false,
    }
}

fn generate_undelegate() -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn undelegate(ctx: Context<Undelegate>) -> Result<()> {
                ::bolt_lang::commit_and_undelegate_accounts(
                    &ctx.accounts.payer,
                    vec![&ctx.accounts.delegated_account.to_account_info()],
                    &ctx.accounts.magic_context,
                    &ctx.accounts.magic_program,
                    None,
                )?;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Undelegate<'info> {
                #[account(mut)]
                pub payer: Signer<'info>,
                #[account(mut)]
                /// CHECK: The delegated component
                pub delegated_account: AccountInfo<'info>,
                #[account(mut, address = ::bolt_lang::MAGIC_CONTEXT_ID)]
                /// CHECK: Magic context account
                pub magic_context: AccountInfo<'info>,
                #[account()]
                /// CHECK: Magic program
                pub magic_program: Program<'info, MagicProgram>
            }
        },
    )
}

fn generate_undelegate_with_actions() -> (TokenStream2, TokenStream2, TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn undelegate_with_actions(
                ctx: Context<UndelegateWithActions>,
                post_commit_actions: Vec<UndelegatePostCommitAction>,
            ) -> Result<()> {
                let actions = post_commit_actions
                    .into_iter()
                    .map(|action| ::ephemeral_rollups_sdk::ephem::CallHandler {
                        args: ::ephemeral_rollups_sdk::ActionArgs::new(action.data)
                            .with_escrow_index(action.escrow_index),
                        compute_units: action.compute_units,
                        escrow_authority: ctx.accounts.escrow_authority.to_account_info(),
                        destination_program: action.destination_program,
                        accounts: action
                            .accounts
                            .into_iter()
                            .map(|account| ::ephemeral_rollups_sdk::ShortAccountMeta {
                                pubkey: account.pubkey,
                                is_writable: account.is_writable,
                            })
                            .collect(),
                    })
                    .collect::<Vec<_>>();

                ::ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder::new(
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.magic_context.to_account_info(),
                    ctx.accounts.magic_program.to_account_info(),
                )
                .commit_and_undelegate(&[ctx.accounts.delegated_account.to_account_info()])
                .add_post_commit_actions(actions)
                .build_and_invoke()?;

                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct UndelegateWithActions<'info> {
                #[account(mut)]
                pub payer: Signer<'info>,
                #[account(mut)]
                /// CHECK: The delegated component
                pub delegated_account: AccountInfo<'info>,
                #[account(mut, address = ::bolt_lang::MAGIC_CONTEXT_ID)]
                /// CHECK: Magic context account
                pub magic_context: AccountInfo<'info>,
                #[account()]
                /// CHECK: Magic program
                pub magic_program: Program<'info, MagicProgram>,
                /// CHECK: Escrow authority used to derive the Magic escrow for post-commit actions
                pub escrow_authority: UncheckedAccount<'info>,
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
            pub struct UndelegatePostCommitAction {
                pub data: Vec<u8>,
                pub compute_units: u32,
                pub escrow_index: u8,
                pub destination_program: Pubkey,
                pub accounts: Vec<UndelegatePostCommitAccountMeta>,
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
            pub struct UndelegatePostCommitAccountMeta {
                pub pubkey: Pubkey,
                pub is_writable: bool,
            }
        },
    )
}

fn generate_reinit_after_undelegate() -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn process_undelegation(ctx: Context<InitializeAfterUndelegation>, account_seeds: Vec<Vec<u8>>) -> Result<()> {
                let [delegated_account, buffer, payer, system_program] = [
                    &ctx.accounts.delegated_account,
                    &ctx.accounts.buffer,
                    &ctx.accounts.payer,
                    &ctx.accounts.system_program,
                ];
                ::bolt_lang::undelegate_account(
                    delegated_account,
                    &id(),
                    buffer,
                    payer,
                    system_program,
                    account_seeds,
                )?;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct InitializeAfterUndelegation<'info> {
                /// CHECK: Delegated component
                #[account(mut)]
                pub delegated_account: AccountInfo<'info>,
                /// CHECK: Delegate buffer
                #[account()]
                pub buffer: AccountInfo<'info>,
                /// CHECK: Payer
                #[account(mut)]
                pub payer: AccountInfo<'info>,
                /// CHECK: System program
                pub system_program: AccountInfo<'info>,
            }
        },
    )
}

fn generate_delegate(component_type: &Type) -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn delegate(ctx: Context<DelegateInput>, commit_frequency_ms: u32, validator: Option<Pubkey>) -> Result<()> {
                let pda_seeds: &[&[u8]] = &[<#component_type>::seed(), &ctx.accounts.entity.key().to_bytes()];

                let del_accounts = ::bolt_lang::DelegateAccounts {
                    payer: &ctx.accounts.payer,
                    pda: &ctx.accounts.account,
                    owner_program: &ctx.accounts.owner_program,
                    buffer: &ctx.accounts.buffer,
                    delegation_record: &ctx.accounts.delegation_record,
                    delegation_metadata: &ctx.accounts.delegation_metadata,
                    delegation_program: &ctx.accounts.delegation_program,
                    system_program: &ctx.accounts.system_program,
                };

                let config = ::bolt_lang::DelegateConfig {
                    commit_frequency_ms,
                    validator,
                };

                ::bolt_lang::delegate_account(
                    del_accounts,
                    pda_seeds,
                    config,
                )?;

                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct DelegateInput<'info> {
                pub payer: Signer<'info>,
                #[account()]
                pub entity: Account<'info, Entity>,
                /// CHECK: Component PDA
                #[account(mut)]
                pub account: AccountInfo<'info>,
                /// CHECK: Owner program
                pub owner_program: AccountInfo<'info>,
                /// CHECK: Delegate buffer
                #[account(mut)]
                pub buffer: AccountInfo<'info>,
                /// CHECK: Delegation record
                #[account(mut)]
                pub delegation_record: AccountInfo<'info>,
                /// CHECK: Delegation metadata
                #[account(mut)]
                pub delegation_metadata: AccountInfo<'info>,
                /// CHECK: Delegation program
                pub delegation_program: AccountInfo<'info>,
                /// CHECK: System program
                pub system_program: AccountInfo<'info>,
            }
        },
    )
}

fn extract_type_name(args: &AttributeArgs) -> Option<Type> {
    args.iter().find_map(|arg| {
        if let NestedMeta::Meta(syn::Meta::Path(path)) = arg {
            Some(Type::Path(syn::TypePath {
                qself: None,
                path: path.clone(),
            }))
        } else {
            None
        }
    })
}
