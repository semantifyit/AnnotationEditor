FROM node:13-alpine AS builder

RUN apk update && apk upgrade && \
  apk add --no-cache bash git openssh make gcc g++ python

WORKDIR /usr/src/app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build

WORKDIR /usr/src/app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build


FROM node:13-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app/server
COPY --from=builder /usr/src/app/client/build ../client/build
COPY --from=builder /usr/src/app/server/node_modules ./node_modules
COPY --from=builder /usr/src/app/server/dist dist

USER node

EXPOSE 8012

CMD ["node", "./dist/server"]