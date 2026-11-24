# Report/email worker: Node + headless Chrome (Playwright) for PDF rendering.
# Build from the repository root: docker build -f apps/worker/Dockerfile -t homefi-worker .
FROM mcr.microsoft.com/playwright:v1.65.1-noble
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter worker...
WORKDIR /app/apps/worker
RUN npx playwright install chromium
ENV NODE_ENV=production
CMD ["pnpm", "start"]
