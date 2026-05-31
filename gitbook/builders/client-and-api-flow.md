# Client and API Flow

Relay's client flow is centered in `clients/rfq-protocol.ts` and exposed through the server/API layer.

## High-Level Flow

1. Verify TEE RPC integrity.
2. Authenticate with the TEE RPC.
3. Initialize or load BOLT world state.
4. Create listing components.
5. Delegate state into PER.
6. Issue or request buyer clearance.
7. Execute RFQ match.
8. Route payment.
9. Commit settlement state back to Solana.

## Public Request Endpoints

The server exposes public request endpoints beside protected admin endpoints for flows such as:

- Clearance request.
- Settlement attestation request.
- Transfer consent request.
- Cancel prepare.
- Cancel submit.

## Protected Admin Actions

Admin-protected actions include direct clearance issuance and other sensitive protocol operations.

## Frontend Client

The frontend uses `Frontend/src/lib/rfq-client.js` to interact with the local API and build user-facing RFQ flows.

The frontend should not expose admin tokens or privileged server credentials.
