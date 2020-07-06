import express from 'express';

import config from '../config';

const router = express.Router();

export interface Config {
  baseUrl: string;
  version: string;
}

router.get('/', (req, res) => {
  res.json({
    baseUrl: config.baseUrl,
    version: config.version,
  });
});

export default router;
