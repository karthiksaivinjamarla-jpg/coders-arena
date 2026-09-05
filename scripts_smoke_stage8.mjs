import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const root = new URL(".", import.meta.url).pathname;
const required = [
  "apps/judge-worker/src/languages.ts",
  "apps/judge-worker/src/executor.ts",
  "infrastructure/docker/cpp/Dockerfile",
  "infrastructure/docker/python/Dockerfile",
  "infrastructure/docker/java/Dockerfile",
  "infrastructure/docker/javascript/Dockerfile",
];
for (const file of required) assert.ok(existsSync(`${root}/${file}`), `missing ${file}`);
const executor = await readFile(`${root}/apps/judge-worker/src/executor.ts`, "utf8");
const index = await readFile(`${root}/apps/judge-worker/src/index.ts`, "utf8");
for (const flag of ["--network", "none", "--read-only", "--cap-drop", "ALL", "no-new-privileges=true", "--pids-limit", "--memory", "--cpus"]) {
  assert.ok(executor.includes(flag), `sandbox flag missing: ${flag}`);
}
for (const lang of ["cpp", "python", "java", "javascript"]) assert.ok(index.includes(lang), `worker language missing: ${lang}`);
console.log("Coders Arena Stage 8 structural smoke test passed.");
