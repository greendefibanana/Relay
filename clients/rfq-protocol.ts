import * as anchor from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import {
  AddEntity,
  ApplySystem,
  ApproveSystem,
  BN,
  createDelegateInstruction,
  createUndelegateInstruction,
  DELEGATION_PROGRAM_ID,
  FindComponentPda,
  FindEntityPda,
  FindRegistryPda,
  InitializeComponent,
  InitializeNewWorld,
  InitializeRegistry,
  World,
} from "@magicblock-labs/bolt-sdk";
import {
  AccountMeta,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import type { AccountInfo } from "@solana/web3.js";
import {
  confirmMagicTransaction,
  delegationRecordPdaFromDelegatedAccount,
  getClosestValidator,
  getWritableAccounts,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import initDcap, {
  js_get_collateral as jsGetCollateral,
  js_verify as jsVerify,
} from "@phala/dcap-qvl-web";
import dotenv from "dotenv";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import nacl from "tweetnacl";
import { assetTypeLabel, isVestingAssetType } from "./asset-types.js";
import assetRegistryIdl from "../target/idl/asset_registry.json";
import dealTermsIdl from "../target/idl/deal_terms.json";
import systemMatchOfferIdl from "../target/idl/system_match_offer.json";

dotenv.config();

const DEFAULT_SOLANA_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_TEE_RPC_URL = "https://tee.magicblock.app";
const DEFAULT_WALLET_PATH = "C:/Users/ezevi/.config/solana/id.json";
const DEFAULT_STATE_PATH = path.join(process.cwd(), ".relay-state.json");

type WorldMetadata = {
  id: BN;
  entities: BN;
  authorities: PublicKey[];
  permissionless: boolean;
  systems: Uint8Array;
};

type PersistedListing = {
  listingId: string;
  world: string;
  sellerEntity: string;
  assetRegistryPda: string;
  dealTermsPda: string;
  paymentPolicyEntity?: string;
  paymentPolicyPda?: string;
  settlementPolicyEntity?: string;
  settlementPolicyPda?: string;
  assetType: number;
  minPrice: number;
  tokenAmount: number;
  valuationCap: number;
  tokenMint?: string | null;
  vestingSourceProgram?: string | null;
  vestingSourcePosition?: string | null;
  vestingStartTs?: number;
  vestingCliffTs?: number;
  vestingEndTs?: number;
  unlockedAmount?: number;
  claimedAmount?: number;
  privateBuyer?: string | null;
  transferRestrictionMode?: number;
  settlementMode?: number;
  settlementStatus?: number;
  approvedBuyer?: string | null;
  settlementAttestor?: string | null;
  settlementExpiresAt?: number;
  requiredSettlementAttestor?: string | null;
  settlementNonce?: number;
  settlementProofId?: string | null;
  settlementPolicyVersion?: number;
  settlementPreparedAt?: number;
  requiredConsentAuthority?: string | null;
  consentStatus?: number;
  consentApprovedBuyer?: string | null;
  consentAuthority?: string | null;
  consentExpiresAt?: number;
  consentNonce?: number;
  owner: string;
  isPrivate: boolean;
  recipient: string | null;
  isSold: boolean;
  buyerEntity?: string;
  updatedAt: string;
};

export type PersistedProtocolState = {
  world: string;
  listings: PersistedListing[];
};

export type ProtocolState = {
  world: PublicKey;
  buyerEntity: PublicKey;
  sellerEntity: PublicKey;
  assetRegistryPda: PublicKey;
  dealTermsPda: PublicKey;
};

type SettlementPolicyState = {
  world: PublicKey;
  policyEntity: PublicKey;
  policyPda: PublicKey;
};

type PaymentPolicyState = {
  world: PublicKey;
  policyEntity: PublicKey;
  policyPda: PublicKey;
};

type SettlementPolicySnapshot = {
  policyAuthority: string | null;
  isEnabled: boolean;
  version: number;
  primaryAttestor: string | null;
  secondaryAttestor: string | null;
  tertiaryAttestor: string | null;
  clearanceAuthority: string | null;
};

type PaymentRoutingPolicySnapshot = {
  policyAuthority: string | null;
  isEnabled: boolean;
  version: number;
  paymentMode: number;
  protocolTreasury: string | null;
  operatorTreasury: string | null;
  protocolFeeBps: number;
  operatorFeeBps: number;
};

type SettlementPolicyConfigInput = {
  primaryAttestor: string;
  secondaryAttestor?: string | null;
  tertiaryAttestor?: string | null;
  clearanceAuthority?: string | null;
  policyAuthority?: string | null;
  isEnabled?: boolean;
};

type PaymentPolicyConfigInput = {
  protocolTreasury?: string | null;
  operatorTreasury?: string | null;
  policyAuthority?: string | null;
  protocolFeeBps?: number;
  operatorFeeBps?: number;
  isEnabled?: boolean;
  paymentMode?: number;
};

export type CreateListingInput = {
  assetType: number;
  minPrice: number;
  tokenAmount: number;
  valuationCap: number;
  tokenMint?: string | null;
  vestingSourceProgram?: string | null;
  vestingSourcePosition?: string | null;
  vestingStartTs?: number;
  vestingCliffTs?: number;
  vestingEndTs?: number;
  unlockedAmount?: number;
  claimedAmount?: number;
  transferRestrictionMode?: number;
  settlementMode?: number;
  settlementExpiresAt?: number;
  requiredSettlementAttestor?: string | null;
  requiredConsentAuthority?: string | null;
  owner?: string | null;
  isPrivate?: boolean;
  recipient?: string | null;
};

export type MatchOfferInput = {
  buyer?: string | null;
  bidPrice?: number;
};

export type AttestVestingSettlementInput = {
  buyer: string;
  settlementProofId?: string | null;
  settlementExpiresAt?: number;
  settlementNonce?: number;
};

export type IssueTransferConsentInput = {
  buyer: string;
  consentExpiresAt?: number;
  consentNonce?: number;
};

export type FlowStep = {
  label: string;
  sig: string;
  explorerUrl: string | null;
};

export type ListingSnapshot = {
  tradeId: number;
  isPrivate: boolean;
  isShielded: boolean;
  isSold: boolean;
  privateBuyer: string | null;
  assetType: string;
  assetTypeId: number;
  owner: string;
  pda: string;
  dealTermsPda: string;
  minPrice: number;
  tokenAmount: number;
  valuationCap: number;
  tokenMint: string | null;
  vestingSourceProgram: string | null;
  vestingSourcePosition: string | null;
  vestingStartTs: number;
  vestingCliffTs: number;
  vestingEndTs: number;
  unlockedAmount: number;
  claimedAmount: number;
  transferRestrictionMode: number;
  settlementMode: number;
  settlementStatus: number;
  approvedBuyer: string | null;
  settlementAttestor: string | null;
  settlementExpiresAt: number;
  requiredSettlementAttestor: string | null;
  settlementNonce: number;
  settlementProofId: string | null;
  settlementPolicyVersion: number;
  settlementPreparedAt: number;
  requiredConsentAuthority: string | null;
  consentStatus: number;
  consentApprovedBuyer: string | null;
  consentAuthority: string | null;
  consentExpiresAt: number;
  consentNonce: number;
  timestamp: number;
  explorerUrl: string;
};

export type FlowExecutionResult = {
  success: true;
  steps: FlowStep[];
  world: string;
  assetRegistryPda: string;
  dealTermsPda: string;
  note: string;
  listing: ListingSnapshot | null;
};

class LocalWallet implements anchor.Wallet {
  constructor(readonly payer: Keypair) {}

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    } else {
      tx.sign([this.payer]);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    txs.forEach((tx) => {
      if (tx instanceof Transaction) {
        tx.partialSign(this.payer);
      } else {
        tx.sign([this.payer]);
      }
    });
    return txs;
  }
}

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | null {
  return process.env[name] ?? null;
}

function optionalPubkey(name: string): PublicKey | null {
  const value = optionalEnv(name);
  return value ? new PublicKey(value.trim()) : null;
}

function isLocalEphemeralRpc(rpcUrl: string): boolean {
  try {
    const url = new URL(rpcUrl);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch {
    return false;
  }
}

async function readJsonResponse<T>(response: Response, context: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "unknown";
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 200).replace(/\s+/g, " ").trim();
    throw new Error(
      `${context} returned non-JSON response (status ${response.status}, content-type ${contentType}) from ${response.url}: ${preview}`,
    );
  }
}

function teeRpcUrlWithPath(rpcEndpoint: string, pathname: string): string {
  const url = new URL(rpcEndpoint);
  const basePath = url.pathname.replace(/\/$/, "");
  url.pathname = `${basePath}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return url.toString();
}

async function getTeeDelegationStatus(
  teeConnection: Connection,
  account: PublicKey,
): Promise<boolean | null> {
  try {
    const response = await fetch(teeRpcUrlWithPath(teeConnection.rpcEndpoint, "/getDelegationStatus"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getDelegationStatus",
        params: [account.toBase58()],
      }),
    });
    const body = await readJsonResponse<{
      error?: unknown;
      result?: { isDelegated?: boolean };
    }>(response, "TEE delegation status request");

    if (!response.ok || body.error || typeof body.result?.isDelegated !== "boolean") {
      return null;
    }

    return body.result.isDelegated;
  } catch {
    return null;
  }
}

function loadKeypair(walletPath: string): Keypair {
  const bytes = JSON.parse(fs.readFileSync(walletPath, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

type LoadedSigner = {
  publicKey: PublicKey;
  keypair: Keypair;
};

function resolveConfiguredAuthorityPublicKey(
  walletPathEnv: string,
  pubkeyEnv: string,
  fallbackPublicKey: PublicKey,
): PublicKey {
  const walletPath = optionalEnv(walletPathEnv);
  if (walletPath) {
    return loadKeypair(walletPath).publicKey;
  }

  const configuredPubkey = optionalEnv(pubkeyEnv);
  return configuredPubkey ? new PublicKey(configuredPubkey.trim()) : fallbackPublicKey;
}

function resolveConfiguredSigner(
  walletPathEnv: string,
  pubkeyEnv: string,
  fallbackKeypair: Keypair,
): LoadedSigner {
  const walletPath = optionalEnv(walletPathEnv);
  if (walletPath) {
    const keypair = loadKeypair(walletPath);
    return { publicKey: keypair.publicKey, keypair };
  }

  const configuredPubkey = optionalEnv(pubkeyEnv);
  if (configuredPubkey) {
    const publicKey = new PublicKey(configuredPubkey.trim());
    if (!publicKey.equals(fallbackKeypair.publicKey)) {
      throw new Error(
        `${pubkeyEnv} requires ${walletPathEnv} when it differs from WALLET_PATH.`,
      );
    }
  }

  return { publicKey: fallbackKeypair.publicKey, keypair: fallbackKeypair };
}

function uniqueSigners(signers: Keypair[]): Keypair[] {
  const byPubkey = new Map<string, Keypair>();
  for (const signer of signers) {
    byPubkey.set(signer.publicKey.toBase58(), signer);
  }
  return [...byPubkey.values()];
}

function providerFor(connection: Connection, wallet: LocalWallet): anchor.AnchorProvider {
  return new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}

export function explorerUrl(value: string, type: "address" | "tx" = "address"): string {
  return `https://explorer.solana.com/${type}/${value}?cluster=devnet`;
}

function perExplorerUrl(signature: string): string {
  return `https://explorer.magicblock.app/tx/${signature}`;
}

function isExplorerSignature(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      !value.includes("already-") &&
      !value.includes("kept-") &&
      !value.includes("skipped-"),
  );
}

function solanaTxExplorerUrl(signature: string | null | undefined): string | null {
  return isExplorerSignature(signature) ? explorerUrl(signature, "tx") : null;
}

function perTxExplorerUrl(signature: string | null | undefined): string | null {
  return isExplorerSignature(signature) ? perExplorerUrl(signature) : null;
}

function entitySeed(seed: string): Buffer {
  return Buffer.from(seed, "utf8");
}

function buyerEntitySeedLabel(buyer: string): string {
  const prefix = env("BUYER_ENTITY_SEED", "buyer").slice(0, 7) || "buyer";
  const suffix = createHash("sha256").update(buyer).digest("hex").slice(0, 24);
  return `${prefix}-${suffix}`;
}

function settlementPolicyEntitySeed(): Buffer {
  return entitySeed(env("SETTLEMENT_POLICY_ENTITY_SEED", "settlement-policy"));
}

function paymentPolicyEntitySeed(): Buffer {
  return entitySeed(env("PAYMENT_POLICY_ENTITY_SEED", "payment-policy"));
}

function parseSafeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer.`);
  }
  return value;
}

function toPublicKey(value: string | PublicKey | null | undefined, fallback: PublicKey): PublicKey {
  if (!value) {
    return fallback;
  }
  return value instanceof PublicKey ? value : new PublicKey(value.trim());
}

function canonicalizeOptionalPubkeyString(
  value: string | null | undefined,
  field: string,
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new PublicKey(trimmed).toBase58();
  } catch {
    throw new Error(`${field} must be a valid public key.`);
  }
}

function rpcReadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRetriableRpcReadError(error: unknown): boolean {
  const message = rpcReadErrorMessage(error).toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("socket hang up") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("429") ||
    message.includes("too many requests")
  );
}

async function getAccountInfoWithRetry(
  connection: Connection,
  address: PublicKey,
  attempts = 4,
): Promise<AccountInfo<Buffer> | null> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await connection.getAccountInfo(address);
    } catch (error) {
      lastError = error;
      if (!isRetriableRpcReadError(error) || attempt === attempts) {
        throw error;
      }
      await sleep(250 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch account info for ${address.toBase58()}.`);
}

function generateSettlementProofId(): string {
  return Keypair.generate().publicKey.toBase58();
}

function appendExtraAccountsToLastInstruction(
  transaction: Transaction,
  accounts: AccountMeta[],
): Transaction {
  const instruction = transaction.instructions[transaction.instructions.length - 1];
  if (!instruction) {
    throw new Error("ApplySystem transaction did not contain an instruction to extend.");
  }
  instruction.keys.push(...accounts);
  return transaction;
}

function optionalListingPubkey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value === PublicKey.default.toBase58() ? null : value;
}

function stateFilePath(): string {
  return process.env.RELAY_STATE_PATH || DEFAULT_STATE_PATH;
}

function loadPersistedState(): PersistedProtocolState | null {
  const filename = stateFilePath();
  if (!fs.existsSync(filename)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filename, "utf8")) as PersistedProtocolState;
}

function savePersistedState(state: PersistedProtocolState): void {
  fs.writeFileSync(stateFilePath(), JSON.stringify(state, null, 2));
}

function readConfiguredState(): PersistedProtocolState | null {
  const world = optionalEnv("WORLD_PDA");
  const sellerEntity = optionalEnv("SELLER_ENTITY_PDA");
  const buyerEntity = optionalEnv("BUYER_ENTITY_PDA");
  const assetRegistryPda = optionalEnv("ASSET_REGISTRY_PDA");
  const dealTermsPda = optionalEnv("DEAL_TERMS_PDA");

  if (!world || !sellerEntity || !buyerEntity || !assetRegistryPda || !dealTermsPda) {
    return null;
  }

  return {
    world,
    listings: [
      {
        listingId: "1",
        world,
        sellerEntity,
        buyerEntity,
        assetRegistryPda,
        dealTermsPda,
        assetType: 1,
        minPrice: 0,
        tokenAmount: 0,
        valuationCap: 0,
        owner: "",
        isPrivate: false,
        recipient: null,
        isSold: false,
        updatedAt: new Date().toISOString()
      }
    ]
  };
}

function getStoredState(): PersistedProtocolState | null {
  return loadPersistedState() || readConfiguredState();
}

function toPersistedState(state: ProtocolState, listing?: PersistedListing): PersistedProtocolState {
  const existing = getStoredState();
  const listings = existing?.listings || [];
  
  if (listing) {
    const idx = listings.findIndex(l => l.listingId === listing.listingId);
    if (idx >= 0) {
      listings[idx] = listing;
    } else {
      listings.push(listing);
    }
  }

  return {
    world: state.world.toBase58(),
    listings,
  };
}

function restoredStateToProtocolState(state: PersistedProtocolState, listingId?: string): ProtocolState {
  const listing = listingId 
    ? state.listings.find(l => l.listingId === listingId)
    : state.listings[state.listings.length - 1]; // Default to most recent/only
    
  if (!listing) throw new Error("Listing not found in persisted state");

  return {
    world: new PublicKey(state.world),
    sellerEntity: new PublicKey(listing.sellerEntity),
    buyerEntity: listing.buyerEntity ? new PublicKey(listing.buyerEntity) : PublicKey.default,
    assetRegistryPda: new PublicKey(listing.assetRegistryPda),
    dealTermsPda: new PublicKey(listing.dealTermsPda),
  };
}

let worldAccountsCoder: anchor.BorshAccountsCoder | null = null;

