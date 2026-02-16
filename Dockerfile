# ────────────────────────────────────────────────────────────────
# DEVELOPMENT - hot reload / fast feedback
# ────────────────────────────────────────────────────────────────

FROM node:20-alpine

# Create app directory (this is INSIDE container — your files get copied/mounted here)
WORKDIR /frontend

# Enable pnpm via corepack (built-in since Node 16+)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only dependency files first → excellent layer caching
COPY package.json pnpm-lock.yaml ./

# Install deps (frozen = reproducible & fast)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Vite dev port
EXPOSE 5173

# Tell Vite to listen on all interfaces (required in Docker)
ENV HOST=0.0.0.0
ENV PORT=5173

# Start dev server
CMD ["pnpm", "dev", "--", "--host"]