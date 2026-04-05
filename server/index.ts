import http from "node:http";
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
  parseConsentBody,
  parseCreateListingBody,
  parseIssueClearanceBody,
  parseMatchBody,
  parseSettlementAttestBody,
} from "./request-validation.js";

const port = Number(process.env.API_PORT || "3030");

function setCors(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  setCors(res);
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

const server = http.createServer(async (req, res) => {
  setCors(res);

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
      const id = url.pathname.split("/").pop()!;
      const result = await executeCancelListing(id);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/settlement-attest$/)) {
      const id = url.pathname.split("/")[3];
      const body = await readJsonBody(req);
      const result = await executeAttestVestingSettlement(id, parseSettlementAttestBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/listings\/\d+\/consent$/)) {
      const id = url.pathname.split("/")[3];
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
      const body = await readJsonBody(req);
      const result = await executeIssueClearance(parseIssueClearanceBody(body));
      sendJson(res, 200, result);
      return;
    }

    notFound(res);
  } catch (error) {
    console.error("API Request Error:", error);
    require("fs").appendFileSync("C:/Users/ezevi/Documents/Relay/api-crash-logs.txt", "\nAPI ERROR: " + (error instanceof Error ? error.stack : String(error)));
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof BadRequestError ? error.statusCode : 500;
    sendJson(res, status, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Relay API listening on http://localhost:${port}`);
});