function getWorldAccountsCoder(): anchor.BorshAccountsCoder {
  if (worldAccountsCoder) {
    return worldAccountsCoder;
  }

  const idlPath = path.join(
    process.cwd(),
    "node_modules",
    "@magicblock-labs",
    "bolt-sdk",
    "lib",
    "generated",
    "idl",
    "world.json",
  );
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl;
  worldAccountsCoder = new anchor.BorshAccountsCoder(idl);
  return worldAccountsCoder;
}

const assetRegistryCoder = new anchor.BorshAccountsCoder(assetRegistryIdl as Idl);
const dealTermsCoder = new anchor.BorshAccountsCoder(dealTermsIdl as Idl);
const delegationProgramId = new PublicKey(DELEGATION_PROGRAM_ID);

const TOP_UP_EPHEMERAL_BALANCE_DISCRIMINATOR = 9;
const CLOSE_EPHEMERAL_BALANCE_DISCRIMINATOR = 11;

async function readWorldMetadata(
  connection: Connection,
  world: PublicKey,
): Promise<WorldMetadata> {
  const worldInfo = await getAccountInfoWithRetry(connection, world);
  if (!worldInfo) {
    throw new Error(`Unable to find world account: ${world.toBase58()}`);
  }

  const decoded = getWorldAccountsCoder().decode("World", worldInfo.data) as WorldMetadata | null;
  if (!decoded) {
    throw new Error(`Unable to decode world account: ${world.toBase58()}`);
  }

  return decoded;
}

async function verifyTeeRpcIntegrityNode(rpcUrl: string): Promise<boolean> {
  const challengeBytes = Buffer.from(
    Uint8Array.from(Array(32).fill(0).map(() => Math.floor(Math.random() * 256))),
  );
  const challenge = challengeBytes.toString("base64");
  const response = await fetch(`${rpcUrl}/quote?challenge=${encodeURIComponent(challenge)}`);
  const responseBody = await readJsonResponse<{ error?: string; quote?: string }>(
    response,
    "TEE quote request",
  );

  if (response.status !== 200 || !responseBody.quote) {
    throw new Error(responseBody.error ?? "Failed to get quote");
  }

  const wasmPath = path.join(
    path.dirname(require.resolve("@phala/dcap-qvl-web")),
    "dcap-qvl-web_bg.wasm",
  );
  const wasmBytes = await fs.promises.readFile(wasmPath);
  await initDcap({ module_or_path: wasmBytes });

  const rawQuote = Uint8Array.from(Buffer.from(responseBody.quote, "base64"));
  const quoteCollateral = await jsGetCollateral(
    "https://pccs.phala.network/tdx/certification/v4",
    rawQuote,
  );
  const now = BigInt(Math.floor(Date.now() / 1000));

  try {
    jsVerify(rawQuote, quoteCollateral, now);
    return true;
  } catch {
    return false;
  }
}

