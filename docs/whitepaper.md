# Relay: Private OTC and Secondary Market Liquidity Layer for Solana

## Overview

Relay is a private liquidity layer for Solana that supports two institutional workflows:

1. Private secondary markets for SAFTs, SAFEs, vested tokens, and locked allocations.
2. Private OTC desks for liquid token block trades, treasury sales, whale-to-whale deals, and confidential buyer/seller matching.

Both paths share the same principle: sensitive negotiation should happen privately, while final settlement should be atomic and verifiable on Solana.

## The Market Problem

Private markets on Solana still depend heavily on manual coordination. SAFTs, SAFEs, vested tokens, and locked allocations are hard to transfer because terms are private, buyers must be screened, and public signaling can create reputational or market risk.

Liquid token OTC has a related problem. Large holders, treasuries, market makers, and projects often avoid public venues when trade size or intent would move markets. Negotiating these trades in public exposes inventory, strategy, counterparties, and pricing expectations.

In both cases, the core issue is information leakage. Relay is designed to reduce that leakage without giving up Solana settlement.

## Relay's Private Architecture

Relay uses **MagicBlock Private Ephemeral Rollups (PER)** and **Trusted Execution Environments (TEEs)** to create confidential RFQ sessions. The protocol keeps negotiation state private, evaluates matching logic inside the TEE, and commits final ownership changes back to Solana.

### BOLT ECS State Split

Relay uses the **BOLT Entity Component System** to separate public and private state:

1. **Public Registry (`AssetRegistry`)**: Tracks asset identity, owner, and settlement state that must be verifiable on Solana.
2. **Confidential Components (`DealTerms`)**: Store minimum price, valuation caps, vesting schedules, block sizes, buyer constraints, and other RFQ terms inside the private execution environment.

This model supports both illiquid secondary listings and liquid OTC block trades without changing the core settlement path.

### Relay Match Protocol (RMP)

The seller, treasury, or desk creates a private listing and delegates the relevant BOLT state into a Relay Ephemeral Rollup. Buyers submit bids through the RFQ flow. The TEE evaluates the offer against private constraints and any required `BuyerClearance` before a match can execute.

When matched, Relay performs atomic settlement and undelegates the public ownership state back to Solana. The public ledger can verify the settlement result, while confidential terms remain shielded.

## Product Paths

### Private Secondary Market

Relay enables private transfers for agreement-backed or restricted assets:

- SAFTs
- SAFEs
- Vested tokens
- Vested memecoins
- Locked allocations
- Equity-style private agreements

This path is designed for founders, employees, early investors, and private buyers who need controlled secondary liquidity with transfer restrictions and confidential terms.

### Private OTC Desk

Relay also supports liquid token OTC workflows:

- Private token block trades
- Treasury sales
- Whale-to-whale OTC deals
- Confidential buyer/seller matching
- Market maker and project OTC coordination

This path is designed for counterparties that need price discovery and settlement without broadcasting size, intent, or counterparty interest to the public market.

## Technical Implementation

- **Execution Environment:** MagicBlock Private Ephemeral Rollups with TEE-backed execution.
- **State Machine:** BOLT ECS.
- **Matching Flow:** Shielded RFQ through `create_listing` and `match_offer`.
- **Compliance Engine:** `BuyerClearance` components for programmatic eligibility checks inside the TEE.
- **Settlement:** Atomic Solana settlement with public `AssetRegistry` updates and confidential `DealTerms`.
- **Network Path:** MVP and test flows run against Solana Devnet and local MagicBlock execution environments.
- **Reference Pricing:** Optional Pyth Lazer reference pricing for assets with liquid underlyings.

## Compliance and Transfer Controls

Relay treats compliance as programmable settlement logic. Buyer eligibility, accreditation, KYC status, issuer approvals, settlement attestation, and listing-specific restrictions can be represented through clearance and policy components.

The TEE evaluates these controls before matching, which lets issuers and desks enforce restrictions without exposing sensitive buyer data or negotiation details on-chain.

## Path Forward

- **Phase 1:** MagicBlock Devnet MVP for shielded RFQ, vested token listings, and private secondary flows.
- **Phase 2:** Expanded secondary support for SAFTs, SAFEs, locked allocations, and issuer-controlled transfer workflows.
- **Phase 3:** Private OTC desk workflows for token blocks, treasury sales, market maker/project coordination, and institutional liquidity partners.

Relay extends Solana liquidity beyond public order flow. It provides a private negotiation layer for assets and trades where discretion, reduced information leakage, and atomic settlement matter.
