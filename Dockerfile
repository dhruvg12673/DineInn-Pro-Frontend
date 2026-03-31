# Stage 1: Build React
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copy package files from the subfolder
COPY package*.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy everything from the frontend folder to the /app directory
# We use '.' because Jenkins is already inside the repository
COPY . .

# 4. Verify files exist before building (Helpful for debugging)
RUN ls -la && ls -la public

# 5. Run the build
RUN npm run build

# Stage 2: Production (Nginx)
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]