async function getAuthTokenNode(
  rpcUrl: string,
  publicKey: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
): Promise<string> {
  const bs58 = require("bs58") as { encode(input: Uint8Array): string };
  const challengeResponse = await fetch(`${rpcUrl}/auth/challenge?pubkey=${publicKey.toString()}`);
  const challengeJson = await readJsonResponse<{ challenge?: string; error?: string }>(
    challengeResponse,
    "TEE auth challenge request",
  );

  if (challengeResponse.status !== 200 || !challengeJson.challenge) {
    throw new Error(challengeJson.error ?? "Failed to fetch TEE auth challenge");
  }

  const signature = await signMessage(new Uint8Array(Buffer.from(challengeJson.challenge, "utf-8")));
  const signatureString = bs58.encode(signature);
  const authResponse = await fetch(`${rpcUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pubkey: publicKey.toString(),
      challenge: challengeJson.challenge,
      signature: signatureString,
    }),
  });
  const authJson = await readJsonResponse<{ token?: string; error?: string }>(
    authResponse,
    "TEE auth login request",
  );

  if (authResponse.status !== 200 || !authJson.token) {
    throw new Error(authJson.error ?? "Failed to authenticate with TEE RPC");
  }

  return authJson.token;
}

async function buildTeeProvider(wallet: LocalWallet): Promise<anchor.AnchorProvider> {
  const teeRpcUrl = env("TEE_RPC_URL", DEFAULT_TEE_RPC_URL);
  if (isLocalEphemeralRpc(teeRpcUrl)) {
    return providerFor(new Connection(teeRpcUrl, "confirmed"), wallet);
  }

  const skipVerification = process.env.SKIP_TEE_VERIFICATION === "true";
  if (!skipVerification) {
    const isVerified = await verifyTeeRpcIntegrityNode(teeRpcUrl);
    if (!isVerified) {
      throw new Error("TEE attestation failed.");
    }
  }

  const token = await getAuthTokenNode(
    teeRpcUrl,
    wallet.publicKey,
    (message: Uint8Array) =>
      Promise.resolve(nacl.sign.detached(message, wallet.payer.secretKey)),
  );

  const teeConnection = new Connection(`${teeRpcUrl}?token=${token}`, "confirmed");
  return providerFor(teeConnection, wallet);
}

async function sendAndConfirmPerTransaction(
  connection: Connection,
  payer: Keypair,
  transaction: Transaction,
  options?: ConfirmOptions,
  additionalSigners: Keypair[] = [],
): Promise<string> {
  const signers = uniqueSigners([payer, ...additionalSigners]);
  if (!transaction.feePayer) {
    transaction.feePayer = payer.publicKey;
  }
  if (isLocalEphemeralRpc(connection.rpcEndpoint)) {
    if (!transaction.recentBlockhash) {
      const latestBlockhash = await connection.getLatestBlockhash(options?.commitment ?? "confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    }
    if (signers.length > 0) {
      const message = transaction.serializeMessage();
      for (const signer of signers) {
        const sig = nacl.sign.detached(message, signer.secretKey);
        transaction.addSignature(signer.publicKey, Buffer.from(sig));
      }
    }

    const signature = await connection.sendRawTransaction(transaction.serialize(), options);
    const confirmation = await confirmMagicTransaction(
      connection,
      {
        signature,
        blockhash: transaction.recentBlockhash as string,
        lastValidBlockHeight: transaction.lastValidBlockHeight as number,
      },
      options?.commitment ?? "confirmed",
    );

    if (confirmation.value.err) {
      throw new SendTransactionError({
        action: "send",
        signature,
        transactionMessage: `Status: (${JSON.stringify(confirmation.value)})`,
      });
    }

    return signature;
  }

  const writableAccounts = getWritableAccounts(transaction);
  const blockhashResponse = await fetch(connection.rpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBlockhashForAccounts",
      params: [writableAccounts],
    }),
  });
  const blockhashBody = await readJsonResponse<{
    error?: unknown;
    result?: {
      blockhash?: string;
      lastValidBlockHeight?: number;
      value?: {
        blockhash: string;
        lastValidBlockHeight: number;
      };
    };
  }>(blockhashResponse, "PER blockhash request");

  if (!blockhashResponse.ok || blockhashBody.error) {
    throw new Error(`Failed to fetch PER blockhash: ${JSON.stringify(blockhashBody)}`);
  }

  const blockhashValue = blockhashBody.result?.value ?? blockhashBody.result;
  if (!blockhashValue?.blockhash || typeof blockhashValue.lastValidBlockHeight !== "number") {
    throw new Error(`Unexpected PER blockhash response: ${JSON.stringify(blockhashBody)}`);
  }

  if (!transaction.recentBlockhash) {
    transaction.recentBlockhash = blockhashValue.blockhash;
    transaction.lastValidBlockHeight = blockhashValue.lastValidBlockHeight;
  }

  if (signers.length > 0) {
    const message = transaction.serializeMessage();
    for (const signer of signers) {
      const sig = nacl.sign.detached(message, signer.secretKey);
      transaction.addSignature(signer.publicKey, Buffer.from(sig));
    }
  }

  try {
    const signature = await connection.sendRawTransaction(transaction.serialize(), options);
    const confirmation = await confirmMagicTransaction(
      connection,
      {
        signature,
        blockhash: blockhashValue.blockhash,
        lastValidBlockHeight: blockhashValue.lastValidBlockHeight,
      },
      options?.commitment ?? "confirmed",
    );

    if (confirmation.value.err) {
      throw new SendTransactionError({
        action: "send",
        signature,
        transactionMessage: `Status: (${JSON.stringify(confirmation.value)})`,
      });
    }

    return signature;
  } catch (error) {
    if (error instanceof SendTransactionError) {
      try {
        const simulation = await connection.simulateTransaction(transaction);
        if (simulation.value.logs?.length) {
          error.message = `${error.message}\nSimulation logs:\n${simulation.value.logs.join("\n")}`;
        }
      } catch {
        // Keep the original error if the fallback simulation also fails.
      }
    }
    throw error;
  }
}

async function sendAndConfirmBaseTransaction(
  connection: Connection,
  payer: Keypair,
  transaction: Transaction,
  options?: ConfirmOptions,
  additionalSigners: Keypair[] = [],
): Promise<string> {
  const signers = uniqueSigners([payer, ...additionalSigners]);
  const latestBlockhash = await connection.getLatestBlockhash(options?.commitment ?? "confirmed");
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  transaction.sign(...signers);

  try {
    const signature = await connection.sendRawTransaction(transaction.serialize(), options);
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      options?.commitment ?? "confirmed",
    );

    if (confirmation.value.err) {
      throw new SendTransactionError({
        action: "send",
        signature,
        transactionMessage: `Status: (${JSON.stringify(confirmation.value)})`,
      });
    }

    return signature;
  } catch (error) {
    if (error instanceof SendTransactionError) {
      try {
        const simulation = await connection.simulateTransaction(transaction);
        if (simulation.value.logs?.length) {
          error.message = `${error.message}\nSimulation logs:\n${simulation.value.logs.join("\n")}`;
        }
      } catch {
        // Keep the original error if the fallback simulation also fails.
      }
    }
    throw error;
  }
}

function discriminatorBuffer(value: number): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
}

function encodeU64(value: number, field: string): Buffer {
  const parsed = parseSafeInteger(value, field);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(parsed));
  return buffer;
}

function parseU8(value: number, field: string): number {
  const parsed = parseSafeInteger(value, field);
  if (parsed > 255) {
    throw new Error(`${field} must fit in a single byte.`);
  }
  return parsed;
}

function deriveEphemeralBalancePda(escrowAuthority: PublicKey, escrowIndex: number): PublicKey {
  const parsedIndex = parseU8(escrowIndex, "escrowIndex");
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("balance", "utf8"),
      escrowAuthority.toBuffer(),
      Buffer.from([parsedIndex]),
    ],
    delegationProgramId,
  )[0];
}

function buildTopUpEphemeralBalanceInstruction(
  payer: PublicKey,
  escrowAuthority: PublicKey,
  amount: number,
  escrowIndex: number,
): TransactionInstruction {
  const parsedIndex = parseU8(escrowIndex, "escrowIndex");
  const ephemeralBalancePda = deriveEphemeralBalancePda(escrowAuthority, parsedIndex);

  return new TransactionInstruction({
    programId: delegationProgramId,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: escrowAuthority, isSigner: false, isWritable: false },
      { pubkey: ephemeralBalancePda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      discriminatorBuffer(TOP_UP_EPHEMERAL_BALANCE_DISCRIMINATOR),
      encodeU64(amount, "ephemeralBalanceTopUpAmount"),
      Buffer.from([parsedIndex]),
    ]),
  });
}

function buildCloseEphemeralBalanceInstruction(
  escrowAuthority: PublicKey,
  escrowIndex: number,
): TransactionInstruction {
  const parsedIndex = parseU8(escrowIndex, "escrowIndex");
  const ephemeralBalancePda = deriveEphemeralBalancePda(escrowAuthority, parsedIndex);

  return new TransactionInstruction({
    programId: delegationProgramId,
    keys: [
      { pubkey: escrowAuthority, isSigner: true, isWritable: true },
      { pubkey: ephemeralBalancePda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      discriminatorBuffer(CLOSE_EPHEMERAL_BALANCE_DISCRIMINATOR),
      Buffer.from([parsedIndex]),
    ]),
  });
}

function escrowIndexForListing(listingId: string): number {
  return createHash("sha256").update(listingId).digest()[0] ?? 0;
}

async function buildCommitMatchedOfferInstruction(
  provider: anchor.AnchorProvider,
  input: {
    payer: PublicKey;
    assetRegistry: PublicKey;
    buyerClearance: PublicKey;
    escrowAuthority: PublicKey;
    bidPrice: number;
    paymentRoutingPolicy: PublicKey;
    protocolTreasury: PublicKey;
    operatorTreasury: PublicKey;
    escrowIndex: number;
    teeValidator: PublicKey;
  },
): Promise<TransactionInstruction> {
  const ids = componentIds();
  const idl = { ...systemMatchOfferIdl, address: ids.matchOfferSystemId.toBase58() };
  const program = new anchor.Program(idl as Idl, provider) as anchor.Program<any>;
  const instruction = await (program.methods as any)
    .commitMatchedOffer({
      bidPrice: new BN(input.bidPrice),
      paymentRoutingPolicy: input.paymentRoutingPolicy,
      protocolTreasury: input.protocolTreasury,
      operatorTreasury: input.operatorTreasury,
      escrowIndex: input.escrowIndex,
    })
    .accounts({
      payer: input.payer,
      assetRegistry: input.assetRegistry,
      buyerClearance: input.buyerClearance,
      escrowAuthority: input.escrowAuthority,
      magicContext: new PublicKey("MagicContext1111111111111111111111111111111"),
      magicProgram: new PublicKey("Magic11111111111111111111111111111111111111"),
    })
    .instruction();

  // The Magic program requires escrow_authority to SIGN the transaction,
  // but it must NOT be writable (PER rejects writes to non-delegated accounts).
  const authIndex = instruction.keys.findIndex((k: any) => k.pubkey.equals(input.escrowAuthority));
  if (authIndex >= 0) {
    instruction.keys[authIndex].isSigner = true;
    instruction.keys[authIndex].isWritable = false;
  }

  return instruction;
}

async function closeEphemeralBalanceIfPossible(
  connection: Connection,
  escrowAuthoritySigner: LoadedSigner | null,
  escrowIndex: number,
): Promise<string> {
  if (!escrowAuthoritySigner) {
    return "close-skipped";
  }

  const transaction = new Transaction().add(
    buildCloseEphemeralBalanceInstruction(escrowAuthoritySigner.publicKey, escrowIndex),
  );
  return await sendAndConfirmBaseTransaction(
    connection,
    escrowAuthoritySigner.keypair,
    transaction,
  );
}

async function ensureRegistry(provider: anchor.AnchorProvider): Promise<void> {
  const registryPda = FindRegistryPda({});
  const registryInfo = await getAccountInfoWithRetry(provider.connection, registryPda);
  if (registryInfo) {
    return;
  }

  const initializeRegistry = await InitializeRegistry({
    payer: provider.wallet.publicKey,
    connection: provider.connection,
  });
  await provider.sendAndConfirm(initializeRegistry.transaction);
}

async function ensureWorld(provider: anchor.AnchorProvider): Promise<PublicKey> {
  const configuredWorld = optionalPubkey("WORLD_PDA");
  if (configuredWorld) {
    return configuredWorld;
  }

  const persisted = loadPersistedState();
  if (persisted?.world) {
    return new PublicKey(persisted.world);
  }

  const initializeNewWorld = await InitializeNewWorld({
    payer: provider.wallet.publicKey,
    connection: provider.connection,
  });
  await provider.sendAndConfirm(initializeNewWorld.transaction);
  return initializeNewWorld.worldPda;
}

async function ensureApprovedSystem(
  provider: anchor.AnchorProvider,
  world: PublicKey,
  systemId: PublicKey,
): Promise<void> {
  const worldMetadata = await readWorldMetadata(provider.connection, world);
  if (worldMetadata.permissionless && worldMetadata.authorities.length === 0) {
    return;
  }

  try {
    const approveSystem = await ApproveSystem({
      authority: provider.wallet.publicKey,
      systemToApprove: systemId,
      world,
    });
    await provider.sendAndConfirm(approveSystem.transaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("already")) {
      throw error;
    }
  }
}

async function findOrCreateEntity(
  provider: anchor.AnchorProvider,
  world: PublicKey,
  seedLabel: string,
): Promise<PublicKey> {
  const worldAccount = await World.fromAccountAddress(provider.connection, world);
  const worldId = new BN(worldAccount.id.toString());
  const seed = entitySeed(seedLabel);
  const entityPda = FindEntityPda({ worldId, seed });
  const entityInfo = await getAccountInfoWithRetry(provider.connection, entityPda);
  if (entityInfo) {
    return entityPda;
  }

  const addEntity = await AddEntity({
    payer: provider.wallet.publicKey,
    world,
    seed,
    connection: provider.connection,
  });
  await provider.sendAndConfirm(addEntity.transaction);
  return addEntity.entityPda;
}

async function findOrCreateComponent(
  provider: anchor.AnchorProvider,
  entity: PublicKey,
  componentId: PublicKey,
): Promise<PublicKey> {
  const componentPda = FindComponentPda({ componentId, entity });
  const componentInfo = await getAccountInfoWithRetry(provider.connection, componentPda);
  if (componentInfo) {
    return componentPda;
  }

  const initializeComponent = await InitializeComponent({
    payer: provider.wallet.publicKey,
    entity,
    componentId,
  });
  await provider.sendAndConfirm(initializeComponent.transaction);
  return initializeComponent.componentPda;
}

async function isDelegatedComponent(
  connection: Connection,
  componentPda: PublicKey,
): Promise<boolean> {
  const accountInfo = await getAccountInfoWithRetry(connection, componentPda);
  if (!accountInfo) {
    throw new Error(`Unable to find component account: ${componentPda.toBase58()}`);
  }

  return accountInfo.owner.equals(new PublicKey(DELEGATION_PROGRAM_ID));
}

async function getDelegatedValidator(
  connection: Connection,
  componentPda: PublicKey,
): Promise<PublicKey | null> {
  const delegationRecord = delegationRecordPdaFromDelegatedAccount(componentPda);
  const accountInfo = await getAccountInfoWithRetry(connection, delegationRecord);
  if (
    !accountInfo ||
    !accountInfo.owner.equals(new PublicKey(DELEGATION_PROGRAM_ID)) ||
    accountInfo.data.length < 40
  ) {
    return null;
  }

  return new PublicKey(accountInfo.data.subarray(8, 40));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasErDelegatedMirror(
  teeConnection: Connection,
  componentPda: PublicKey,
  componentId: PublicKey,
): Promise<boolean | null> {
  try {
    if (isLocalEphemeralRpc(teeConnection.rpcEndpoint)) {
      const erInfo = await getAccountInfoWithRetry(teeConnection, componentPda);
      return !!erInfo && erInfo.owner.equals(componentId);
    }

    const isDelegated = await getTeeDelegationStatus(teeConnection, componentPda);
    if (typeof isDelegated === "boolean") {
      return isDelegated;
    }
  } catch {
    return null;
  }

  return null;
}

async function isErMirrorSyncedToBase(
  baseConnection: Connection,
  teeConnection: Connection,
  componentPda: PublicKey,
  componentId: PublicKey,
): Promise<boolean | null> {
  try {
    if (isLocalEphemeralRpc(teeConnection.rpcEndpoint)) {
      const [baseInfo, erInfo] = await Promise.all([
        getAccountInfoWithRetry(baseConnection, componentPda),
        getAccountInfoWithRetry(teeConnection, componentPda),
      ]);
      if (!baseInfo) {
        return false;
      }
      if (!baseInfo.owner.equals(new PublicKey(DELEGATION_PROGRAM_ID))) {
        return false;
      }
      if (!erInfo || !erInfo.owner.equals(componentId)) {
        return false;
      }
      return Buffer.compare(Buffer.from(baseInfo.data), Buffer.from(erInfo.data)) === 0;
    }

    return await hasErDelegatedMirror(teeConnection, componentPda, componentId);
  } catch {
    return null;
  }
}

async function waitForDelegationState(
  baseConnection: Connection,
  teeConnection: Connection,
  componentPda: PublicKey,
  componentId: PublicKey,
  expectedDelegated: boolean,
  timeoutMs = 15000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastBaseState = false;
  let lastErState: boolean | null = null;

  while (Date.now() < deadline) {
    try {
      lastBaseState = await isDelegatedComponent(baseConnection, componentPda);
      lastErState = await isErMirrorSyncedToBase(
        baseConnection,
        teeConnection,
        componentPda,
        componentId,
      );
    } catch (error) {
      if (!isRetriableRpcReadError(error)) {
        throw error;
      }
      await sleep(500);
      continue;
    }

    if (
      (expectedDelegated && lastBaseState && lastErState === true) ||
      (!expectedDelegated && !lastBaseState)
    ) {
      return;
    }

    await sleep(500);
  }

  const baseLabel = lastBaseState ? "delegated" : "undelegated";
  const erLabel =
    lastErState === null ? "unknown" : lastErState ? "delegated" : "undelegated";
  throw new Error(
    `Timed out waiting for ${componentPda.toBase58()} to become ${
      expectedDelegated ? "delegated" : "undelegated"
    } (base=${baseLabel}, er=${erLabel}).`,
  );
}

async function ensureWorldState(
  provider: anchor.AnchorProvider,
  assetRegistryComponentId: PublicKey,
  dealTermsComponentId: PublicKey,
  listingId?: string,
  seedOverrides?: {
    buyerEntitySeed?: string;
    sellerEntitySeed?: string;
  },
): Promise<ProtocolState> {
  await ensureRegistry(provider);
  const world = await ensureWorld(provider);

  const persisted = loadPersistedState();
  let existingListing = listingId 
    ? persisted?.listings?.find(l => l.listingId === listingId)
    : undefined;

  const defaultBuyerSeed = seedOverrides?.buyerEntitySeed ?? env("BUYER_ENTITY_SEED", "buyer");
  const defaultSellerSeed = seedOverrides?.sellerEntitySeed ?? env("SELLER_ENTITY_SEED", "seller");

  const buyerEntity =
    optionalPubkey("BUYER_ENTITY_PDA") ||
    (seedOverrides?.buyerEntitySeed
      ? null
      : existingListing?.buyerEntity
        ? new PublicKey(existingListing.buyerEntity)
        : null) ||
    (await findOrCreateEntity(provider, world, defaultBuyerSeed));
  const sellerEntity =
    optionalPubkey("SELLER_ENTITY_PDA") ||
    (existingListing?.sellerEntity ? new PublicKey(existingListing.sellerEntity) : null) ||
    (await findOrCreateEntity(provider, world, defaultSellerSeed));

  const assetRegistryPda =
    optionalPubkey("ASSET_REGISTRY_PDA") ||
    (existingListing?.assetRegistryPda ? new PublicKey(existingListing.assetRegistryPda) : null) ||
    (await findOrCreateComponent(provider, sellerEntity, assetRegistryComponentId));
  const dealTermsPda =
    optionalPubkey("DEAL_TERMS_PDA") ||
    (existingListing?.dealTermsPda ? new PublicKey(existingListing.dealTermsPda) : null) ||
    (await findOrCreateComponent(provider, sellerEntity, dealTermsComponentId));

  return {
    world,
    buyerEntity,
    sellerEntity,
    assetRegistryPda,
    dealTermsPda,
  };
}

function resolveSettlementPolicyConfig(
  fallbackPrimaryAttestor: string,
  fallbackClearanceAuthority: string,
): SettlementPolicyConfigInput {
  const primaryAttestor =
    optionalEnv("SETTLEMENT_POLICY_PRIMARY_ATTESTOR") || fallbackPrimaryAttestor;
  if (!primaryAttestor) {
    throw new Error("A settlement attestor is required to configure settlement policy.");
  }

  return {
    primaryAttestor,
    secondaryAttestor: optionalEnv("SETTLEMENT_POLICY_SECONDARY_ATTESTOR"),
    tertiaryAttestor: optionalEnv("SETTLEMENT_POLICY_TERTIARY_ATTESTOR"),
    clearanceAuthority: fallbackClearanceAuthority,
    policyAuthority: optionalEnv("SETTLEMENT_POLICY_AUTHORITY"),
    isEnabled: optionalEnv("SETTLEMENT_POLICY_ENABLED") !== "false",
  };
}

async function ensureSettlementPolicyState(
  provider: anchor.AnchorProvider,
  settlementAuthorityPolicyComponentId: PublicKey,
): Promise<SettlementPolicyState> {
  await ensureRegistry(provider);
  const world = await ensureWorld(provider);
  const worldAccount = await World.fromAccountAddress(provider.connection, world);
  const worldId = new BN(worldAccount.id.toString());
  const policyEntity = FindEntityPda({ worldId, seed: settlementPolicyEntitySeed() });
  const entityInfo = await getAccountInfoWithRetry(provider.connection, policyEntity);

  if (!entityInfo) {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world,
      seed: settlementPolicyEntitySeed(),
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
  }

  const policyPda = await findOrCreateComponent(
    provider,
    policyEntity,
    settlementAuthorityPolicyComponentId,
  );

  return {
    world,
    policyEntity,
    policyPda,
  };
}

async function buildConfigureSettlementPolicyTransaction(
  authority: PublicKey,
  world: PublicKey,
  systemId: PublicKey,
  policyEntity: PublicKey,
  settlementAuthorityPolicyComponentId: PublicKey,
  input: SettlementPolicyConfigInput,
  version: number,
): Promise<Transaction> {
  const applySystem = await ApplySystem({
    authority,
    world,
    systemId,
    entities: [
      {
        entity: policyEntity,
        components: [{ componentId: settlementAuthorityPolicyComponentId }],
      },
    ],
    args: {
      policy_authority: input.policyAuthority ?? "",
      is_enabled: input.isEnabled ?? true,
      version: parseSafeInteger(version, "settlementPolicyVersion"),
      primary_attestor: input.primaryAttestor,
      secondary_attestor: input.secondaryAttestor ?? "",
      tertiary_attestor: input.tertiaryAttestor ?? "",
      clearance_authority: input.clearanceAuthority ?? "",
    },
  });

  return applySystem.transaction;
}

async function ensureSettlementPolicyConfigured(
  provider: anchor.AnchorProvider,
  teeProvider: anchor.AnchorProvider,
  wallet: LocalWallet,
  teeValidator: PublicKey,
  ids: ReturnType<typeof componentIds>,
  fallbackPrimaryAttestor: string,
): Promise<SettlementPolicyState> {
  const policyConfig = resolveSettlementPolicyConfig(
    fallbackPrimaryAttestor,
    wallet.publicKey.toBase58(),
  );
  const policyAuthoritySigner = resolveConfiguredSigner(
    "SETTLEMENT_POLICY_AUTHORITY_WALLET_PATH",
    "SETTLEMENT_POLICY_AUTHORITY",
    wallet.payer,
  );
  const policyState = await ensureSettlementPolicyState(
    provider,
    ids.settlementAuthorityPolicyComponentId,
  );

  await ensureApprovedSystem(provider, policyState.world, ids.configureSettlementPolicySystemId);

  const policyDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    policyState.policyEntity,
    ids.settlementAuthorityPolicyComponentId,
    teeValidator,
  );
  void policyDelegateSignature;

  const currentPolicy =
    (await readSettlementPolicySnapshot(teeProvider.connection, policyState.policyPda)) ||
    (await readSettlementPolicySnapshot(provider.connection, policyState.policyPda));
  const desiredPolicyAuthority =
    policyConfig.policyAuthority ?? policyAuthoritySigner.publicKey.toBase58();
  const desiredEnabled = policyConfig.isEnabled ?? true;
  const isAlreadyConfigured =
    currentPolicy &&
    currentPolicy.policyAuthority === desiredPolicyAuthority &&
    currentPolicy.isEnabled === desiredEnabled &&
    currentPolicy.primaryAttestor === policyConfig.primaryAttestor &&
    currentPolicy.secondaryAttestor === (policyConfig.secondaryAttestor ?? null) &&
    currentPolicy.tertiaryAttestor === (policyConfig.tertiaryAttestor ?? null) &&
    currentPolicy.clearanceAuthority === (policyConfig.clearanceAuthority ?? null);

  if (isAlreadyConfigured) {
    await undelegateComponentAccount(
      provider.connection,
      teeProvider.connection,
      wallet.payer,
      wallet.publicKey,
      policyState.policyPda,
      ids.settlementAuthorityPolicyComponentId,
    );
    return policyState;
  }

  const nextVersion = Math.max(
    currentPolicy?.version ?? 0,
    parseSafeInteger(Number(optionalEnv("SETTLEMENT_POLICY_VERSION") || "0"), "settlementPolicyVersion"),
  ) + 1;
  const transaction = await buildConfigureSettlementPolicyTransaction(
    policyAuthoritySigner.publicKey,
    policyState.world,
    ids.configureSettlementPolicySystemId,
    policyState.policyEntity,
    ids.settlementAuthorityPolicyComponentId,
    {
      ...policyConfig,
      policyAuthority: desiredPolicyAuthority,
    },
    nextVersion,
  );
  await sendAndConfirmPerTransaction(
    teeProvider.connection,
    wallet.payer,
    transaction,
    undefined,
    policyAuthoritySigner.publicKey.equals(wallet.publicKey) ? [] : [policyAuthoritySigner.keypair],
  );

  await undelegateComponentAccount(
    provider.connection,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    policyState.policyPda,
    ids.settlementAuthorityPolicyComponentId,
  );

  return policyState;
}

function resolvePaymentPolicyConfig(
  fallbackPolicyAuthority: string,
): PaymentPolicyConfigInput {
  const protocolFeeBps = parseSafeInteger(
    Number(optionalEnv("PAYMENT_POLICY_PROTOCOL_FEE_BPS") || "0"),
    "paymentPolicyProtocolFeeBps",
  );
  const operatorFeeBps = parseSafeInteger(
    Number(optionalEnv("PAYMENT_POLICY_OPERATOR_FEE_BPS") || "0"),
    "paymentPolicyOperatorFeeBps",
  );

  return {
    protocolTreasury: optionalEnv("PAYMENT_POLICY_PROTOCOL_TREASURY"),
    operatorTreasury: optionalEnv("PAYMENT_POLICY_OPERATOR_TREASURY"),
    policyAuthority: optionalEnv("PAYMENT_POLICY_AUTHORITY") || fallbackPolicyAuthority,
    protocolFeeBps,
    operatorFeeBps,
    isEnabled: optionalEnv("PAYMENT_POLICY_ENABLED") !== "false",
    paymentMode: Number(optionalEnv("PAYMENT_POLICY_MODE") || "1"),
  };
}

async function ensurePaymentPolicyState(
  provider: anchor.AnchorProvider,
  paymentRoutingPolicyComponentId: PublicKey,
): Promise<PaymentPolicyState> {
  await ensureRegistry(provider);
  const world = await ensureWorld(provider);
  const worldAccount = await World.fromAccountAddress(provider.connection, world);
  const worldId = new BN(worldAccount.id.toString());
  const policyEntity = FindEntityPda({ worldId, seed: paymentPolicyEntitySeed() });
  const entityInfo = await getAccountInfoWithRetry(provider.connection, policyEntity);

  if (!entityInfo) {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world,
      seed: paymentPolicyEntitySeed(),
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
  }

  const policyPda = await findOrCreateComponent(
    provider,
    policyEntity,
    paymentRoutingPolicyComponentId,
  );

  return {
    world,
    policyEntity,
    policyPda,
  };
}

async function buildConfigurePaymentRoutingTransaction(
  authority: PublicKey,
  world: PublicKey,
  systemId: PublicKey,
  policyEntity: PublicKey,
  paymentRoutingPolicyComponentId: PublicKey,
  input: PaymentPolicyConfigInput,
  version: number,
): Promise<Transaction> {
  const applySystem = await ApplySystem({
    authority,
    world,
    systemId,
    entities: [
      {
        entity: policyEntity,
        components: [{ componentId: paymentRoutingPolicyComponentId }],
      },
    ],
    args: {
      policy_authority: input.policyAuthority ?? "",
      is_enabled: input.isEnabled ?? true,
      version: parseSafeInteger(version, "paymentPolicyVersion"),
      payment_mode: parseSafeInteger(input.paymentMode ?? 1, "paymentPolicyMode"),
      protocol_treasury: input.protocolTreasury ?? "",
      operator_treasury: input.operatorTreasury ?? "",
      protocol_fee_bps: parseSafeInteger(input.protocolFeeBps ?? 0, "paymentPolicyProtocolFeeBps"),
      operator_fee_bps: parseSafeInteger(input.operatorFeeBps ?? 0, "paymentPolicyOperatorFeeBps"),
    },
  });

  return applySystem.transaction;
}

async function ensurePaymentRoutingConfigured(
  provider: anchor.AnchorProvider,
  teeProvider: anchor.AnchorProvider,
  wallet: LocalWallet,
  teeValidator: PublicKey,
  ids: ReturnType<typeof componentIds>,
): Promise<PaymentPolicyState> {
  const policyAuthoritySigner = resolveConfiguredSigner(
    "PAYMENT_POLICY_AUTHORITY_WALLET_PATH",
    "PAYMENT_POLICY_AUTHORITY",
    wallet.payer,
  );
  const policyConfig = resolvePaymentPolicyConfig(policyAuthoritySigner.publicKey.toBase58());
  const policyState = await ensurePaymentPolicyState(
    provider,
    ids.paymentRoutingPolicyComponentId,
  );

  await ensureApprovedSystem(provider, policyState.world, ids.configurePaymentRoutingSystemId);

  const paymentPolicyDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    policyState.policyEntity,
    ids.paymentRoutingPolicyComponentId,
    teeValidator,
  );
  void paymentPolicyDelegateSignature;

  const currentPolicy =
    (await readPaymentRoutingPolicySnapshot(teeProvider.connection, policyState.policyPda)) ||
    (await readPaymentRoutingPolicySnapshot(provider.connection, policyState.policyPda));
  const desiredPolicyAuthority = policyConfig.policyAuthority ?? policyAuthoritySigner.publicKey.toBase58();
  const isAlreadyConfigured =
    currentPolicy &&
    currentPolicy.policyAuthority === desiredPolicyAuthority &&
    currentPolicy.isEnabled === (policyConfig.isEnabled ?? true) &&
    currentPolicy.paymentMode === (policyConfig.paymentMode ?? 1) &&
    currentPolicy.protocolTreasury === (policyConfig.protocolTreasury ?? null) &&
    currentPolicy.operatorTreasury === (policyConfig.operatorTreasury ?? null) &&
    currentPolicy.protocolFeeBps === (policyConfig.protocolFeeBps ?? 0) &&
    currentPolicy.operatorFeeBps === (policyConfig.operatorFeeBps ?? 0);

  if (isAlreadyConfigured) {
    await undelegateComponentAccount(
      provider.connection,
      teeProvider.connection,
      wallet.payer,
      wallet.publicKey,
      policyState.policyPda,
      ids.paymentRoutingPolicyComponentId,
    );
    return policyState;
  }

  const nextVersion = Math.max(
    currentPolicy?.version ?? 0,
    parseSafeInteger(Number(optionalEnv("PAYMENT_POLICY_VERSION") || "0"), "paymentPolicyVersion"),
  ) + 1;
  const transaction = await buildConfigurePaymentRoutingTransaction(
    policyAuthoritySigner.publicKey,
    policyState.world,
    ids.configurePaymentRoutingSystemId,
    policyState.policyEntity,
    ids.paymentRoutingPolicyComponentId,
    {
      ...policyConfig,
      policyAuthority: desiredPolicyAuthority,
    },
    nextVersion,
  );
  await sendAndConfirmPerTransaction(
    teeProvider.connection,
    wallet.payer,
    transaction,
    undefined,
    policyAuthoritySigner.publicKey.equals(wallet.publicKey) ? [] : [policyAuthoritySigner.keypair],
  );

  await undelegateComponentAccount(
    provider.connection,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    policyState.policyPda,
    ids.paymentRoutingPolicyComponentId,
  );

  return policyState;
}

async function delegateComponentAccount(
  provider: anchor.AnchorProvider,
  teeConnection: Connection,
  payerKeypair: Keypair,
  payer: PublicKey,
  entity: PublicKey,
  componentId: PublicKey,
  validator: PublicKey,
): Promise<string> {
  const componentPda = FindComponentPda({ componentId, entity });
  const baseDelegated = await isDelegatedComponent(provider.connection, componentPda);
  const delegatedValidator = baseDelegated
    ? await getDelegatedValidator(provider.connection, componentPda)
    : null;
  const delegatedInSession =
    baseDelegated &&
    (delegatedValidator?.equals(validator) === true ||
      (await hasErDelegatedMirror(teeConnection, componentPda, componentId)) === true);

  if (delegatedInSession) {
    return "already-delegated";
  }

  if (baseDelegated) {
    try {
      await undelegateComponentAccount(
        provider.connection,
        teeConnection,
        payerKeypair,
        payer,
        componentPda,
        componentId,
      );
    } catch (error) {
      const validatorLabel = delegatedValidator?.toBase58() ?? "unknown";
      throw new Error(
        `Failed to undelegate ${componentPda.toBase58()} before re-delegation (base validator=${validatorLabel}, target validator=${validator.toBase58()}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const transaction = new anchor.web3.Transaction().add(
    createDelegateInstruction(
      {
        payer,
        entity,
        account: componentPda,
        ownerProgram: componentId,
      },
      0,
      validator,
      componentId,
    ),
  );

  const signature = await provider.sendAndConfirm(transaction);
  await waitForDelegationState(
    provider.connection,
    teeConnection,
    componentPda,
    componentId,
    true,
  );
  return signature;
}

async function undelegateComponentAccount(
  baseConnection: Connection,
  teeConnection: Connection,
  payerKeypair: Keypair,
  payer: PublicKey,
  componentPda: PublicKey,
  componentProgramId: PublicKey,
): Promise<string> {
  if (!(await isDelegatedComponent(baseConnection, componentPda))) {
    return "already-undelegated";
  }

  const transaction = new anchor.web3.Transaction().add(
    createUndelegateInstruction({
      payer,
      delegatedAccount: componentPda,
      componentPda: componentProgramId,
    }),
  );

  const signature = await sendAndConfirmPerTransaction(teeConnection, payerKeypair, transaction);
  await waitForDelegationState(
    baseConnection,
    teeConnection,
    componentPda,
    componentProgramId,
    false,
  );
  return signature;
}

async function buildCreateListingTransaction(
  authority: PublicKey,
  world: PublicKey,
  systemId: PublicKey,
  sellerEntity: PublicKey,
  assetRegistryComponentId: PublicKey,
  dealTermsComponentId: PublicKey,
  owner: PublicKey,
  input: CreateListingInput,
  extraAccounts: AccountMeta[] = [],
): Promise<Transaction> {
  const applySystem = await ApplySystem({
    authority,
    world,
    systemId,
    entities: [
      {
        entity: sellerEntity,
        components: [
          { componentId: assetRegistryComponentId },
          { componentId: dealTermsComponentId },
        ],
      },
    ],
    extraAccounts,
    args: {
      owner: owner.toBase58(),
      asset_type: parseSafeInteger(input.assetType, "assetType"),
      min_price: parseSafeInteger(input.minPrice, "minPrice"),
      token_amount: parseSafeInteger(input.tokenAmount, "tokenAmount"),
      valuation_cap: parseSafeInteger(input.valuationCap, "valuationCap"),
      token_mint: input.tokenMint ?? "",
      vesting_source_program: input.vestingSourceProgram ?? "",
      vesting_source_position: input.vestingSourcePosition ?? "",
      vesting_start_ts: parseSafeInteger(input.vestingStartTs ?? 0, "vestingStartTs"),
      vesting_cliff_ts: parseSafeInteger(input.vestingCliffTs ?? 0, "vestingCliffTs"),
      vesting_end_ts: parseSafeInteger(input.vestingEndTs ?? 0, "vestingEndTs"),
      unlocked_amount: parseSafeInteger(input.unlockedAmount ?? 0, "unlockedAmount"),
      claimed_amount: parseSafeInteger(input.claimedAmount ?? 0, "claimedAmount"),
      private_buyer: input.recipient ?? "",
      transfer_restriction_mode: parseSafeInteger(
        input.transferRestrictionMode ?? 0,
        "transferRestrictionMode",
      ),
      settlement_mode: parseSafeInteger(input.settlementMode ?? 0, "settlementMode"),
      settlement_expires_at: parseSafeInteger(
        input.settlementExpiresAt ?? 0,
        "settlementExpiresAt",
      ),
      required_settlement_attestor: input.requiredSettlementAttestor ?? "",
      required_consent_authority: input.requiredConsentAuthority ?? "",
    },
  });

  return applySystem.transaction;
}

async function buildMatchOfferTransaction(
  authority: PublicKey,
  world: PublicKey,
  systemId: PublicKey,
  sellerEntity: PublicKey,
  assetRegistryComponentId: PublicKey,
  dealTermsComponentId: PublicKey,
  buyer: PublicKey,
  bidPrice: number,
  extraAccounts: AccountMeta[],
): Promise<Transaction> {
  const applySystem = await ApplySystem({
    authority,
    world,
    systemId,
    entities: [
      {
        entity: sellerEntity,
        components: [
          { componentId: assetRegistryComponentId },
          { componentId: dealTermsComponentId },
        ],
      },
    ],
    extraAccounts,
    args: {
      buyer: buyer.toBase58(),
      bid_price: parseSafeInteger(bidPrice, "bidPrice"),
      current_timestamp: Math.floor(Date.now() / 1000),
    },
  });

  return applySystem.transaction;
}

async function buildAttestVestingSettlementTransaction(
  world: PublicKey,
  systemId: PublicKey,
  sellerEntity: PublicKey,
  settlementPolicyEntity: PublicKey,
  assetRegistryComponentId: PublicKey,
  dealTermsComponentId: PublicKey,
  settlementAuthorityPolicyComponentId: PublicKey,
  attestorSigner: PublicKey,
  input: AttestVestingSettlementInput,
): Promise<Transaction> {
  const applySystem = await ApplySystem({
    authority: attestorSigner,
    world,
    systemId,
    entities: [
      {
        entity: sellerEntity,
        components: [
          { componentId: assetRegistryComponentId },
          { componentId: dealTermsComponentId },
        ],
      },
      {
        entity: settlementPolicyEntity,
        components: [{ componentId: settlementAuthorityPolicyComponentId }],
      },
    ],
    args: {
      buyer: input.buyer,
      settlement_proof_id: input.settlementProofId ?? generateSettlementProofId(),
      settlement_expires_at: parseSafeInteger(
        input.settlementExpiresAt ?? 0,
        "settlementExpiresAt",
      ),
      settlement_nonce: parseSafeInteger(input.settlementNonce ?? 1, "settlementNonce"),
      current_timestamp: Math.floor(Date.now() / 1000),
    },
  });

  return applySystem.transaction;
}

async function buildIssueTransferConsentTransaction(
  world: PublicKey,
  systemId: PublicKey,
  sellerEntity: PublicKey,
  assetRegistryComponentId: PublicKey,
  dealTermsComponentId: PublicKey,
  consentSigner: PublicKey,
  input: IssueTransferConsentInput,
): Promise<Transaction> {
  const applySystem = await ApplySystem({
    authority: consentSigner,
    world,
    systemId,
    entities: [
      {
        entity: sellerEntity,
        components: [
          { componentId: assetRegistryComponentId },
          { componentId: dealTermsComponentId },
        ],
      },
    ],
    args: {
      buyer: input.buyer,
      consent_expires_at: parseSafeInteger(input.consentExpiresAt ?? 0, "consentExpiresAt"),
      consent_nonce: parseSafeInteger(input.consentNonce ?? 1, "consentNonce"),
    },
  });

  return applySystem.transaction;
}

function resolveBuyerPubkey(): PublicKey {
  const configured = optionalPubkey("BUYER_PUBKEY");
  if (configured) {
    return configured;
  }

  const buyerWalletPath = optionalEnv("BUYER_WALLET_PATH");
  if (buyerWalletPath) {
    return loadKeypair(buyerWalletPath).publicKey;
  }

  const walletPath = env("WALLET_PATH", DEFAULT_WALLET_PATH);
  return loadKeypair(walletPath).publicKey;
}

function runtimeWallet(): LocalWallet {
  const walletPath = env("WALLET_PATH", DEFAULT_WALLET_PATH);
  process.env.ANCHOR_WALLET ??= walletPath;
  process.env.ANCHOR_PROVIDER_URL ??= env("SOLANA_RPC_URL", DEFAULT_SOLANA_RPC_URL);
  return new LocalWallet(loadKeypair(walletPath));
}

function baseProvider(wallet: LocalWallet): anchor.AnchorProvider {
  return providerFor(
    new Connection(env("SOLANA_RPC_URL", DEFAULT_SOLANA_RPC_URL), "confirmed"),
    wallet,
  );
}

function componentIds() {
  return {
    assetRegistryComponentId: new PublicKey(
      env("ASSET_REGISTRY_COMPONENT_ID", "4CwL74bNw5z2TEzxSjj2w6buKjKaSGzT5YAbV7DrSte2"),
    ),
    dealTermsComponentId: new PublicKey(
      env("DEAL_TERMS_COMPONENT_ID", "8to6ZeAV3XQ617fAZcjeD47ujsq1yCwMYeL73DH7kZ17"),
    ),
    paymentRoutingPolicyComponentId: new PublicKey(
      env(
        "PAYMENT_ROUTING_POLICY_COMPONENT_ID",
        "GsKrmGeT4BG4FEhrRw9ReoncQETQaKQvKipxptxx2YXi",
      ),
    ),
    settlementAuthorityPolicyComponentId: new PublicKey(
      env(
        "SETTLEMENT_AUTHORITY_POLICY_COMPONENT_ID",
        "H59dwBiX1ntWqEExHR1RdfjS75UrQYZGs5w3TxbUoH5E",
      ),
    ),
    createListingSystemId: new PublicKey(
      env("CREATE_LISTING_SYSTEM_ID", "RRmid28bwiGY9LHhnm6uNdvjo5yoBLHTbtFyRQmCSR5"),
    ),
    attestVestingSettlementSystemId: new PublicKey(
      env(
        "ATTEST_VESTING_SETTLEMENT_SYSTEM_ID",
        "5nbPHQ9Rd19M7EnPLFeHmF3UtAMu3vWnjHazxyHa9BKg",
      ),
    ),
    configurePaymentRoutingSystemId: new PublicKey(
      env(
        "CONFIGURE_PAYMENT_ROUTING_SYSTEM_ID",
        "AxJbuot2YEmw3XFnFpVc2Mk4WFuewG4uqci2J68vr8b1",
      ),
    ),
    configureSettlementPolicySystemId: new PublicKey(
      env(
        "CONFIGURE_SETTLEMENT_POLICY_SYSTEM_ID",
        "AzJ4FSYj5UpqaoMMezoA7hKXms5zFnq3KijXeicrbUPs",
      ),
    ),
    matchOfferSystemId: new PublicKey(
      env("MATCH_OFFER_SYSTEM_ID", "Cr4ZyqvML9tS5HeAFXLTKfBxJKixQStL8dGFmfbUx585"),
    ),
    buyerClearanceComponentId: new PublicKey(
      env("BUYER_CLEARANCE_COMPONENT_ID", "6yM2Dkk6FiG8N9jQjtMQcDgsKNZDgc2J25K3muxVA8gz"),
    ),
    issueClearanceSystemId: new PublicKey(
      env("ISSUE_CLEARANCE_SYSTEM_ID", "4rM76JYkhK8waP7KvGfuakkHVZQjfywK13xxb5MVZ4ra"),
    ),
    issueTransferConsentSystemId: new PublicKey(
      env(
        "ISSUE_TRANSFER_CONSENT_SYSTEM_ID",
        "FezJZYRfJxPBLpEY4AjJZXGkoyeWde1Hw6oUJVGL8zD1",
      ),
    ),
  };
}

async function readAssetRegistrySnapshot(
  connection: Connection,
  assetRegistryPda: PublicKey,
): Promise<{
  owner: string;
  sellerPayout: string;
  assetType: number;
  isSold: boolean;
} | null> {
  const account = await getAccountInfoWithRetry(connection, assetRegistryPda);
  if (!account) {
    return null;
  }
  
  if (account.owner.equals(delegationProgramId)) {
    throw new Error("Component is delegated to Ephemeral Rollup, throwing to fallback.");
  }

  const decoded = assetRegistryCoder.decode("AssetRegistry", account.data) as
    | {
        owner: PublicKey;
        seller_payout: PublicKey;
        asset_type: number;
        is_sold: boolean;
        bolt_metadata: any;
      }
    | null;

  if (!decoded) {
    return null;
  }

  return {
    owner: decoded.owner.toBase58(),
    sellerPayout: decoded.seller_payout.toBase58(),
    assetType: decoded.asset_type,
    isSold: decoded.is_sold,
  };
}

async function readDealTermsSnapshot(
  connection: Connection,
  dealTermsPda: PublicKey,
): Promise<{
  minPrice: number;
  tokenAmount: number;
  valuationCap: number;
  tokenMint: string | null;
  vestingSourceProgram: string | null;
  vestingSourcePosition: string | null;
  vestingStartTs: number;
  vestingCliffTs: number;
  vestingEndTs: number;
  unlockedAmount: number;
  claimedAmount: number;
  privateBuyer: string | null;
  transferRestrictionMode: number;
  settlementMode: number;
  settlementStatus: number;
  approvedBuyer: string | null;
  settlementAttestor: string | null;
  settlementExpiresAt: number;
  requiredSettlementAttestor: string | null;
  settlementNonce: number;
  settlementProofId: string | null;
  settlementPolicyVersion: number;
  settlementPreparedAt: number;
  requiredConsentAuthority: string | null;
  consentStatus: number;
  consentApprovedBuyer: string | null;
  consentAuthority: string | null;
  consentExpiresAt: number;
  consentNonce: number;
} | null> {
  const account = await getAccountInfoWithRetry(connection, dealTermsPda);
  if (!account) {
    return null;
  }

  const decoded = dealTermsCoder.decode("DealTerms", account.data) as
    | {
        min_price: BN;
        token_amount: BN;
        valuation_cap: BN;
        token_mint?: PublicKey;
        vesting_source_program?: PublicKey;
        vesting_source_position?: PublicKey;
        vesting_start_ts?: BN;
        vesting_cliff_ts?: BN;
        vesting_end_ts?: BN;
        unlocked_amount?: BN;
        claimed_amount?: BN;
        private_buyer?: PublicKey;
        transfer_restriction_mode?: number;
        settlement_mode?: number;
        settlement_status?: number;
        approved_buyer?: PublicKey;
        settlement_attestor?: PublicKey;
        settlement_expires_at?: BN;
        required_settlement_attestor?: PublicKey;
        settlement_nonce?: BN;
        settlement_proof_id?: PublicKey;
        settlement_policy_version?: BN;
        settlement_prepared_at?: BN;
        required_consent_authority?: PublicKey;
        consent_status?: number;
        consent_approved_buyer?: PublicKey;
        consent_authority?: PublicKey;
        consent_expires_at?: BN;
        consent_nonce?: BN;
      }
    | null;

  if (!decoded) {
    return null;
  }

  return {
    minPrice: decoded.min_price.toNumber(),
    tokenAmount: decoded.token_amount.toNumber(),
    valuationCap: decoded.valuation_cap.toNumber(),
    tokenMint: optionalListingPubkey(decoded.token_mint?.toBase58()),
    vestingSourceProgram: optionalListingPubkey(decoded.vesting_source_program?.toBase58()),
    vestingSourcePosition: optionalListingPubkey(decoded.vesting_source_position?.toBase58()),
    vestingStartTs: decoded.vesting_start_ts?.toNumber() ?? 0,
    vestingCliffTs: decoded.vesting_cliff_ts?.toNumber() ?? 0,
    vestingEndTs: decoded.vesting_end_ts?.toNumber() ?? 0,
    unlockedAmount: decoded.unlocked_amount?.toNumber() ?? 0,
    claimedAmount: decoded.claimed_amount?.toNumber() ?? 0,
    privateBuyer: optionalListingPubkey(decoded.private_buyer?.toBase58()),
    transferRestrictionMode: decoded.transfer_restriction_mode ?? 0,
    settlementMode: decoded.settlement_mode ?? 0,
    settlementStatus: decoded.settlement_status ?? 0,
    approvedBuyer: optionalListingPubkey(decoded.approved_buyer?.toBase58()),
    settlementAttestor: optionalListingPubkey(decoded.settlement_attestor?.toBase58()),
    settlementExpiresAt: decoded.settlement_expires_at?.toNumber() ?? 0,
    requiredSettlementAttestor: optionalListingPubkey(
      decoded.required_settlement_attestor?.toBase58(),
    ),
    settlementNonce: decoded.settlement_nonce?.toNumber() ?? 0,
    settlementProofId: optionalListingPubkey(decoded.settlement_proof_id?.toBase58()),
    settlementPolicyVersion: decoded.settlement_policy_version?.toNumber() ?? 0,
    settlementPreparedAt: decoded.settlement_prepared_at?.toNumber() ?? 0,
    requiredConsentAuthority: optionalListingPubkey(
      decoded.required_consent_authority?.toBase58(),
    ),
    consentStatus: decoded.consent_status ?? 0,
    consentApprovedBuyer: optionalListingPubkey(decoded.consent_approved_buyer?.toBase58()),
    consentAuthority: optionalListingPubkey(decoded.consent_authority?.toBase58()),
    consentExpiresAt: decoded.consent_expires_at?.toNumber() ?? 0,
    consentNonce: decoded.consent_nonce?.toNumber() ?? 0,
  };
}

let settlementPolicyCoder: anchor.BorshAccountsCoder | null = null;
function getSettlementPolicyCoder(): anchor.BorshAccountsCoder {
  if (!settlementPolicyCoder) {
    const preferredIdlPath = path.join(
      process.cwd(),
      "target",
      "idl",
      "settlement_authority_policy.json",
    );
    const legacyIdlPath = path.join(
      process.cwd(),
      "target",
      "idl",
      "component_settlement_authority_policy.json",
    );
    try {
      const idlPath = fs.existsSync(preferredIdlPath) ? preferredIdlPath : legacyIdlPath;
      const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl;
      settlementPolicyCoder = new anchor.BorshAccountsCoder(idl);
    } catch {
      settlementPolicyCoder = new anchor.BorshAccountsCoder({
        version: "0.1.0",
        name: "component_settlement_authority_policy",
        instructions: [],
        accounts: [
          {
            name: "SettlementAuthorityPolicy",
            type: {
              kind: "struct",
              fields: [
                { name: "policy_authority", type: "publicKey" },
                { name: "is_enabled", type: "bool" },
                { name: "version", type: "u64" },
                { name: "primary_attestor", type: "publicKey" },
                { name: "secondary_attestor", type: "publicKey" },
                { name: "tertiary_attestor", type: "publicKey" },
                { name: "clearance_authority", type: "publicKey" },
              ],
            },
          },
        ],
      } as unknown as Idl);
    }
  }
  return settlementPolicyCoder;
}

let paymentRoutingPolicyCoder: anchor.BorshAccountsCoder | null = null;
function getPaymentRoutingPolicyCoder(): anchor.BorshAccountsCoder {
  if (!paymentRoutingPolicyCoder) {
    const preferredIdlPath = path.join(
      process.cwd(),
      "target",
      "idl",
      "payment_routing_policy.json",
    );
    const legacyIdlPath = path.join(
      process.cwd(),
      "target",
      "idl",
      "component_payment_routing_policy.json",
    );
    try {
      const idlPath = fs.existsSync(preferredIdlPath) ? preferredIdlPath : legacyIdlPath;
      const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl;
      paymentRoutingPolicyCoder = new anchor.BorshAccountsCoder(idl);
    } catch {
      paymentRoutingPolicyCoder = new anchor.BorshAccountsCoder({
        version: "0.1.0",
        name: "component_payment_routing_policy",
        instructions: [],
        accounts: [
          {
            name: "PaymentRoutingPolicy",
            type: {
              kind: "struct",
              fields: [
                { name: "policy_authority", type: "publicKey" },
                { name: "is_enabled", type: "bool" },
                { name: "version", type: "u64" },
                { name: "payment_mode", type: "u8" },
                { name: "protocol_treasury", type: "publicKey" },
                { name: "operator_treasury", type: "publicKey" },
                { name: "protocol_fee_bps", type: "u16" },
                { name: "operator_fee_bps", type: "u16" },
              ],
            },
          },
        ],
      } as unknown as Idl);
    }
  }
  return paymentRoutingPolicyCoder;
}

async function readSettlementPolicySnapshot(
  connection: Connection,
  policyPda: PublicKey,
): Promise<SettlementPolicySnapshot | null> {
  const account = await getAccountInfoWithRetry(connection, policyPda);
  if (!account) {
    return null;
  }

  const decoded = getSettlementPolicyCoder().decode("SettlementAuthorityPolicy", account.data) as
    | {
        policy_authority?: PublicKey;
        is_enabled?: boolean;
        version?: BN;
        primary_attestor?: PublicKey;
        secondary_attestor?: PublicKey;
        tertiary_attestor?: PublicKey;
        clearance_authority?: PublicKey;
      }
    | null;

  if (!decoded) {
    return null;
  }

  return {
    policyAuthority: optionalListingPubkey(decoded.policy_authority?.toBase58()),
    isEnabled: decoded.is_enabled ?? false,
    version: decoded.version?.toNumber() ?? 0,
    primaryAttestor: optionalListingPubkey(decoded.primary_attestor?.toBase58()),
    secondaryAttestor: optionalListingPubkey(decoded.secondary_attestor?.toBase58()),
    tertiaryAttestor: optionalListingPubkey(decoded.tertiary_attestor?.toBase58()),
    clearanceAuthority: optionalListingPubkey(decoded.clearance_authority?.toBase58()),
  };
}

async function readPaymentRoutingPolicySnapshot(
  connection: Connection,
  policyPda: PublicKey,
): Promise<PaymentRoutingPolicySnapshot | null> {
  const account = await getAccountInfoWithRetry(connection, policyPda);
  if (!account) {
    return null;
  }

  const decoded = getPaymentRoutingPolicyCoder().decode("PaymentRoutingPolicy", account.data) as
    | {
        policy_authority?: PublicKey;
        is_enabled?: boolean;
        version?: BN;
        payment_mode?: number;
        protocol_treasury?: PublicKey;
        operator_treasury?: PublicKey;
        protocol_fee_bps?: number;
        operator_fee_bps?: number;
      }
    | null;

  if (!decoded) {
    return null;
  }

  return {
    policyAuthority: optionalListingPubkey(decoded.policy_authority?.toBase58()),
    isEnabled: decoded.is_enabled ?? false,
    version: decoded.version?.toNumber() ?? 0,
    paymentMode: decoded.payment_mode ?? 0,
    protocolTreasury: optionalListingPubkey(decoded.protocol_treasury?.toBase58()),
    operatorTreasury: optionalListingPubkey(decoded.operator_treasury?.toBase58()),
    protocolFeeBps: decoded.protocol_fee_bps ?? 0,
    operatorFeeBps: decoded.operator_fee_bps ?? 0,
  };
}

let buyerClearanceCoder: anchor.BorshAccountsCoder | null = null;
function getBuyerClearanceCoder(): anchor.BorshAccountsCoder {
  if (!buyerClearanceCoder) {
    const preferredIdlPath = path.join(
      process.cwd(),
      "target",
      "idl",
      "buyer_clearance.json",
    );
    const legacyIdlPath = path.join(
      process.cwd(),
      "target",
      "idl",
      "component_buyer_clearance.json",
    );
    try {
      const idlPath = fs.existsSync(preferredIdlPath) ? preferredIdlPath : legacyIdlPath;
      const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl;
      buyerClearanceCoder = new anchor.BorshAccountsCoder(idl);
    } catch {
      // Create a dummy coder if IDL is not available yet, just for types
      buyerClearanceCoder = new anchor.BorshAccountsCoder({
        version: "0.1.0",
        name: "component_buyer_clearance",
        instructions: [],
        accounts: [
          {
            name: "BuyerClearance",
            type: {
              kind: "struct",
              fields: [
                { name: "buyer", type: "publicKey" },
                { name: "is_cleared", type: "bool" },
                { name: "clearance_type", type: "u8" },
                { name: "expires_at", type: "i64" },
              ],
            },
          },
        ],
      } as unknown as Idl);
    }
  }
  return buyerClearanceCoder;
}

export async function getClearanceStatus(buyerPubkeyStr: string): Promise<any | null> {
  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);
  
  const configuredWorld = optionalPubkey("WORLD_PDA");
  const persisted = loadPersistedState();
  const world = configuredWorld || (persisted?.world ? new PublicKey(persisted.world) : null);
  if (!world) return null;

  try {
    const worldAccount = await World.fromAccountAddress(provider.connection, world);
    const worldId = new BN(worldAccount.id.toString());
    const seed = entitySeed(buyerEntitySeedLabel(buyerPubkeyStr));
    const ids = componentIds();
    const entityPda = FindEntityPda({ worldId, seed });
    const componentPda = FindComponentPda({ componentId: ids.buyerClearanceComponentId, entity: entityPda });
    
    let account = await getAccountInfoWithRetry(provider.connection, componentPda);
    let decoded: any = null;
    let isDelegated = account ? account.owner.equals(delegationProgramId) : false;
    
    if (account && !isDelegated) {
      try {
        decoded = getBuyerClearanceCoder().decode("BuyerClearance", account.data);
      } catch(err) {
        // Ignored
      }
    }
    
    if (isDelegated || !decoded) {
      try {
        const teeProvider = await buildTeeProvider(wallet);
        const teeAccount = await getAccountInfoWithRetry(teeProvider.connection, componentPda);
        if (teeAccount) {
          decoded = getBuyerClearanceCoder().decode("BuyerClearance", teeAccount.data);
        }
      } catch (err) {
        // Ignored
      }
    }
    
    if (!decoded) {
      return null;
    }
    
    return {
      buyer: decoded.buyer.toBase58(),
      isCleared: decoded.is_cleared,
      clearanceType: decoded.clearance_type,
      expiresAt: decoded.expires_at.toNumber()
    };
  } catch(err) {
    console.log(`[DEBUG] getClearanceStatus fatal err:`, err);
    return null;
  }
}

export async function getListingSnapshot(listingId: string): Promise<ListingSnapshot | null> {
  const stored = getStoredState();
  if (!stored || !stored.listings) {
    return null;
  }

  const persistedListing = stored.listings.find(l => l.listingId === listingId);
  if (!persistedListing) return null;

  const protocolState = restoredStateToProtocolState(stored, listingId);
  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);

  let assetRegistry = null;
  try {
    assetRegistry = await readAssetRegistrySnapshot(provider.connection, protocolState.assetRegistryPda);
  } catch {
    // If it throws (e.g. Invalid bool: 139), it might be delegated.
    assetRegistry = null;
  }

  if (!assetRegistry) {
    try {
      const teeProvider = await buildTeeProvider(wallet);
      assetRegistry = await readAssetRegistrySnapshot(teeProvider.connection, protocolState.assetRegistryPda);
    } catch {
      assetRegistry = null;
    }
  }

  if (!assetRegistry) {
    return null;
  }

  let dealTerms = null;
  try {
    const teeProvider = await buildTeeProvider(wallet);
    dealTerms = await readDealTermsSnapshot(teeProvider.connection, protocolState.dealTermsPda);
  } catch {
    dealTerms = null;
  }

  const minPrice = dealTerms?.minPrice ?? persistedListing.minPrice;
  const tokenAmount = dealTerms?.tokenAmount ?? persistedListing.tokenAmount;
  const valuationCap = dealTerms?.valuationCap ?? persistedListing.valuationCap;
  const vestingStartTs = dealTerms?.vestingStartTs ?? persistedListing.vestingStartTs ?? 0;
  const vestingCliffTs = dealTerms?.vestingCliffTs ?? persistedListing.vestingCliffTs ?? 0;
  const vestingEndTs = dealTerms?.vestingEndTs ?? persistedListing.vestingEndTs ?? 0;
  const unlockedAmount = dealTerms?.unlockedAmount ?? persistedListing.unlockedAmount ?? 0;
  const claimedAmount = dealTerms?.claimedAmount ?? persistedListing.claimedAmount ?? 0;
  const privateBuyer =
    dealTerms?.privateBuyer ?? persistedListing.privateBuyer ?? persistedListing.recipient ?? null;
  const transferRestrictionMode =
    dealTerms?.transferRestrictionMode ?? persistedListing.transferRestrictionMode ?? 0;
  const settlementMode = dealTerms?.settlementMode ?? persistedListing.settlementMode ?? 0;
  const settlementStatus = dealTerms?.settlementStatus ?? persistedListing.settlementStatus ?? 0;
  const approvedBuyer = dealTerms?.approvedBuyer ?? persistedListing.approvedBuyer ?? null;
  const settlementAttestor =
    dealTerms?.settlementAttestor ?? persistedListing.settlementAttestor ?? null;
  const settlementExpiresAt =
    dealTerms?.settlementExpiresAt ?? persistedListing.settlementExpiresAt ?? 0;
  const requiredSettlementAttestor =
    dealTerms?.requiredSettlementAttestor ??
    persistedListing.requiredSettlementAttestor ??
    null;
  const settlementNonce = dealTerms?.settlementNonce ?? persistedListing.settlementNonce ?? 0;
  const settlementProofId =
    dealTerms?.settlementProofId ?? persistedListing.settlementProofId ?? null;
  const settlementPolicyVersion =
    dealTerms?.settlementPolicyVersion ?? persistedListing.settlementPolicyVersion ?? 0;
  const settlementPreparedAt =
    dealTerms?.settlementPreparedAt ?? persistedListing.settlementPreparedAt ?? 0;
  const requiredConsentAuthority =
    dealTerms?.requiredConsentAuthority ?? persistedListing.requiredConsentAuthority ?? null;
  const consentStatus = dealTerms?.consentStatus ?? persistedListing.consentStatus ?? 0;
  const consentApprovedBuyer =
    dealTerms?.consentApprovedBuyer ?? persistedListing.consentApprovedBuyer ?? null;
  const consentAuthority =
    dealTerms?.consentAuthority ?? persistedListing.consentAuthority ?? null;
  const consentExpiresAt = dealTerms?.consentExpiresAt ?? persistedListing.consentExpiresAt ?? 0;
  const consentNonce = dealTerms?.consentNonce ?? persistedListing.consentNonce ?? 0;
  const tokenMint = dealTerms?.tokenMint ?? persistedListing.tokenMint ?? null;
  const vestingSourceProgram =
    dealTerms?.vestingSourceProgram ?? persistedListing.vestingSourceProgram ?? null;
  const vestingSourcePosition =
    dealTerms?.vestingSourcePosition ?? persistedListing.vestingSourcePosition ?? null;

  if (
    typeof minPrice !== "number" ||
    typeof tokenAmount !== "number" ||
    typeof valuationCap !== "number"
  ) {
    return null;
  }

  return {
    tradeId: parseInt(listingId) || 1,
    isPrivate: privateBuyer !== null,
    isShielded: true,
    isSold: assetRegistry.isSold,
    privateBuyer,
    assetType: assetTypeLabel(assetRegistry.assetType),
    assetTypeId: assetRegistry.assetType,
    owner: assetRegistry.owner,
    pda: protocolState.assetRegistryPda.toBase58(),
    dealTermsPda: protocolState.dealTermsPda.toBase58(),
    minPrice,
    tokenAmount,
    valuationCap,
    tokenMint,
    vestingSourceProgram,
    vestingSourcePosition,
    vestingStartTs,
    vestingCliffTs,
    vestingEndTs,
    unlockedAmount,
    claimedAmount,
    transferRestrictionMode,
    settlementMode,
    settlementStatus,
    approvedBuyer,
    settlementAttestor,
    settlementExpiresAt,
    requiredSettlementAttestor,
    settlementNonce,
    settlementProofId,
    settlementPolicyVersion,
    settlementPreparedAt,
    requiredConsentAuthority,
    consentStatus,
    consentApprovedBuyer,
    consentAuthority,
    consentExpiresAt,
    consentNonce,
    timestamp: Math.floor(new Date(persistedListing.updatedAt).getTime() / 1000),
    explorerUrl: explorerUrl(protocolState.assetRegistryPda.toBase58()),
  };
}

