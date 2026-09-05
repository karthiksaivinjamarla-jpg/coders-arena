FROM eclipse-temurin:21-jdk-jammy
RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin runner
WORKDIR /workspace
USER runner
CMD ["sh"]
