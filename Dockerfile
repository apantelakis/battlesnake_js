FROM node:20

ENV NODE_ENV=production

WORKDIR /app

COPY . .
RUN npm install --production --legacy-peer-deps

CMD [ "node", "index.js" ]
