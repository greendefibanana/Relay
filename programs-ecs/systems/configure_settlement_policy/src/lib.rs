use std::str::FromStr;

use bolt_lang::*;
use relay_component_types::{parse_optional_pubkey, SettlementAuthorityPolicy};
use serde::Deserialize;

declare_id!("7WTkuFXzdtYdFJGKnFB2oWrViVVpqqtsscULaQo4DXLq");

#[derive(Deserialize, Clone)]
pub struct ConfigureSettlementPolicyArgs {
    #[serde(default)]
    pub policy_authority: String,
    #[serde(default)]
    pub is_enabled: bool,
    pub version: u64,
    pub primary_attestor: String,
    #[serde(default)]
    pub secondary_attestor: String,
    #[serde(default)]
    pub tertiary_attestor: String,
    /// The authorized clearance issuer (C-1 support).
    #[serde(default)]
    pub clearance_authority: String,
}

#[error_code]
pub enum ConfigureSettlementPolicyError {
    #[msg("Settlement policy args could not be decoded.")]
    InvalidArgs,
    #[msg("Policy authority pubkey is invalid.")]
    InvalidPolicyAuthority,
    #[msg("Primary attestor pubkey is invalid.")]
    InvalidPrimaryAttestor,
    #[msg("Secondary attestor pubkey is invalid.")]
    InvalidSecondaryAttestor,
    #[msg("Tertiary attestor pubkey is invalid.")]
    InvalidTertiaryAttestor,
    #[msg("Settlement policy version must increase monotonically.")]
    InvalidVersion,
    #[msg("Settlement policy authority is not allowed to update this policy.")]
    UnauthorizedPolicyAuthority,
    #[msg("At least one settlement attestor must be configured when the policy is enabled.")]
    MissingEnabledAttestor,
    #[msg("Clearance authority pubkey is invalid.")]
    InvalidClearanceAuthority,
}

/// Event emitted when the settlement policy is updated (I-2).
#[event]
pub struct SettlementPolicyConfigured {
    pub policy_authority: Pubkey,
    pub version: u64,
    pub is_enabled: bool,
    pub clearance_authority: Pubkey,
}

#[system]
pub mod system_configure_settlement_policy {
    use super::*;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        let args: ConfigureSettlementPolicyArgs = serde_json::from_slice(&args_p)
            .map_err(|_| error!(ConfigureSettlementPolicyError::InvalidArgs))?;
        let primary_attestor = Pubkey::from_str(&args.primary_attestor)
            .map_err(|_| error!(ConfigureSettlementPolicyError::InvalidPrimaryAttestor))?;
        let secondary_attestor = parse_optional_pubkey(
            &args.secondary_attestor,
            error!(ConfigureSettlementPolicyError::InvalidSecondaryAttestor),
        )?;
        let tertiary_attestor = parse_optional_pubkey(
            &args.tertiary_attestor,
            error!(ConfigureSettlementPolicyError::InvalidTertiaryAttestor),
        )?;
        let next_policy_authority = if args.policy_authority.trim().is_empty() {
            *ctx.accounts.authority.key
        } else {
            parse_optional_pubkey(
                &args.policy_authority,
                error!(ConfigureSettlementPolicyError::InvalidPolicyAuthority),
            )?
        };
        let clearance_authority = parse_optional_pubkey(
            &args.clearance_authority,
            error!(ConfigureSettlementPolicyError::InvalidClearanceAuthority),
        )?;

        let policy = &mut ctx.accounts.settlement_authority_policy;
        if policy.policy_authority != Pubkey::default() {
            require!(
                ctx.accounts.authority.key == &policy.policy_authority,
                ConfigureSettlementPolicyError::UnauthorizedPolicyAuthority
            );
        }

        require!(
            args.version > policy.version,
            ConfigureSettlementPolicyError::InvalidVersion
        );
        require!(
            !args.is_enabled || primary_attestor != Pubkey::default(),
            ConfigureSettlementPolicyError::MissingEnabledAttestor
        );

        policy.policy_authority = next_policy_authority;
        policy.is_enabled = args.is_enabled;
        policy.version = args.version;
        policy.primary_attestor = primary_attestor;
        policy.secondary_attestor = secondary_attestor;
        policy.tertiary_attestor = tertiary_attestor;
        policy.clearance_authority = clearance_authority;

        // ── I-2: Event emission ─────────────────────────────────────
        emit!(SettlementPolicyConfigured {
            policy_authority: next_policy_authority,
            version: args.version,
            is_enabled: args.is_enabled,
            clearance_authority,
        });

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub settlement_authority_policy: SettlementAuthorityPolicy,
    }
}
