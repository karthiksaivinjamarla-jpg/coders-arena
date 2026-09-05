import assert from "node:assert/strict";
import { LANGUAGE_CONFIGS } from "./languages.ts";

for (const slug of ["cpp", "python", "java", "javascript"]) {
  const config = LANGUAGE_CONFIGS[slug];
  assert.ok(config, `${slug} config missing`);
  assert.ok(config.imageEnv);
  assert.ok(config.defaultImage);
  assert.ok(config.sourceFile);
  assert.ok(config.command);
}
assert.equal(LANGUAGE_CONFIGS.java.sourceFile, "Main.java");
assert.equal(LANGUAGE_CONFIGS.python.sourceFile, "main.py");
assert.equal(LANGUAGE_CONFIGS.javascript.sourceFile, "main.js");
console.log("Stage 8 language configuration smoke test passed.");
