# Prodejní web: statika + /api/poptavka (Resend). Image staví GitHub Actions
# a publikuje do ghcr.io — lokálně se nic stavět nemusí.
FROM node:22-alpine AS sestaveni
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
LABEL org.opencontainers.image.source="https://github.com/bhaaddin/weby-prodej" \
      org.opencontainers.image.description="Prodejní web s poptávkou přes Resend"
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=sestaveni --chown=node:node /app/public ./public
COPY --from=sestaveni --chown=node:node /app/lib ./lib
COPY --from=sestaveni --chown=node:node /app/server.mjs /app/package.json ./
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/zdravi || exit 1
CMD ["node", "server.mjs"]
