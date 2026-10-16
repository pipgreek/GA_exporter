# Single container: Next.js (public, $PORT) + NestJS backend (localhost:3001).
# Build context must be the repo root so llm/ is included.

FROM node:24-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN npm i -g pnpm@11.25.0 && pnpm install --frozen-lockfile
COPY backend/ ./
RUN rm -rf dist tsconfig.build.tsbuildinfo && pnpm run build && test -f dist/main.js
RUN pnpm prune --prod

FROM node:24-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin path handled by the rewrite in next.config.ts (inlined at build time).
ENV NEXT_PUBLIC_API_URL=/backend
RUN npm run build

FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

WORKDIR /app
# Layout mirrors the repo: backend/dist reads ../../llm/prompts.
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY backend/templates ./backend/templates
COPY llm ./llm
COPY --from=frontend-build /app/frontend/.next/standalone ./frontend
COPY --from=frontend-build /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend/public
COPY start.sh ./start.sh

ENV NODE_ENV=production \
    PORT=10000 \
    BACKEND_PORT=3001
EXPOSE 10000
CMD ["sh", "start.sh"]
