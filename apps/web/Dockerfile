# ── Build stage ──────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci

COPY apps/web/ .

RUN npm run build

# ── Run stage ────────────────────────────────────────────────
FROM node:22-slim

# Create non-root user
RUN useradd --create-home --shell /bin/bash spice

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Switch to non-root user
USER spice

EXPOSE 3737

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3737').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

CMD ["npm", "start", "--", "--port", "3737"]
