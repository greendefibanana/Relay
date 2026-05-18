use std::str::FromStr;

use anchor_lang::InstructionData;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::{invoke, invoke_signed},
    system_instruction, system_program,
};
use bolt_lang::*;
use ephemeral_rollups_sdk::anchor::{action, commit};
use ephemeral_rollups_sdk::ephem::{CallHandler, MagicIntentBundleBuilder};
use ephemeral_rollups_sdk::{ActionArgs, ShortAccountMeta};
use relay_component_types::{
    asset_type, attestor_is_allowed, consent_status, payment_mode, settlement_status,
    transfer_restriction, AssetRegistry, BuyerClearance, DealTerms, PaymentRoutingPolicy,
    SettlementAuthorityPolicy,
};
use serde::Deserialize;

declare_id!("Cr4ZyqvML9tS5HeAFXLTKfBxJKixQStL8dGFmfbUx585");

#[derive(Deserialize, Clone)]
pub struct MatchOfferArgs {
    pub buyer: String,
    pub bid_price: u64,
    #[serde(default)]
    pub listing_entity: String,
    /// Current unix timestamp supplied by the client. Used to check clearance
    /// expiry. Must be > 0 to prevent timestamp bypass (H-2).
    #[serde(default)]
    pub current_timestamp: i64,
}

#[error_code]
pub enum MatchOfferError {
    #[msg("The asset has already been sold.")]
    AssetAlreadySold,
    #[msg("The submitted bid is below the seller minimum.")]
    BidTooLow,
    #[msg("MatchOffer args could not be decoded.")]
    InvalidArgs,
    #[msg("Buyer has not been cleared for this transaction.")]
    BuyerNotCleared,
    #[msg("Clearance record does not match the buyer.")]
    ClearanceMismatch,
    #[msg("Buyer clearance has expired.")]
    ClearanceExpired,
    #[msg("This private listing is reserved for a different buyer.")]
    PrivateBuyerMismatch,
    #[msg("This vesting position is marked as non-transferable.")]
    PositionNonTransferable,
    #[msg("This vesting position requires settlement attestation before matching.")]
    SettlementNotPrepared,
    #[msg("Settlement approval does not match the buyer.")]
    SettlementBuyerMismatch,
    #[msg("Settlement approval has expired.")]
    SettlementExpired,
    #[msg("Settlement approval is missing a proof id.")]
    SettlementProofMissing,
    #[msg("Settlement approval was issued under a stale policy version.")]
    SettlementPolicyVersionMismatch,
    #[msg("Settlement policy is disabled.")]
    SettlementPolicyDisabled,
    #[msg("Settlement attestor is no longer allowed by policy.")]
    SettlementAttestorRevoked,
    #[msg("Payment routing is disabled.")]
    PaymentRoutingDisabled,
    #[msg("Only native SOL payment routing is currently supported.")]
    UnsupportedPaymentMode,
    #[msg("Payment fee configuration is invalid.")]
    InvalidPaymentFeeConfiguration,
    #[msg("Seller payout account does not match the current seller.")]
    SellerPayoutMismatch,
    #[msg("Protocol treasury account does not match policy.")]
    ProtocolTreasuryMismatch,
    #[msg("Operator treasury account does not match policy.")]
    OperatorTreasuryMismatch,
    #[msg("Protocol treasury is required by policy.")]
    MissingProtocolTreasury,
    #[msg("Operator treasury is required by policy.")]
    MissingOperatorTreasury,
    #[msg("Issuer / admin transfer consent is still pending.")]
    ConsentNotPrepared,
    #[msg("Issuer / admin transfer consent does not match the buyer.")]
    ConsentBuyerMismatch,
    #[msg("Issuer / admin transfer consent has expired.")]
    ConsentExpired,
    #[msg("Buyer must be the transaction signer.")]
    BuyerNotSigner,
    #[msg("A valid current timestamp is required (must be > 0).")]
    TimestampRequired,
    #[msg("Clearance is not scoped to this listing entity.")]
    ClearanceEntityMismatch,
    #[msg("Magic escrow authority must match the matched buyer.")]
    PaymentEscrowAuthorityMismatch,
    #[msg("Magic escrow account must be writable.")]
    EscrowNotWritable,
    #[msg("Magic escrow account must be a signer.")]
    EscrowNotSigner,
    #[msg("The asset must be sold before payment settlement can run.")]
    AssetNotSold,
    #[msg("Token program account is invalid.")]
    InvalidTokenProgram,
    #[msg("Token escrow authority PDA is invalid.")]
    InvalidTokenEscrowAuthority,
    #[msg("Token escrow account must be writable.")]
    TokenEscrowNotWritable,
    #[msg("Buyer token account must be writable.")]
    BuyerTokenAccountNotWritable,
    #[msg("Deal terms account does not match the matched listing.")]
    DealTermsMismatch,
    #[msg("Token amount does not match the listing deal terms.")]
    TokenAmountMismatch,
    #[msg("Token escrow account does not match the listing mint and escrow authority.")]
    InvalidTokenEscrowAccount,
    #[msg("Buyer token account does not match the matched buyer and listing mint.")]
    InvalidBuyerTokenAccount,
    #[msg("Signer does not match the listing owner.")]
    OwnerNotSigner,
    #[msg("Listing has not been initialised.")]
    ListingNotInitialized,
    #[msg("Token escrow balance is below the listed token amount.")]
    TokenEscrowBalanceTooLow,
}

