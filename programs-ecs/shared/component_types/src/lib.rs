use std::str::FromStr;

use bolt_lang::*;

// ── Named Constants (I-4) ───────────────────────────────────────────

/// Asset type identifiers.
pub mod asset_type {
    pub const SPOT_TOKEN: u8 = 1;
    pub const VESTING_LINEAR: u8 = 2;
    pub const VESTING_CLIFF: u8 = 3;
    pub const LP_POSITION: u8 = 4;
    pub const NFT: u8 = 5;
    pub const OTHER: u8 = 6;

    pub fn is_supported(t: u8) -> bool {
        matches!(t, SPOT_TOKEN | VESTING_LINEAR | VESTING_CLIFF | LP_POSITION | NFT | OTHER)
    }

    pub fn is_vesting(t: u8) -> bool {
        matches!(t, VESTING_LINEAR | VESTING_CLIFF)
    }
}

/// Clearance type identifiers.
pub mod clearance_type {
    pub const NONE: u8 = 0;
    pub const ACCREDITED_INVESTOR: u8 = 1;
    pub const QUALIFIED_PURCHASER: u8 = 2;
    pub const NON_US_PERSON: u8 = 3;

    pub fn is_valid(t: u8) -> bool {
        matches!(t, ACCREDITED_INVESTOR | QUALIFIED_PURCHASER | NON_US_PERSON)
    }
}

/// Settlement modes.
pub mod settlement_mode {
    pub const NONE: u8 = 0;
    pub const TEE_ATTESTED: u8 = 1;
    pub const MULTISIG: u8 = 2;
    pub const DAO_VOTE: u8 = 3;
}

/// Settlement status values.
pub mod settlement_status {
    pub const NOT_REQUIRED: u8 = 0;
    pub const PENDING: u8 = 1;
    pub const PREPARED: u8 = 2;
    pub const COMPLETED: u8 = 3;
}

/// Transfer consent status values.
pub mod consent_status {
    pub const NOT_REQUIRED: u8 = 0;
    pub const PENDING: u8 = 1;
    pub const APPROVED: u8 = 2;
    pub const CONSUMED: u8 = 3;
}

/// Transfer restriction modes.
pub mod transfer_restriction {
    pub const UNRESTRICTED: u8 = 0;
    pub const CONSENT_REQUIRED: u8 = 1;
    pub const NON_TRANSFERABLE: u8 = 2;
}

/// Payment modes.
pub mod payment_mode {
    pub const NATIVE_SOL: u8 = 1;
}

// ── Shared Helpers (I-1) ────────────────────────────────────────────

/// Returns `true` if `authority` is one of the three configured attestors.
pub fn attestor_is_allowed(policy: &SettlementAuthorityPolicy, authority: &Pubkey) -> bool {
    *authority == policy.primary_attestor
        || *authority == policy.secondary_attestor
        || *authority == policy.tertiary_attestor
}

/// Parses a string into a `Pubkey`, returning `Pubkey::default()` for empty
/// strings. Returns the supplied `error_code` on parse failure.
pub fn parse_optional_pubkey(value: &str, error_code: anchor_lang::error::Error) -> Result<Pubkey> {
    if value.trim().is_empty() {
        return Ok(Pubkey::default());
    }
    Pubkey::from_str(value).map_err(|_| error_code)
}

// ── Component Structs ───────────────────────────────────────────────

#[component_deserialize]
#[derive(Default)]
pub struct AssetRegistry {
    pub owner: Pubkey,
    pub seller_payout: Pubkey,
    pub asset_type: u8,
    pub is_sold: bool,
    pub bolt_metadata: BoltMetadata,
}

#[component_deserialize]
#[derive(Default)]
pub struct BuyerClearance {
    pub buyer: Pubkey,
    pub is_cleared: bool,
    pub clearance_type: u8,
    pub expires_at: u64,
    /// The listing entity this clearance is scoped to (M-2).
    /// `Pubkey::default()` means global (backwards-compatible).
    pub listing_entity: Pubkey,
    pub bolt_metadata: BoltMetadata,
}

#[component_deserialize]
#[derive(Default)]
pub struct DealTerms {
    pub min_price: u64,
    pub token_amount: u64,
    pub valuation_cap: u64,
    pub token_mint: Pubkey,
    pub vesting_source_program: Pubkey,
    pub vesting_source_position: Pubkey,
    pub vesting_start_ts: u64,
    pub vesting_cliff_ts: u64,
    pub vesting_end_ts: u64,
    pub unlocked_amount: u64,
    pub claimed_amount: u64,
    pub private_buyer: Pubkey,
    pub transfer_restriction_mode: u8,
    pub settlement_mode: u8,
    pub settlement_status: u8,
    pub approved_buyer: Pubkey,
    pub settlement_attestor: Pubkey,
    pub settlement_expires_at: u64,
    pub required_settlement_attestor: Pubkey,
    pub settlement_nonce: u64,
    pub settlement_proof_id: Pubkey,
    pub settlement_policy_version: u64,
    pub settlement_prepared_at: u64,
    pub required_consent_authority: Pubkey,
    pub consent_status: u8,
    pub consent_approved_buyer: Pubkey,
    pub consent_authority: Pubkey,
    pub consent_expires_at: u64,
    pub consent_nonce: u64,
    pub bolt_metadata: BoltMetadata,
}

#[component_deserialize]
#[derive(Default)]
pub struct SettlementAuthorityPolicy {
    pub policy_authority: Pubkey,
    pub is_enabled: bool,
    pub version: u64,
    pub primary_attestor: Pubkey,
    pub secondary_attestor: Pubkey,
    pub tertiary_attestor: Pubkey,
    /// The authorized clearance issuer (C-1). Only this pubkey may call
    /// `issue_clearance`. `Pubkey::default()` means not yet configured.
    pub clearance_authority: Pubkey,
    pub bolt_metadata: BoltMetadata,
}

#[component_deserialize]
#[derive(Default)]
pub struct PaymentRoutingPolicy {
    pub policy_authority: Pubkey,
    pub is_enabled: bool,
    pub version: u64,
    pub payment_mode: u8,
    pub protocol_treasury: Pubkey,
    pub operator_treasury: Pubkey,
    pub protocol_fee_bps: u16,
    pub operator_fee_bps: u16,
    pub bolt_metadata: BoltMetadata,
}
