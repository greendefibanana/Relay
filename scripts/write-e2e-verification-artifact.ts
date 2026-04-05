import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { runEndToEndFlow } from "../clients/rfq-protocol.js";

dotenv.config();

function optionalEnv(name: string): string | null {
  return process.env[name] ?? null;
}

function safeGitCommand(args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function sanitizedTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function resolveArtifactPath(date: Date): string {
  const configured = optionalEnv("VERIFICATION_ARTIFACT_PATH");
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }

  const relayEnvironment = optionalEnv("RELAY_ENVIRONMENT") ?? "devnet";
  return path.join(
    process.cwd(),
    "artifacts",
    `${relayEnvironment}-e2e-${sanitizedTimestamp(date)}.json`,
  );
}

async function main(): Promise<void> {
  const startedAt = new Date();
  const result = await runEndToEndFlow();
  const artifactPath = resolveArtifactPath(startedAt);

  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });

  const artifact = {
    artifactVersion: 1,
    generatedAt: startedAt.toISOString(),
    git: {
      commitSha: safeGitCommand(["rev-parse", "HEAD"]),
      describe: safeGitCommand(["describe", "--always", "--dirty"]),
    },
    environment: {
      relayEnvironment: optionalEnv("RELAY_ENVIRONMENT") ?? "devnet",
      solanaRpcUrl: optionalEnv("SOLANA_RPC_URL"),
      teeRpcUrl: optionalEnv("TEE_RPC_URL"),
      verificationArtifactPath: artifactPath,
    },
    result,
  };

  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({ artifactPath, artifact }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
