# Stage 1: Build React
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copy only package files first
COPY package*.json ./

# 2. Install dependencies (this layer is cached if package.json doesn't change)
RUN npm install

# 3. Copy the rest of the code and build
COPY . .
RUN npm run build

# Stage 2: Production (Nginx)
FROM nginx:stable-alpine
# Update 'build' to 'dist' below if you are using Vite
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]