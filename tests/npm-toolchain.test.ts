import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const manifest = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));

describe("reproducible npm toolchain", () => {
  it("declares an exact npm version and keeps root lock metadata in sync", () => {
    expect(manifest.packageManager).toMatch(/^npm@\d+\.\d+\.\d+$/);
    expect(manifest.packageManager).toBe(`npm@${manifest.engines.npm}`);
    expect(lock.packages[""].engines).toEqual(manifest.engines);
  });

  it.each(["registry-ci.yml", "deploy-cloudflare.yml"])("selects project npm before every clean install in %s", (file) => {
    const workflow = parse(read(`.github/workflows/${file}`));
    let checked = 0;
    for (const job of Object.values(workflow.jobs) as Array<{ steps: Array<{ run?: string }> }>) {
      const install = job.steps.findIndex((step) => step.run === "npm install --global $(node --print \"require('./package.json').packageManager\")");
      for (const [index, step] of job.steps.entries()) {
        if (step.run === "npm ci") {
          expect(install).toBeGreaterThanOrEqual(0);
          expect(install).toBeLessThan(index);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("keeps the sharp override resolved without reintroducing a second older copy", () => {
    expect(manifest.overrides.miniflare.sharp).toBe("0.35.5");
    const sharpPackages = Object.entries(lock.packages).filter(([key]) => /(^|\/)node_modules\/sharp$/.test(key));
    expect(sharpPackages).toHaveLength(1);
    expect(sharpPackages[0]![1]).toMatchObject({ version: manifest.overrides.miniflare.sharp });
  });
});
