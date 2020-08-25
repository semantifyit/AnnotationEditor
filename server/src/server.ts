import dotenv from 'dotenv';
dotenv.config();

import app from './loaders/app';
import * as mongo from './loaders/mongo';
import config from './config';

mongo.connect().then(() => {
  app.listen(config.port);
  console.log(`App Started on port ${config.port}`);
});
