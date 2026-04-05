use bolt_lang::*;

declare_id!("Dwp5fQgx1CtVfUaPiQhEeKEr2RwXmkarJJxkMXDAw194");

#[component(delegate)]
#[derive(Copy, Default)]
pub struct PaymentRoutingPolicy {
    /// Policy owner that can rotate fee routing and treasury settings.
    pub policy_authority: Pubkey,
    /// Whether payment routing is currently enabled.
    pub is_enabled: bool,
    /// Monotonic config version for auditability.
    pub version: u64,
    /// 1 = native SOL direct payment.
    pub payment_mode: u8,
    /// Treasury that receives the protocol fee.
    pub protocol_treasury: Pubkey,
    /// Treasury that receives the operator fee.
    pub operator_treasury: Pubkey,
    /// Protocol fee in basis points.
    pub protocol_fee_bps: u16,
    /// Operator fee in basis points.
    pub operator_fee_bps: u16,
}
