use std::str::FromStr;

use bolt_lang::*;
use relay_component_types::{
    asset_type, attestor_is_allowed, settlement_status, AssetRegistry, DealTerms,
    SettlementAuthorityPolicy,
};
use serde::Deserialize;

declare_id!("BrACdZTWSwNSwFexzUcPtobEB5wxMHXxW3Q9GR5i63Rc");

#[derive(Deserialize, Clone)]
pub struct AttestVestingSettlementArgs {
    pub buyer: String,
    pub settlement_proof_id: String,
    #[serde(default)]
    pub settlement_expires_at: u64,
    #[serde(default)]
    pub settlement_nonce: u64,
    #[serde(default)]
    pub current_timestamp: u64,
}

#[error_code]
pub enum AttestVestingSettlementError {
    #[msg("Settlement attestation args could not be decoded.")]
    InvalidArgs,
    #[msg("Buyer pubkey is invalid.")]
    InvalidBuyer,
    #[msg("Settlement attestation only applies to vesting assets.")]
    NotVestingAsset,
    #[msg("Listing has already been sold.")]
    AssetAlreadySold,
    #[msg("Listing is missing a supported settlement mode.")]
    InvalidSettlementMode,
    #[msg("This listing is missing a required settlement attestor.")]
    MissingRequiredSettlementAttestor,
    #[msg("The apply authority does not match the listing's required settlement attestor.")]
    UnauthorizedAttestor,
    #[msg("This private listing is reserved for a different buyer.")]
    PrivateBuyerMismatch,
    #[msg("Settlement nonce must increase monotonically.")]
    InvalidSettlementNonce,
    #[msg("Settlement proof id pubkey is invalid.")]
    InvalidSettlementProofId,
    #[msg("Settlement proof id cannot be empty.")]
    MissingSettlementProofId,
    #[msg("Settlement approval must expire in the future.")]
    InvalidSettlementExpiry,
    #[msg("Settlement policy is disabled.")]
    SettlementPolicyDisabled,
    #[msg("Settlement attestor is not currently allowed by policy.")]
    UnauthorizedByPolicy,
    #[msg("A valid current timestamp is required (must be > 0).")]
    TimestampRequired,
}

/// Event emitted when a vesting settlement is attested (I-2).
#[event]
pub struct VestingSettlementAttested {
    pub buyer: Pubkey,
    pub attestor: Pubkey,
    pub settlement_proof_id: Pubkey,
    pub settlement_nonce: u64,
}

#[system]
pub mod system_attest_vesting_settlement {
    use super::*;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        let args: AttestVestingSettlementArgs = serde_json::from_slice(&args_p)
            .map_err(|_| error!(AttestVestingSettlementError::InvalidArgs))?;
        let buyer = Pubkey::from_str(&args.buyer)
            .map_err(|_| error!(AttestVestingSettlementError::InvalidBuyer))?;
        let settlement_proof_id = Pubkey::from_str(&args.settlement_proof_id)
            .map_err(|_| error!(AttestVestingSettlementError::InvalidSettlementProofId))?;

        // ── H-2: Require valid positive timestamp ───────────────────
        require!(
            args.current_timestamp > 0,
            AttestVestingSettlementError::TimestampRequired
        );

        let asset_registry = &ctx.accounts.asset_registry;
        let deal_terms = &mut ctx.accounts.deal_terms;
        let settlement_policy = &ctx.accounts.settlement_authority_policy;

        require!(
            asset_type::is_vesting(asset_registry.asset_type),
            AttestVestingSettlementError::NotVestingAsset
        );
        require!(
            !asset_registry.is_sold,
            AttestVestingSettlementError::AssetAlreadySold
        );
        require!(
            deal_terms.settlement_mode >= 1 && deal_terms.settlement_mode <= 3,
            AttestVestingSettlementError::InvalidSettlementMode
        );
        require!(
            deal_terms.required_settlement_attestor != Pubkey::default(),
            AttestVestingSettlementError::MissingRequiredSettlementAttestor
        );
        require!(
            ctx.accounts.authority.key == &deal_terms.required_settlement_attestor,
            AttestVestingSettlementError::UnauthorizedAttestor
        );
        require!(
            settlement_policy.is_enabled,
            AttestVestingSettlementError::SettlementPolicyDisabled
        );
        require!(
            attestor_is_allowed(settlement_policy, ctx.accounts.authority.key),
            AttestVestingSettlementError::UnauthorizedByPolicy
        );
        require!(
            deal_terms.private_buyer == Pubkey::default() || deal_terms.private_buyer == buyer,
            AttestVestingSettlementError::PrivateBuyerMismatch
        );
        require!(
            args.settlement_nonce > deal_terms.settlement_nonce,
            AttestVestingSettlementError::InvalidSettlementNonce
        );
        require!(
            settlement_proof_id != Pubkey::default(),
            AttestVestingSettlementError::MissingSettlementProofId
        );
        require!(
            args.settlement_expires_at > 0 && args.settlement_expires_at > args.current_timestamp,
            AttestVestingSettlementError::InvalidSettlementExpiry
        );

        deal_terms.approved_buyer = buyer;
        deal_terms.settlement_attestor = *ctx.accounts.authority.key;
        deal_terms.settlement_expires_at = args.settlement_expires_at;
        deal_terms.settlement_nonce = args.settlement_nonce;
        deal_terms.settlement_proof_id = settlement_proof_id;
        deal_terms.settlement_policy_version = settlement_policy.version;
        deal_terms.settlement_prepared_at = args.current_timestamp;
        deal_terms.settlement_status = settlement_status::PREPARED;

        // ── I-2: Event emission ─────────────────────────────────────
        emit!(VestingSettlementAttested {
            buyer,
            attestor: *ctx.accounts.authority.key,
            settlement_proof_id,
            settlement_nonce: args.settlement_nonce,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub asset_registry: AssetRegistry,
        pub deal_terms: DealTerms,
        pub settlement_authority_policy: SettlementAuthorityPolicy,
    }
}
