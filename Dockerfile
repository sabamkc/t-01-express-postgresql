FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY src ./src
COPY migrations ./migrations
COPY database.json.example ./database.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Run migrations and then start the server
CMD ["npm", "run", "start:prod"]
