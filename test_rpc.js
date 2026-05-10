import { Connection, Keypair, VersionedTransaction, Transaction } from '@solana/web3.js';
import fetch from 'node-fetch';
import bs58 from 'bs58';

async function test() {
  const connection = new Connection('https://api.devnet.solana.com');
  const payer = Keypair.generate();

  // Create a listing request
  const reqBody = {
    owner: payer.publicKey.toBase58(),
    assetType: 1, // assuming 1 is valid
    minPrice: 1000000,
    tokenAmount: 1,
    valuationCap: 0,
    isPrivate: false,
    transferRestrictionMode: 0,
    settlementMode: 0
  };

  console.log("Sending prepare request...");
  const res = await fetch('http://localhost:3000/api/listings/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });

  if (!res.ok) {
    console.error("Failed to prepare:", await res.text());
    return;
  }

  const data = await res.json();
  console.log("Prepared listing ID:", data.listingId);

  const txBytes = Buffer.from(data.transactionBase64, 'base64');
  const tx = Transaction.from(txBytes);
  
  console.log("Simulating on Devnet RPC...");
  try {
    const simRes = await connection.simulateTransaction(tx);
    console.log("Simulation result:", simRes.value);
  } catch (e) {
    console.error("Simulation error:", e);
  }
}

test().catch(console.error);