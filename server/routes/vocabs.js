const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/vocabs/:vocabName', (req, res) => {
  const { vocabName } = req.params;
  try {
    const vocab = fs.readFileSync(
      path.join(__dirname, '..', 'vocabs', `${vocabName}.jsonld`),
      'utf8',
    );
    res.json(JSON.parse(vocab));
  } catch (e) {
    res.status(404).json({ err: `No such vocabulary available: ${vocabName}` });
  }
});

module.exports = router;
