# REZ ingest worker. Build from the repository root:
#   docker build -f worker/Dockerfile -t rez-worker .
# The Playwright image ships Chromium and its system libraries; its version must match the playwright npm package.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app
ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    REZ_RENDER_CONCURRENCY=1 \
    REZ_CRAWL_CONCURRENCY=2

COPY worker/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund

COPY src/lib ./src/lib
COPY worker/server.mts ./worker/server.mts

EXPOSE 10000
CMD ["npx", "tsx", "worker/server.mts"]
