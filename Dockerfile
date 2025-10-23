# Use Node.js 18 LTS Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with production flags
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Create logs directory
RUN mkdir -p logs

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]