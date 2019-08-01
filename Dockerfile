FROM node:8-alpine

# install node dependencies
ENV NPM_CONFIG_LOGLEVEL warn

# this speeds up building time if you don't change the package.json
COPY ./package*.json /var/src/
COPY ./client/package*.json /var/src/client/
COPY ./api-mapping/package*.json /var/src/api-mapping/

WORKDIR /var/src

# npm packages need node-gyp, which requires gcc make and python
RUN apk add --no-cache git make gcc g++ python && \
  npm install && \
  apk del git make gcc g++ python

COPY . /var/src

# Expose website on port
EXPOSE 8007

CMD ["npm", "start"]
