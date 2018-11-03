FROM node:8-alpine

COPY . /var/src
WORKDIR /var/src

# install node dependencies
ENV NPM_CONFIG_LOGLEVEL warn

# npm packages need node-gyp, which requires gcc make and python
RUN apk add --no-cache make gcc g++ python && \
  npm install && \
  apk del make gcc g++ python

# Expose website on port
EXPOSE 8007

CMD ["npm", "start"]
