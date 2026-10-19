FROM node:20.18.0-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

ENTRYPOINT ["node", "/app/dist/src/cli.js"]
CMD ["--help"]
