use std::str::FromStr;

use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
};
use bolt_lang::*;
use relay_component_types::{
    asset_type, consent_status, parse_optional_pubkey, settlement_status,
    transfer_restriction, AssetRegistry, DealTerms,
};
use serde::Deserialize;

declare_id!("FgVyAJoCFkym9QjD8NsQ3SbHVkJEbECjYHJ7PpdetkCN");

#[derive(Deserialize, Clone)]
pub struct CreateListingArgs {
    pub owner: String,
    pub asset_type: u8,
    pub min_price: u64,
    pub token_amount: u64,
    pub valuation_cap: u64,
    #[serde(default)]
    pub token_mint: String,
    #[serde(default)]
    pub vesting_source_program: String,
    #[serde(default)]
    pub vesting_source_position: String,
    #[serde(default)]
    pub vesting_start_ts: u64,
    #[serde(default)]
    pub vesting_cliff_ts: u64,
    #[serde(default)]
    pub vesting_end_ts: u64,
    #[serde(default)]
    pub unlocked_amount: u64,
    #[serde(default)]
    pub claimed_amount: u64,
    #[serde(default)]
    pub private_buyer: String,
    #[serde(default)]
    pub transfer_restriction_mode: u8,
    #[serde(default)]
    pub settlement_mode: u8,
    #[serde(default)]
    pub settlement_expires_at: u64,
    #[serde(default)]
    pub required_settlement_attestor: String,
    #[serde(default)]
    pub required_consent_authority: String,
}

#[error_code]
pub enum CreateListingError {
    #[msg("CreateListing args could not be decoded.")]
    InvalidArgs,
    #[msg("Owner pubkey is invalid.")]
    InvalidOwner,
    #[msg("Minimum price must be greater than zero.")]
    InvalidMinPrice,
    #[msg("Token amount must be greater than zero.")]
    InvalidTokenAmount,
    #[msg("Asset type is unsupported.")]
    InvalidAssetType,
    #[msg("Token mint pubkey is invalid.")]
    InvalidTokenMint,
    #[msg("Vesting source program pubkey is invalid.")]
    InvalidVestingSourceProgram,
    #[msg("Vesting source position pubkey is invalid.")]
    InvalidVestingSourcePosition,
    #[msg("Vesting schedule is invalid.")]
    InvalidVestingSchedule,
    #[msg("Unlocked amount exceeds token amount.")]
    InvalidUnlockedAmount,
    #[msg("Claimed amount exceeds token amount.")]
    InvalidClaimedAmount,
    #[msg("Private buyer pubkey is invalid.")]
    InvalidPrivateBuyer,
    #[msg("Transfer restriction mode is invalid.")]
    InvalidTransferRestrictionMode,
    #[msg("Settlement mode is invalid.")]
    InvalidSettlementMode,
    #[msg("Required settlement attestor pubkey is invalid.")]
    InvalidRequiredSettlementAttestor,
    #[msg("Required consent authority pubkey is invalid.")]
    InvalidRequiredConsentAuthority,
    #[msg("Signer does not match the listing owner.")]
    OwnerNotSigner,
    #[msg("Listing has already been initialised for this entity.")]
    ListingAlreadyInitialized,
    #[msg("Token escrow accounts are required when a token mint is supplied.")]
    MissingTokenEscrowAccounts,
    #[msg("Token program account is invalid.")]
    InvalidTokenProgram,
    #[msg("Seller token account does not match the listing owner and mint.")]
    InvalidSellerTokenAccount,
    #[msg("Escrow token account does not match the listing escrow authority and mint.")]
    InvalidEscrowTokenAccount,
}

fn token_program_id() -> Pubkey {
    Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap()
}

fn associated_token_program_id() -> Pubkey {
    Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").unwrap()
}

fn match_offer_program_id() -> Pubkey {
    Pubkey::from_str("Cr4ZyqvML9tS5HeAFXLTKfBxJKixQStL8dGFmfbUx585").unwrap()
}

fn associated_token_address(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[owner.as_ref(), token_program_id().as_ref(), mint.as_ref()],
        &associated_token_program_id(),
    )
    .0
}

fn token_escrow_authority(asset_registry: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[b"listing-token-escrow", asset_registry.as_ref()],
        &match_offer_program_id(),
    )
    .0
}

