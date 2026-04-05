# Stage 1: Build & Compilation
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Installation des dépendances (y compris dev pour le build)
RUN npm install

# Copie du code source
COPY . .

# Génération du client Prisma et build du projet
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Node Runner
FROM node:20-alpine

WORKDIR /app

# Dépendances système pour Node-Forge et PDFKit (si nécessaire)
RUN apk add --no-cache openssl

# Copie des dépendances de production uniquement
COPY package*.json ./
RUN npm install --omit=dev

# Copie depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5005

# Exposition du port
EXPOSE 5005

# Commande de démarrage (npx prisma migrate deploy au run)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