export async function getListings(): Promise<ListingSnapshot[]> {
  const stored = getStoredState();
  if (!stored || !stored.listings) return [];
  
  const results = await Promise.all(
    stored.listings.map(l => getListingSnapshot(l.listingId))
  );
  
  return results.filter(Boolean) as ListingSnapshot[];
}

export async function executeCancelListing(listingId: string): Promise<{ ok: true; id: string }> {
  const stored = getStoredState();
  if (!stored) throw new Error("No protocol state exists.");
  
  const originalCount = stored.listings.length;
  stored.listings = stored.listings.filter((l) => l.listingId !== listingId);
  
  if (stored.listings.length === originalCount) {
    throw new Error(`Listing ${listingId} not found`);
  }
  
  savePersistedState(stored);
  return { ok: true, id: listingId };
}

export async function executeCreateListing(
  input: CreateListingInput,
  signCallback?: (txBuffer: Buffer, listingId: string) => Promise<Buffer>
): Promise<FlowExecutionResult> {
  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);
  const ids = componentIds();
  const privateRecipient = input.recipient?.trim()
    ? new PublicKey(input.recipient.trim()).toBase58()
    : null;
  if (input.isPrivate && !privateRecipient) {
    throw new Error("Private placements require a recipient wallet.");
  }
  const configuredSettlementAuthority = isVestingAssetType(input.assetType)
    ? resolveConfiguredAuthorityPublicKey(
        "SETTLEMENT_ATTESTOR_WALLET_PATH",
        "SETTLEMENT_ATTESTOR",
        wallet.publicKey,
      )
    : null;
  const configuredConsentAuthority =
    input.transferRestrictionMode === 1
      ? resolveConfiguredAuthorityPublicKey(
          "TRANSFER_CONSENT_AUTHORITY_WALLET_PATH",
          "TRANSFER_CONSENT_AUTHORITY",
          wallet.publicKey,
        )
      : null;
  const normalizedInput: CreateListingInput = {
    ...input,
    recipient: privateRecipient,
    tokenMint: canonicalizeOptionalPubkeyString(input.tokenMint ?? null, "tokenMint"),
    vestingSourceProgram: canonicalizeOptionalPubkeyString(
      input.vestingSourceProgram ?? null,
      "vestingSourceProgram",
    ),
    vestingSourcePosition: canonicalizeOptionalPubkeyString(
      input.vestingSourcePosition ?? null,
      "vestingSourcePosition",
    ),
    requiredSettlementAttestor:
      canonicalizeOptionalPubkeyString(
        input.requiredSettlementAttestor ??
          optionalEnv("REQUIRED_SETTLEMENT_ATTESTOR") ??
          configuredSettlementAuthority?.toBase58() ??
          null,
        "requiredSettlementAttestor",
      ),
    requiredConsentAuthority:
      canonicalizeOptionalPubkeyString(
        input.requiredConsentAuthority ??
          optionalEnv("REQUIRED_CONSENT_AUTHORITY") ??
          configuredConsentAuthority?.toBase58() ??
          null,
        "requiredConsentAuthority",
      ),
  };
  
  const listingId = Math.floor(Date.now() / 1000).toString();
  const sellerEntitySeed = `${env("SELLER_ENTITY_SEED", "seller")}-${listingId}`;
  
  const state = await ensureWorldState(
    provider,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    listingId,
    {
      buyerEntitySeed: env("BUYER_ENTITY_SEED", "buyer"),
      sellerEntitySeed,
    },
  );
  const teeProvider = await buildTeeProvider(wallet);
  const teeValidator = new PublicKey((await getClosestValidator(teeProvider.connection)).toBase58());
  const publishDealTermsOnChain = env("PUBLISH_DEAL_TERMS_ONCHAIN", "false") === "true";
  const keepAssetRegistryInPer = isVestingAssetType(normalizedInput.assetType);
  const paymentPolicyState = await ensurePaymentRoutingConfigured(
    provider,
    teeProvider,
    wallet,
    teeValidator,
    ids,
  );
  const settlementPolicyState =
    keepAssetRegistryInPer && normalizedInput.requiredSettlementAttestor
      ? await ensureSettlementPolicyConfigured(
          provider,
          teeProvider,
          wallet,
          teeValidator,
          ids,
          normalizedInput.requiredSettlementAttestor,
        )
      : null;

  await ensureApprovedSystem(provider, state.world, ids.createListingSystemId);

  const ownerSigner = resolveConfiguredSigner(
    "OWNER_WALLET_PATH",
    "OWNER_PUBKEY",
    wallet.payer,
  );
  const owner = toPublicKey(input.owner, ownerSigner.publicKey);
  if (!owner.equals(ownerSigner.publicKey) && !signCallback) {
    throw new Error(
      "create_listing requires OWNER_WALLET_PATH / OWNER_PUBKEY to match the listing owner.",
    );
  }
  const listAssetDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    teeValidator,
  );
  const listDealTermsDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.dealTermsComponentId,
    teeValidator,
  );
  const createListingTransaction = await buildCreateListingTransaction(
    wallet.publicKey,
    state.world,
    ids.createListingSystemId,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    owner,
    normalizedInput,
    [
      {
        pubkey: owner,
        isSigner: true,
        isWritable: false,
      },
    ],
  );

  let finalSigners = [ownerSigner.keypair];
  let finalTransaction = createListingTransaction;

  if (signCallback) {
    createListingTransaction.feePayer = wallet.payer.publicKey;
    
    // Exact blockhash fetching logic to prevent PER rejection
    if (isLocalEphemeralRpc(teeProvider.connection.rpcEndpoint)) {
      const latestBlockhash = await teeProvider.connection.getLatestBlockhash("confirmed");
      createListingTransaction.recentBlockhash = latestBlockhash.blockhash;
      createListingTransaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    } else {
      const writableAccounts = getWritableAccounts(createListingTransaction);
      const blockhashResponse = await fetch(teeProvider.connection.rpcEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBlockhashForAccounts",
          params: [writableAccounts],
        }),
      });
      const blockhashBody = await blockhashResponse.json() as any;
      if (!blockhashResponse.ok || blockhashBody.error) {
        throw new Error(`Failed to fetch PER blockhash: ${JSON.stringify(blockhashBody)}`);
      }
      const blockhashValue = blockhashBody.result?.value ?? blockhashBody.result;
      if (!blockhashValue?.blockhash || typeof blockhashValue.lastValidBlockHeight !== "number") {
        throw new Error(`Unexpected PER blockhash response: ${JSON.stringify(blockhashBody)}`);
      }
      createListingTransaction.recentBlockhash = blockhashValue.blockhash;
      createListingTransaction.lastValidBlockHeight = blockhashValue.lastValidBlockHeight;
    }

    const serialized = createListingTransaction.serialize({ requireAllSignatures: false });
    const signedBuffer = await signCallback(serialized, listingId);
    finalTransaction = anchor.web3.Transaction.from(signedBuffer);
    finalSigners = [];
  }

  const createListingPerSignature = await sendAndConfirmPerTransaction(
    teeProvider.connection,
    wallet.payer,
    finalTransaction,
    undefined,
    finalSigners,
  );
  const listAssetCommitSignature = keepAssetRegistryInPer
    ? "kept-delegated-in-per"
    : await undelegateComponentAccount(
        provider.connection,
        teeProvider.connection,
        wallet.payer,
        wallet.publicKey,
        state.assetRegistryPda,
        ids.assetRegistryComponentId,
      );
  const listDealTermsCommitSignature = publishDealTermsOnChain
    ? await undelegateComponentAccount(
        provider.connection,
        teeProvider.connection,
        wallet.payer,
        wallet.publicKey,
        state.dealTermsPda,
        ids.dealTermsComponentId,
      )
    : "kept-delegated-in-per";

  const persistedListing: PersistedListing = {
    listingId,
    world: state.world.toBase58(),
    sellerEntity: state.sellerEntity.toBase58(),
    buyerEntity: state.buyerEntity.toBase58(),
    assetRegistryPda: state.assetRegistryPda.toBase58(),
    dealTermsPda: state.dealTermsPda.toBase58(),
    paymentPolicyEntity: paymentPolicyState.policyEntity.toBase58(),
    paymentPolicyPda: paymentPolicyState.policyPda.toBase58(),
    settlementPolicyEntity: settlementPolicyState?.policyEntity.toBase58(),
    settlementPolicyPda: settlementPolicyState?.policyPda.toBase58(),
    assetType: input.assetType,
    minPrice: normalizedInput.minPrice,
    tokenAmount: normalizedInput.tokenAmount,
    valuationCap: normalizedInput.valuationCap,
    tokenMint: normalizedInput.tokenMint ?? null,
    vestingSourceProgram: normalizedInput.vestingSourceProgram ?? null,
    vestingSourcePosition: normalizedInput.vestingSourcePosition ?? null,
    vestingStartTs: normalizedInput.vestingStartTs ?? 0,
    vestingCliffTs: normalizedInput.vestingCliffTs ?? 0,
    vestingEndTs: normalizedInput.vestingEndTs ?? 0,
    unlockedAmount: normalizedInput.unlockedAmount ?? 0,
    claimedAmount: normalizedInput.claimedAmount ?? 0,
    privateBuyer: normalizedInput.recipient ?? null,
    transferRestrictionMode: normalizedInput.transferRestrictionMode ?? 0,
    settlementMode: normalizedInput.settlementMode ?? 0,
    settlementStatus: isVestingAssetType(normalizedInput.assetType) ? 1 : 0,
    approvedBuyer: null,
    settlementAttestor: null,
    settlementExpiresAt: normalizedInput.settlementExpiresAt ?? 0,
    requiredSettlementAttestor: normalizedInput.requiredSettlementAttestor ?? null,
    settlementNonce: 0,
    settlementProofId: null,
    settlementPolicyVersion: 0,
    settlementPreparedAt: 0,
    requiredConsentAuthority: normalizedInput.requiredConsentAuthority ?? null,
    consentStatus: normalizedInput.transferRestrictionMode === 1 ? 1 : 0,
    consentApprovedBuyer: null,
    consentAuthority: null,
    consentExpiresAt: 0,
    consentNonce: 0,
    owner: owner.toBase58(),
    isPrivate: (normalizedInput.recipient ?? null) !== null,
    recipient: normalizedInput.recipient ?? null,
    isSold: false,
    updatedAt: new Date().toISOString(),
  };
  savePersistedState(toPersistedState(state, persistedListing));

  return {
    success: true,
    steps: [
      {
        label: "Delegate asset state to PER",
        sig: listAssetDelegateSignature,
        explorerUrl: solanaTxExplorerUrl(listAssetDelegateSignature),
      },
      {
        label: "Execute create_listing in TEE/PER",
        sig: createListingPerSignature,
        explorerUrl: perTxExplorerUrl(createListingPerSignature),
      },
      {
        label: keepAssetRegistryInPer
          ? "Keep AssetRegistry confidential in ER/PER"
          : "Commit AssetRegistry to Solana",
        sig: listAssetCommitSignature,
        explorerUrl: solanaTxExplorerUrl(listAssetCommitSignature),
      },
    ],
    world: state.world.toBase58(),
    assetRegistryPda: state.assetRegistryPda.toBase58(),
    dealTermsPda: state.dealTermsPda.toBase58(),
    note: keepAssetRegistryInPer
      ? normalizedInput.recipient
        ? "Vesting listing was reserved for a designated buyer and keeps AssetRegistry delegated inside ER/PER until final settlement; DealTerms remain confidential there as well."
        : "Vesting listings keep AssetRegistry delegated inside ER/PER until final settlement; DealTerms remain confidential there as well."
      : listDealTermsDelegateSignature === "already-delegated" || !publishDealTermsOnChain
        ? normalizedInput.recipient
          ? "DealTerms remain confidential inside PER and the listing is reserved for its designated buyer."
          : "DealTerms remain confidential inside PER."
        : "DealTerms were committed back to Solana.",
    listing: await getListingSnapshot(listingId),
  };
}

