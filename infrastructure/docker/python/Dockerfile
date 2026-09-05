FROM python:3.13-slim
RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin runner
WORKDIR /workspace
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER runner
CMD ["sh"]
