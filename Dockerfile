## Multi-stage Dockerfile for TaskFlow
# - builder stage installs dependencies and builds TypeScript
# - runner stage copies only the built output and necessary files

FROM node:18-alpine AS builder
WORKDIR /app

# enable corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# copy package manifests and lockfile first for better caching
COPY package.json pnpm-lock.yaml ./

# install dependencies (including dev for building)
RUN pnpm install --frozen-lockfile

# copy the rest of the source and build
COPY . .
RUN pnpm run build

## production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# copy package manifests so `pnpm` can find peer deps if needed
COPY package.json pnpm-lock.yaml ./

# install only production deps (optional; we copy node_modules from builder below)
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod --frozen-lockfile

# copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD ["node", "dist/index.js"]
FROM node:18-alpine 

WORKDIR /app 

#Copy package file
COPY package.json pnpm-lock.yaml ./ 

#Install pnpm and dependencies 
RUN npm install -g pnpm && pnpm install 

#Copy source code 
COPY . .

#build the app 
RUN pnpm build 

#Expose port
EXPOSE 8000

#Start the app 
CMD ["pnpm", "start"]
