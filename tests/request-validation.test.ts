import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BadRequestError,
  parseCancelPrepareBody,
  parseClearanceRequestBody,
  parseConsentBody,
  parseCreateListingBody,
  parseIssueClearanceBody,
  parseMatchBody,
  parseSettlementAttestBody,
  parseSignedTransactionBody,
} from "../server/request-validation.ts";
import { evaluateKycRequest, isReviewModeEnabled, KycRequestError } from "../server/kyc.ts";

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
    listingEntity: null,
  });
  assert.deepEqual(parseIssueClearanceBody({ buyer: "buyer-1", clearanceType: 2, listingEntity: "listing-1" }), {
    buyer: "buyer-1",
    clearanceType: 2,
    expiresAt: undefined,
    listingEntity: "listing-1",
  });

  assert.throws(
    () => parseIssueClearanceBody({ buyer: "buyer-1", clearanceType: 9 }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "clearanceType must be one of: 1, 2, 3.",
  );
});

run("public request parsers require buyer, seller, and signed transactions", () => {
  assert.deepEqual(parseClearanceRequestBody({ buyer: "buyer-1", listingEntity: "listing-1" }), {
    buyer: "buyer-1",
    listingEntity: "listing-1",
  });
  assert.deepEqual(parseCancelPrepareBody({ seller: "seller-1" }), {
    seller: "seller-1",
  });
  assert.deepEqual(parseSignedTransactionBody({ listingId: "7", signedTransaction: "abc" }), {
    listingId: "7",
    signedTransaction: "abc",
  });
  assert.throws(
    () => parseClearanceRequestBody({ buyer: "" }),
    (error: unknown) =>
      error instanceof BadRequestError && error.message === "buyer is required.",
  );
  assert.throws(
    () => parseCancelPrepareBody({}),
    (error: unknown) =>
      error instanceof BadRequestError && error.message === "seller is required.",
  );
});

run("KYC manual allowlist accepts and rejects buyers", () => {
  const previousProvider = process.env.RELAY_KYC_PROVIDER;
  const previousAllowlist = process.env.RELAY_KYC_ALLOWLIST;
  const previousClearanceType = process.env.RELAY_KYC_DEFAULT_CLEARANCE_TYPE;

  process.env.RELAY_KYC_PROVIDER = "manual";
  process.env.RELAY_KYC_ALLOWLIST = "buyer-1,buyer-2";
  process.env.RELAY_KYC_DEFAULT_CLEARANCE_TYPE = "2";

  assert.deepEqual(evaluateKycRequest("buyer-2"), {
    buyer: "buyer-2",
    clearanceType: 2,
  });
  assert.throws(
    () => evaluateKycRequest("buyer-3"),
    (error: unknown) =>
      error instanceof KycRequestError && error.message === "Buyer is not in RELAY_KYC_ALLOWLIST.",
  );

  if (previousProvider == null) delete process.env.RELAY_KYC_PROVIDER;
  else process.env.RELAY_KYC_PROVIDER = previousProvider;
  if (previousAllowlist == null) delete process.env.RELAY_KYC_ALLOWLIST;
  else process.env.RELAY_KYC_ALLOWLIST = previousAllowlist;
  if (previousClearanceType == null) delete process.env.RELAY_KYC_DEFAULT_CLEARANCE_TYPE;
  else process.env.RELAY_KYC_DEFAULT_CLEARANCE_TYPE = previousClearanceType;
});

run("KYC mock provider requires explicit local opt-in", () => {
  const previousProvider = process.env.RELAY_KYC_PROVIDER;
  const previousMock = process.env.ALLOW_MOCK_KYC;

  process.env.RELAY_KYC_PROVIDER = "mock";
  delete process.env.ALLOW_MOCK_KYC;
  assert.throws(
    () => evaluateKycRequest("buyer-1"),
    (error: unknown) =>
      error instanceof KycRequestError && error.message === "Mock KYC requires ALLOW_MOCK_KYC=true.",
  );

  process.env.ALLOW_MOCK_KYC = "true";
  assert.deepEqual(evaluateKycRequest("buyer-1"), {
    buyer: "buyer-1",
    clearanceType: 1,
  });

  if (previousProvider == null) delete process.env.RELAY_KYC_PROVIDER;
  else process.env.RELAY_KYC_PROVIDER = previousProvider;
  if (previousMock == null) delete process.env.ALLOW_MOCK_KYC;
  else process.env.ALLOW_MOCK_KYC = previousMock;
});

