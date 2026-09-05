import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { getLanguageConfig, type LanguageConfig } from "./languages";

export type SandboxLimits = {
  timeoutMs: number;
  memoryMb: number;
  maxOutputBytes: number;
  maxPids?: number;
  cpus?: number;
};

export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit"
  | "memory_limit"
  | "compile_error"
  | "system_error";

export type SandboxInput = {
  language: LanguageConfig["slug"];
  sourceCode: string;
  stdin: string;
  limits: SandboxLimits;
};

export type SandboxResult = {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKb: number;
};

const DEFAULT_IMAGES: Record<LanguageConfig["slug"], string> = {
  cpp: "coders-arena/cpp:1",
  python: "coders-arena/python:1",
  java: "coders-arena/java:1",
  javascript: "coders-arena/javascript:1",
};
const MAX_TIMEOUT_MS = 10_000;
const MAX_MEMORY_MB = 512;
const MAX_OUTPUT_BYTES = 1_000_000;
const DEFAULT_PIDS = 64;
const DEFAULT_CPUS = 1;

function clampLimits(limits: SandboxLimits) {
  return {
    timeoutMs: Math.min(Math.max(limits.timeoutMs, 100), MAX_TIMEOUT_MS),
    memoryMb: Math.min(Math.max(limits.memoryMb, 32), MAX_MEMORY_MB),
    maxOutputBytes: Math.min(Math.max(limits.maxOutputBytes, 1_024), MAX_OUTPUT_BYTES),
    maxPids: Math.min(Math.max(limits.maxPids ?? DEFAULT_PIDS, 8), 128),
    cpus: Math.min(Math.max(limits.cpus ?? DEFAULT_CPUS, 0.25), 2),
  };
}

function limitText(value: string, maxBytes: number) {
  const bytes = Buffer.byteLength(value, "utf8");
  if (bytes <= maxBytes) return value;
  return `${Buffer.from(value, "utf8").subarray(0, maxBytes).toString("utf8")}\n[output truncated]`;
}

function runDocker(args: string[], timeoutMs: number, maxOutputBytes: number) {
  return new Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean; timeMs: number }>(
    (resolve, reject) => {
      const started = performance.now();
      const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;
      const containerName = args[args.indexOf("--name") + 1];

      const timer = setTimeout(() => {
        timedOut = true;
        if (containerName) {
          const killer = spawn("docker", ["rm", "-f", containerName], { stdio: "ignore" });
          killer.on("error", () => undefined);
        }
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        if (Buffer.byteLength(stdout, "utf8") < maxOutputBytes) stdout += chunk.toString("utf8");
      });
      child.stderr.on("data", (chunk: Buffer) => {
        if (Buffer.byteLength(stderr, "utf8") < maxOutputBytes) stderr += chunk.toString("utf8");
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve({ code, stdout: limitText(stdout, maxOutputBytes), stderr: limitText(stderr, maxOutputBytes), timedOut, timeMs: Math.round(performance.now() - started) });
        }
      });
    },
  );
}

/**
 * Executes C++ in a disposable, network-isolated container.
 *
 * This worker must run on a dedicated Linux judge host. The host should use
 * rootless Docker or an equivalent isolated runtime where possible. Never run
 * this executor on the Next.js host and never expose the Docker socket to the
 * browser or participant code.
 */
export async function executeInSandbox(input: SandboxInput): Promise<SandboxResult> {
  const config = getLanguageConfig(input.language);
  if (!config) {
    return { verdict: "system_error", stdout: "", stderr: "Unsupported language", timeMs: 0, memoryKb: 0 };
  }

  const limits = clampLimits(input.limits);
  const image = process.env[config.imageEnv] || DEFAULT_IMAGES[input.language];
  const workDir = await mkdtemp(join(tmpdir(), "coders-arena-"));
  const sourcePath = join(workDir, config.sourceFile);
  const inputPath = join(workDir, "stdin.txt");
  const containerName = `coders-arena-${randomUUID()}`;

  try {
    await writeFile(sourcePath, input.sourceCode, { encoding: "utf8", mode: 0o600 });
    await writeFile(inputPath, input.stdin, { encoding: "utf8", mode: 0o600 });
    await chmod(sourcePath, 0o600);
    await chmod(inputPath, 0o600);

    const commonArgs = [
      "run", "--rm", "--name", containerName,
      "--network", "none",
      "--read-only",
      "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges=true",
      "--security-opt", "seccomp=builtin",
      "--pids-limit", String(limits.maxPids),
      "--memory", `${limits.memoryMb}m`,
      "--memory-swap", `${limits.memoryMb}m`,
      "--cpus", String(limits.cpus),
      "--ulimit", "nofile=64:64",
      "--ulimit", "fsize=10485760:10485760",
      "--tmpfs", "/workspace:rw,nosuid,nodev,size=128m",
      "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=16m",
      "--mount", `type=bind,src=${sourcePath},dst=/input/${config.sourceFile},readonly`,
      "--mount", `type=bind,src=${inputPath},dst=/input/stdin.txt,readonly`,
      "--user", "10001:10001",
      image, "sh", "-lc", config.command,
    ];

    const result = await runDocker(commonArgs, limits.timeoutMs + 2_000, limits.maxOutputBytes);

    if (result.timedOut) {
      return { verdict: "time_limit", stdout: result.stdout, stderr: result.stderr, timeMs: limits.timeoutMs, memoryKb: 0 };
    }
    if (result.code === 125 && result.stdout.includes("__CA_COMPILE_ERROR__")) {
      return { verdict: "compile_error", stdout: result.stdout.replace("__CA_COMPILE_ERROR__\n", ""), stderr: result.stderr, timeMs: result.timeMs, memoryKb: 0 };
    }
    if (result.code === 125) {
      return { verdict: "system_error", stdout: result.stdout, stderr: result.stderr || "Docker could not start the sandbox", timeMs: result.timeMs, memoryKb: 0 };
    }
    if (result.code === 137) {
      return { verdict: "memory_limit", stdout: result.stdout, stderr: result.stderr, timeMs: result.timeMs, memoryKb: 0 };
    }
    if (result.code !== 0) {
      return { verdict: "runtime_error", stdout: result.stdout, stderr: result.stderr, timeMs: result.timeMs, memoryKb: 0 };
    }

    return { verdict: "accepted", stdout: result.stdout, stderr: result.stderr, timeMs: result.timeMs, memoryKb: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { verdict: "system_error", stdout: "", stderr: message, timeMs: 0, memoryKb: 0 };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
