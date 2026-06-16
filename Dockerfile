# Production image for Dainty Goals (used by Fly.io and any container host).
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Build tools so better-sqlite3 can compile if a prebuilt binary isn't used.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm install && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    DB_PATH=/data/dainty.db
COPY --from=build /app /app
EXPOSE 4000
CMD ["npm", "start"]
