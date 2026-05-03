import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function cloneAndInit(repoUrl: string): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `af-${Date.now()}`);
  console.log(`\n📥 Cloning ${repoUrl}...`);
  try {
    execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, { stdio: "inherit" });
    console.log(`   ✅ Cloned to ${tmpDir}\n`);
    return tmpDir;
  } catch (e) {
    console.error(`❌ Clone failed: ${(e as Error).message}`);
    process.exit(1);
  }
}

export function isLargeRepo(rootDir: string, threshold: number = 1000): boolean {
  try {
    const count = parseInt(execSync(`find ${rootDir} -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l`, { encoding: "utf-8" }).trim());
    return count > threshold;
  } catch {
    return false;
  }
}
