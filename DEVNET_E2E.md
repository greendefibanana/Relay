# Devnet E2E Verification

Date: 2026-03-22

Command executed:

```bash
npx tsx clients/shielded-rfq.ts
```

Runtime configuration used:

- No local `.env` file was present.
- Script defaults were used for:
  - `SOLANA_RPC_URL=https://api.devnet.solana.com`
  - `TEE_RPC_URL=https://tee.magicblock.app`
  - `WALLET_PATH=C:/Users/ezevi/.config/solana/id.json`
  - `PUBLISH_DEAL_TERMS_ONCHAIN=false`

## Result

The PER-backed flow completed successfully on devnet with the following high-level behavior:

- `create_listing` executed inside PER.
- `AssetRegistry` was committed back from PER to devnet after listing.
- `match_offer` executed inside PER.
- `AssetRegistry` was committed back from PER to devnet after matching.
- `DealTerms` remained confidential in PER and was not committed back to devnet.

Returned output:

```json
{
  "world": "HbDPyS7et36d9EjnazgXNXnJkz5yaeMo8BCjBVJXLAYw",
  "sellerEntity": "DLuEfmi2cPymnoxSKH2CnpMdSWZ575Hy8LgNCJmsVBLe",
  "buyerEntity": "8N7jH9Sq4kKtozzuwUhM3CCGW9u6GK3wEKTUa9Cr2jfx",
  "assetRegistryPda": "ByBrZfu75dpjHqBhqEBjLFdy6N3LwAxVNGj4wa2QohGQ",
  "dealTermsPda": "CZHqPVcrLcvsU3Edqg35dmkoW3rq2RdWoEnJJYNX3RcM",
  "sellerOwner": "9BeBqNy15zt5mq112RrR35GaHNoqkPNFe1brhtEocdpU",
  "buyerOwner": "8mpVwnrxqX6G6Y1pxNLZCqj1rCGG7eaTWFe2REry4gVe",
  "per": {
    "teeRpcUrl": "https://tee.magicblock.app",
    "teeValidator": "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA",
    "publishDealTermsOnChain": false,
    "confidentialAccounts": [
      "CZHqPVcrLcvsU3Edqg35dmkoW3rq2RdWoEnJJYNX3RcM"
    ]
  },
  "programs": {
    "assetRegistryComponentId": "6BE4Z9G2WkEq8AEH89FgBDDxv5517MGM1pzuzF1pZSDe",
    "dealTermsComponentId": "5DTNmzUrHxbpGsj7C8U1YP1AtaHJF1qEEy2CT6W2vCqN",
    "createListingSystemId": "7rjyGnnFRacekAxByYLiq7sXLEjScKRCbtsdnz621yMT",
    "matchOfferSystemId": "EfyPjbjJ9hwuRixNH7bkT6yETnsTmEtqnQ7L3Erw9pyj"
  },
  "signatures": {
    "listAssetDelegateSignature": "3PYfbG7CCvfgzpxSxtzvQWBJAzSjmkveaDSJYUa5ffSV9MEo8SCMhk26hEetXi6kWuTs44xwxpEsUWrunzsjovyG",
    "listDealTermsDelegateSignature": "vQSF6MhiPf7UcaYfyaBf86uEde9AAYmjaJo6vJTfc7YEiSsBr1ECnpFcnY3tDikquGDM82FCStc4zmhsAN6T63Z",
    "createListingPerSignature": "3pK44atLZeyy69GAz2eDGkT9fYwsqFGBsLR33bUfkxumRohqrct7cWZgvcQ6Zq3mUHFGb9WMuYj8hk77SsxhuV5r",
    "listAssetCommitSignature": "qZ3YZjqnMRJN2CkjR9t1AFwhaRiiQCnFnsixBy3bCsgfDhgM5amjqYYoHGbENobznST1mv9aYbp4WZg9qHzKmVe",
    "listDealTermsCommitSignature": "kept-delegated-in-per",
    "matchAssetDelegateSignature": "2t2Qq4g6kBdgznbJrLLyxHeWqk6J2bbeJ8dyiCmcH4QWAmrxq4N8SB3qUJZ3NUDi8NFs8hRuTvEgRHuatqL5YiSU",
    "matchDealTermsDelegateSignature": "already-delegated",
    "matchOfferPerSignature": "pRQmxhKWugEFQoJwpR7Lr8foReV67Uw6bW3nRdAXzAV7FnZgkxvS86GUh52cuD8bxUpzXg2EUaFneandYCCLpU3",
    "matchAssetCommitSignature": "5U7sncj687DYaCJ7PreN91dj32MNumSMdtZwAsB35MPKXXVQd393VYDiL1DC58DExErdRq33ZwMvkorSNmsaSt6A",
    "matchDealTermsCommitSignature": "kept-delegated-in-per"
  }
}
```

## Observed State

Observed on devnet after the run:

- `AssetRegistry` PDA owner program: `6BE4Z9G2WkEq8AEH89FgBDDxv5517MGM1pzuzF1pZSDe`
- `AssetRegistry.owner`: `8mpVwnrxqX6G6Y1pxNLZCqj1rCGG7eaTWFe2REry4gVe`
- `AssetRegistry.asset_type`: `1`
- `AssetRegistry.is_sold`: `true`

Observed on devnet for `DealTerms` after the run:

- `DealTerms` PDA owner program: `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`
- The base-layer delegated account did not expose the committed pricing terms because it was intentionally left inside PER.

Observed through the TEE RPC after the run:

- `DealTerms` PDA owner program: `5DTNmzUrHxbpGsj7C8U1YP1AtaHJF1qEEy2CT6W2vCqN`
- `DealTerms.min_price`: `900000`
- `DealTerms.token_amount`: `1000000000`
- `DealTerms.valuation_cap`: `500000000`

Interpretation:

- Public settlement worked for `AssetRegistry`.
- Confidential storage worked for `DealTerms` because the account remained delegated and live inside PER.

## Code Changes Required To Make This Pass

The original scaffold did not pass a real devnet E2E run. The following fixes were needed:

- Normalize the TEE RPC `getBlockhashForAccounts` response, which currently returns `result.value.blockhash` and `result.value.lastValidBlockHeight`.
- Delegate component accounts explicitly to the validator advertised by the TEE endpoint instead of relying on implicit validator selection.
- Send `undelegate` and commit transactions to the TEE/PER RPC, not to the base Solana RPC.
- Keep `DealTerms` delegated by default so the pricing data remains confidential.

## Current Limits

- This verification used operational confidentiality via PER delegation, not a native `#[component(confidential)]` Rust macro.
- `PUBLISH_DEAL_TERMS_ONCHAIN=true` was not exercised in this run.
