const express = require('express');
const parser = require('body-parser');
const config = require('config');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const vocabRouter = require('./routes/vocabs');
const downloadRouter = require('./routes/downloads');
const relayRouter = require('./routes/relay');

const app = express();
app.use(parser.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  res.setHeader('backend', 'annotation-editor');
  return next();
});

app.use('/annotation/api', vocabRouter);
app.use('/annotation/api', downloadRouter);
app.use('/annotation/api', relayRouter);

// server app route
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'default') {
  console.log('Use build');
  app.use(
    '/annotation',
    express.static(path.join(__dirname, '..', 'client', 'build')),
  );
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

const port = config.get('port');
app.listen(port);
console.log(`Server started on port ${port}`);
console.log(`Started in mode: ${process.env.NODE_ENV || 'default'}`);
