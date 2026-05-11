# Render API Deployment

Deploy the Relay API as a Render Web Service.

Render settings:

- Service type: Web Service
- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Before deploying, make sure the generated IDLs are included in the Git commit:

- `target/idl/asset_registry.json`
- `target/idl/deal_terms.json`
- `target/idl/system_match_offer.json`

The API imports these files at startup. A fresh Render clone will not contain local ignored build artifacts unless they are committed or regenerated during the build.

Required environment variables:

- `NODE_VERSION`: `24.11.1`
- `SOLANA_RPC_URL`: `https://api.devnet.solana.com`
- `TEE_RPC_URL`: `https://tee.magicblock.app`
- `SKIP_TEE_VERIFICATION`: `true`
- `RELAY_ALLOWED_ORIGIN`: your hosted frontend origin, for example `https://greendefibanana.github.io`
- `WALLET_KEYPAIR_JSON`: JSON array from the API/operator Solana keypair file
- `ALLOW_UNAUTHENTICATED_ADMIN`: `true` for demo only
- `ALLOW_CUSTODIAL_PAYMENT`: `true` for demo only
- `DEMO_SKIP_BUYER_CLEARANCE`: `true` for demo only
- `DEMO_DISABLE_SPL_CREATE_ESCROW`: `true` for demo only
- `PUBLISH_DEAL_TERMS_ONCHAIN`: `false`
- `ASSET_REGISTRY_COMPONENT_ID`: `84rAQe7vMX8F8BevA9go8CWETc5FZJyKVgT5nowff81Z`
- `DEAL_TERMS_COMPONENT_ID`: `23vDPBsuhfMEjmySL3p7DWTzXxX6j33xtaWj9VkbM5gg`
- `PAYMENT_ROUTING_POLICY_COMPONENT_ID`: `Dwp5fQgx1CtVfUaPiQhEeKEr2RwXmkarJJxkMXDAw194`
- `SETTLEMENT_AUTHORITY_POLICY_COMPONENT_ID`: `DxV3D2u8LPiJVZTJT7EkoovhXok4uzxZHwDznXmchHvG`
- `BUYER_CLEARANCE_COMPONENT_ID`: `H9SDPiu38JtdPJaKueCnoAjjNBPHrfUxUgS95JPRPDM5`
- `CREATE_LISTING_SYSTEM_ID`: `FgVyAJoCFkym9QjD8NsQ3SbHVkJEbECjYHJ7PpdetkCN`
- `CANCEL_LISTING_SYSTEM_ID`: `AwvMZG7WWjUNzLVUZFa5JRoCHz6cJ1nu2zxTCi3xYgKc`
- `ATTEST_VESTING_SETTLEMENT_SYSTEM_ID`: `BrACdZTWSwNSwFexzUcPtobEB5wxMHXxW3Q9GR5i63Rc`
- `CONFIGURE_PAYMENT_ROUTING_SYSTEM_ID`: `Gnwd2U3g37AiZ5k4rphRnKHBx7UHujQupaE7XArMY8vt`
- `CONFIGURE_SETTLEMENT_POLICY_SYSTEM_ID`: `7WTkuFXzdtYdFJGKnFB2oWrViVVpqqtsscULaQo4DXLq`
- `ISSUE_CLEARANCE_SYSTEM_ID`: `2e7rfeRKU33mGe9ZLRwNTnDKf8yRJttqPcbXgjX4UXxK`
- `ISSUE_TRANSFER_CONSENT_SYSTEM_ID`: `ERJNXy2po3hrkGEJ3XM7hvMg3k2jRP1emb32voWvPNU9`
- `MATCH_OFFER_SYSTEM_ID`: `Cr4ZyqvML9tS5HeAFXLTKfBxJKixQStL8dGFmfbUx585`

Optional:

- `RELAY_ADMIN_TOKEN`: set this if `ALLOW_UNAUTHENTICATED_ADMIN` is not enabled.
- `RELAY_STATE_PATH`: defaults to `.relay-state.json`. On Render without a persistent disk, state resets when the service redeploys.

To create `WALLET_KEYPAIR_JSON`, copy the full JSON array from your Solana keypair file. Do not commit this keypair to GitHub.

After Render deploys, update the frontend build env:

- `REACT_APP_API_BASE_URL`: your Render API URL, for example `https://relay-api.onrender.com`
