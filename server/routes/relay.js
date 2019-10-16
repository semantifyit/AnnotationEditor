const express = require('express');
const path = require('path');
const axios = require('axios');

const router = express.Router();

router.post('/relay', async (req, res) => {  
  try {
    const {data, status, statusText, headers} = await axios(req.body);
    res.json({
        data,
        status,
        statusText,
        headers,
    });
  } catch (e) {
    res.status(400).json({ err: `Error calling API: ${e}` });
  }
});

module.exports = router;
