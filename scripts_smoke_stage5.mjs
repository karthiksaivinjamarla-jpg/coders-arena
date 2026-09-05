import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const required = [
  "apps/judge-worker/src/executor.ts",
  "apps/judge-worker/src/index.ts",
  "apps/judge-worker/src/queue.ts",
  "infrastructure/docker/cpp/Dockerfile",
  "infrastructure/docker/cpp/README.md",
  "docs/JUDGE-SANDBOX.md",
];
for (const file of required) {
  if (!existsSync(join(root, file))) throw new Error(`Missing ${file}`);
}

const executor = readFileSync(join(root, "apps/judge-worker/src/executor.ts"), "utf8");
for (const flag of ["--network", "none", "--read-only", "--cap-drop", "ALL", "no-new-privileges=true", "seccomp=builtin", "--pids-limit", "--memory", "--memory-swap", "--cpus", "--user", "10001:10001"]) {
  if (!executor.includes(flag)) throw new Error(`Sandbox hardening flag missing: ${flag}`);
}
if (!executor.includes("g++ -std=c++20 -O2 -pipe")) throw new Error("C++20 compile command missing");
if (!executor.includes("/workspace/main < /input/stdin.txt")) throw new Error("Runtime command missing");

const index = readFileSync(join(root, "apps/judge-worker/src/index.ts"), "utf8");
for (const token of ["submission_results", "wrong_answer", "compile_error", "time_limit", "memory_limit", "score"]) {
  if (!index.includes(token)) throw new Error(`Judge pipeline token missing: ${token}`);
}

console.log("Stage 5 smoke checks passed: files, C++ pipeline, verdict mapping, and sandbox flags are present.");
console.log("Runtime integration test: SKIPPED (Docker is not available in this build environment).");