export async function executeAttestVestingSettlement(
  listingId: string,
  input: AttestVestingSettlementInput,
): Promise<FlowExecutionResult> {
  const stored = getStoredState();
  if (!stored || !stored.listings) {
    throw new Error("No listings found.");
  }

  const persistedListing = stored.listings.find((l) => l.listingId === listingId);
  if (!persistedListing) {
    throw new Error(`Listing ${listingId} not found.`);
  }
  if (!isVestingAssetType(persistedListing.assetType)) {
    throw new Error("Settlement attestation only applies to vesting listings.");
  }
  if (persistedListing.privateBuyer && persistedListing.privateBuyer !== input.buyer) {
    throw new Error("This private listing is reserved for a different buyer.");
  }

  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);
  const teeProvider = await buildTeeProvider(wallet);
  const ids = componentIds();
  const attestorSigner = resolveConfiguredSigner(
    "SETTLEMENT_ATTESTOR_WALLET_PATH",
    "SETTLEMENT_ATTESTOR",
    wallet.payer,
  );
  const state = await ensureWorldState(
    provider,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    listingId,
  );
  const teeValidator = new PublicKey((await getClosestValidator(teeProvider.connection)).toBase58());
  const keepAssetRegistryInPer = true;
  const settlementPolicyState = await ensureSettlementPolicyConfigured(
    provider,
    teeProvider,
    wallet,
    teeValidator,
    ids,
    persistedListing.requiredSettlementAttestor ?? attestorSigner.publicKey.toBase58(),
  );
  const settlementPolicy = await readSettlementPolicySnapshot(
    teeProvider.connection,
    settlementPolicyState.policyPda,
  );
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const resolvedSettlementExpiresAt =
    input.settlementExpiresAt && input.settlementExpiresAt > currentTimestamp
      ? input.settlementExpiresAt
      : currentTimestamp + Number(optionalEnv("SETTLEMENT_EXPIRY_TTL_SECONDS") || "3600");
  const settlementProofId = input.settlementProofId ?? generateSettlementProofId();

  await ensureApprovedSystem(provider, state.world, ids.attestVestingSettlementSystemId);

  const attestAssetDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    teeValidator,
  );
  const attestDealTermsDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.dealTermsComponentId,
    teeValidator,
  );
  const attestPolicyDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    settlementPolicyState.policyEntity,
    ids.settlementAuthorityPolicyComponentId,
    teeValidator,
  );
  void attestDealTermsDelegateSignature;
  void attestPolicyDelegateSignature;
  const attestTransaction = await buildAttestVestingSettlementTransaction(
    state.world,
    ids.attestVestingSettlementSystemId,
    state.sellerEntity,
    settlementPolicyState.policyEntity,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    ids.settlementAuthorityPolicyComponentId,
    attestorSigner.publicKey,
    {
      ...input,
      settlementExpiresAt: resolvedSettlementExpiresAt,
      settlementProofId,
    },
  );
  const attestPerSignature = await sendAndConfirmPerTransaction(
    teeProvider.connection,
    wallet.payer,
    attestTransaction,
    undefined,
    attestorSigner.publicKey.equals(wallet.publicKey) ? [] : [attestorSigner.keypair],
  );
  const attestAssetCommitSignature = keepAssetRegistryInPer
    ? "kept-delegated-in-per"
    : await undelegateComponentAccount(
        provider.connection,
        teeProvider.connection,
        wallet.payer,
        wallet.publicKey,
        state.assetRegistryPda,
        ids.assetRegistryComponentId,
      );

  const updatedListing: PersistedListing = {
    ...persistedListing,
    approvedBuyer: input.buyer,
    settlementAttestor: attestorSigner.publicKey.toBase58(),
    settlementStatus: 2,
    settlementExpiresAt: resolvedSettlementExpiresAt,
    settlementNonce: input.settlementNonce ?? (persistedListing.settlementNonce ?? 0) + 1,
    settlementProofId,
    settlementPolicyVersion: settlementPolicy?.version ?? persistedListing.settlementPolicyVersion ?? 0,
    settlementPreparedAt: currentTimestamp,
    settlementPolicyEntity: settlementPolicyState.policyEntity.toBase58(),
    settlementPolicyPda: settlementPolicyState.policyPda.toBase58(),
    updatedAt: new Date().toISOString(),
  };
  savePersistedState(toPersistedState(state, updatedListing));

  return {
    success: true,
    steps: [
      {
        label: "Delegate vesting state to ER/PER",
        sig: attestAssetDelegateSignature,
        explorerUrl: solanaTxExplorerUrl(attestAssetDelegateSignature),
      },
      {
        label: "Attest vesting settlement in ER/PER",
        sig: attestPerSignature,
        explorerUrl: perTxExplorerUrl(attestPerSignature),
      },
      {
        label: keepAssetRegistryInPer
          ? "Keep AssetRegistry confidential in ER/PER"
          : "Commit AssetRegistry to Solana",
        sig: attestAssetCommitSignature,
        explorerUrl: solanaTxExplorerUrl(attestAssetCommitSignature),
      },
    ],
    world: state.world.toBase58(),
    assetRegistryPda: state.assetRegistryPda.toBase58(),
    dealTermsPda: state.dealTermsPda.toBase58(),
    note:
      "Settlement readiness was attested under the active world settlement policy while AssetRegistry and DealTerms stayed delegated inside ER/PER for the remaining approval flow.",
    listing: await getListingSnapshot(listingId),
  };
}

