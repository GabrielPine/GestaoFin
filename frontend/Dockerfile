FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --prod
RUN npm install -g http-server


CMD ["http-server", "dist/frontend/browser", "-p", "8080", "--fallback", "index.html"]
