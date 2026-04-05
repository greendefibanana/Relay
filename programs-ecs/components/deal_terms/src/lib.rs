use bolt_lang::*;

declare_id!("23vDPBsuhfMEjmySL3p7DWTzXxX6j33xtaWj9VkbM5gg");

// bolt-lang 0.2.4 exposes delegation cleanly, but not a compatible confidential
// component macro for this flow. Confidentiality is enforced operationally by
// keeping this component delegated inside PER and not undelegating it by default.
#[component(delegate)]
#[derive(Copy, Default)]
pub struct DealTerms {
    pub min_price: u64,
    pub token_amount: u64,
    pub valuation_cap: u64,
    /// Underlying token mint for tokenized vesting positions.
    pub token_mint: Pubkey,
    /// Vesting program or contract that governs the underlying position.
    pub vesting_source_program: Pubkey,
    /// Concrete vesting account / stream / escrow that backs the listing.
    pub vesting_source_position: Pubkey,
    /// Vesting schedule start unix timestamp. 0 for non-vesting assets.
    pub vesting_start_ts: u64,
    /// Cliff unix timestamp. 0 when no cliff applies.
    pub vesting_cliff_ts: u64,
    /// Vesting end unix timestamp. 0 for non-vesting assets.
    pub vesting_end_ts: u64,
    /// Amount currently unlocked and immediately transferable / claimable.
    pub unlocked_amount: u64,
    /// Amount already claimed out of the listed vesting position.
    pub claimed_amount: u64,
    /// Reserved buyer for private placements. Default pubkey means public listing.
    pub private_buyer: Pubkey,
    /// 0 = unrestricted, 1 = issuer consent required, 2 = non-transferable.
    pub transfer_restriction_mode: u8,
    /// 0 = no extra settlement attestation required, 1 = TEE verified transfer,
    /// 2 = escrow release, 3 = issuer / admin approval.
    pub settlement_mode: u8,
    /// 0 = not required, 1 = pending, 2 = ready for the approved buyer, 3 = consumed.
    pub settlement_status: u8,
    /// Buyer approved by the settlement attestation step for vesting assets.
    pub approved_buyer: Pubkey,
    /// Off-chain / TEE attestor or operator that prepared settlement.
    pub settlement_attestor: Pubkey,
    /// Unix timestamp when the settlement approval expires. 0 = no expiry.
    pub settlement_expires_at: u64,
    /// Listing-level authority that is allowed to sign settlement approvals.
    pub required_settlement_attestor: Pubkey,
    /// Monotonic nonce for settlement approvals to prevent replay / stale reuse.
    pub settlement_nonce: u64,
    /// Unique proof identifier for the currently active settlement approval.
    pub settlement_proof_id: Pubkey,
    /// Policy version that authorized the active settlement approval.
    pub settlement_policy_version: u64,
    /// Unix timestamp when the settlement approval was prepared.
    pub settlement_prepared_at: u64,
    /// Listing-level authority that is allowed to approve transfer-restricted sales.
    pub required_consent_authority: Pubkey,
    /// 0 = not required, 1 = pending, 2 = ready for the approved buyer, 3 = consumed.
    pub consent_status: u8,
    /// Buyer approved by issuer / admin consent for restricted transfers.
    pub consent_approved_buyer: Pubkey,
    /// Issuer / admin authority that approved the restricted transfer.
    pub consent_authority: Pubkey,
    /// Unix timestamp when the transfer consent expires. 0 = no expiry.
    pub consent_expires_at: u64,
    /// Monotonic nonce for transfer-consent approvals.
    pub consent_nonce: u64,
}