fn token_program_id() -> Pubkey {
    Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap()
}

fn token_escrow_authority(asset_registry: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"listing-token-escrow", asset_registry.as_ref()], &crate::ID)
}

fn associated_token_program_id() -> Pubkey {
    Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").unwrap()
}

fn associated_token_address(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[owner.as_ref(), token_program_id().as_ref(), mint.as_ref()],
        &associated_token_program_id(),
    )
    .0
}

fn token_account_mint_owner(account: &AccountInfo) -> Result<(Pubkey, Pubkey)> {
    let data = account.try_borrow_data()?;
    require!(data.len() >= 64, MatchOfferError::InvalidTokenEscrowAccount);
    let mint = Pubkey::new_from_array(
        data[0..32]
            .try_into()
            .map_err(|_| error!(MatchOfferError::InvalidTokenEscrowAccount))?,
    );
    let owner = Pubkey::new_from_array(
        data[32..64]
            .try_into()
            .map_err(|_| error!(MatchOfferError::InvalidTokenEscrowAccount))?,
    );
    Ok((mint, owner))
}

fn token_account_amount(account: &AccountInfo) -> Result<u64> {
    let data = account.try_borrow_data()?;
    require!(data.len() >= 72, MatchOfferError::InvalidTokenEscrowAccount);
    Ok(u64::from_le_bytes(
        data[64..72]
            .try_into()
            .map_err(|_| error!(MatchOfferError::InvalidTokenEscrowAccount))?,
    ))
}

fn token_transfer_instruction(
    source: Pubkey,
    destination: Pubkey,
    authority: Pubkey,
    amount: u64,
) -> Instruction {
    let mut data = Vec::with_capacity(9);
    data.push(3); // SPL TokenInstruction::Transfer
    data.extend_from_slice(&amount.to_le_bytes());
    Instruction {
        program_id: token_program_id(),
        accounts: vec![
            AccountMeta::new(source, false),
            AccountMeta::new(destination, false),
            AccountMeta::new_readonly(authority, true),
        ],
        data,
    }
}

fn token_close_account_instruction(
    account: Pubkey,
    destination: Pubkey,
    authority: Pubkey,
) -> Instruction {
    Instruction {
        program_id: token_program_id(),
        accounts: vec![
            AccountMeta::new(account, false),
            AccountMeta::new(destination, false),
            AccountMeta::new_readonly(authority, true),
        ],
        data: vec![9], // SPL TokenInstruction::CloseAccount
    }
}

fn compute_fee(amount: u64, fee_bps: u16) -> Result<u64> {
    amount
        .checked_mul(fee_bps as u64)
        .ok_or_else(|| error!(MatchOfferError::InvalidPaymentFeeConfiguration))?
        .checked_div(10_000)
        .ok_or_else(|| error!(MatchOfferError::InvalidPaymentFeeConfiguration))
}

