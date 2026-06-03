// Converts a known 32-byte hex public key into Solana base58 form.
import { PublicKey } from "@solana/web3.js";
const bytes = Buffer.from("053d471a859e732e680bc958f841072b8f3fbc19739be697c4c681126f8c1f74", "hex");
console.log(new PublicKey(bytes).toBase58());
