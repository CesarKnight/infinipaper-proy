# ==========================================
# STAGE 1: Build the Application
# ==========================================
ARG NODE_VERSION=26.10.0-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for nesting build)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate the Prisma client (output: src/generated/prisma) before building.
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Generate the production JavaScript build inside the /dist directory
RUN npm run build

# ==========================================
# STAGE 2: Run the Production Application
# ==========================================
FROM node:${NODE_VERSION} AS production

# Set optimal Node environment for performance optimizations
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

# Install ONLY production dependencies to keep the image slim
RUN npm ci --omit=dev

# Copy the compiled JS files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Prisma schema + config so migrations can run at container start
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma7.config.ts ./prisma7.config.ts

# Use the pre-configured non-root 'node' user bundled in the alpine image for security
USER node

# Expose your application port (NestJS defaults to 3000)
EXPOSE 3000

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
