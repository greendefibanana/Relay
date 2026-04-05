use bolt_lang::*;
use relay_component_types::{consent_status, transfer_restriction, AssetRegistry, DealTerms};
use serde::Deserialize;

declare_id!("FRfp37UqvopSMDPJ4wo4yraaDm7k4MN7zCU2pHEmTbXm");

#[derive(Deserialize, Clone)]
pub struct CancelListingArgs {
    // No args needed; authority is validated as the owner.
}

#[error_code]
pub enum CancelListingError {
    #[msg("CancelListing args could not be decoded.")]
    InvalidArgs,
    #[msg("Signer is not the listing owner.")]
    NotOwner,
    #[msg("Listing has already been sold and cannot be cancelled.")]
    AssetAlreadySold,
    #[msg("Listing has not been initialised.")]
    ListingNotInitialized,
}

/// Event emitted when a listing is cancelled (I-2).
#[event]
pub struct ListingCancelled {
    pub owner: Pubkey,
    pub asset_type: u8,
}

#[system]
pub mod system_cancel_listing {
    use super::*;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        // Args are currently empty but we keep the deserialize for forward compat
        let _args: CancelListingArgs =
            serde_json::from_slice(&args_p).map_err(|_| error!(CancelListingError::InvalidArgs))?;

        let asset_registry = &mut ctx.accounts.asset_registry;
        let deal_terms = &mut ctx.accounts.deal_terms;

        // Guard: listing must exist
        require!(
            asset_registry.owner != Pubkey::default(),
            CancelListingError::ListingNotInitialized
        );
        // Guard: only owner can cancel
        require!(
            ctx.accounts.authority.key == &asset_registry.owner,
            CancelListingError::NotOwner
        );
        // Guard: cannot cancel sold listing
        require!(
            !asset_registry.is_sold,
            CancelListingError::AssetAlreadySold
        );

        let owner = asset_registry.owner;
        let at = asset_registry.asset_type;

        // ── Reset asset_registry ────────────────────────────────────
        asset_registry.owner = Pubkey::default();
        asset_registry.asset_type = 0;
        asset_registry.is_sold = false;

        // ── Reset deal_terms ────────────────────────────────────────
        deal_terms.min_price = 0;
        deal_terms.token_amount = 0;
        deal_terms.valuation_cap = 0;
        deal_terms.token_mint = Pubkey::default();
        deal_terms.vesting_source_program = Pubkey::default();
        deal_terms.vesting_source_position = Pubkey::default();
        deal_terms.vesting_start_ts = 0;
        deal_terms.vesting_cliff_ts = 0;
        deal_terms.vesting_end_ts = 0;
        deal_terms.unlocked_amount = 0;
        deal_terms.claimed_amount = 0;
        deal_terms.private_buyer = Pubkey::default();
        deal_terms.transfer_restriction_mode = transfer_restriction::UNRESTRICTED;
        deal_terms.settlement_mode = 0;
        deal_terms.settlement_status = 0;
        deal_terms.approved_buyer = Pubkey::default();
        deal_terms.settlement_attestor = Pubkey::default();
        deal_terms.settlement_expires_at = 0;
        deal_terms.required_settlement_attestor = Pubkey::default();
        deal_terms.settlement_nonce = 0;
        deal_terms.settlement_proof_id = Pubkey::default();
        deal_terms.settlement_policy_version = 0;
        deal_terms.settlement_prepared_at = 0;
        deal_terms.required_consent_authority = Pubkey::default();
        deal_terms.consent_status = consent_status::NOT_REQUIRED;
        deal_terms.consent_approved_buyer = Pubkey::default();
        deal_terms.consent_authority = Pubkey::default();
        deal_terms.consent_expires_at = 0;
        deal_terms.consent_nonce = 0;

        emit!(ListingCancelled {
            owner,
            asset_type: at,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub asset_registry: AssetRegistry,
        pub deal_terms: DealTerms,
    }
}
