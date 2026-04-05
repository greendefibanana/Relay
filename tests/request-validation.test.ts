import assert from "node:assert/strict";

import {
  BadRequestError,
  parseConsentBody,
  parseCreateListingBody,
  parseIssueClearanceBody,
  parseMatchBody,
  parseSettlementAttestBody,
} from "../server/request-validation.ts";

let failures = 0;

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

run("parseCreateListingBody accepts a reserved SAFT listing", () => {
  const listing = parseCreateListingBody({
    assetType: 1,
    minPrice: 1500,
    tokenAmount: 25,
    valuationCap: 5000000,
    isPrivate: true,
    recipient: "BuyerWallet111111111111111111111111111111111",
  });

  assert.deepEqual(listing, {
    assetType: 1,
    minPrice: 1500,
    tokenAmount: 25,
    valuationCap: 5000000,
    tokenMint: null,
    vestingSourceProgram: null,
    vestingSourcePosition: null,
    vestingStartTs: undefined,
    vestingCliffTs: undefined,
    vestingEndTs: undefined,
    unlockedAmount: undefined,
    claimedAmount: undefined,
    transferRestrictionMode: 0,
    settlementMode: 0,
    settlementExpiresAt: undefined,
    requiredSettlementAttestor: null,
    requiredConsentAuthority: null,
    owner: null,
    isPrivate: true,
    recipient: "BuyerWallet111111111111111111111111111111111",
  });
});

run("parseCreateListingBody accepts SAFE and equity-style listings without vesting fields", () => {
  const listing = parseCreateListingBody({
    assetType: 4,
    minPrice: 2500,
    tokenAmount: 10,
    valuationCap: 8000000,
    transferRestrictionMode: 1,
    requiredConsentAuthority: "ConsentAuth1111111111111111111111111111111",
  });

  assert.deepEqual(listing, {
    assetType: 4,
    minPrice: 2500,
    tokenAmount: 10,
    valuationCap: 8000000,
    tokenMint: null,
    vestingSourceProgram: null,
    vestingSourcePosition: null,
    vestingStartTs: undefined,
    vestingCliffTs: undefined,
    vestingEndTs: undefined,
    unlockedAmount: undefined,
    claimedAmount: undefined,
    transferRestrictionMode: 1,
    settlementMode: 0,
    settlementExpiresAt: undefined,
    requiredSettlementAttestor: null,
    requiredConsentAuthority: "ConsentAuth1111111111111111111111111111111",
    owner: null,
    isPrivate: false,
    recipient: null,
  });
});

run("parseCreateListingBody rejects private listings without a recipient", () => {
  assert.throws(
    () =>
      parseCreateListingBody({
        assetType: 1,
        isPrivate: true,
      }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "recipient is required when isPrivate is true.",
  );
});

run("parseCreateListingBody enforces vesting-specific fields", () => {
  assert.throws(
    () =>
      parseCreateListingBody({
        assetType: 2,
        minPrice: 1000,
        tokenAmount: 20,
        valuationCap: 2000000,
        tokenMint: "Mint111111111111111111111111111111111111111",
        vestingSourceProgram: "Vest111111111111111111111111111111111111111",
        vestingSourcePosition: "Pos1111111111111111111111111111111111111111",
        vestingStartTs: 1710000000,
        vestingEndTs: 1720000000,
        settlementMode: 1,
      }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "requiredSettlementAttestor is required for vesting listings.",
  );
});

run("parseCreateListingBody enforces restricted-transfer consent authority", () => {
  assert.throws(
    () =>
      parseCreateListingBody({
        assetType: 1,
        transferRestrictionMode: 1,
      }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message ===
        "requiredConsentAuthority is required when transferRestrictionMode is 1.",
  );
});

run("approval parsers require a buyer and positive nonce", () => {
  assert.deepEqual(
    parseSettlementAttestBody({
      buyer: "buyer-1",
      settlementNonce: 2,
      settlementProofId: "Proof111111111111111111111111111111111111111",
    }),
    {
    buyer: "buyer-1",
    settlementProofId: "Proof111111111111111111111111111111111111111",
    settlementExpiresAt: undefined,
    settlementNonce: 2,
    },
  );
  assert.deepEqual(parseConsentBody({ buyer: "buyer-1", consentNonce: 3 }), {
    buyer: "buyer-1",
    consentExpiresAt: undefined,
    consentNonce: 3,
  });

  assert.throws(
    () => parseSettlementAttestBody({ buyer: "buyer-1", settlementNonce: 0 }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "settlementNonce must be greater than zero when provided.",
  );
  assert.throws(
    () => parseConsentBody({ buyer: "", consentNonce: 1 }),
    (error: unknown) =>
      error instanceof BadRequestError && error.message === "buyer is required.",
  );
});

run("parseMatchBody and parseIssueClearanceBody validate integer inputs", () => {
  assert.deepEqual(parseMatchBody({ buyer: "buyer-1", bidPrice: "900000" }), {
    buyer: "buyer-1",
    bidPrice: 900000,
  });
  assert.deepEqual(parseIssueClearanceBody({ buyer: "buyer-1", clearanceType: 2, expiresAt: 77 }), {
    buyer: "buyer-1",
    clearanceType: 2,
    expiresAt: "77",
  });

  assert.throws(
    () => parseIssueClearanceBody({ buyer: "buyer-1", clearanceType: 9 }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "clearanceType must be one of: 1, 2, 3.",
  );
});

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("PASS request-validation");
}
