FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY yarn.lock ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run prisma:generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
