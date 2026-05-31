# Devnet MVP

Relay currently runs as a development-stage MVP against Solana Devnet and local MagicBlock execution environments.

## Start the API

```bash
npm run dev:server
```

## Start the Frontend

```bash
npm --prefix Frontend start
```

## Run Verification

```bash
npm run verify:prod-ready
```

## Run Tests

```bash
npm test
```

## Default Network

The client defaults to Solana Devnet unless configured otherwise.

The TEE RPC default is:

```text
https://tee.magicblock.app
```

## MVP Capabilities

The MVP demonstrates:

- Listing creation.
- Private RFQ matching.
- Buyer clearance.
- Vesting settlement attestation.
- Transfer consent.
- Atomic settlement.
- Confidential `DealTerms`.
- Public `AssetRegistry` settlement state.
