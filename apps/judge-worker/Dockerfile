FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --no-audit --no-fund
COPY src ./src
RUN npx tsc

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
USER node
CMD ["node","dist/index.js"]