fn token_transfer_instruction(
    source: Pubkey,
    destination: Pubkey,
    authority: Pubkey,
    amount: u64,
) -> Instruction {
    let mut data = Vec::with_capacity(9);
    data.push(3); // SPL TokenInstruction::Transfer
    data.extend_from_slice(&amount.to_le_bytes());
    Instruction {
        program_id: token_program_id(),
        accounts: vec![
            AccountMeta::new(source, false),
            AccountMeta::new(destination, false),
            AccountMeta::new_readonly(authority, true),
        ],
        data,
    }
}

#[event]
pub struct ListingCreated {
    pub owner: Pubkey,
    pub asset_type: u8,
    pub min_price: u64,
    pub token_amount: u64,
}

#[system]
pub mod system_create_listing {
    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        const COMPONENT_ACCOUNT_COUNT: usize = 2;

        let args: CreateListingArgs =
            serde_json::from_slice(&args_p).map_err(|_| error!(CreateListingError::InvalidArgs))?;
        let owner =
            Pubkey::from_str(&args.owner).map_err(|_| error!(CreateListingError::InvalidOwner))?;
        let owner_signer_matches =
            (ctx.accounts.authority.key == &owner && ctx.accounts.authority.is_signer)
                || ctx
                    .remaining_accounts
                    .iter()
                    .any(|account| account.key == &owner && account.is_signer);
        require!(
            owner_signer_matches,
            CreateListingError::OwnerNotSigner
        );

        let token_mint =
            parse_optional_pubkey(&args.token_mint, error!(CreateListingError::InvalidTokenMint))?;
        let vesting_source_program = parse_optional_pubkey(
            &args.vesting_source_program,
            error!(CreateListingError::InvalidVestingSourceProgram),
        )?;
        let vesting_source_position = parse_optional_pubkey(
            &args.vesting_source_position,
            error!(CreateListingError::InvalidVestingSourcePosition),
        )?;
        let required_settlement_attestor = parse_optional_pubkey(
            &args.required_settlement_attestor,
            error!(CreateListingError::InvalidRequiredSettlementAttestor),
        )?;
        let private_buyer = parse_optional_pubkey(
            &args.private_buyer,
            error!(CreateListingError::InvalidPrivateBuyer),
        )?;
        let required_consent_authority = parse_optional_pubkey(
            &args.required_consent_authority,
            error!(CreateListingError::InvalidRequiredConsentAuthority),
        )?;

        require!(args.min_price > 0, CreateListingError::InvalidMinPrice);
        require!(args.token_amount > 0, CreateListingError::InvalidTokenAmount);
        require!(
            asset_type::is_supported(args.asset_type),
            CreateListingError::InvalidAssetType
        );
        require!(
            args.transfer_restriction_mode <= transfer_restriction::NON_TRANSFERABLE,
            CreateListingError::InvalidTransferRestrictionMode
        );
        require!(
            args.settlement_mode <= 3,
            CreateListingError::InvalidSettlementMode
        );
        require!(
            args.unlocked_amount <= args.token_amount,
            CreateListingError::InvalidUnlockedAmount
        );
        require!(
            args.claimed_amount <= args.token_amount,
            CreateListingError::InvalidClaimedAmount
        );

        if asset_type::is_vesting(args.asset_type) {
            require!(
                token_mint != Pubkey::default(),
                CreateListingError::InvalidTokenMint
            );
            require!(
                vesting_source_program != Pubkey::default(),
                CreateListingError::InvalidVestingSourceProgram
            );
            require!(
                vesting_source_position != Pubkey::default(),
                CreateListingError::InvalidVestingSourcePosition
            );
            require!(
                args.vesting_start_ts > 0
                    && args.vesting_end_ts > args.vesting_start_ts
                    && args.vesting_cliff_ts >= args.vesting_start_ts
                    && args.vesting_cliff_ts <= args.vesting_end_ts,
                CreateListingError::InvalidVestingSchedule
            );
            require!(
                args.settlement_mode >= 1,
                CreateListingError::InvalidSettlementMode
            );
            require!(
                required_settlement_attestor != Pubkey::default(),
                CreateListingError::InvalidRequiredSettlementAttestor
            );
        }

        if args.transfer_restriction_mode == transfer_restriction::CONSENT_REQUIRED {
            require!(
                required_consent_authority != Pubkey::default(),
                CreateListingError::InvalidRequiredConsentAuthority
            );
        }

