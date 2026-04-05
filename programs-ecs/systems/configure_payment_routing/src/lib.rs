use std::str::FromStr;

use bolt_lang::*;
use relay_component_types::{parse_optional_pubkey, payment_mode, PaymentRoutingPolicy};
use serde::Deserialize;

declare_id!("Gnwd2U3g37AiZ5k4rphRnKHBx7UHujQupaE7XArMY8vt");

#[derive(Deserialize, Clone)]
pub struct ConfigurePaymentRoutingArgs {
    #[serde(default)]
    pub policy_authority: String,
    #[serde(default)]
    pub is_enabled: bool,
    pub version: u64,
    #[serde(default = "default_payment_mode")]
    pub payment_mode: u8,
    #[serde(default)]
    pub protocol_treasury: String,
    #[serde(default)]
    pub operator_treasury: String,
    #[serde(default)]
    pub protocol_fee_bps: u16,
    #[serde(default)]
    pub operator_fee_bps: u16,
}

fn default_payment_mode() -> u8 {
    payment_mode::NATIVE_SOL
}

#[error_code]
pub enum ConfigurePaymentRoutingError {
    #[msg("Payment routing args could not be decoded.")]
    InvalidArgs,
    #[msg("Policy authority pubkey is invalid.")]
    InvalidPolicyAuthority,
    #[msg("Protocol treasury pubkey is invalid.")]
    InvalidProtocolTreasury,
    #[msg("Operator treasury pubkey is invalid.")]
    InvalidOperatorTreasury,
    #[msg("Payment routing version must increase monotonically.")]
    InvalidVersion,
    #[msg("Payment routing authority is not allowed to update this policy.")]
    UnauthorizedPolicyAuthority,
    #[msg("Only native SOL payment mode is currently supported.")]
    UnsupportedPaymentMode,
    #[msg("Total payment fees cannot exceed 10000 basis points.")]
    InvalidFeeConfiguration,
    #[msg("Protocol treasury is required when protocol fees are enabled.")]
    MissingProtocolTreasury,
    #[msg("Operator treasury is required when operator fees are enabled.")]
    MissingOperatorTreasury,
}

/// Event emitted when payment routing policy is updated (I-2).
#[event]
pub struct PaymentRoutingConfigured {
    pub policy_authority: Pubkey,
    pub version: u64,
    pub is_enabled: bool,
    pub payment_mode: u8,
}

#[system]
pub mod system_configure_payment_routing {
    use super::*;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        let args: ConfigurePaymentRoutingArgs = serde_json::from_slice(&args_p)
            .map_err(|_| error!(ConfigurePaymentRoutingError::InvalidArgs))?;
        let next_policy_authority = if args.policy_authority.trim().is_empty() {
            *ctx.accounts.authority.key
        } else {
            parse_optional_pubkey(
                &args.policy_authority,
                error!(ConfigurePaymentRoutingError::InvalidPolicyAuthority),
            )?
        };
        let protocol_treasury = parse_optional_pubkey(
            &args.protocol_treasury,
            error!(ConfigurePaymentRoutingError::InvalidProtocolTreasury),
        )?;
        let operator_treasury = parse_optional_pubkey(
            &args.operator_treasury,
            error!(ConfigurePaymentRoutingError::InvalidOperatorTreasury),
        )?;
        let total_fee_bps = args
            .protocol_fee_bps
            .checked_add(args.operator_fee_bps)
            .ok_or_else(|| error!(ConfigurePaymentRoutingError::InvalidFeeConfiguration))?;

        let policy = &mut ctx.accounts.payment_routing_policy;
        if policy.policy_authority != Pubkey::default() {
            require!(
                ctx.accounts.authority.key == &policy.policy_authority,
                ConfigurePaymentRoutingError::UnauthorizedPolicyAuthority
            );
        }

        require!(
            args.version > policy.version,
            ConfigurePaymentRoutingError::InvalidVersion
        );
        require!(
            args.payment_mode == payment_mode::NATIVE_SOL,
            ConfigurePaymentRoutingError::UnsupportedPaymentMode
        );
        require!(
            total_fee_bps <= 10_000,
            ConfigurePaymentRoutingError::InvalidFeeConfiguration
        );
        require!(
            args.protocol_fee_bps == 0 || protocol_treasury != Pubkey::default(),
            ConfigurePaymentRoutingError::MissingProtocolTreasury
        );
        require!(
            args.operator_fee_bps == 0 || operator_treasury != Pubkey::default(),
            ConfigurePaymentRoutingError::MissingOperatorTreasury
        );

        policy.policy_authority = next_policy_authority;
        policy.is_enabled = args.is_enabled;
        policy.version = args.version;
        policy.payment_mode = args.payment_mode;
        policy.protocol_treasury = protocol_treasury;
        policy.operator_treasury = operator_treasury;
        policy.protocol_fee_bps = args.protocol_fee_bps;
        policy.operator_fee_bps = args.operator_fee_bps;

        // ── I-2: Event emission ─────────────────────────────────────
        emit!(PaymentRoutingConfigured {
            policy_authority: next_policy_authority,
            version: args.version,
            is_enabled: args.is_enabled,
            payment_mode: args.payment_mode,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub payment_routing_policy: PaymentRoutingPolicy,
    }
}
