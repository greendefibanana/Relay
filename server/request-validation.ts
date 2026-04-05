import type {
  AttestVestingSettlementInput,
  CreateListingInput,
  IssueClearanceInput,
  IssueTransferConsentInput,
  MatchOfferInput,
} from "../clients/rfq-protocol.js";

type JsonBody = Record<string, unknown>;

const SUPPORTED_ASSET_TYPES = [1, 2, 3, 4, 5, 6] as const;
const VESTING_ASSET_TYPES = new Set([2, 3]);

function isVestingAssetType(assetType: number): boolean {
  return VESTING_ASSET_TYPES.has(assetType);
}

export class BadRequestError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

function parseOptionalString(value: unknown, field: string): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new BadRequestError(`${field} must be a string.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRequiredString(value: unknown, field: string): string {
  const parsed = parseOptionalString(value, field);
  if (!parsed) {
    throw new BadRequestError(`${field} is required.`);
  }
  return parsed;
}

function parseOptionalSafeInteger(value: unknown, field: string): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new BadRequestError(`${field} must be a non-negative safe integer.`);
  }

  return parsed;
}

function parseSafeIntegerWithDefault(
  value: unknown,
  field: string,
  fallback: number,
): number {
  return parseOptionalSafeInteger(value, field) ?? fallback;
}

function parsePositiveSafeInteger(value: unknown, field: string): number | undefined {
  const parsed = parseOptionalSafeInteger(value, field);
  if (parsed == null) {
    return undefined;
  }
  if (parsed === 0) {
    throw new BadRequestError(`${field} must be greater than zero when provided.`);
  }
  return parsed;
}

function parseBoolean(value: unknown, field: string): boolean {
  if (value == null || value === "") {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new BadRequestError(`${field} must be a boolean.`);
}

function requireEnum(value: number, field: string, allowed: readonly number[]): number {
  if (!allowed.includes(value)) {
    throw new BadRequestError(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value;
}

export function parseCreateListingBody(body: JsonBody): CreateListingInput {
  const assetType = requireEnum(
    parseSafeIntegerWithDefault(body.assetType, "assetType", 1),
    "assetType",
    [...SUPPORTED_ASSET_TYPES],
  );
  const transferRestrictionMode = requireEnum(
    parseSafeIntegerWithDefault(body.transferRestrictionMode, "transferRestrictionMode", 0),
    "transferRestrictionMode",
    [0, 1, 2],
  );
  const settlementMode = requireEnum(
    parseSafeIntegerWithDefault(body.settlementMode, "settlementMode", 0),
    "settlementMode",
    [0, 1, 2, 3],
  );
  const isPrivate = parseBoolean(body.isPrivate, "isPrivate");
  const recipient = parseOptionalString(body.recipient, "recipient");
  const requiredSettlementAttestor = parseOptionalString(
    body.requiredSettlementAttestor,
    "requiredSettlementAttestor",
  );
  const requiredConsentAuthority = parseOptionalString(
    body.requiredConsentAuthority,
    "requiredConsentAuthority",
  );

  if (isPrivate && !recipient) {
    throw new BadRequestError("recipient is required when isPrivate is true.");
  }

  if (transferRestrictionMode === 1 && !requiredConsentAuthority) {
    throw new BadRequestError(
      "requiredConsentAuthority is required when transferRestrictionMode is 1.",
    );
  }

  if (isVestingAssetType(assetType)) {
    if (!parseOptionalString(body.tokenMint, "tokenMint")) {
      throw new BadRequestError("tokenMint is required for vesting listings.");
    }
    if (!parseOptionalString(body.vestingSourceProgram, "vestingSourceProgram")) {
      throw new BadRequestError("vestingSourceProgram is required for vesting listings.");
    }
    if (!parseOptionalString(body.vestingSourcePosition, "vestingSourcePosition")) {
      throw new BadRequestError("vestingSourcePosition is required for vesting listings.");
    }
    if ((parseOptionalSafeInteger(body.vestingStartTs, "vestingStartTs") ?? 0) === 0) {
      throw new BadRequestError("vestingStartTs is required for vesting listings.");
    }
    if ((parseOptionalSafeInteger(body.vestingEndTs, "vestingEndTs") ?? 0) === 0) {
      throw new BadRequestError("vestingEndTs is required for vesting listings.");
    }
    if (settlementMode === 0) {
      throw new BadRequestError("settlementMode must be set for vesting listings.");
    }
    if (!requiredSettlementAttestor) {
      throw new BadRequestError(
        "requiredSettlementAttestor is required for vesting listings.",
      );
    }
  }

  return {
    assetType,
    minPrice: parseSafeIntegerWithDefault(body.minPrice, "minPrice", 0),
    tokenAmount: parseSafeIntegerWithDefault(body.tokenAmount, "tokenAmount", 0),
    valuationCap: parseSafeIntegerWithDefault(body.valuationCap, "valuationCap", 0),
    tokenMint: parseOptionalString(body.tokenMint, "tokenMint"),
    vestingSourceProgram: parseOptionalString(
      body.vestingSourceProgram,
      "vestingSourceProgram",
    ),
    vestingSourcePosition: parseOptionalString(
      body.vestingSourcePosition,
      "vestingSourcePosition",
    ),
    vestingStartTs: parseOptionalSafeInteger(body.vestingStartTs, "vestingStartTs"),
    vestingCliffTs: parseOptionalSafeInteger(body.vestingCliffTs, "vestingCliffTs"),
    vestingEndTs: parseOptionalSafeInteger(body.vestingEndTs, "vestingEndTs"),
    unlockedAmount: parseOptionalSafeInteger(body.unlockedAmount, "unlockedAmount"),
    claimedAmount: parseOptionalSafeInteger(body.claimedAmount, "claimedAmount"),
    transferRestrictionMode,
    settlementMode,
    settlementExpiresAt: parseOptionalSafeInteger(
      body.settlementExpiresAt,
      "settlementExpiresAt",
    ),
    requiredSettlementAttestor,
    requiredConsentAuthority,
    owner: parseOptionalString(body.seller, "seller"),
    isPrivate,
    recipient,
  };
}

export function parseSettlementAttestBody(body: JsonBody): AttestVestingSettlementInput {
  return {
    buyer: parseRequiredString(body.buyer, "buyer"),
    settlementProofId: parseOptionalString(body.settlementProofId, "settlementProofId"),
    settlementExpiresAt: parseOptionalSafeInteger(
      body.settlementExpiresAt,
      "settlementExpiresAt",
    ),
    settlementNonce: parsePositiveSafeInteger(body.settlementNonce, "settlementNonce"),
  };
}

export function parseConsentBody(body: JsonBody): IssueTransferConsentInput {
  return {
    buyer: parseRequiredString(body.buyer, "buyer"),
    consentExpiresAt: parseOptionalSafeInteger(body.consentExpiresAt, "consentExpiresAt"),
    consentNonce: parsePositiveSafeInteger(body.consentNonce, "consentNonce"),
  };
}

export function parseMatchBody(body: JsonBody): MatchOfferInput {
  return {
    buyer: parseOptionalString(body.buyer, "buyer"),
    bidPrice: parseOptionalSafeInteger(body.bidPrice, "bidPrice"),
  };
}

export function parseIssueClearanceBody(body: JsonBody): IssueClearanceInput {
  const expiresAt = parseOptionalSafeInteger(body.expiresAt, "expiresAt");
  return {
    buyer: parseRequiredString(body.buyer, "buyer"),
    clearanceType: requireEnum(
      parseSafeIntegerWithDefault(body.clearanceType, "clearanceType", 1),
      "clearanceType",
      [1, 2, 3],
    ),
    expiresAt: expiresAt == null ? undefined : String(expiresAt),
  };
}
