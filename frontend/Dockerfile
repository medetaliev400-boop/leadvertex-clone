FROM node:18-alpine

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

# Copy built files to volume mount point
RUN cp -r /app/build/* /app/build/ 2>/dev/null || true

# Expose port (for completeness)
EXPOSE 80

# Keep container running to serve as volume source
CMD ["tail", "-f", "/dev/null"]