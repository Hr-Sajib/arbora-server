FROM node:20-slim

# --- Install Chromium dependencies for Puppeteer ---
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# --- Copy dependency files ---
COPY package*.json tsconfig.json ./

# --- Install dependencies including devDependencies ---
RUN npm install

# --- Copy the rest of the application code ---
COPY . .

# --- Build the TypeScript project ---
RUN npm run build

# --- Prune devDependencies to reduce image size ---
RUN npm prune --production

# --- Expose port and start ---
EXPOSE 5100

CMD ["npm", "start"]
