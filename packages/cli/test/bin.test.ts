import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bin = fileURLToPath(new URL("../dist/main.js", import.meta.url));
const fixtures = fileURLToPath(new URL("../../core/fixtures/", import.meta.url));

describe("built binary", () => {
  it("is built before the tests run", () => {
    expect(existsSync(bin), "run pnpm build before pnpm test").toBe(true);
  });

  it("prints the version and help", () => {
    expect(execFileSync("node", [bin, "--version"], { encoding: "utf8" }).trim()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(execFileSync("node", [bin, "--help"], { encoding: "utf8" })).toContain("check");
  });

  it("returns 0, 1 and 2 from a real process", () => {
    const dir = mkdtempSync(join(tmpdir(), "arc-porter-bin-"));
    writeFileSync(join(dir, "Good.sol"), readFileSync(join(fixtures, "AP001/good/OracleRaffle.sol")));
    expect(spawnSync("node", [bin, "check", "Good.sol"], { cwd: dir }).status).toBe(0);
    writeFileSync(join(dir, "Bad.sol"), readFileSync(join(fixtures, "AP001/bad/Raffle.sol")));
    const bad = spawnSync("node", [bin, "check", "Bad.sol", "--no-color"], { cwd: dir, encoding: "utf8" });
    expect(bad.status).toBe(1);
    expect(bad.stdout).toContain("AP001");
    writeFileSync(join(dir, "Broken.sol"), "contract {");
    expect(spawnSync("node", [bin, "check", "Broken.sol"], { cwd: dir }).status).toBe(2);
    expect(spawnSync("node", [bin, "check", "--format", "yaml"], { cwd: dir }).status).toBe(2);
    expect(spawnSync("node", [bin, "explain", "AP404"], { cwd: dir }).status).toBe(2);
  });
});
