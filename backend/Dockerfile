FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache bash

# Install dependencies first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["./start.sh"]
