# Render API Deployment

Deploy the Relay API as a Render Web Service.

Render settings:

- Service type: Web Service
- Runtime: Node
- Build command: `npm install`
- Start command: `npm run dev:server`

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
- `ASSET_REGISTRY_COMPONENT_ID`: `6BE4Z9G2WkEq8AEH89FgBDDxv5517MGM1pzuzF1pZSDe`
- `DEAL_TERMS_COMPONENT_ID`: `5DTNmzUrHxbpGsj7C8U1YP1AtaHJF1qEEy2CT6W2vCqN`
- `CREATE_LISTING_SYSTEM_ID`: `7rjyGnnFRacekAxByYLiq7sXLEjScKRCbtsdnz621yMT`
- `MATCH_OFFER_SYSTEM_ID`: `EfyPjbjJ9hwuRixNH7bkT6yETnsTmEtqnQ7L3Erw9pyj`

Optional:

- `RELAY_ADMIN_TOKEN`: set this if `ALLOW_UNAUTHENTICATED_ADMIN` is not enabled.
- `RELAY_STATE_PATH`: defaults to `.relay-state.json`. On Render without a persistent disk, state resets when the service redeploys.

To create `WALLET_KEYPAIR_JSON`, copy the full JSON array from your Solana keypair file. Do not commit this keypair to GitHub.

After Render deploys, update the frontend build env:

- `REACT_APP_API_BASE_URL`: your Render API URL, for example `https://relay-api.onrender.com`