export async function executeIssueTransferConsent(
  listingId: string,
  input: IssueTransferConsentInput,
): Promise<FlowExecutionResult> {
  const stored = getStoredState();
  if (!stored || !stored.listings) {
    throw new Error("No listings found.");
  }

  const persistedListing = stored.listings.find((l) => l.listingId === listingId);
  if (!persistedListing) {
    throw new Error(`Listing ${listingId} not found.`);
  }
  if ((persistedListing.transferRestrictionMode ?? 0) !== 1) {
    throw new Error("Transfer consent only applies to listings that require issuer/admin approval.");
  }
  if (persistedListing.privateBuyer && persistedListing.privateBuyer !== input.buyer) {
    throw new Error("This private listing is reserved for a different buyer.");
  }

  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);
  const teeProvider = await buildTeeProvider(wallet);
  const ids = componentIds();
  const consentSigner = resolveConfiguredSigner(
    "TRANSFER_CONSENT_AUTHORITY_WALLET_PATH",
    "TRANSFER_CONSENT_AUTHORITY",
    wallet.payer,
  );
  const state = await ensureWorldState(
    provider,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    listingId,
  );
  const teeValidator = new PublicKey((await getClosestValidator(teeProvider.connection)).toBase58());
  const keepAssetRegistryInPer = true;

  await ensureApprovedSystem(provider, state.world, ids.issueTransferConsentSystemId);

  const consentAssetDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    teeValidator,
  );
  const consentDealTermsDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.dealTermsComponentId,
    teeValidator,
  );
  const consentTransaction = await buildIssueTransferConsentTransaction(
    state.world,
    ids.issueTransferConsentSystemId,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    consentSigner.publicKey,
    input,
  );
  const consentPerSignature = await sendAndConfirmPerTransaction(
    teeProvider.connection,
    wallet.payer,
    consentTransaction,
    undefined,
    consentSigner.publicKey.equals(wallet.publicKey) ? [] : [consentSigner.keypair],
  );
  const consentAssetCommitSignature = keepAssetRegistryInPer
    ? "kept-delegated-in-per"
    : await undelegateComponentAccount(
        provider.connection,
        teeProvider.connection,
        wallet.payer,
        wallet.publicKey,
        state.assetRegistryPda,
        ids.assetRegistryComponentId,
      );

  const updatedListing: PersistedListing = {
    ...persistedListing,
    consentApprovedBuyer: input.buyer,
    consentAuthority: consentSigner.publicKey.toBase58(),
    consentStatus: 2,
    consentExpiresAt: input.consentExpiresAt ?? persistedListing.consentExpiresAt ?? 0,
    consentNonce: input.consentNonce ?? (persistedListing.consentNonce ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  savePersistedState(toPersistedState(state, updatedListing));

  return {
    success: true,
    steps: [
      {
        label: "Delegate restricted listing state to ER/PER",
        sig: consentAssetDelegateSignature,
        explorerUrl: solanaTxExplorerUrl(consentAssetDelegateSignature),
      },
      {
        label: "Issue transfer consent in ER/PER",
        sig: consentPerSignature,
        explorerUrl: perTxExplorerUrl(consentPerSignature),
      },
      {
        label: keepAssetRegistryInPer
          ? "Keep AssetRegistry confidential in ER/PER"
          : "Commit AssetRegistry to Solana",
        sig: consentAssetCommitSignature,
        explorerUrl: solanaTxExplorerUrl(consentAssetCommitSignature),
      },
    ],
    world: state.world.toBase58(),
    assetRegistryPda: state.assetRegistryPda.toBase58(),
    dealTermsPda: state.dealTermsPda.toBase58(),
    note:
      "Restricted-transfer consent was issued while AssetRegistry and DealTerms stayed delegated inside ER/PER for final matching.",
    listing: await getListingSnapshot(listingId),
  };
}

export async function executeMatchOffer(
  listingId: string,
  input: MatchOfferInput,
  signCallback?: (txBuffer: Buffer, matchedListingId: string) => Promise<Buffer>
): Promise<FlowExecutionResult> {
  const stored = getStoredState();
  if (!stored || !stored.listings) {
    throw new Error("No listings found.");
  }

  const persistedListing = stored.listings.find(l => l.listingId === listingId);
  if (!persistedListing) {
    throw new Error(`Listing ${listingId} not found.`);
  }

  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);
  const teeProvider = await buildTeeProvider(wallet);
  const ids = componentIds();
  const paymentSigner = resolveConfiguredSigner(
    "BUYER_WALLET_PATH",
    "BUYER_PUBKEY",
    wallet.payer,
  );
  const buyer = toPublicKey(input.buyer, resolveBuyerPubkey());
  const state = await ensureWorldState(
    provider,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    listingId,
    {
      buyerEntitySeed: buyerEntitySeedLabel(buyer.toBase58()),
    },
  );
  const teeValidator = new PublicKey((await getClosestValidator(teeProvider.connection)).toBase58());
  const publishDealTermsOnChain = env("PUBLISH_DEAL_TERMS_ONCHAIN", "false") === "true";
  const paymentPolicyState = await ensurePaymentRoutingConfigured(
    provider,
    teeProvider,
    wallet,
    teeValidator,
    ids,
  );
  const paymentPolicy =
    (await readPaymentRoutingPolicySnapshot(
      teeProvider.connection,
      paymentPolicyState.policyPda,
    )) ||
    (await readPaymentRoutingPolicySnapshot(
      provider.connection,
      paymentPolicyState.policyPda,
    ));
  const settlementPolicyState = isVestingAssetType(persistedListing.assetType)
    ? await ensureSettlementPolicyConfigured(
        provider,
        teeProvider,
        wallet,
        teeValidator,
        ids,
        persistedListing.requiredSettlementAttestor ?? wallet.publicKey.toBase58(),
      )
    : persistedListing.settlementPolicyPda && persistedListing.settlementPolicyEntity
    ? {
        world: state.world,
        policyEntity: new PublicKey(persistedListing.settlementPolicyEntity),
        policyPda: new PublicKey(persistedListing.settlementPolicyPda),
      }
    : await ensureSettlementPolicyState(provider, ids.settlementAuthorityPolicyComponentId);

  await ensureApprovedSystem(provider, state.world, ids.matchOfferSystemId);
  const allowCustodialPayment = env("ALLOW_CUSTODIAL_PAYMENT", "false") === "true";
  if (!buyer.equals(paymentSigner.publicKey) && !allowCustodialPayment) {
    throw new Error(
      "match_offer requires BUYER_WALLET_PATH / BUYER_PUBKEY to match the paying buyer unless ALLOW_CUSTODIAL_PAYMENT=true.",
    );
  }
  if (persistedListing.privateBuyer && persistedListing.privateBuyer !== buyer.toBase58()) {
    throw new Error("This private listing is reserved for a different buyer.");
  }
  const bidPrice = parseSafeInteger(
    input.bidPrice ?? persistedListing.minPrice ?? Number(optionalEnv("BID_PRICE") || "1000000"),
    "bidPrice",
  );

  const matchAssetDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    teeValidator,
  );
  const matchDealTermsDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.sellerEntity,
    ids.dealTermsComponentId,
    teeValidator,
  );
  const buyerClearancePda = await findOrCreateComponent(
    provider,
    state.buyerEntity,
    ids.buyerClearanceComponentId,
  );
  const matchClearanceDelegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    state.buyerEntity,
    ids.buyerClearanceComponentId,
    teeValidator,
  );
  const protocolFeeBps =
    paymentPolicy?.protocolFeeBps ??
    parseSafeInteger(
      Number(optionalEnv("PAYMENT_POLICY_PROTOCOL_FEE_BPS") || "0"),
      "paymentPolicyProtocolFeeBps",
    );
  const operatorFeeBps =
    paymentPolicy?.operatorFeeBps ??
    parseSafeInteger(
      Number(optionalEnv("PAYMENT_POLICY_OPERATOR_FEE_BPS") || "0"),
      "paymentPolicyOperatorFeeBps",
    );
  const protocolTreasury = protocolFeeBps > 0
    ? new PublicKey(
        paymentPolicy?.protocolTreasury ??
          optionalEnv("PAYMENT_POLICY_PROTOCOL_TREASURY") ??
          (() => {
            throw new Error(
              "match_offer requires PAYMENT_POLICY_PROTOCOL_TREASURY when protocol fees are enabled.",
            );
          })(),
      )
    : wallet.publicKey; // Use operator wallet instead of PublicKey.default to avoid ConstraintMut on System Program
  const operatorTreasury = operatorFeeBps > 0
    ? new PublicKey(
        paymentPolicy?.operatorTreasury ??
          optionalEnv("PAYMENT_POLICY_OPERATOR_TREASURY") ??
          (() => {
            throw new Error(
              "match_offer requires PAYMENT_POLICY_OPERATOR_TREASURY when operator fees are enabled.",
            );
          })(),
      )
    : wallet.publicKey; // Use operator wallet instead of PublicKey.default to avoid ConstraintMut on System Program
  const matchOfferExtraAccounts: AccountMeta[] = [
    {
      pubkey: buyerClearancePda,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: paymentPolicyState.policyPda,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: settlementPolicyState.policyPda,
      isSigner: false,
      isWritable: false,
    },
    {
      // payment_authority = buyer: checked as signer on-chain at remaining_accounts[5]
      pubkey: buyer,
      isSigner: true,
      isWritable: false,
    },
    {
      // MatchOffer.execute only validates this payout key. Settlement happens later
      // inside CommitMatchedOffer's Magic action, where the payout wallet is writable.
      pubkey: new PublicKey(persistedListing.owner),
      isSigner: false,
      isWritable: false,
    },
  ];
  if (protocolFeeBps > 0) {
    matchOfferExtraAccounts.push({
      pubkey: protocolTreasury,
      isSigner: false,
      isWritable: false,
    });
  }
  if (operatorFeeBps > 0) {
    matchOfferExtraAccounts.push({
      pubkey: operatorTreasury,
      isSigner: false,
      isWritable: false,
    });
  }
  matchOfferExtraAccounts.push({
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  });
  console.log("[matchOffer] extraAccounts:", matchOfferExtraAccounts.map(a => ({
    pubkey: a.pubkey.toBase58(),
    isSigner: a.isSigner,
    isWritable: a.isWritable,
  })));
  let matchOfferTransaction = await buildMatchOfferTransaction(
    wallet.publicKey,
    state.world,
    ids.matchOfferSystemId,
    state.sellerEntity,
    ids.assetRegistryComponentId,
    ids.dealTermsComponentId,
    buyer,
    bidPrice,
    matchOfferExtraAccounts,
  );

  const escrowIndex = escrowIndexForListing(listingId);
  const escrowFundingAmount = parseSafeInteger(
    bidPrice + 1_000_000,
    "escrowFundingAmount",
  );

  const commitMatchedOfferInstruction = await buildCommitMatchedOfferInstruction(
    teeProvider,
    {
      payer: wallet.publicKey,
      assetRegistry: state.assetRegistryPda,
      buyerClearance: buyerClearancePda,
      escrowAuthority: buyer,
      bidPrice,
      paymentRoutingPolicy: paymentPolicyState.policyPda,
      protocolTreasury,
      operatorTreasury,
      escrowIndex,
      teeValidator,
    },
  );
  const undelegateIx = createUndelegateInstruction({
    payer: wallet.publicKey,
    delegatedAccount: state.assetRegistryPda,
    componentPda: ids.assetRegistryComponentId,
  });

  // Merge all instructions into one transaction so the buyer can sign via Phantom.
  // The buyer is a SIGNER (required by Magic BaseAction) but NOT writable (PER constraint).
  matchOfferTransaction.add(undelegateIx, commitMatchedOfferInstruction);

  // Keep the operator wallet as fee payer for PER transactions.
  const matchOfferPayer = wallet.payer;
  const matchOfferAdditionalSigners = [
    paymentSigner.publicKey.equals(matchOfferPayer.publicKey) ? null : paymentSigner.keypair,
  ].filter((signer): signer is Keypair => signer !== null);
  
  if (signCallback) {
    matchOfferTransaction.feePayer = matchOfferPayer.publicKey;
    if (isLocalEphemeralRpc(teeProvider.connection.rpcEndpoint)) {
      const latestBlockhash = await teeProvider.connection.getLatestBlockhash("confirmed");
      matchOfferTransaction.recentBlockhash = latestBlockhash.blockhash;
      matchOfferTransaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    } else {
      const writableAccounts = getWritableAccounts(matchOfferTransaction);
      const blockhashResponse = await fetch(teeProvider.connection.rpcEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBlockhashForAccounts",
          params: [writableAccounts],
        }),
      });
      const blockhashBody = await blockhashResponse.json() as any;
      if (!blockhashResponse.ok || blockhashBody.error) {
        throw new Error(`Failed to fetch PER blockhash: ${JSON.stringify(blockhashBody)}`);
      }
      const blockhashValue = blockhashBody.result?.value ?? blockhashBody.result;
      if (!blockhashValue?.blockhash || typeof blockhashValue.lastValidBlockHeight !== "number") {
        throw new Error(`Unexpected PER blockhash response: ${JSON.stringify(blockhashBody)}`);
      }
      matchOfferTransaction.recentBlockhash = blockhashValue.blockhash;
      matchOfferTransaction.lastValidBlockHeight = blockhashValue.lastValidBlockHeight;
    }

    matchOfferTransaction.partialSign(matchOfferPayer, ...matchOfferAdditionalSigners);
    const serialized = matchOfferTransaction.serialize({ requireAllSignatures: false });
    const signedBuffer = await signCallback(serialized, listingId);
    matchOfferTransaction = anchor.web3.Transaction.from(signedBuffer);
  }

  const escrowAuthoritySigner =
    paymentSigner.publicKey.equals(buyer) ? paymentSigner : null;

  // Fund the Magic escrow on the base layer BEFORE submitting to PER.
  const topUpEscrowSignature = await sendAndConfirmBaseTransaction(
    provider.connection,
    paymentSigner.keypair,
    new Transaction().add(
      buildTopUpEphemeralBalanceInstruction(
        paymentSigner.publicKey,
        buyer,
        escrowFundingAmount,
        escrowIndex,
      ),
    ),
  );

  let matchOfferPerSignature: string;
  try {
    matchOfferPerSignature = await sendAndConfirmPerTransaction(
      teeProvider.connection,
      matchOfferPayer,
      matchOfferTransaction,
      undefined,
      matchOfferAdditionalSigners,
    );
  } catch (error) {
    try {
      await closeEphemeralBalanceIfPossible(
        provider.connection,
        escrowAuthoritySigner,
        escrowIndex,
      );
    } catch {
      // Leave the original match failure intact if escrow cleanup also fails.
    }
    throw error;
  }
  const matchDealTermsCommitSignature = publishDealTermsOnChain
    ? await undelegateComponentAccount(
        provider.connection,
        teeProvider.connection,
        wallet.payer,
        wallet.publicKey,
        state.dealTermsPda,
        ids.dealTermsComponentId,
      )
    : "kept-delegated-in-per";
  let closeEscrowSignature = "close-skipped";
  try {
    closeEscrowSignature = await closeEphemeralBalanceIfPossible(
      provider.connection,
      escrowAuthoritySigner,
      escrowIndex,
    );
  } catch {
    closeEscrowSignature = "close-skipped";
  }

  const updatedListing = {
    ...persistedListing,
    buyerEntity: state.buyerEntity.toBase58(),
    approvedBuyer: buyer.toBase58(),
    consentApprovedBuyer:
      (persistedListing.transferRestrictionMode ?? 0) === 1
        ? buyer.toBase58()
        : (persistedListing.consentApprovedBuyer ?? null),
    consentStatus:
      (persistedListing.transferRestrictionMode ?? 0) === 1
        ? 3
        : (persistedListing.consentStatus ?? 0),
    settlementStatus: isVestingAssetType(persistedListing.assetType)
      ? 3
      : (persistedListing.settlementStatus ?? 0),
    settlementPolicyEntity:
      persistedListing.settlementPolicyEntity ?? settlementPolicyState.policyEntity.toBase58(),
    settlementPolicyPda:
      persistedListing.settlementPolicyPda ?? settlementPolicyState.policyPda.toBase58(),
    paymentPolicyEntity:
      persistedListing.paymentPolicyEntity ?? paymentPolicyState.policyEntity.toBase58(),
    paymentPolicyPda:
      persistedListing.paymentPolicyPda ?? paymentPolicyState.policyPda.toBase58(),
    isSold: true,
    updatedAt: new Date().toISOString(),
  };
  savePersistedState(toPersistedState(state, updatedListing));

  const steps: FlowStep[] = [
      {
        label: "Delegate asset state to PER",
        sig: matchAssetDelegateSignature,
        explorerUrl: solanaTxExplorerUrl(matchAssetDelegateSignature),
      },
      {
        label: "Match offer, commit and settle in TEE/PER",
        sig: matchOfferPerSignature,
        explorerUrl: perTxExplorerUrl(matchOfferPerSignature),
      },
      {
        label: "Fund buyer Magic escrow on Solana",
        sig: topUpEscrowSignature,
        explorerUrl: solanaTxExplorerUrl(topUpEscrowSignature),
      },
  ];
  if (publishDealTermsOnChain) {
    steps.push({
      label: "Commit DealTerms to Solana",
      sig: matchDealTermsCommitSignature,
      explorerUrl: solanaTxExplorerUrl(matchDealTermsCommitSignature),
    });
  }
  if (closeEscrowSignature !== "close-skipped") {
    steps.push({
      label: "Close buyer Magic escrow",
      sig: closeEscrowSignature,
      explorerUrl: solanaTxExplorerUrl(closeEscrowSignature),
    });
  }

  return {
    success: true,
    steps,
    world: state.world.toBase58(),
    assetRegistryPda: state.assetRegistryPda.toBase58(),
    dealTermsPda: state.dealTermsPda.toBase58(),
    note:
      publishDealTermsOnChain
        ? "Payment settled from a buyer-scoped Magic escrow during post-commit execution, and DealTerms were committed back to Solana."
        : "Payment settled from a buyer-scoped Magic escrow during post-commit execution while DealTerms remained confidential inside ER/PER.",
    listing: await getListingSnapshot(listingId),
  };
}

