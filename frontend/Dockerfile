FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Remove any npmrc that might interfere
RUN rm -f .npmrc

# Build the application  
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]