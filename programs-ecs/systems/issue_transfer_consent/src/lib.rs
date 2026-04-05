use std::str::FromStr;

use bolt_lang::*;
use relay_component_types::{consent_status, transfer_restriction, AssetRegistry, DealTerms};
use serde::Deserialize;

declare_id!("ERJNXy2po3hrkGEJ3XM7hvMg3k2jRP1emb32voWvPNU9");

#[derive(Deserialize, Clone)]
pub struct IssueTransferConsentArgs {
    pub buyer: String,
    #[serde(default)]
    pub consent_expires_at: u64,
    #[serde(default)]
    pub consent_nonce: u64,
}

#[error_code]
pub enum IssueTransferConsentError {
    #[msg("Transfer consent args could not be decoded.")]
    InvalidArgs,
    #[msg("Buyer pubkey is invalid.")]
    InvalidBuyer,
    #[msg("Transfer consent is not required for this listing.")]
    ConsentNotRequired,
    #[msg("Listing has already been sold.")]
    AssetAlreadySold,
    #[msg("This listing is missing a required consent authority.")]
    MissingRequiredConsentAuthority,
    #[msg("The apply authority does not match the listing's required consent authority.")]
    UnauthorizedConsentAuthority,
    #[msg("This private listing is reserved for a different buyer.")]
    PrivateBuyerMismatch,
    #[msg("Consent nonce must increase monotonically.")]
    InvalidConsentNonce,
}

/// Event emitted when transfer consent is granted (I-2).
#[event]
pub struct TransferConsentIssued {
    pub buyer: Pubkey,
    pub authority: Pubkey,
    pub consent_nonce: u64,
}

#[system]
pub mod system_issue_transfer_consent {
    use super::*;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        let args: IssueTransferConsentArgs =
            serde_json::from_slice(&args_p).map_err(|_| error!(IssueTransferConsentError::InvalidArgs))?;
        let buyer =
            Pubkey::from_str(&args.buyer).map_err(|_| error!(IssueTransferConsentError::InvalidBuyer))?;

        let asset_registry = &ctx.accounts.asset_registry;
        let deal_terms = &mut ctx.accounts.deal_terms;

        require!(
            deal_terms.transfer_restriction_mode == transfer_restriction::CONSENT_REQUIRED,
            IssueTransferConsentError::ConsentNotRequired
        );
        require!(
            !asset_registry.is_sold,
            IssueTransferConsentError::AssetAlreadySold
        );
        require!(
            deal_terms.required_consent_authority != Pubkey::default(),
            IssueTransferConsentError::MissingRequiredConsentAuthority
        );
        require!(
            ctx.accounts.authority.key == &deal_terms.required_consent_authority,
            IssueTransferConsentError::UnauthorizedConsentAuthority
        );
        require!(
            deal_terms.private_buyer == Pubkey::default() || deal_terms.private_buyer == buyer,
            IssueTransferConsentError::PrivateBuyerMismatch
        );
        require!(
            args.consent_nonce > deal_terms.consent_nonce,
            IssueTransferConsentError::InvalidConsentNonce
        );

        deal_terms.consent_approved_buyer = buyer;
        deal_terms.consent_authority = *ctx.accounts.authority.key;
        deal_terms.consent_expires_at = args.consent_expires_at;
        deal_terms.consent_nonce = args.consent_nonce;
        deal_terms.consent_status = consent_status::APPROVED;

        // ── I-2: Event emission ─────────────────────────────────────
        emit!(TransferConsentIssued {
            buyer,
            authority: *ctx.accounts.authority.key,
            consent_nonce: args.consent_nonce,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub asset_registry: AssetRegistry,
        pub deal_terms: DealTerms,
    }
}