export type IssueClearanceInput = {
  buyer: string;
  clearanceType: number; // 1 = Accredited, 2 = Qualified, 3 = Non-US
  expiresAt?: string; // UNIX timestamp
};

export async function executeIssueClearance(input: IssueClearanceInput): Promise<FlowExecutionResult> {
  const wallet = runtimeWallet();
  const provider = baseProvider(wallet);
  const teeProvider = await buildTeeProvider(wallet);
  const ids = componentIds();
  const teeValidator = new PublicKey((await getClosestValidator(teeProvider.connection)).toBase58());

  // Wait, there's no single listing we are bound to yet for clearance.
  // Clearance belongs to the world and the buyer entity.
  const stored = getStoredState();
  const world = stored?.world ? new PublicKey(stored.world) : optionalPubkey("WORLD_PDA");
  
  if (!world) {
    throw new Error("Cannot issue clearance because the World is not deployed yet.");
  }

  const settlementPolicyState = await ensureSettlementPolicyConfigured(
    provider,
    teeProvider,
    wallet,
    teeValidator,
    ids,
    optionalEnv("SETTLEMENT_POLICY_PRIMARY_ATTESTOR") ||
      optionalEnv("REQUIRED_SETTLEMENT_ATTESTOR") ||
      wallet.publicKey.toBase58(),
  );

  await ensureApprovedSystem(provider, world, ids.issueClearanceSystemId);

  const seed = entitySeed(buyerEntitySeedLabel(input.buyer));
  const worldAccount = await World.fromAccountAddress(provider.connection, world);
  const worldId = new BN(worldAccount.id.toString());
  const buyerEntity = FindEntityPda({ worldId, seed });

  // Make sure the entity exists, or create it if not
  const entityInfo = await getAccountInfoWithRetry(provider.connection, buyerEntity);
  if (!entityInfo) {
    const addEntity = await AddEntity({
      payer: provider.wallet.publicKey,
      world,
      seed,
      connection: provider.connection,
    });
    await provider.sendAndConfirm(addEntity.transaction);
  }

  // Find or create BuyerClearance component
  const buyerClearanceComponentId = ids.buyerClearanceComponentId;
  const buyerClearancePda = await findOrCreateComponent(provider, buyerEntity, buyerClearanceComponentId);

  // Delegate
  const delegateSignature = await delegateComponentAccount(
    provider,
    teeProvider.connection,
    wallet.payer,
    wallet.publicKey,
    buyerEntity,
    buyerClearanceComponentId,
    teeValidator,
  );

  // Execute system
  const expiresAt = input.expiresAt ? parseInt(input.expiresAt, 10) : 0;
  const applySystem = await ApplySystem({
    authority: wallet.publicKey,
    world,
    systemId: ids.issueClearanceSystemId,
    entities: [
      {
        entity: buyerEntity,
        components: [{ componentId: buyerClearanceComponentId }],
      },
      {
        entity: settlementPolicyState.policyEntity,
        components: [{ componentId: ids.settlementAuthorityPolicyComponentId }],
      },
    ],
    args: {
      buyer: input.buyer,
      clearance_type: input.clearanceType,
      expires_at: expiresAt,
    },
  });

  let perSignature = "skipped-already-issued";
  try {
    perSignature = await sendAndConfirmPerTransaction(
      teeProvider.connection,
      wallet.payer,
      applySystem.transaction,
    );
  } catch (err: any) {
    if (err.message && err.message.includes("0x1776")) {
      console.log(`[INFO] Clearance already issued for buyer ${input.buyer}. Skipping...`);
    } else {
      throw err;
    }
  }

  const commitSignature = "kept-delegated-in-per";

  const latestListingId = stored?.listings?.[stored.listings.length - 1]?.listingId ?? null;
  const latestListing = stored?.listings?.[stored.listings.length - 1] ?? null;

  return {
    success: true,
    steps: [
      {
        label: "Delegate BuyerClearance to PER",
        sig: delegateSignature,
        explorerUrl: solanaTxExplorerUrl(delegateSignature)
      },
      {
        label: "Execute issue_clearance in TEE/PER",
        sig: perSignature,
        explorerUrl: perTxExplorerUrl(perSignature)
      },
      {
        label: "Keep BuyerClearance confidential in ER/PER",
        sig: commitSignature,
        explorerUrl: null,
      }
    ],
    world: world.toBase58(),
    assetRegistryPda: latestListing?.assetRegistryPda ?? "",
    dealTermsPda: latestListing?.dealTermsPda ?? "",
    note:
      "Buyer clearance is global to the world and stays delegated inside ER/PER until the final match commits it back.",
    listing: latestListingId ? await getListingSnapshot(latestListingId) : null,
  };
}

