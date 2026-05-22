type KycDecision = {
  buyer: string;
  clearanceType: number;
};

export class KycRequestError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "KycRequestError";
  }
}

function parseAllowlist(): Set<string> {
  return new Set(
    (process.env.RELAY_KYC_ALLOWLIST || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function defaultClearanceType(): number {
  const configured = Number(process.env.RELAY_KYC_DEFAULT_CLEARANCE_TYPE || "1");
  if (![1, 2, 3].includes(configured)) {
    throw new KycRequestError("RELAY_KYC_DEFAULT_CLEARANCE_TYPE must be 1, 2, or 3.");
  }
  return configured;
}

export function isReviewModeEnabled(): boolean {
  return process.env.RELAY_REVIEW_MODE === "true";
}

export function evaluateKycRequest(buyer: string): KycDecision {
  const provider = (process.env.RELAY_KYC_PROVIDER || "manual").toLowerCase();

  if (provider === "review" || isReviewModeEnabled()) {
    return { buyer, clearanceType: defaultClearanceType() };
  }

  if (provider === "mock") {
    if (process.env.ALLOW_MOCK_KYC !== "true") {
      throw new KycRequestError("Mock KYC requires ALLOW_MOCK_KYC=true.");
    }
    return { buyer, clearanceType: defaultClearanceType() };
  }

  if (provider !== "manual") {
    throw new KycRequestError("RELAY_KYC_PROVIDER must be manual, mock, or review.");
  }

  if (!parseAllowlist().has(buyer)) {
    throw new KycRequestError("Buyer is not in RELAY_KYC_ALLOWLIST.");
  }

  return { buyer, clearanceType: defaultClearanceType() };
}
