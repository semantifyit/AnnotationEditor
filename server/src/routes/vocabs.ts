import express from 'express';

import Vocab from '../models/Vocab';
import { parseVocab } from '../util/vocab';

const router = express.Router();

const withTryCatch = async (
  res: express.Response,
  fn: () => Promise<void>,
): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    res.status(400).json({ err: e.toString() });
  }
};

router.get('/', (req, res) => {
  withTryCatch(res, async () => {
    const vocabs = await Vocab.find({});
    res.json(vocabs);
  });
});

router.get('/:id', (req, res) => {
  withTryCatch(res, async () => {
    const vocab = await Vocab.findById(req.params.id);
    if (!vocab) {
      res.status(404).json({ err: `Vocab with id ${req.params.id} not found` });
      return;
    }
    res.json(vocab);
  });
});

router.post('/', (req, res) => {
  withTryCatch(res, async () => {
    if (req.body.ogVocab && !req.body.vocab) {
      req.body.vocab = JSON.stringify(await parseVocab(req.body.ogVocab));
    }

    const result = await Vocab.create(req.body);

    if (!result) {
      res.status(404).json({ err: 'error creating document' });
      return;
    }
    res.json(result);
  });
});

router.patch('/:id', (req, res) => {
  withTryCatch(res, async () => {
    if (req.body.ogVocab && !req.body.vocab) {
      req.body.vocab = JSON.stringify(await parseVocab(req.body.ogVocab));
    }

    const result = await Vocab.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!result) {
      res.status(404).json({ err: 'error updating document' });
      return;
    }
    res.json(result);
  });
});

router.delete('/:id', (req, res) => {
  withTryCatch(res, async () => {
    const vocab = await Vocab.findByIdAndDelete(req.params.id);
    if (!vocab) {
      res.status(404).json({ err: `Vocab with id ${req.params.id} not found` });
      return;
    }
    res.json(vocab);
  });
});

router.post('/parse', (req, res) => {
  withTryCatch(res, async () => {
    const vocab = await parseVocab(req.body.vocab);

    res.json(vocab);
  });
});

export default router;
