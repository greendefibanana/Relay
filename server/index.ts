import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import {
  executeAttestVestingSettlement,
  executeCreateListing,
  executeIssueTransferConsent,
  executeMatchOffer,
  executeIssueClearance,
  getClearanceStatus,
  getListingSnapshot,
  getListings,
  executeCancelListing,
} from "../clients/rfq-protocol.js";
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
} from "./request-validation.js";
import { evaluateKycRequest, isReviewModeEnabled } from "./kyc.js";

const port = Number(process.env.PORT || process.env.API_PORT || "3030");
const allowedOrigins = (process.env.RELAY_ALLOWED_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

class UnauthorizedError extends Error {
  readonly statusCode = 401;
}

function setCors(res: http.ServerResponse, req?: http.IncomingMessage): void {
  const origin = req?.headers.origin;
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "http://localhost:3000";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function requireAdmin(req: http.IncomingMessage): void {
  if (process.env.ALLOW_UNAUTHENTICATED_ADMIN === "true") {
    return;
  }
  const token = process.env.RELAY_ADMIN_TOKEN;
  if (!token) {
    throw new UnauthorizedError(
      "RELAY_ADMIN_TOKEN is required for privileged operations. Set ALLOW_UNAUTHENTICATED_ADMIN=true only for local demos.",
    );
  }
  if (req.headers.authorization !== `Bearer ${token}`) {
    throw new UnauthorizedError("Unauthorized privileged operation.");
  }
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload: unknown,
  req?: http.IncomingMessage,
): void {
  setCors(res, req);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const body = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }
}

function notFound(res: http.ServerResponse): void {
  sendJson(res, 404, { error: "Not found" });
}

function logApiError(error: unknown): void {
  const message = `\nAPI ERROR: ${error instanceof Error ? error.stack : String(error)}`;
  const logPath = process.env.RELAY_ERROR_LOG_PATH || path.join(process.cwd(), "api-crash-logs.txt");

  try {
    fs.appendFileSync(logPath, message);
  } catch (logError) {
    console.error("Failed to write API error log:", logError);
  }
}

async function ensureReviewClearanceForSimpleMatch(
  listingId: string,
  buyer: string,
): Promise<void> {
  if (!isReviewModeEnabled()) {
    return;
  }

  const listing = await getListingSnapshot(listingId);
  if (!listing || listing.isSold) {
    return;
  }

  const isSimpleReviewFlow =
    listing.assetTypeId === 1 &&
    listing.transferRestrictionMode === 0 &&
    listing.settlementMode === 0 &&
    (!listing.privateBuyer || listing.privateBuyer === buyer);
  if (!isSimpleReviewFlow) {
    return;
  }

  const clearance = await getClearanceStatus(buyer);
  const alreadyCleared =
    clearance?.isCleared &&
    (!clearance.listingEntity || clearance.listingEntity === listing.sellerEntity);
  if (alreadyCleared) {
    return;
  }

  const decision = evaluateKycRequest(buyer);
  await executeIssueClearance({
    buyer: decision.buyer,
    clearanceType: decision.clearanceType,
    listingEntity: listing.sellerEntity,
  });
}

const server = http.createServer(async (req, res) => {
  setCors(res, req);

  if (!req.url || !req.method) {
    notFound(res);
    return;
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/listings") {
      sendJson(res, 200, { listings: await getListings() });
      return;
    }

    if (req.method === "GET" && url.pathname.match(/^\/api\/listings\/\d+$/)) {
      const id = url.pathname.split("/").pop()!;
      const listing = await getListingSnapshot(id);
      if (!listing) {
        sendJson(res, 404, { error: "Listing not found" });
        return;
      }
      sendJson(res, 200, { listing });
      return;
    }

    const IN_FLIGHT_LISTINGS = (global as any).IN_FLIGHT_LISTINGS || new Map<string, any>();
    (global as any).IN_FLIGHT_LISTINGS = IN_FLIGHT_LISTINGS;

    if (req.method === "POST" && url.pathname === "/api/listings") {
      // Legacy wrapper that throws errors directly
      throw new BadRequestError("Use /api/listings/prepare and /api/listings/submit directly.");
    }

    if (req.method === "POST" && url.pathname === "/api/listings/prepare") {
      const body = await readJsonBody(req);
      const input = parseCreateListingBody(body);
      let outListingId = "";
      let outBase64 = "";

      const preparePromise = new Promise<void>((resolvePrep, rejectPrep) => {
        const executor = executeCreateListing(input, async (txBuf, listingId) => {
          outListingId = listingId;
          outBase64 = txBuf.toString("base64");
          resolvePrep();
          return new Promise<Buffer>((res, rej) => {
            IN_FLIGHT_LISTINGS.set(listingId, {
              resolveTx: res,
              rejectTx: rej,
              finalResult: executor
            });
          });
        });

        executor.catch((e: Error) => {
          if (!outListingId) rejectPrep(e);
        });
      });

      await preparePromise;
      sendJson(res, 200, { listingId: outListingId, transactionBase64: outBase64 });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/listings/submit") {
      const body = await readJsonBody(req) as any;
      const { listingId, signedTransaction } = body;
      
      const flight = IN_FLIGHT_LISTINGS.get(listingId);
      if (!flight) throw new BadRequestError("Listing not in flight or expired.");
      IN_FLIGHT_LISTINGS.delete(listingId);
      
      flight.resolveTx(Buffer.from(signedTransaction, "base64"));
      const result = await flight.finalResult;
      
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "DELETE" && url.pathname.match(/^\/api\/listings\/\d+$/)) {
      requireAdmin(req);
      const id = url.pathname.split("/").pop()!;
      const result = await executeCancelListing(id);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/cancel\/prepare$/)) {
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req);
      const input = parseCancelPrepareBody(body);
      const listing = await getListingSnapshot(id);
      if (!listing) {
        sendJson(res, 404, { error: "Listing not found" }, req);
        return;
      }
      if (listing.isSold) {
        throw new BadRequestError(`Listing ${id} is already sold and cannot be cancelled.`);
      }
      if (listing.owner !== input.seller) {
        throw new UnauthorizedError("Only the listing owner can cancel this listing.");
      }

      let outBase64 = "";
      const cancelPromise = new Promise<void>((resolvePrep, rejectPrep) => {
        const executor = executeCancelListing(id, async (txBuf, listingId) => {
          outBase64 = txBuf.toString("base64");
          resolvePrep();
          return new Promise<Buffer>((res, rej) => {
            IN_FLIGHT_LISTINGS.set(`${listingId}_cancel`, {
              resolveTx: res,
              rejectTx: rej,
              finalResult: executor,
            });
          });
        });

        executor.catch((e: Error) => {
          if (!outBase64) rejectPrep(e);
        });
      });

      await cancelPromise;
      sendJson(res, 200, { listingId: id, transactionBase64: outBase64 });
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/cancel\/submit$/)) {
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req);
      const { signedTransaction } = parseSignedTransactionBody({ ...body, listingId: id });
      const flight = IN_FLIGHT_LISTINGS.get(`${id}_cancel`);
      if (!flight) {
        throw new BadRequestError(`No in-flight cancellation found for listing ${id}`);
      }

      flight.resolveTx(Buffer.from(signedTransaction, "base64"));
      IN_FLIGHT_LISTINGS.delete(`${id}_cancel`);
      const result = await flight.finalResult;
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/settlement-attest$/)) {
      requireAdmin(req);
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req);
      const result = await executeAttestVestingSettlement(id, parseSettlementAttestBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/settlement-attest\/request$/)) {
      const id = url.pathname.split("/")[3];
      const listing = await getListingSnapshot(id);
      if (!listing) {
        sendJson(res, 404, { error: "Listing not found" }, req);
        return;
      }
      if (listing.isSold) {
        throw new BadRequestError(`Listing ${id} is already sold.`);
      }
      const body = await readJsonBody(req);
      const result = await executeAttestVestingSettlement(id, parseSettlementAttestBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/consent$/)) {
      requireAdmin(req);
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req);
      const result = await executeIssueTransferConsent(id, parseConsentBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/consent\/request$/)) {
      const id = url.pathname.split("/")[3];
      const listing = await getListingSnapshot(id);
      if (!listing) {
        sendJson(res, 404, { error: "Listing not found" }, req);
        return;
      }
      if (listing.isSold) {
        throw new BadRequestError(`Listing ${id} is already sold.`);
      }
      const body = await readJsonBody(req);
      const result = await executeIssueTransferConsent(id, parseConsentBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/match$/)) {
      throw new BadRequestError("Use /api/listings/:id/match/prepare and /api/listings/:id/match/submit directly.");
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/match\/prepare$/)) {
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req);
      const input = parseMatchBody(body);
      if (input.buyer) {
        await ensureReviewClearanceForSimpleMatch(id, input.buyer);
      }
      
      let outListingId = id;
      let outBase64 = "";

      const preparePromise = new Promise<void>((resolvePrep, rejectPrep) => {
        const executor = executeMatchOffer(id, input, async (txBuf, _resolvedId) => {
          outBase64 = txBuf.toString("base64");
          resolvePrep();
          return new Promise<Buffer>((res, rej) => {
            IN_FLIGHT_LISTINGS.set(id + "_match", {
              resolveTx: res,
              rejectTx: rej,
              finalResult: executor
            });
          });
        });

        executor.catch((e: Error) => {
          if (!outBase64) rejectPrep(e);
        });
      });

      await preparePromise;
      sendJson(res, 200, { listingId: outListingId, transactionBase64: outBase64 });
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/match\/submit$/)) {
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req) as any;
      const { signedTransaction } = body;
      
      const flight = IN_FLIGHT_LISTINGS.get(id + "_match");
      if (!flight) {
        throw new BadRequestError(`No in-flight match offer found for listing ${id}`);
      }

      flight.resolveTx(Buffer.from(signedTransaction, "base64"));
      IN_FLIGHT_LISTINGS.delete(id + "_match");

      const result = await flight.finalResult;
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/clearance/")) {
      const buyer = url.pathname.split("/").pop()!;
      const clearance = await getClearanceStatus(buyer);
      sendJson(res, 200, { clearance });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/clearance") {
      requireAdmin(req);
      const body = await readJsonBody(req);
      const result = await executeIssueClearance(parseIssueClearanceBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/clearance/request") {
      const body = await readJsonBody(req);
      const request = parseClearanceRequestBody(body);
      const decision = evaluateKycRequest(request.buyer);
      const result = await executeIssueClearance({
        buyer: decision.buyer,
        clearanceType: decision.clearanceType,
        listingEntity: request.listingEntity,
      });
      sendJson(res, 200, result);
      return;
    }

    notFound(res);
  } catch (error) {
    console.error("API Request Error:", error);
    logApiError(error);
    const message = error instanceof Error ? error.message : String(error);
    const status =
      error instanceof BadRequestError || error instanceof UnauthorizedError
        ? error.statusCode
        : typeof (error as { statusCode?: unknown }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : 500;
    sendJson(res, status, { error: message }, req);
  }
});

server.listen(port, () => {
  console.log(`Relay API listening on http://localhost:${port}`);
});
