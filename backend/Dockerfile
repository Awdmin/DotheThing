FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
# .env is loaded at runtime via docker-compose env_file, not baked in
EXPOSE 3003
CMD ["node", "src/index.js"]
