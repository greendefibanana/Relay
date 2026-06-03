# Relay Architecture

Relay is a confidential RFQ protocol for Solana private liquidity workflows. It combines public Solana settlement, MagicBlock PER/TEE execution, and BOLT ECS state separation.

## State Model

Relay separates settlement state from confidential negotiation state:

- `AssetRegistry` is the public settlement component. It records the asset owner, asset type, settlement status, and related public fields.
- `DealTerms` is the confidential RFQ component. It stores minimum price, token amount, valuation cap, vesting metadata, buyer constraints, and settlement constraints.
- `BuyerClearance` represents eligibility state used by matching systems before a buyer can complete a restricted transaction.
- `PaymentRoutingPolicy` and `SettlementAuthorityPolicy` define protocol/operator fee routing and settlement attestor policy.

## Execution Flow

1. The client or relayer initializes BOLT world/entity state.
2. A seller creates a listing through `create_listing`.
3. Public and private components are delegated into the MagicBlock PER execution path.
4. Buyer eligibility and settlement constraints are evaluated through the TEE-backed flow.
5. `match_offer` executes the RFQ match and payment routing.
6. Public settlement state is committed back to Solana while confidential deal terms remain delegated when `PUBLISH_DEAL_TERMS_ONCHAIN=false`.

## Protocol Programs

Relay programs live under `programs-ecs/`:

- Components: `asset_registry`, `deal_terms`, `buyer_clearance`, `payment_routing_policy`, `settlement_authority_policy`.
- Systems: `create_listing`, `cancel_listing`, `match_offer`, `issue_clearance`, `issue_transfer_consent`, `attest_vesting_settlement`, `configure_payment_routing`, `configure_settlement_policy`.
- Shared types: `programs-ecs/shared/component_types`.

Tracked IDLs are stored in `target/idl/` for reproducibility and integration.

## API And Frontend

The devnet API server in `server/` prepares and submits protocol actions, manages local relay state, and exposes review/demo endpoints. The official frontend is `Frontend/`, with root scripts and GitHub Pages CI targeting that app.

## Trust And Deployment Notes

Relay's devnet implementation depends on MagicBlock PER/TEE availability, Solana devnet RPC availability, and local operator wallet configuration. Production deployment should use non-demo admin controls, non-mock KYC or clearance issuance, hardened wallet custody, and a reviewed security posture.

