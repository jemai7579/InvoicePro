# Stage 1: Build compilation
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments de build (Vite a besoin de ces variables au moment du build)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .

# Build final pour production
RUN npm run build

# Stage 2: Serveur de production Nginx
FROM nginx:stable-alpine

# Copie des fichiers statiques générés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie de la configuration Nginx optimisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition du port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
