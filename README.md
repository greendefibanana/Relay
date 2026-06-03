# Relay

Private liquidity infrastructure for Solana.

## Overview

Relay is a confidential RFQ protocol for private liquidity workflows on Solana. It supports negotiated secondary transfers and OTC block trades where counterparties need private price discovery, eligibility checks, and settlement coordination without exposing sensitive terms before execution.

Relay uses MagicBlock Private Ephemeral Rollups (PER), Trusted Execution Environment (TEE) execution, and BOLT ECS programs to separate public settlement state from confidential negotiation state.

## Problem

Illiquid, vested, restricted, or privately negotiated token positions leak sensitive information when negotiated publicly. Public negotiation can expose seller intent, buyer demand, block size, vesting terms, pricing constraints, and counterparty identity before a trade is ready to settle.

The same leakage affects large liquid-token OTC trades. Treasuries, market makers, founders, funds, and whales often need RFQ-style negotiation without broadcasting inventory or strategy to the market.

## Solution

Relay provides confidential RFQ negotiation with public settlement. Sellers create listings, buyers submit offers, and matching logic executes through the PER/TEE path. Public Solana state records the settlement result, while private deal constraints remain inside the delegated execution environment.

The protocol is designed around a split-state model: public ownership and settlement status remain verifiable, while deal terms, eligibility checks, and RFQ constraints are evaluated confidentially.

## Architecture

- **Public Registry**: `AssetRegistry` records asset identity, owner, and settlement status that must remain publicly verifiable.
- **Confidential Deal Terms**: `DealTerms` stores price constraints, token amount, valuation cap, vesting data, and RFQ constraints delegated into PER.
- **MagicBlock PER / TEE execution**: Matching and eligibility checks run through the MagicBlock TEE RPC path before settlement state is committed back.
- **BOLT ECS components/systems**: Components hold state and systems execute transitions such as listing creation, clearance issuance, matching, policy configuration, and transfer consent.
- **Devnet relayer / frontend**: The API server prepares and submits protocol actions, and the React app provides the operator/reviewer interface.

See [docs/architecture.md](docs/architecture.md) for the detailed system model.

## Repository Structure

```txt
.
├── Anchor.toml
├── Cargo.toml
├── programs-ecs/        # BOLT ECS components and systems
├── clients/             # TypeScript protocol client and E2E flow
├── server/              # Devnet API/relayer
├── Frontend/            # Official React frontend
├── tests/               # Root TypeScript tests
├── scripts/             # Official scripts and diagnostics
├── docs/                # Architecture, deployment, evidence, audit, whitepaper
├── artifacts/devnet/    # Public sample/evidence artifacts
├── target/idl/          # Tracked Anchor/BOLT IDLs used by app and verification
├── gitbook/             # Published GitBook documentation
└── archive/             # Legacy planning, scratch utilities, and archived UI
```

## Quick Start

Install dependencies:

```bash
npm install
npm --prefix Frontend install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start the API server:

```bash
npm run dev:server
```

Start the frontend:

```bash
npm --prefix Frontend start
```

## Environment Variables

Use `.env.example` as the source of truth for local configuration. Devnet and mainnet templates are also available in `env/devnet.env` and `env/mainnet.env`.

Important variables:

- `SOLANA_RPC_URL`: Base Solana RPC endpoint.
- `TEE_RPC_URL`: MagicBlock TEE RPC endpoint.
- `WALLET_PATH`: Local operator wallet path for devnet execution.
- `RELAY_STATE_PATH`: Local generated relay state path. This should not be committed.
- `VERIFICATION_ARTIFACT_PATH`: Optional path for E2E verification output.
- `PUBLISH_DEAL_TERMS_ONCHAIN`: Keep `false` for confidential PER-backed flows.
- `RELAY_ADMIN_TOKEN`: Required for protected administrative API operations in non-demo environments.

Never commit real wallet keypairs, mnemonics, RPC secrets, admin tokens, or production KYC credentials.

## Build

Type-check the root TypeScript client/server/tests:

```bash
npm run build
```

Build the frontend:

```bash
npm run build:frontend
```

Build BOLT/Anchor programs:

```bash
anchor build
```

## Test

Run root tests:

```bash
npm test
```

Run frontend tests:

```bash
npm run test:frontend
```

Run production-readiness checks:

```bash
npm run verify:prod-ready
```

Run the devnet E2E verification artifact flow:

```bash
npm run test:e2e
```

## Devnet Verification

Relay keeps public verification evidence in [docs/devnet-evidence.md](docs/devnet-evidence.md). The tracked sample state artifact is available at [artifacts/devnet/relay-state.sample.json](artifacts/devnet/relay-state.sample.json).

Generated E2E artifacts should be written under `artifacts/devnet/` and reviewed before publication.

## Deployment Status

Relay is a devnet-stage protocol implementation. The repository includes devnet program IDs in `Anchor.toml`, tracked IDLs in `target/idl/`, and deployment notes in [docs/deployment.md](docs/deployment.md).

Mainnet deployment requires fresh program IDs, production wallet custody controls, non-demo KYC/clearance configuration, and a security review of any open audit findings.

## Security Notes

- Do not commit `.env`, wallet keypairs, local relay state, logs, ledgers, or generated deployment buffers.
- Treat `ALLOW_UNAUTHENTICATED_ADMIN`, `ALLOW_CUSTODIAL_PAYMENT`, demo clearance settings, and mock KYC settings as local/demo-only controls.
- Keep `DealTerms` delegated for confidential flows unless explicitly testing public publication.
- Review [docs/audit.md](docs/audit.md) and [SECURITY.md](SECURITY.md) before production deployment.

## Documentation

- [Architecture](docs/architecture.md)
- [Devnet Evidence](docs/devnet-evidence.md)
- [Deployment](docs/deployment.md)
- [Whitepaper](docs/whitepaper.md)
- [Shielded RFQ Legacy Note](docs/shielded-rfq.md)
- [Audit](docs/audit.md)
- [Scripts](scripts/README.md)
- [GitBook](gitbook/README.md)

