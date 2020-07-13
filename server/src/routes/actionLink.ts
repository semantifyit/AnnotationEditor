import express from 'express';
import ActionLinks from '../models/ActionLink';

const router = express.Router();

router.get('/', async (req, res) => {
  const results = await ActionLinks.find({}).lean();
  res.json(results);
});

router.get('/:id', async (req, res) => {
  try {
    const result = await ActionLinks.findById(req.params.id).lean();
    if (!result) {
      res.status(404).json({ err: `ActionLink with id ${req.params.id} not found` });
      return;
    }
    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await ActionLinks.create(req.body);

    if (!result) {
      res.status(404).json({ err: 'error creating document' });
      return;
    }

    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const oldResult = await ActionLinks.findById(req.params.id);

    if (!oldResult) {
      res.status(404).json({ err: `ActionLink with id ${req.params.id} not found` });
      return;
    }

    const newResult = await ActionLinks.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean();

    res.json(newResult);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await ActionLinks.findByIdAndDelete(req.params.id).lean();

    if (!result) {
      res.status(404).json({ err: `ActionLink with id ${req.params.id} not found` });
      return;
    }

    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

export default router;
