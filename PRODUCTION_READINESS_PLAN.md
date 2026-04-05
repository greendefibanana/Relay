# Production Readiness Plan

Date: 2026-03-30

## Goal

Make this repo production-ready for vesting-token and vesting-memecoin RFQs, with devnet acting as a true pre-mainnet rehearsal.

That means:

- one protocol flow for devnet and mainnet
- one deployment pipeline for devnet and mainnet
- one attestation and settlement model for devnet and mainnet
- no localhost-only logic in the production path
- no vesting sale that can finalize without settlement preparation for the actual buyer

## Parity Rules

Devnet must mirror mainnet 1:1 in:

- program logic
- client flow
- backend services
- attestor signer model
- settlement proof format
- monitoring and alerting
- deployment pipeline

Allowed differences:

- program IDs
- RPC / WS URLs
- signer key material
- fees and circuit-breaker thresholds
- synthetic or staged vesting fixtures used for devnet onboarding

## Current State

What exists now:

- vesting metadata is modeled in [asset_registry/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/components/asset_registry/src/lib.rs)
- vesting schedule and settlement metadata are modeled in [deal_terms/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/components/deal_terms/src/lib.rs)
- vesting listings are validated in [create_listing/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/systems/create_listing/src/lib.rs)
- `match_offer` refuses vesting matches unless settlement was prepared for the exact buyer in [match_offer/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/systems/match_offer/src/lib.rs)
- `attest_vesting_settlement` exists in [attest_vesting_settlement/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/systems/attest_vesting_settlement/src/lib.rs)
- the TS client and API layer understand the new fields in [rfq-protocol.ts](/C:/Users/ezevi/Documents/Relay/clients/rfq-protocol.ts) and [index.ts](/C:/Users/ezevi/Documents/Relay/server/index.ts)

What is still missing:

- `anchor build` is not clean, so generated IDLs / deploy artifacts are not yet trustworthy
- settlement proofs are not cryptographically verified on-chain
- there is no attestor allowlist or replay protection
- there is no payment leg or escrow leg
- there is no issuer-consent enforcement path beyond flags
- the API is a thin local server, not a production service
- devnet currently depends on infrastructure that is not fully under your control

## Workstream A: Build And Artifact Integrity

### Objective

Make builds reproducible, IDLs correct, and deployment artifacts safe to promote from devnet to mainnet.

### Tasks

1. Fix `anchor build` / IDL generation failure for BOLT systems.
   File targets:
   - [Cargo.toml](/C:/Users/ezevi/Documents/Relay/Cargo.toml)
   - [Anchor.toml](/C:/Users/ezevi/Documents/Relay/Anchor.toml)
   - [vendor/bolt-attribute-bolt-system-input/src/lib.rs](/C:/Users/ezevi/Documents/Relay/vendor/bolt-attribute-bolt-system-input/src/lib.rs)
   - [vendor/bolt-attribute-bolt-system/src/lib.rs](/C:/Users/ezevi/Documents/Relay/vendor/bolt-attribute-bolt-system/src/lib.rs)
   - any generated `target/idl/*.json`

2. Freeze toolchain versions.
   File targets:
   - [Cargo.toml](/C:/Users/ezevi/Documents/Relay/Cargo.toml)
   - [package.json](/C:/Users/ezevi/Documents/Relay/package.json)
   - optional `.tool-versions` or `rust-toolchain.toml`

3. Add build verification commands and artifact checks.
   File targets:
   - new `scripts/` helper or package scripts
   - optional CI config

### Exit Criteria

- `anchor build` passes
- generated IDLs match current program layouts
- release binaries and IDLs can be reproduced from a clean checkout

## Workstream B: Settlement Proof Enforcement

### Objective

Move from “attested readiness metadata” to “cryptographically enforced settlement authorization”.

### Tasks

1. Introduce a settlement authority model.
   Recommendation:
   - new on-chain config account with allowed attestor pubkeys
   - versioned policy for signer rotation and revocation

2. Define a settlement proof payload.
   Fields:
   - listing ID
   - world
   - seller entity
   - buyer entity
   - asset registry PDA
   - deal terms PDA
   - vesting source program
   - vesting source position
   - token mint
   - token amount
   - settlement mode
   - expiry
   - nonce / proof ID

3. Verify settlement signatures on-chain.
   File targets:
   - [match_offer/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/systems/match_offer/src/lib.rs)
   - [attest_vesting_settlement/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/systems/attest_vesting_settlement/src/lib.rs)
   - likely one or more new components/programs for policy / nonce tracking

4. Add replay protection.
   Recommendation:
   - nonce component or consumed-proof account keyed by `(listing, buyer, proof_id)`

5. Add explicit settlement consumption semantics.
   - once used, proof cannot be replayed
   - stale settlement approvals must be revocable or expirable

### Exit Criteria

- a vesting match cannot finalize unless a valid signed settlement proof is present
- wrong signer, wrong buyer, expired proof, and replayed proof all fail on-chain

## Workstream C: Payment And Escrow Leg

### Objective

Make settlement economically real, not just informational.

### Tasks

1. Choose the production settlement model.
   Recommendation:
   - phase 1: attested settlement proof + payment escrow
   - phase 2: vesting-program-specific adapters

2. Add payment transfer or payment escrow.
   File targets:
   - likely new escrow / treasury program under `programs-ecs/`
   - [match_offer/src/lib.rs](/C:/Users/ezevi/Documents/Relay/programs-ecs/systems/match_offer/src/lib.rs)

3. Add fee routing.
   - protocol fee
   - operator fee if needed
   - treasury destination config

4. Add abort / refund path.
   - buyer funds released if settlement never completes
   - seller listing can be reopened or cancelled

### Exit Criteria

