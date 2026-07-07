# Build stage
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package.json and package-lock.json first for better cache on npm ci
COPY package*.json ./

# Install build dependencies for native modules (e.g. gifsicle)
RUN apk add --no-cache python3 make g++ autoconf automake libtool pkgconfig nasm zlib-dev

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