export async function runEndToEndFlow(): Promise<Record<string, unknown>> {
  const wallet = runtimeWallet();
  const ids = componentIds();
  const ownerPubkey =
    optionalEnv("OWNER_PUBKEY") ||
    (optionalEnv("OWNER_WALLET_PATH")
      ? resolveConfiguredAuthorityPublicKey(
          "OWNER_WALLET_PATH",
          "OWNER_PUBKEY",
          wallet.publicKey,
        ).toBase58()
      : null);
  const listingInput: CreateListingInput = {
    assetType: Number(optionalEnv("ASSET_TYPE") || "1"),
    minPrice: Number(optionalEnv("MIN_PRICE") || "900000"),
    tokenAmount: Number(optionalEnv("TOKEN_AMOUNT") || "1000000000"),
    valuationCap: Number(optionalEnv("VALUATION_CAP") || "500000000"),
    tokenMint: optionalEnv("TOKEN_MINT"),
    vestingSourceProgram: optionalEnv("VESTING_SOURCE_PROGRAM"),
    vestingSourcePosition: optionalEnv("VESTING_SOURCE_POSITION"),
    vestingStartTs: Number(optionalEnv("VESTING_START_TS") || "0"),
    vestingCliffTs: Number(optionalEnv("VESTING_CLIFF_TS") || "0"),
    vestingEndTs: Number(optionalEnv("VESTING_END_TS") || "0"),
    unlockedAmount: Number(optionalEnv("UNLOCKED_AMOUNT") || "0"),
    claimedAmount: Number(optionalEnv("CLAIMED_AMOUNT") || "0"),
    transferRestrictionMode: Number(optionalEnv("TRANSFER_RESTRICTION_MODE") || "0"),
    settlementMode: Number(optionalEnv("SETTLEMENT_MODE") || "0"),
    settlementExpiresAt: Number(optionalEnv("SETTLEMENT_EXPIRES_AT") || "0"),
    requiredSettlementAttestor:
      optionalEnv("REQUIRED_SETTLEMENT_ATTESTOR") || optionalEnv("SETTLEMENT_ATTESTOR"),
    requiredConsentAuthority:
      optionalEnv("REQUIRED_CONSENT_AUTHORITY") || optionalEnv("TRANSFER_CONSENT_AUTHORITY"),
    owner: ownerPubkey,
    isPrivate: Boolean(optionalEnv("PRIVATE_BUYER") || optionalEnv("RECIPIENT")),
    recipient: optionalEnv("PRIVATE_BUYER") || optionalEnv("RECIPIENT"),
  };
  const settlementAttestor =
    isVestingAssetType(listingInput.assetType)
      ? resolveConfiguredAuthorityPublicKey(
          "SETTLEMENT_ATTESTOR_WALLET_PATH",
          "SETTLEMENT_ATTESTOR",
          wallet.publicKey,
        ).toBase58()
      : null;
  const consentAuthority =
    listingInput.transferRestrictionMode === 1
      ? resolveConfiguredAuthorityPublicKey(
          "TRANSFER_CONSENT_AUTHORITY_WALLET_PATH",
          "TRANSFER_CONSENT_AUTHORITY",
          wallet.publicKey,
        ).toBase58()
      : null;
  const settlementPolicyAuthority = isVestingAssetType(listingInput.assetType)
    ? resolveConfiguredAuthorityPublicKey(
        "SETTLEMENT_POLICY_AUTHORITY_WALLET_PATH",
        "SETTLEMENT_POLICY_AUTHORITY",
        wallet.publicKey,
      ).toBase58()
    : null;
  const paymentPolicyAuthority = resolveConfiguredAuthorityPublicKey(
    "PAYMENT_POLICY_AUTHORITY_WALLET_PATH",
    "PAYMENT_POLICY_AUTHORITY",
    wallet.publicKey,
  ).toBase58();
  const paymentSigner = resolveConfiguredSigner(
    "BUYER_WALLET_PATH",
    "BUYER_PUBKEY",
    wallet.payer,
  ).publicKey.toBase58();
  const createResult = await executeCreateListing(listingInput);
  const buyerPubkey = optionalEnv("BUYER_PUBKEY") || resolveBuyerPubkey().toBase58();
  const clearanceResult = await executeIssueClearance({
    buyer: buyerPubkey,
    clearanceType: Number(optionalEnv("CLEARANCE_TYPE") || "1"),
    expiresAt: optionalEnv("CLEARANCE_EXPIRES_AT") || undefined,
  });
  const stored = getStoredState();
  const listingId = stored?.listings?.[stored.listings.length - 1]?.listingId;
  
  if (!listingId) throw new Error("Listing failed to save.");

  const settlementResult =
    isVestingAssetType(listingInput.assetType)
      ? await executeAttestVestingSettlement(listingId, {
          buyer: buyerPubkey,
          settlementProofId: optionalEnv("SETTLEMENT_PROOF_ID"),
          settlementExpiresAt: Number(optionalEnv("SETTLEMENT_EXPIRES_AT") || "0"),
          settlementNonce: Number(optionalEnv("SETTLEMENT_NONCE") || "1"),
        })
      : null;
  const consentResult =
    listingInput.transferRestrictionMode === 1
      ? await executeIssueTransferConsent(listingId, {
          buyer: buyerPubkey,
          consentExpiresAt: Number(optionalEnv("CONSENT_EXPIRES_AT") || "0"),
          consentNonce: Number(optionalEnv("CONSENT_NONCE") || "1"),
        })
      : null;
  
  const matchResult = await executeMatchOffer(listingId, {
    buyer: buyerPubkey,
    bidPrice: Number(optionalEnv("BID_PRICE") || "1000000"),
  });
  const finalStored = getStoredState();
  const finalListing = finalStored?.listings?.[finalStored.listings.length - 1];

  return {
    executedAt: new Date().toISOString(),
    listingId,
    environment: {
      relayEnvironment: optionalEnv("RELAY_ENVIRONMENT") || "devnet",
      solanaRpcUrl: env("SOLANA_RPC_URL", DEFAULT_SOLANA_RPC_URL),
      teeRpcUrl: env("TEE_RPC_URL", DEFAULT_TEE_RPC_URL),
      publishDealTermsOnChain: env("PUBLISH_DEAL_TERMS_ONCHAIN", "false") === "true",
      allowCustodialPayment: env("ALLOW_CUSTODIAL_PAYMENT", "false") === "true",
      relayStatePath: stateFilePath(),
    },
    roles: {
      operator: wallet.publicKey.toBase58(),
      seller: listingInput.owner ?? wallet.publicKey.toBase58(),
      buyer: buyerPubkey,
      paymentSigner,
      paymentPolicyAuthority,
      paymentPolicyProtocolTreasury: optionalEnv("PAYMENT_POLICY_PROTOCOL_TREASURY"),
      paymentPolicyOperatorTreasury: optionalEnv("PAYMENT_POLICY_OPERATOR_TREASURY"),
      settlementAttestor,
      settlementPolicyAuthority,
      consentAuthority,
    },
    programs: {
      assetRegistryComponentId: ids.assetRegistryComponentId.toBase58(),
      dealTermsComponentId: ids.dealTermsComponentId.toBase58(),
      paymentRoutingPolicyComponentId:
        ids.paymentRoutingPolicyComponentId.toBase58(),
      settlementAuthorityPolicyComponentId:
        ids.settlementAuthorityPolicyComponentId.toBase58(),
      buyerClearanceComponentId: ids.buyerClearanceComponentId.toBase58(),
      createListingSystemId: ids.createListingSystemId.toBase58(),
      attestVestingSettlementSystemId: ids.attestVestingSettlementSystemId.toBase58(),
      configurePaymentRoutingSystemId:
        ids.configurePaymentRoutingSystemId.toBase58(),
      configureSettlementPolicySystemId:
        ids.configureSettlementPolicySystemId.toBase58(),
      issueClearanceSystemId: ids.issueClearanceSystemId.toBase58(),
      issueTransferConsentSystemId: ids.issueTransferConsentSystemId.toBase58(),
      matchOfferSystemId: ids.matchOfferSystemId.toBase58(),
    },
    listingInput,
    world: createResult.world,
    sellerEntity: finalListing?.sellerEntity ?? null,
    buyerEntity: finalListing?.buyerEntity ?? null,
    assetRegistryPda: createResult.assetRegistryPda,
    dealTermsPda: createResult.dealTermsPda,
    sellerOwner: listingInput.owner ?? wallet.publicKey.toBase58(),
    buyerOwner: matchResult.listing?.owner ?? optionalEnv("BUYER_PUBKEY"),
    finalListing: matchResult.listing,
    signatures: {
      listAssetDelegateSignature: createResult.steps[0]?.sig,
      createListingPerSignature: createResult.steps[1]?.sig,
      listAssetCommitSignature: createResult.steps[2]?.sig,
      clearanceDelegateSignature: clearanceResult.steps[0]?.sig,
      clearancePerSignature: clearanceResult.steps[1]?.sig,
      clearanceCommitSignature: clearanceResult.steps[2]?.sig,
      settlementDelegateSignature: settlementResult?.steps[0]?.sig,
      settlementPerSignature: settlementResult?.steps[1]?.sig,
      settlementCommitSignature: settlementResult?.steps[2]?.sig,
      consentDelegateSignature: consentResult?.steps[0]?.sig,
      consentPerSignature: consentResult?.steps[1]?.sig,
      consentCommitSignature: consentResult?.steps[2]?.sig,
      matchAssetDelegateSignature: matchResult.steps[0]?.sig,
      matchOfferPerSignature: matchResult.steps[1]?.sig,
      matchAssetCommitSignature: matchResult.steps[2]?.sig,
      listDealTermsCommitSignature: "kept-delegated-in-per",
      matchDealTermsCommitSignature: "kept-delegated-in-per",
    },
  };
}
