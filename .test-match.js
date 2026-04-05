const { Keypair, Transaction } = require("@solana/web3.js");
const bs58 = require("bs58");

async function main() {
  const listingId = "1";
  const listingsRes = await fetch("http://localhost:3030/api/listings").then(r => r.json());
  
  const listing = listingsRes.listings.find(l => !l.isSold);
  if (!listing) {
    console.log("No active listings found to test with.");
    return;
  }
  
  console.log("Testing against listing:", listing.tradeId);
  const buyer = Keypair.generate();
  
  try {
    const prepRes = await fetch(`http://localhost:3030/api/listings/${listing.tradeId}/match/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyer: buyer.publicKey.toBase58() })
    });
    
    if (!prepRes.ok) {
      console.log("Prepare failed:", await prepRes.text());
      return;
    }
    const prepBody = await prepRes.json();
    console.log("Prepare succeeded, txBase64 length:", prepBody.transactionBase64.length);
    
    const txBuf = Buffer.from(prepBody.transactionBase64, "base64");
    const tx = Transaction.from(txBuf);
    
    const buyerKey = tx.instructions[0].keys.find(k => k.pubkey.toBase58() === buyer.publicKey.toBase58());
    console.log("Buyer isSigner:", buyerKey ? buyerKey.isSigner : "NOT FOUND IN KEYS");
    
    // Simulate Phantom sign
    tx.partialSign(buyer);
    const signedBuf = tx.serialize({ requireAllSignatures: false });
    
    const submitRes = await fetch(`http://localhost:3030/api/listings/${listing.tradeId}/match/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedTransaction: signedBuf.toString("base64") })
    });
    
    if (!submitRes.ok) {
      console.log("Submit failed:", submitRes.status, await submitRes.text());
    } else {
      console.log("Submit succeeded:", await submitRes.json());
    }
    
  } catch (err) {
    console.error("Test Exception:", err);
  }
}

main();