- devnet flow includes both asset-side and payment-side settlement
- failed settlement does not strand buyer funds

## Workstream D: Issuer Consent And Transfer Restrictions

### Objective

Turn transfer restriction flags into enforceable policy.

### Tasks

1. For `transfer_restriction_mode = 1`, require consent proof.
   Recommendation:
   - new consent attestation system, parallel to settlement attestation
   - or extend settlement proof schema with issuer consent signer and scope

2. Bind consent to:
   - listing
   - buyer
   - amount
   - expiry

3. Reject matches without valid consent where required.

### Exit Criteria

- restricted assets cannot match unless consent exists and is still valid

## Workstream E: Listing Lifecycle And State Machine

### Objective

Add the missing operational actions required for a real market.

### Tasks

1. Add lifecycle actions:
   - cancel listing
   - expire listing
   - revoke settlement
   - refresh settlement
   - relist
   - optional partial fill

2. Replace boolean-style state with explicit status machine.
   Recommendation:
   - `draft`
   - `listed`
   - `settlement_pending`
   - `settlement_ready`
   - `matched`
   - `settled`
   - `cancelled`
   - `expired`
   - `disputed`

3. Add event logging / indexing-friendly transitions.

### Exit Criteria

- all normal and failure lifecycle transitions are representable and testable

## Workstream F: Backend Services

### Objective

Replace the current local API server with a production service layer.

### Current Gap

[server/index.ts](/C:/Users/ezevi/Documents/Relay/server/index.ts) is a thin unauthenticated wrapper around client functions.

### Tasks

1. Split responsibilities into services:
   - listing API
   - attestor service
   - issuer consent service
   - settlement orchestrator
   - indexing / reporting service

2. Add production controls:
   - auth
   - RBAC
   - secrets management
   - structured logging
   - metrics
   - alerts
   - audit trail

3. Add deterministic attestor signing.
   - sign proofs from backend only
   - do not rely on ad hoc CLI/manual signing

### Exit Criteria

- no critical production path depends on the local node server pattern

## Workstream G: Devnet Infrastructure That Mirrors Mainnet

### Objective

Remove demo-only infrastructure assumptions.

### Tasks

1. Run controlled devnet infrastructure you own or fully control:
   - devnet ER/PER endpoint
   - attestor service
   - signer storage
   - monitoring stack

2. Stop depending on flaky hosted devnet TEE for release-critical tests.

3. Mirror mainnet signer roles on devnet:
   - deploy authority
   - attestor key
   - consent key
   - treasury key
   - emergency admin

4. Add environment manifests:
   - `devnet.env`
   - `mainnet.env`
   - same keys by role, different material by environment

### Exit Criteria

- devnet full E2E can run on controlled infra any time, not only when third-party hosted services are healthy

## Workstream H: Testing, CI, And Verification Artifacts

### Objective

Make “works end to end on devnet” machine-verifiable.

### Tasks

1. Add Rust unit and integration tests:
   - invalid vesting schedule
   - non-transferable positions
   - missing settlement proof
   - expired settlement proof
   - wrong buyer
   - replay rejection
   - consent required but absent

2. Add TS end-to-end test harness.
   Recommendation:
   - new `tests/e2e-devnet/` or `scripts/e2e/`

3. Generate a verification artifact per devnet run.
   Contents:
   - commit SHA
   - program IDs
   - system IDs
   - wallet used
   - listing ID
   - signatures
   - final listing snapshot
   - settlement proof metadata

4. Add CI for:
   - `npm run typecheck`
   - `cargo check --workspace`
   - `anchor build`
   - selected integration tests

### Exit Criteria

- a devnet run produces a reproducible, machine-readable proof of success

## Workstream I: Security And Mainnet Launch Controls

### Objective

Be able to defend a mainnet launch.

### Tasks

1. Internal threat model.
2. Key rotation procedures.
3. Emergency pause / disable flows.
4. External audit for:
   - on-chain programs
   - settlement proof verification
   - backend signer flows
   - deployment authority controls

### Exit Criteria

- audited release candidate with documented incident and recovery procedures

## Recommended Implementation Order

1. Fix `anchor build` and artifact generation.
2. Add settlement authority config + attestor allowlist.
3. Add signed settlement proof verification and replay protection.
4. Add issuer-consent proof path.
5. Add payment escrow / payment transfer leg.
6. Add lifecycle actions and explicit status machine.
7. Replace local API server assumptions with production services.
8. Deploy all updated programs to devnet from reproducible artifacts.
9. Stand up controlled devnet attestor + ER/PER infrastructure.
10. Run full devnet E2E and produce a verification artifact.
11. Freeze release artifacts for mainnet.

## Immediate Repo Backlog

### Sprint 1: Build And Proof Integrity

- fix `anchor build`
- regenerate all IDLs
- add `ATTEST_VESTING_SETTLEMENT_SYSTEM_ID` to env manifests
- add CI command set

### Sprint 2: Cryptographic Settlement Proofs

- add settlement authority / nonce storage
- verify signed settlement proofs on-chain
- update TS client to build and submit those proofs

### Sprint 3: Real Economic Settlement

- add payment escrow or payment transfer flow
- add treasury / fee routing
- add failure rollback path

### Sprint 4: Devnet Mirror

- deploy full stack to controlled devnet infra
- run scripted E2E from clean state
- publish `DEVNET_E2E_PRODUCTION.md`

## Acceptance Criteria For “Production Ready On Devnet”

- `anchor build` passes
- devnet uses the same code and flow intended for mainnet
- vesting assets require a valid settlement proof for the exact buyer
- restricted assets require valid consent where applicable
- payment and asset settlement both execute or both fail
- no critical path relies on localhost-only shortcuts
- a clean scripted devnet run succeeds end-to-end and emits a verification report

