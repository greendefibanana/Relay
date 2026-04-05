import { Transaction, Keypair } from "@solana/web3.js";

async function main() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log("Preparing listing...");
    const prep = await fetch("http://localhost:3030/api/listings/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetType: 1,
        minPrice: 1000000,
        tokenAmount: 1,
        valuationCap: 5000000,
        owner: Keypair.generate().publicKey.toBase58(),
      }),
    });
    
    const prepData = await prep.json();
    if (!prep.ok) throw new Error("Prep failed: " + JSON.stringify(prepData));
    
    console.log("Got transaction, decoding...");
    const txBuf = Buffer.from(prepData.transactionBase64, "base64");
    const tx = Transaction.from(txBuf);
    
    console.log("Signing transaction (mock Phantom)...");
    // Mock signature - just partial sign with our dummy owner
    const dummyOwner = Keypair.fromSecretKey(new Uint8Array([/* doesn't matter for decode test */])); // Wait we need the actual owner's private key to sign! 
    // Actually we don't even need to sign for a decoding error. Phantom serializes it.
    
    // Just serialize it back to base64
    const signedBase64 = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
    
    console.log("Submitting transaction...");
    const submit = await fetch("http://localhost:3030/api/listings/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: prepData.listingId,
        signedTransaction: signedBase64,
      }),
    });
    
    const submitData = await submit.json();
    console.log("Submit result:", submitData);
  } catch (err) {
    console.error("Test Failed:", err);
  }
}

main();