        if token_mint != Pubkey::default() {
            let owner_signer = ctx
                .remaining_accounts
                .get(COMPONENT_ACCOUNT_COUNT)
                .cloned()
                .ok_or_else(|| error!(CreateListingError::MissingTokenEscrowAccounts))?;
            let seller_token_account = ctx
                .remaining_accounts
                .get(COMPONENT_ACCOUNT_COUNT + 1)
                .cloned()
                .ok_or_else(|| error!(CreateListingError::MissingTokenEscrowAccounts))?;
            let escrow_token_account = ctx
                .remaining_accounts
                .get(COMPONENT_ACCOUNT_COUNT + 2)
                .cloned()
                .ok_or_else(|| error!(CreateListingError::MissingTokenEscrowAccounts))?;
            let token_program = ctx
                .remaining_accounts
                .get(COMPONENT_ACCOUNT_COUNT + 3)
                .cloned()
                .ok_or_else(|| error!(CreateListingError::MissingTokenEscrowAccounts))?;

            require!(
                token_program.key == &token_program_id(),
                CreateListingError::InvalidTokenProgram
            );
            require!(
                owner_signer.key == &owner && owner_signer.is_signer,
                CreateListingError::OwnerNotSigner
            );

            let asset_registry_key = ctx.accounts.asset_registry.to_account_info().key();
            let expected_seller_token = associated_token_address(&owner, &token_mint);
            let expected_escrow_token =
                associated_token_address(&token_escrow_authority(&asset_registry_key), &token_mint);
            require!(
                seller_token_account.key == &expected_seller_token,
                CreateListingError::InvalidSellerTokenAccount
            );
            require!(
                escrow_token_account.key == &expected_escrow_token,
                CreateListingError::InvalidEscrowTokenAccount
            );

            invoke(
                &token_transfer_instruction(
                    *seller_token_account.key,
                    *escrow_token_account.key,
                    owner,
                    args.token_amount,
                ),
                &[
                    seller_token_account.to_account_info(),
                    escrow_token_account.to_account_info(),
                    owner_signer.to_account_info(),
                    token_program.to_account_info(),
                ],
            )?;
        }

        let asset_registry = &mut ctx.accounts.asset_registry;
        require!(
            asset_registry.owner == Pubkey::default(),
            CreateListingError::ListingAlreadyInitialized
        );

        let deal_terms = &mut ctx.accounts.deal_terms;

        asset_registry.owner = owner;
        asset_registry.seller_payout = owner;
        asset_registry.asset_type = args.asset_type;
        asset_registry.is_sold = false;

        deal_terms.min_price = args.min_price;
        deal_terms.token_amount = args.token_amount;
        deal_terms.valuation_cap = args.valuation_cap;
        deal_terms.token_mint = token_mint;
        deal_terms.vesting_source_program = vesting_source_program;
        deal_terms.vesting_source_position = vesting_source_position;
        deal_terms.vesting_start_ts = args.vesting_start_ts;
        deal_terms.vesting_cliff_ts = args.vesting_cliff_ts;
        deal_terms.vesting_end_ts = args.vesting_end_ts;
        deal_terms.unlocked_amount = args.unlocked_amount;
        deal_terms.claimed_amount = args.claimed_amount;
        deal_terms.private_buyer = private_buyer;
        deal_terms.transfer_restriction_mode = args.transfer_restriction_mode;
        deal_terms.settlement_mode = args.settlement_mode;
        deal_terms.settlement_status = if asset_type::is_vesting(args.asset_type) {
            settlement_status::PENDING
        } else {
            settlement_status::NOT_REQUIRED
        };
        deal_terms.approved_buyer = Pubkey::default();
        deal_terms.settlement_attestor = Pubkey::default();
        deal_terms.settlement_expires_at = args.settlement_expires_at;
        deal_terms.required_settlement_attestor = required_settlement_attestor;
        deal_terms.settlement_nonce = 0;
        deal_terms.settlement_proof_id = Pubkey::default();
        deal_terms.settlement_policy_version = 0;
        deal_terms.settlement_prepared_at = 0;
        deal_terms.required_consent_authority = required_consent_authority;
        deal_terms.consent_status = if args.transfer_restriction_mode
            == transfer_restriction::CONSENT_REQUIRED
        {
            consent_status::PENDING
        } else {
            consent_status::NOT_REQUIRED
        };
        deal_terms.consent_approved_buyer = Pubkey::default();
        deal_terms.consent_authority = Pubkey::default();
        deal_terms.consent_expires_at = 0;
        deal_terms.consent_nonce = 0;

        emit!(ListingCreated {
            owner,
            asset_type: args.asset_type,
            min_price: args.min_price,
            token_amount: args.token_amount,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub asset_registry: AssetRegistry,
        pub deal_terms: DealTerms,
    }
}
