# Environment Setup

Relay uses environment variables for Solana, MagicBlock, wallets, policy addresses, and review-mode configuration.

## Required Setup

Create a local `.env` from the example file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Common Variables

The exact variables depend on the flow being tested, but common categories include:

- Solana RPC URL.
- TEE RPC URL.
- Operator wallet path.
- Buyer wallet path.
- Seller wallet path.
- Payment policy configuration.
- Settlement authority configuration.
- Review or mock KYC settings.

## Devnet Notes

When testing against Devnet:

- Fund test wallets with Devnet SOL.
- Confirm program IDs and IDLs match the deployed programs.
- Keep environment configuration aligned with the current `Anchor.toml` and `target/idl` outputs.

## Safety

Never commit private keys, production wallet paths, admin tokens, or real KYC secrets.
