import express from 'express';
import morgan from 'morgan';
import parser from 'body-parser';
import path from 'path';

import vocabRouter from '../routes/vocabs';
import webAPIRouter from '../routes/webApi';
import actionHandlerRouter from '../routes/actionHandler';
import mappingRouter from '../routes/mapping';

const app = express();

app.use(parser.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.use('/api/vocab', vocabRouter);
app.use('/api/webApi', webAPIRouter);
app.use('/api/action', actionHandlerRouter);
app.use('/api/mapping', mappingRouter);

// serve react app in production mode
if (process.env.NODE_ENV === 'production') {
  console.log('Starting in production');
  app.use(express.static(path.join(__dirname, '../../../client/build')));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/build/index.html'));
  });
}

export default app;
