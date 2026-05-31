# Supported Assets

Relay models assets through `assetType` values in the client and protocol flow.

## Current Asset Types

| ID | Asset type |
| --- | --- |
| 1 | SAFT |
| 2 | Vested Token |
| 3 | Vested Memecoin |
| 4 | SAFE |
| 5 | Private Equity |
| 6 | Memecoin Equity |

## Vesting Assets

The current vesting-specific path applies to:

- Vested Token
- Vested Memecoin

These listings require vesting-specific fields and can require settlement attestation before final matching.

## OTC Token Blocks

Liquid token block trades use the same RFQ and settlement principles. The important distinction is not whether the underlying token is liquid. It is whether the negotiation should remain private until settlement.

## Future Extensions

Relay's asset model can be extended as new private transfer workflows emerge, including new agreement types, issuer-controlled instruments, and additional OTC settlement modes.