#[event]
pub struct OfferMatched {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub bid_price: u64,
    pub asset_type: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SettlePaymentArgs {
    pub bid_price: u64,
    pub token_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CommitMatchedOfferArgs {
    pub bid_price: u64,
    pub payment_routing_policy: Pubkey,
    pub protocol_treasury: Pubkey,
    pub operator_treasury: Pubkey,
    pub token_amount: u64,
    pub token_escrow_authority: Pubkey,
    pub token_escrow_account: Pubkey,
    pub buyer_token_account: Pubkey,
    pub escrow_index: u8,
}

#[system]
pub mod system_match_offer {
    pub fn execute<'info>(
        ctx: Context<'_, '_, '_, 'info, Components<'info>>,
        args_p: Vec<u8>,
    ) -> Result<Components<'info>> {
        const COMPONENT_ACCOUNT_COUNT: usize = 2;

        let args: MatchOfferArgs =
            serde_json::from_slice(&args_p).map_err(|_| error!(MatchOfferError::InvalidArgs))?;
        let buyer =
            Pubkey::from_str(&args.buyer).map_err(|_| error!(MatchOfferError::InvalidArgs))?;
        let listing_entity = if args.listing_entity.trim().is_empty() {
            Pubkey::default()
        } else {
            Pubkey::from_str(&args.listing_entity).map_err(|_| error!(MatchOfferError::InvalidArgs))?
        };

        require!(
            args.current_timestamp > 0,
            MatchOfferError::TimestampRequired
        );
        let current_ts = args.current_timestamp as u64;

        let buyer_clearance_account = ctx
            .remaining_accounts
            .get(COMPONENT_ACCOUNT_COUNT)
            .cloned()
            .ok_or_else(|| error!(MatchOfferError::BuyerNotCleared))?;
        require!(
            buyer_clearance_account.key != &system_program::ID,
            MatchOfferError::BuyerNotCleared
        );
        let mut buyer_clearance_data: &[u8] = &buyer_clearance_account.try_borrow_data()?;
        let buyer_clearance = BuyerClearance::try_deserialize(&mut buyer_clearance_data)?;

        let payment_routing_policy_account = ctx
            .remaining_accounts
            .get(COMPONENT_ACCOUNT_COUNT + 1)
            .cloned()
            .ok_or_else(|| error!(MatchOfferError::PaymentRoutingDisabled))?;
        let payment_routing_policy = {
            let mut data: &[u8] = &payment_routing_policy_account.try_borrow_data()?;
            PaymentRoutingPolicy::try_deserialize(&mut data)?
        };

        let settlement_policy_account = ctx
            .remaining_accounts
            .get(COMPONENT_ACCOUNT_COUNT + 2)
            .cloned()
            .ok_or_else(|| error!(MatchOfferError::SettlementPolicyDisabled))?;
        let settlement_policy = {
            let mut data: &[u8] = &settlement_policy_account.try_borrow_data()?;
            SettlementAuthorityPolicy::try_deserialize(&mut data)?
        };

        let payment_authority = ctx
            .remaining_accounts
            .get(COMPONENT_ACCOUNT_COUNT + 3)
            .cloned()
            .ok_or_else(|| error!(MatchOfferError::BuyerNotSigner))?;
        require!(
            payment_authority.key == &buyer && payment_authority.is_signer,
            MatchOfferError::BuyerNotSigner
        );

        let seller_payout = ctx
            .remaining_accounts
            .get(COMPONENT_ACCOUNT_COUNT + 4)
            .cloned()
            .ok_or_else(|| error!(MatchOfferError::SellerPayoutMismatch))?;

        require!(buyer_clearance.is_cleared, MatchOfferError::BuyerNotCleared);
        require!(
            buyer_clearance.buyer == buyer,
            MatchOfferError::ClearanceMismatch
        );
        require!(
            buyer_clearance.listing_entity == Pubkey::default()
                || buyer_clearance.listing_entity == listing_entity,
            MatchOfferError::ClearanceEntityMismatch
        );
        if buyer_clearance.expires_at > 0 {
            require!(
                current_ts < buyer_clearance.expires_at,
                MatchOfferError::ClearanceExpired
            );
        }

        let asset_registry = &mut ctx.accounts.asset_registry;
        let deal_terms = &mut ctx.accounts.deal_terms;
        let seller = asset_registry.seller_payout;

        require!(!asset_registry.is_sold, MatchOfferError::AssetAlreadySold);
        require!(
            args.bid_price >= deal_terms.min_price,
            MatchOfferError::BidTooLow
        );
        require!(
            deal_terms.private_buyer == Pubkey::default() || deal_terms.private_buyer == buyer,
            MatchOfferError::PrivateBuyerMismatch
        );
        require!(
            deal_terms.transfer_restriction_mode != transfer_restriction::NON_TRANSFERABLE,
            MatchOfferError::PositionNonTransferable
        );

        if deal_terms.transfer_restriction_mode == transfer_restriction::CONSENT_REQUIRED {
            require!(
                deal_terms.consent_status == consent_status::APPROVED,
                MatchOfferError::ConsentNotPrepared
            );
            require!(
                deal_terms.consent_approved_buyer == buyer,
                MatchOfferError::ConsentBuyerMismatch
            );
            if deal_terms.consent_expires_at > 0 {
                require!(
                    current_ts < deal_terms.consent_expires_at,
                    MatchOfferError::ConsentExpired
                );
            }
        }

        if asset_type::is_vesting(asset_registry.asset_type) {
            require!(
                deal_terms.settlement_mode >= 1
                    && deal_terms.settlement_status == settlement_status::PREPARED,
                MatchOfferError::SettlementNotPrepared
            );
            require!(
                deal_terms.approved_buyer == buyer,
                MatchOfferError::SettlementBuyerMismatch
            );
            if deal_terms.settlement_expires_at > 0 {
                require!(
                    current_ts < deal_terms.settlement_expires_at,
                    MatchOfferError::SettlementExpired
                );
            }
            require!(
                deal_terms.settlement_proof_id != Pubkey::default(),
                MatchOfferError::SettlementProofMissing
            );
            require!(
                settlement_policy.is_enabled,
                MatchOfferError::SettlementPolicyDisabled
            );
            require!(
                deal_terms.settlement_policy_version == settlement_policy.version,
                MatchOfferError::SettlementPolicyVersionMismatch
            );
            require!(
                attestor_is_allowed(&settlement_policy, &deal_terms.settlement_attestor),
                MatchOfferError::SettlementAttestorRevoked
            );
        }

        require!(
            payment_routing_policy.is_enabled,
            MatchOfferError::PaymentRoutingDisabled
        );
        require!(
            payment_routing_policy.payment_mode == payment_mode::NATIVE_SOL,
            MatchOfferError::UnsupportedPaymentMode
        );
        require!(
            seller_payout.key == &seller,
            MatchOfferError::SellerPayoutMismatch
        );

        let protocol_fee = compute_fee(args.bid_price, payment_routing_policy.protocol_fee_bps)?;
        let operator_fee = compute_fee(args.bid_price, payment_routing_policy.operator_fee_bps)?;
        let total_fee = protocol_fee
            .checked_add(operator_fee)
            .ok_or_else(|| error!(MatchOfferError::InvalidPaymentFeeConfiguration))?;
        require!(
            total_fee <= args.bid_price,
            MatchOfferError::InvalidPaymentFeeConfiguration
        );
        let _seller_net_amount = args
            .bid_price
            .checked_sub(total_fee)
            .ok_or_else(|| error!(MatchOfferError::InvalidPaymentFeeConfiguration))?;
        let mut next_account_index = COMPONENT_ACCOUNT_COUNT + 5;
        let protocol_treasury = if protocol_fee > 0 {
            let account = ctx
                .remaining_accounts
                .get(next_account_index)
                .cloned()
                .ok_or_else(|| error!(MatchOfferError::ProtocolTreasuryMismatch))?;
            next_account_index += 1;
            Some(account)
        } else {
            None
        };
        let operator_treasury = if operator_fee > 0 {
            let account = ctx
                .remaining_accounts
                .get(next_account_index)
                .cloned()
                .ok_or_else(|| error!(MatchOfferError::OperatorTreasuryMismatch))?;
            next_account_index += 1;
            Some(account)
        } else {
            None
        };
        let system_program_account = ctx
            .remaining_accounts
            .get(next_account_index)
            .cloned()
            .ok_or_else(|| error!(MatchOfferError::UnsupportedPaymentMode))?;
        require!(
            system_program_account.key == &system_program::ID,
            MatchOfferError::UnsupportedPaymentMode
        );

        if protocol_fee > 0 {
            let protocol_treasury = protocol_treasury
                .as_ref()
                .ok_or_else(|| error!(MatchOfferError::ProtocolTreasuryMismatch))?;
            require!(
                payment_routing_policy.protocol_treasury != Pubkey::default(),
                MatchOfferError::MissingProtocolTreasury
            );
            require!(
                protocol_treasury.key == &payment_routing_policy.protocol_treasury,
                MatchOfferError::ProtocolTreasuryMismatch
            );
        }
        if operator_fee > 0 {
            let operator_treasury = operator_treasury
                .as_ref()
                .ok_or_else(|| error!(MatchOfferError::OperatorTreasuryMismatch))?;
            require!(
                payment_routing_policy.operator_treasury != Pubkey::default(),
                MatchOfferError::MissingOperatorTreasury
            );
            require!(
                operator_treasury.key == &payment_routing_policy.operator_treasury,
                MatchOfferError::OperatorTreasuryMismatch
            );
        }

        asset_registry.owner = buyer;
        asset_registry.is_sold = true;
        if deal_terms.transfer_restriction_mode == transfer_restriction::CONSENT_REQUIRED {
            deal_terms.consent_status = consent_status::CONSUMED;
        }
        if asset_type::is_vesting(asset_registry.asset_type) {
            deal_terms.settlement_status = settlement_status::COMPLETED;
        }

        emit!(OfferMatched {
            buyer,
            seller,
            bid_price: args.bid_price,
            asset_type: asset_registry.asset_type,
        });

        Ok(ctx.accounts)
    }

