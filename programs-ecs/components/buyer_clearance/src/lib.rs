use bolt_lang::*;

declare_id!("H9SDPiu38JtdPJaKueCnoAjjNBPHrfUxUgS95JPRPDM5");

/// Clearance type constants:
///   0 = None (default / not cleared)
///   1 = Accredited Investor (Reg D 506(c))
///   2 = Qualified Purchaser ($5M+ investments)
///   3 = Non-US Person (Reg S)
#[component(delegate)]
#[derive(Copy, Default)]
pub struct BuyerClearance {
    /// The buyer wallet this clearance belongs to.
    pub buyer: Pubkey,
    /// Whether the buyer has been cleared by a TEE-verified process.
    pub is_cleared: bool,
    /// The type of clearance granted (see constants above).
    pub clearance_type: u8,
    /// Unix timestamp when this clearance expires. 0 = no expiry.
    pub expires_at: u64,
    /// The listing entity this clearance is scoped to (M-2).
    /// `Pubkey::default()` = global / backwards-compatible.
    pub listing_entity: Pubkey,
}
