import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadEnvironment } from "../src/env.mjs";

test("loadEnvironment reads an Interfaze key from an env file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "barbooks-env-"));
  const envPath = join(directory, ".env");
  await writeFile(envPath, "INTERFAZE_API_KEY=test-key\n");
  const target = {};

  loadEnvironment(envPath, target);

  assert.equal(target.INTERFAZE_API_KEY, "test-key");
});
