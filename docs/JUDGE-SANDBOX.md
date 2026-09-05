# Stage 5 — Secure C++ Judge Sandbox

Stage 5 turns the Stage 4 worker stub into a real C++ judging path.

## Trust boundary

Participant source is **untrusted input**. It must never execute inside the
Next.js process, the Redis service, or the normal application container.
The judge worker should run on a dedicated Linux host with a container runtime.

## Isolation used by the worker

Each test case gets a fresh disposable container with:

- no network (`--network none`)
- read-only root filesystem
- disposable writable tmpfs workspace
- non-root UID 10001
- all Linux capabilities dropped
- `no-new-privileges`
- Docker's built-in seccomp profile
- CPU limit
- memory limit
- PID limit
- open-file and file-size limits
- source and test input mounted read-only
- host temporary files removed after the run

Docker documents seccomp as a mechanism for restricting container syscalls and
recommends keeping the default profile rather than disabling it. It also
supports rootless mode, which runs both the daemon and containers without root
privileges. See the Docker security documentation before production rollout.

## Why this is not the web server

The worker requires access to a container runtime. That privilege must stay on
the dedicated judge host. Do **not** expose a Docker socket to participant code
or to the browser-facing application.

For higher-risk multi-tenant deployments, consider an additional sandbox such
as gVisor. It is designed to provide defense-in-depth isolation for untrusted
code, but it still needs careful host configuration and testing.

## Stage 5 scope

Currently supported:

- C++20
- compile + run
- accepted / wrong answer
- compile error
- runtime error
- time limit
- memory limit
- system error
- per-test-case result persistence
- score accumulation

Not yet implemented:

- Python / Java / JavaScript execution
- parallel workers
- advanced memory telemetry
- interactive problems
- special judges
- custom checkers
- plagiarism detection

Those belong to later stages.