    pub fn settle_payment(ctx: Context<SettlePayment>, args: SettlePaymentArgs) -> Result<()> {
        let asset_registry = {
            let mut data: &[u8] = &ctx.accounts.asset_registry.try_borrow_data()?;
            AssetRegistry::try_deserialize(&mut data)?
        };
        let deal_terms = {
            let mut data: &[u8] = &ctx.accounts.deal_terms.try_borrow_data()?;
            DealTerms::try_deserialize(&mut data)?
        };
        let payment_routing_policy = {
            let mut data: &[u8] = &ctx.accounts.payment_routing_policy.try_borrow_data()?;
            PaymentRoutingPolicy::try_deserialize(&mut data)?
        };

        // NOTE: is_sold guard removed – on the base layer the AssetRegistry
        require!(asset_registry.is_sold, MatchOfferError::AssetNotSold);
        require!(
            ctx.accounts.escrow_auth.key == &asset_registry.owner,
            MatchOfferError::PaymentEscrowAuthorityMismatch
        );
        require!(
            ctx.accounts.seller_payout.key == &asset_registry.seller_payout,
            MatchOfferError::SellerPayoutMismatch
        );
        // require!(ctx.accounts.escrow.is_signer, MatchOfferError::EscrowNotSigner);
        require!(ctx.accounts.escrow.is_writable, MatchOfferError::EscrowNotWritable);
        require!(
            payment_routing_policy.is_enabled,
            MatchOfferError::PaymentRoutingDisabled
        );
        require!(
            payment_routing_policy.payment_mode == payment_mode::NATIVE_SOL,
            MatchOfferError::UnsupportedPaymentMode
        );

        let protocol_fee =
            compute_fee(args.bid_price, payment_routing_policy.protocol_fee_bps)?;
        let operator_fee =
            compute_fee(args.bid_price, payment_routing_policy.operator_fee_bps)?;
        let total_fee = protocol_fee
            .checked_add(operator_fee)
            .ok_or_else(|| error!(MatchOfferError::InvalidPaymentFeeConfiguration))?;
        require!(
            total_fee <= args.bid_price,
            MatchOfferError::InvalidPaymentFeeConfiguration
        );
        let seller_net_amount = args
            .bid_price
            .checked_sub(total_fee)
            .ok_or_else(|| error!(MatchOfferError::InvalidPaymentFeeConfiguration))?;

        if seller_net_amount > 0 {
            invoke(
                &system_instruction::transfer(
                    ctx.accounts.escrow.key,
                    ctx.accounts.seller_payout.key,
                    seller_net_amount,
                ),
                &[
                    ctx.accounts.escrow.to_account_info(),
                    ctx.accounts.seller_payout.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        if protocol_fee > 0 {
            require!(
                payment_routing_policy.protocol_treasury != Pubkey::default(),
                MatchOfferError::MissingProtocolTreasury
            );
            require!(
                ctx.accounts.protocol_treasury.key
                    == &payment_routing_policy.protocol_treasury,
                MatchOfferError::ProtocolTreasuryMismatch
            );
            invoke(
                &system_instruction::transfer(
                    ctx.accounts.escrow.key,
                    ctx.accounts.protocol_treasury.key,
                    protocol_fee,
                ),
                &[
                    ctx.accounts.escrow.to_account_info(),
                    ctx.accounts.protocol_treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        if operator_fee > 0 {
            require!(
                payment_routing_policy.operator_treasury != Pubkey::default(),
                MatchOfferError::MissingOperatorTreasury
            );
            require!(
                ctx.accounts.operator_treasury.key
                    == &payment_routing_policy.operator_treasury,
                MatchOfferError::OperatorTreasuryMismatch
            );
            invoke(
                &system_instruction::transfer(
                    ctx.accounts.escrow.key,
                    ctx.accounts.operator_treasury.key,
                    operator_fee,
                ),
                &[
                    ctx.accounts.escrow.to_account_info(),
                    ctx.accounts.operator_treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        if args.token_amount > 0 {
            let (expected_authority, bump) =
                token_escrow_authority(ctx.accounts.asset_registry.key);
            require!(
                deal_terms.token_mint != Pubkey::default(),
                MatchOfferError::DealTermsMismatch
            );
            require!(
                args.token_amount == deal_terms.token_amount,
                MatchOfferError::TokenAmountMismatch
            );
            require!(
                ctx.accounts.token_escrow_authority.key == &expected_authority,
                MatchOfferError::InvalidTokenEscrowAuthority
            );
            require!(
                ctx.accounts.token_escrow.is_writable,
                MatchOfferError::TokenEscrowNotWritable
            );
            require!(
                ctx.accounts.buyer_token_account.is_writable,
                MatchOfferError::BuyerTokenAccountNotWritable
            );
            require!(
                ctx.accounts.token_program.key == &token_program_id(),
                MatchOfferError::InvalidTokenProgram
            );
            require!(
                ctx.accounts.token_escrow.key
                    == &associated_token_address(&expected_authority, &deal_terms.token_mint),
                MatchOfferError::InvalidTokenEscrowAccount
            );
            require!(
                ctx.accounts.buyer_token_account.key
                    == &associated_token_address(&asset_registry.owner, &deal_terms.token_mint),
                MatchOfferError::InvalidBuyerTokenAccount
            );

            let (escrow_mint, escrow_owner) =
                token_account_mint_owner(&ctx.accounts.token_escrow.to_account_info())?;
            require!(
                escrow_mint == deal_terms.token_mint && escrow_owner == expected_authority,
                MatchOfferError::InvalidTokenEscrowAccount
            );
            let (buyer_mint, buyer_owner) =
                token_account_mint_owner(&ctx.accounts.buyer_token_account.to_account_info())?;
            require!(
                buyer_mint == deal_terms.token_mint && buyer_owner == asset_registry.owner,
                MatchOfferError::InvalidBuyerTokenAccount
            );

            let asset_registry_key = ctx.accounts.asset_registry.key();
            let signer_seeds: &[&[u8]] = &[
                b"listing-token-escrow",
                asset_registry_key.as_ref(),
                &[bump],
            ];
            invoke_signed(
                &token_transfer_instruction(
                    *ctx.accounts.token_escrow.key,
                    *ctx.accounts.buyer_token_account.key,
                    expected_authority,
                    args.token_amount,
                ),
                &[
                    ctx.accounts.token_escrow.to_account_info(),
                    ctx.accounts.buyer_token_account.to_account_info(),
                    ctx.accounts.token_escrow_authority.to_account_info(),
                    ctx.accounts.token_program.to_account_info(),
                ],
                &[signer_seeds],
            )?;
        }

        Ok(())
    }

    pub fn refund_cancelled_listing_tokens(
        ctx: Context<RefundCancelledListingTokens>,
    ) -> Result<()> {
        let asset_registry = {
            let mut data: &[u8] = &ctx.accounts.asset_registry.try_borrow_data()?;
            AssetRegistry::try_deserialize(&mut data)?
        };
        let deal_terms = {
            let mut data: &[u8] = &ctx.accounts.deal_terms.try_borrow_data()?;
            DealTerms::try_deserialize(&mut data)?
        };

        require!(
            asset_registry.owner != Pubkey::default(),
            MatchOfferError::ListingNotInitialized
        );
        require!(!asset_registry.is_sold, MatchOfferError::AssetAlreadySold);
        require!(
            ctx.accounts.owner.key == &asset_registry.owner,
            MatchOfferError::OwnerNotSigner
        );
        require!(
            deal_terms.token_mint != Pubkey::default() && deal_terms.token_amount > 0,
            MatchOfferError::DealTermsMismatch
        );
        require!(
            ctx.accounts.token_program.key == &token_program_id(),
            MatchOfferError::InvalidTokenProgram
        );

        let (expected_authority, bump) =
            token_escrow_authority(ctx.accounts.asset_registry.key);
        require!(
            ctx.accounts.token_escrow_authority.key == &expected_authority,
            MatchOfferError::InvalidTokenEscrowAuthority
        );
        require!(
            ctx.accounts.token_escrow.is_writable,
            MatchOfferError::TokenEscrowNotWritable
        );
        require!(
            ctx.accounts.owner_token_account.is_writable,
            MatchOfferError::BuyerTokenAccountNotWritable
        );
        require!(
            ctx.accounts.token_escrow.key
                == &associated_token_address(&expected_authority, &deal_terms.token_mint),
            MatchOfferError::InvalidTokenEscrowAccount
        );
        require!(
            ctx.accounts.owner_token_account.key
                == &associated_token_address(&asset_registry.owner, &deal_terms.token_mint),
            MatchOfferError::InvalidBuyerTokenAccount
        );

        let (escrow_mint, escrow_owner) =
            token_account_mint_owner(&ctx.accounts.token_escrow.to_account_info())?;
        require!(
            escrow_mint == deal_terms.token_mint && escrow_owner == expected_authority,
            MatchOfferError::InvalidTokenEscrowAccount
        );
        let (owner_mint, owner_token_owner) =
            token_account_mint_owner(&ctx.accounts.owner_token_account.to_account_info())?;
        require!(
            owner_mint == deal_terms.token_mint && owner_token_owner == asset_registry.owner,
            MatchOfferError::InvalidBuyerTokenAccount
        );

        let escrow_amount = token_account_amount(&ctx.accounts.token_escrow.to_account_info())?;
        require!(
            escrow_amount >= deal_terms.token_amount,
            MatchOfferError::TokenEscrowBalanceTooLow
        );

        let asset_registry_key = ctx.accounts.asset_registry.key();
        let signer_seeds: &[&[u8]] = &[
            b"listing-token-escrow",
            asset_registry_key.as_ref(),
            &[bump],
        ];
        invoke_signed(
            &token_transfer_instruction(
                *ctx.accounts.token_escrow.key,
                *ctx.accounts.owner_token_account.key,
                expected_authority,
                escrow_amount,
            ),
            &[
                ctx.accounts.token_escrow.to_account_info(),
                ctx.accounts.owner_token_account.to_account_info(),
                ctx.accounts.token_escrow_authority.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
            ],
            &[signer_seeds],
        )?;
        invoke_signed(
            &token_close_account_instruction(
                *ctx.accounts.token_escrow.key,
                *ctx.accounts.owner.key,
                expected_authority,
            ),
            &[
                ctx.accounts.token_escrow.to_account_info(),
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.token_escrow_authority.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
            ],
            &[signer_seeds],
        )?;

        Ok(())
    }

    pub fn commit_matched_offer(
        ctx: Context<CommitMatchedOffer>,
        args: CommitMatchedOfferArgs,
    ) -> Result<()> {
        let asset_registry = {
            let mut data: &[u8] = &ctx.accounts.asset_registry.try_borrow_data()?;
            AssetRegistry::try_deserialize(&mut data)?
        };

        let settle_payment_args = crate::instruction::SettlePayment {
            args: SettlePaymentArgs {
                bid_price: args.bid_price,
                token_amount: args.token_amount,
            },
        }
        .data();

        let settle_payment = CallHandler {
            args: ActionArgs::new(settle_payment_args).with_escrow_index(args.escrow_index),
            compute_units: 200_000,
            escrow_authority: ctx.accounts.escrow_authority.to_account_info(),
            destination_program: crate::ID,
            accounts: vec![
                ShortAccountMeta {
                    pubkey: ctx.accounts.asset_registry.key(),
                    is_writable: false,
                },
                ShortAccountMeta {
                    pubkey: ctx.accounts.deal_terms.key(),
                    is_writable: false,
                },
                ShortAccountMeta {
                    pubkey: args.payment_routing_policy,
                    is_writable: false,
                },
                ShortAccountMeta {
                    pubkey: asset_registry.seller_payout,
                    is_writable: true,
                },
                ShortAccountMeta {
                    pubkey: args.protocol_treasury,
                    is_writable: true,
                },
                ShortAccountMeta {
                    pubkey: args.operator_treasury,
                    is_writable: true,
                },
                ShortAccountMeta {
                    pubkey: system_program::ID,
                    is_writable: false,
                },
                ShortAccountMeta {
                    pubkey: args.token_escrow_authority,
                    is_writable: false,
                },
                ShortAccountMeta {
                    pubkey: args.token_escrow_account,
                    is_writable: args.token_amount > 0,
                },
                ShortAccountMeta {
                    pubkey: args.buyer_token_account,
                    is_writable: args.token_amount > 0,
                },
                ShortAccountMeta {
                    pubkey: token_program_id(),
                    is_writable: false,
                },
            ],
        };

        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[ctx.accounts.asset_registry.to_account_info()])
        .add_post_commit_actions([settle_payment])
        .build_and_invoke()?;

        Ok(())
    }

    #[allow(dead_code)]
    pub fn __bolt_context_hint(_ctx: Context<Components>) -> Result<()> {
        Ok(())
    }

    #[system_input]
    pub struct Components {
        pub asset_registry: AssetRegistry,
        pub deal_terms: DealTerms,
    }
}

#[action]
#[derive(Accounts)]
pub struct SettlePayment<'info> {
    /// CHECK: AssetRegistry component account committed back to Solana before this handler runs.
    pub asset_registry: UncheckedAccount<'info>,
    /// CHECK: DealTerms component account for the matched listing.
    pub deal_terms: UncheckedAccount<'info>,
    /// CHECK: PaymentRoutingPolicy component account on Solana.
    pub payment_routing_policy: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Seller payout wallet verified against AssetRegistry.
    pub seller_payout: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Protocol treasury wallet verified against PaymentRoutingPolicy.
    pub protocol_treasury: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Operator treasury wallet verified against PaymentRoutingPolicy.
    pub operator_treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: PDA authority over the listing's escrow token account.
    pub token_escrow_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Token account holding the listed asset until payment settles.
    pub token_escrow: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Buyer token account receiving the listed asset.
    pub buyer_token_account: UncheckedAccount<'info>,
    /// CHECK: SPL Token program.
    pub token_program: UncheckedAccount<'info>,
    /// CHECK: Injected by Magic Actions; used to identify the funded escrow authority.
    pub escrow_auth: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Magic escrow PDA injected by the validator for this action.
    pub escrow: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RefundCancelledListingTokens<'info> {
    /// CHECK: AssetRegistry component account for the active listing.
    pub asset_registry: UncheckedAccount<'info>,
    /// CHECK: DealTerms component account for the active listing.
    pub deal_terms: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: PDA authority over the listing's escrow token account.
    pub token_escrow_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Token account holding the listed asset until cancellation or match settlement.
    pub token_escrow: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Owner token account receiving the refunded asset.
    pub owner_token_account: UncheckedAccount<'info>,
    /// CHECK: SPL Token program.
    pub token_program: UncheckedAccount<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitMatchedOffer<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: Delegated AssetRegistry component account.
    pub asset_registry: UncheckedAccount<'info>,
    /// CHECK: Delegated DealTerms component account for the matched listing.
    pub deal_terms: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Delegated BuyerClearance component account.
    pub buyer_clearance: UncheckedAccount<'info>,
    /// Buyer signer whose Magic escrow funds settlement.
    pub escrow_authority: Signer<'info>,
}
