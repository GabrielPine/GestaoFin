FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --prod
RUN npm install -g http-server

# ⬇️ ATENÇÃO AQUI
CMD ["http-server", "dist/frontend/browser"]
