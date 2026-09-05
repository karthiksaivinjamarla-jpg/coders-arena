# Coders Arena javascript judge image

Build this image locally before starting the judge worker:

`docker build -t coders-arena/javascript:1 infrastructure/docker/javascript`

The worker runs it with network disabled, read-only root filesystem, dropped Linux capabilities, no-new-privileges, PID/CPU/memory limits, and a non-root UID.
