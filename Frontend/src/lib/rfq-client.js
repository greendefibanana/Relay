import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3030";
const RELAY_ADMIN_TOKEN = process.env.REACT_APP_RELAY_ADMIN_TOKEN || "";
const SOLANA_RPC_URL = process.env.REACT_APP_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SOLANA_EXPLORER = "https://explorer.solana.com";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function base64ToUint8Array(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  var binary = '';
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function signPreparedPerTransaction(
  transactionBase64,
  signTransaction,
) {
  const txBytes = base64ToUint8Array(transactionBase64);
  const transaction = Transaction.from(txBytes);

  if (!signTransaction) {
    throw new Error("Wallet connection required to sign the transaction.");
  }

  return await signTransaction(transaction);
}

async function anchorListingReceiptOnSolana(listingId, seller, signTransaction) {
  if (!seller || !listingId) {
    return null;
  }

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const feePayer = new PublicKey(seller);
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const memo = `Relay listing created:${listingId}`;
  const transaction = new Transaction({
    feePayer,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: new TextEncoder().encode(memo),
    }),
  );

  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
  });
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );
  if (confirmation.value.err) {
    throw new Error(`Lister receipt transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return signature;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

function adminHeaders() {
  return RELAY_ADMIN_TOKEN ? { Authorization: `Bearer ${RELAY_ADMIN_TOKEN}` } : {};
}

export function explorerUrl(value, type = "address") {
  return `${SOLANA_EXPLORER}/${type}/${value}?cluster=devnet`;
}

export async function getListings() {
  const payload = await api("/api/listings");
  return payload.listings || [];
}

export async function getListing(tradeId) {
  const payload = await api(`/api/listings/${tradeId}`);
  return payload.listing || null;
}

export async function createListing(params, signTransaction) {
  if (!signTransaction) {
    throw new Error("Wallet connection required to sign the listing transaction.");
  }

  try {
    const prep = await api("/api/listings/prepare", {
      method: "POST",
      body: JSON.stringify(params),
    });

    console.log("Requesting wallet signature...");
    const signed = await signPreparedPerTransaction(
      prep.transactionBase64,
      signTransaction,
    );
    console.log("Signature successful, serializing...");

    const signedBase64 = uint8ArrayToBase64(signed.serialize({ requireAllSignatures: false }));

    console.log("Submitting to API...");
    const result = await api("/api/listings/submit", {
      method: "POST",
      body: JSON.stringify({
        listingId: prep.listingId,
        signedTransaction: signedBase64
      }),
    });

    try {
      const receiptSignature = await anchorListingReceiptOnSolana(
        result?.listing?.tradeId || prep.listingId,
        params.seller,
        signTransaction,
      );

      if (receiptSignature) {
        result.steps = [
          ...(result.steps || []),
          {
            label: "Anchor lister receipt on Solana",
            sig: receiptSignature,
            explorerUrl: explorerUrl(receiptSignature, "tx"),
          },
        ];
        result.note = `${result.note || "Listing created."} Lister receipt anchored on Solana.`;
      }
    } catch (receiptError) {
      console.warn("Listing receipt anchor failed:", receiptError);
      result.steps = [
        ...(result.steps || []),
        {
          label: "Anchor lister receipt on Solana",
          sig: "receipt-anchor-failed",
          explorerUrl: null,
        },
      ];
      result.note = `${result.note || "Listing created."} Listing was created, but the optional lister Solana receipt was not anchored.`;
    }

    return result;
  } catch (err) {
    console.error("Frontend RqF Error Trace:", err);
    throw err;
  }
}

export async function matchOffer(tradeId, params, signTransaction) {
  if (!signTransaction) {
    throw new Error("Wallet connection required to sign the matching transaction.");
  }

  try {
    const prep = await api(`/api/listings/${tradeId}/match/prepare`, {
      method: "POST",
      body: JSON.stringify(params || {}),
    });

    const signed = await signPreparedPerTransaction(
      prep.transactionBase64,
      signTransaction,
    );
    const signedMessage = signed.serialize({ requireAllSignatures: false });
    const signedBase64 = uint8ArrayToBase64(signedMessage);

    return await api(`/api/listings/${tradeId}/match/submit`, {
      method: "POST",
      body: JSON.stringify({
        listingId: tradeId,
        signedTransaction: signedBase64
      }),
    });
  } catch (err) {
    console.error("Frontend RqF Error Trace:", err);
    throw err;
  }
}

export async function attestVestingSettlement(tradeId, params) {
  return api(`/api/listings/${tradeId}/settlement-attest`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(params || {}),
  });
}

export async function issueTransferConsent(tradeId, params) {
  return api(`/api/listings/${tradeId}/consent`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(params || {}),
  });
}

export async function issueClearance(params) {
  return api("/api/clearance", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(params),
  });
}

export async function getClearanceStatus(buyer) {
  const payload = await api(`/api/clearance/${buyer}`);
  return payload.clearance || null;
}

export async function cancelListing(tradeId) {
  return api(`/api/listings/${tradeId}`, { method: "DELETE", headers: adminHeaders() });
}

export async function getProtocolStats(listings) {
  const total = listings.length;
  const active = listings.filter((l) => !l.isSold).length;
  const matched = listings.filter((l) => l.isSold).length;
  return { total, active, matched };
}
