# Coders Arena C++ judge image

Build on the **dedicated Linux judge host**:

```bash
docker build -t coders-arena/cpp:1 infrastructure/docker/cpp
```

The Stage 5 worker launches each submission with:

- `--network none`
- read-only root filesystem
- writable disposable tmpfs workspace
- `--cap-drop ALL`
- `no-new-privileges`
- Docker's default seccomp profile
- CPU, memory, PID, file-size and open-file limits
- non-root UID 10001
- disposable container and temporary source/input mounts

Do not mount the Docker socket into the Next.js web application. The worker
and Docker runtime belong on an isolated judge host. Rootless Docker is a
preferred additional defense where the workload and host support it.
