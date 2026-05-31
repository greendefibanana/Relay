# Trust Assumptions

Relay reduces information leakage, but it still has trust assumptions.

## Protocol Assumptions

- BOLT systems enforce the intended state transitions.
- Component accounts are correctly initialized and delegated.
- `match_offer` requires valid buyer clearance.
- Payment routing policy is configured correctly.
- Settlement authority policy is configured correctly.

## Execution Assumptions

- MagicBlock PER executes delegated state correctly.
- TEE integrity verification is performed where required.
- TEE RPC availability is sufficient for the workflow.
- Confidential state remains shielded inside the intended execution boundary.

## Relayer Assumptions

- The relayer pays infrastructure setup fees as expected.
- The relayer does not expose admin-only actions to public clients.
- The relayer does not custody user assets.
- Environment variables are protected.

## User Assumptions

- Users verify the listing they are interacting with.
- Sellers and buyers understand the legal character of the asset.
- Operators confirm transfer restrictions before production use.

## Current Stage

Relay is a development-stage MVP. Mainnet deployments, partner pilots, and production integrations should include external security review, legal review, and operational runbooks.
