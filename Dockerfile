FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (node-pty, better-sqlite3)
RUN apk add --no-cache python3 make g++ linux-headers

# Install backend dependencies (skip postinstall which tries to cd into frontend)
COPY package.json package-lock.json ./
RUN npm pkg delete scripts.postinstall && npm ci

# Install frontend dependencies (use install, not ci — lock file may drift across node versions)
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install --ignore-scripts

# Copy source and build frontend
COPY frontend/ ./frontend/
RUN cd frontend && NODE_OPTIONS="--max-old-space-size=1024" npx vite build
COPY src/ ./src/

# --- Production stage ---
FROM node:22-alpine
WORKDIR /app

# Runtime dependencies: tmux (local session fallback), openssh-client (remote hosts)
RUN apk add --no-cache tmux openssh-client

# Copy built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/package.json ./
COPY src/ ./src/

# Create data directory for SQLite
RUN mkdir -p /app/data

# SSH config directory — copy at startup since mounted files have wrong ownership
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh

# Entrypoint that fixes SSH permissions then starts the app
COPY <<'ENTRYPOINT' /app/entrypoint.sh
#!/bin/sh
if [ -d /ssh-mount ]; then
  cp /ssh-mount/* /root/.ssh/ 2>/dev/null
  chmod 700 /root/.ssh
  chmod 600 /root/.ssh/config /root/.ssh/id_ed25519 2>/dev/null
  chmod 644 /root/.ssh/id_ed25519.pub 2>/dev/null
  chown -R root:root /root/.ssh
fi
exec node src/index.js
ENTRYPOINT
RUN chmod +x /app/entrypoint.sh

EXPOSE 7890
ENV NODE_ENV=production
CMD ["/app/entrypoint.sh"]
