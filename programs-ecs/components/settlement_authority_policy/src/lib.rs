use bolt_lang::*;

declare_id!("DxV3D2u8LPiJVZTJT7EkoovhXok4uzxZHwDznXmchHvG");

#[component(delegate)]
#[derive(Copy, Default)]
pub struct SettlementAuthorityPolicy {
    /// Policy owner that can rotate attestors and bump the version.
    pub policy_authority: Pubkey,
    /// Whether settlement attestations are currently enabled.
    pub is_enabled: bool,
    /// Monotonic policy version. Outstanding proofs are pinned to one version.
    pub version: u64,
    /// Up to three globally allowed settlement attestors.
    pub primary_attestor: Pubkey,
    pub secondary_attestor: Pubkey,
    pub tertiary_attestor: Pubkey,
    /// Authority allowed to issue buyer clearance inside PER.
    pub clearance_authority: Pubkey,
}
