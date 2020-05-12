import express from 'express';
import morgan from 'morgan';
import parser from 'body-parser';
import path from 'path';

import vocabRouter from '../routes/vocab';
import webAPIRouter from '../routes/webApi';
import actionRouter from '../routes/action';
import mappingRouter from '../routes/mapping';
import rdfRouter from '../routes/rdf';

const app = express();

app.use(parser.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.use('/api/vocab', vocabRouter);
app.use('/api/webApi', webAPIRouter);
app.use('/api/action', actionRouter);
app.use('/api/mapping', mappingRouter);
app.use('/api/rdf', rdfRouter);

// serve react app in production mode
if (process.env.NODE_ENV === 'production') {
  console.log('Starting in production');
  app.use(express.static(path.join(__dirname, '../../../client/build')));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/build/index.html'));
  });
}

export default app;
