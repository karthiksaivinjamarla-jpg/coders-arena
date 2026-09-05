# Coders Arena python judge image

Build this image locally before starting the judge worker:

`docker build -t coders-arena/python:1 infrastructure/docker/python`

The worker runs it with network disabled, read-only root filesystem, dropped Linux capabilities, no-new-privileges, PID/CPU/memory limits, and a non-root UID.
