use std::str::FromStr;

use bolt_lang::*;
use relay_component_types::{clearance_type, BuyerClearance, SettlementAuthorityPolicy};
use serde::Deserialize;

declare_id!("2e7rfeRKU33mGe9ZLRwNTnDKf8yRJttqPcbXgjX4UXxK");

#[derive(Deserialize, Clone)]
pub struct IssueClearanceArgs {
    /// The buyer wallet address to clear.
    pub buyer: String,
    /// The clearance type to grant (1 = Accredited, 2 = Qualified Purchaser, 3 = Non-US).
    pub clearance_type: u8,
    /// Unix timestamp when this clearance expires. 0 = no expiry.
    pub expires_at: u64,
    /// The listing entity this clearance is scoped to (M-2). Empty = global.
    #[serde(default)]
    pub listing_entity: String,
}

#[error_code]
pub enum IssueClearanceError {
    #[msg("IssueClearance args could not be decoded.")]
    InvalidArgs,
    #[msg("Buyer pubkey is invalid.")]
    InvalidBuyer,
    #[msg("Clearance type must be 1, 2, or 3.")]
    InvalidClearanceType,
    #[msg("Listing entity pubkey is invalid.")]
    InvalidListingEntity,
    #[msg("Clearance authority has not been configured in the settlement policy.")]
    ClearanceAuthorityNotConfigured,
    #[msg("Signer is not the authorized clearance authority.")]
    UnauthorizedClearanceAuthority,
    #[msg("Clearance has already been issued for this buyer. Revoke first.")]
    ClearanceAlreadyIssued,
}

/// Event emitted when clearance is issued (I-2).
#[event]
pub struct ClearanceIssued {
    pub buyer: Pubkey,
    pub clearance_type: u8,
    pub expires_at: u64,
    pub listing_entity: Pubkey,
    pub authority: Pubkey,
}

#[system]
pub mod system_issue_clearance {
    use super::*;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        let args: IssueClearanceArgs =
            serde_json::from_slice(&args_p).map_err(|_| error!(IssueClearanceError::InvalidArgs))?;
        let buyer =
            Pubkey::from_str(&args.buyer).map_err(|_| error!(IssueClearanceError::InvalidBuyer))?;
        let listing_entity = if args.listing_entity.trim().is_empty() {
            Pubkey::default()
        } else {
            Pubkey::from_str(&args.listing_entity)
                .map_err(|_| error!(IssueClearanceError::InvalidListingEntity))?
        };

        require!(
            clearance_type::is_valid(args.clearance_type),
            IssueClearanceError::InvalidClearanceType
        );

        // ── C-1: Authority check ────────────────────────────────────
        let policy = &ctx.accounts.settlement_authority_policy;
        require!(
            policy.clearance_authority != Pubkey::default(),
            IssueClearanceError::ClearanceAuthorityNotConfigured
        );
        require!(
            ctx.accounts.authority.key == &policy.clearance_authority,
            IssueClearanceError::UnauthorizedClearanceAuthority
        );

        // ── M-3: Re-initialization guard ────────────────────────────
        let buyer_clearance = &mut ctx.accounts.buyer_clearance;
        require!(
            !buyer_clearance.is_cleared,
            IssueClearanceError::ClearanceAlreadyIssued
        );

        buyer_clearance.buyer = buyer;
        buyer_clearance.is_cleared = true;
        buyer_clearance.clearance_type = args.clearance_type;
        buyer_clearance.expires_at = args.expires_at;
        buyer_clearance.listing_entity = listing_entity;

        // ── I-2: Event emission ─────────────────────────────────────
        emit!(ClearanceIssued {
            buyer,
            clearance_type: args.clearance_type,
            expires_at: args.expires_at,
            listing_entity,
            authority: *ctx.accounts.authority.key,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub buyer_clearance: BuyerClearance,
        pub settlement_authority_policy: SettlementAuthorityPolicy,
    }
}
