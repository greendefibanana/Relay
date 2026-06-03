// Fetches and attempts to decode a MagicBlock World account on devnet.
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import fs from "fs";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");
  const worldAddress = new PublicKey("SvxeTS6CR9CKVgT75sjyngutRxYSHPihmf38RziXx5j");
  const accountInfo = await connection.getAccountInfo(worldAddress);
  
  if (!accountInfo) {
    console.log("World account not found");
    return;
  }

  console.log("World Account Data (Hex):", accountInfo.data.toString("hex"));
  
  // The World IDL is usually in @magicblock-labs/bolt-sdk
  // But we can try to find it in the repo.
  const idlPath = "node_modules/@magicblock-labs/bolt-sdk/lib/generated/idl/world.json";
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const coder = new anchor.BorshAccountsCoder(idl);
    try {
      const decoded = coder.decode("World", accountInfo.data);
      console.log("Decoded World:", JSON.stringify(decoded, null, 2));
    } catch (err) {
      console.error("Failed to decode with World IDL:", err);
    }
  } else {
    console.log("IDL not found at", idlPath);
  }
}

main().catch(console.error);