run("review mode makes KYC optional for demos without allowlists", () => {
  const previousProvider = process.env.RELAY_KYC_PROVIDER;
  const previousReviewMode = process.env.RELAY_REVIEW_MODE;
  const previousAllowlist = process.env.RELAY_KYC_ALLOWLIST;

  process.env.RELAY_KYC_PROVIDER = "manual";
  process.env.RELAY_REVIEW_MODE = "true";
  delete process.env.RELAY_KYC_ALLOWLIST;

  assert.equal(isReviewModeEnabled(), true);
  assert.deepEqual(evaluateKycRequest("reviewer-wallet"), {
    buyer: "reviewer-wallet",
    clearanceType: 1,
  });

  process.env.RELAY_REVIEW_MODE = "false";
  process.env.RELAY_KYC_PROVIDER = "review";
  assert.deepEqual(evaluateKycRequest("reviewer-wallet"), {
    buyer: "reviewer-wallet",
    clearanceType: 1,
  });

  if (previousProvider == null) delete process.env.RELAY_KYC_PROVIDER;
  else process.env.RELAY_KYC_PROVIDER = previousProvider;
  if (previousReviewMode == null) delete process.env.RELAY_REVIEW_MODE;
  else process.env.RELAY_REVIEW_MODE = previousReviewMode;
  if (previousAllowlist == null) delete process.env.RELAY_KYC_ALLOWLIST;
  else process.env.RELAY_KYC_ALLOWLIST = previousAllowlist;
});

run("match_offer requires a real BuyerClearance component", () => {
  const systemSource = fs.readFileSync(
    "programs-ecs/systems/match_offer/src/lib.rs",
    "utf8",
  );
  const clientSource = fs.readFileSync(
    "clients/rfq-protocol.ts",
    "utf8",
  );

  assert.match(systemSource, /buyer_clearance_account\.key != &system_program::ID/);
  assert.doesNotMatch(systemSource, /skip_buyer_clearance/);
  assert.doesNotMatch(clientSource, /DEMO_SKIP_BUYER_CLEARANCE|skipped-demo-clearance/);
});

run("frontend does not expose admin tokens and token escrow is not demo-skipped", () => {
  const frontendClient = fs.readFileSync("Frontend/src/lib/rfq-client.js", "utf8");
  const protocolClient = fs.readFileSync("clients/rfq-protocol.ts", "utf8");

  assert.doesNotMatch(frontendClient, /REACT_APP_RELAY_ADMIN_TOKEN/);
  assert.doesNotMatch(protocolClient, /DEMO_DISABLE_SPL_CREATE_ESCROW|Skipping SPL token escrow|skipSplCreateEscrow/);
});

run("server exposes public request endpoints beside protected admin endpoints", () => {
  const serverSource = fs.readFileSync("server/index.ts", "utf8");

  assert.match(serverSource, /\/api\/clearance\/request/);
  assert.match(serverSource, /ensureReviewClearanceForSimpleMatch/);
  assert.match(fs.readFileSync("server/kyc.ts", "utf8"), /RELAY_REVIEW_MODE/);
  assert.match(serverSource, /settlement-attest\\\/request/);
  assert.match(serverSource, /consent\\\/request/);
  assert.match(serverSource, /cancel\\\/prepare/);
  assert.match(serverSource, /cancel\\\/submit/);
  assert.match(serverSource, /requireAdmin\(req\);\s+const body = await readJsonBody\(req\);\s+const result = await executeIssueClearance/s);
});

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("PASS request-validation");
}
