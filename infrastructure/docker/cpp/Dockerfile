FROM gcc:14-bookworm

RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin runner
WORKDIR /workspace

# Keep the runtime image small in privileges: the judge passes --cap-drop=ALL,
# --network=none, --read-only, --pids-limit, --memory and no-new-privileges.
USER runner

CMD ["sh"]
