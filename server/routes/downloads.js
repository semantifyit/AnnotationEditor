const express = require('express');
const archiver = require('archiver');
const path = require("path");

const router = express.Router();

// http://localhost:8007/annotation/api/downloadWebAPIProjectZip
router.post('/downloadWebAPIProjectZip', (req, res) => {
  // TODO extract mappings & annotations, create mappings.json
  // const data = req.body;
  // console.log(data);

  const archive = archiver('zip');
  archive.on('error', (err) => {
    res.status(500).send({error: err.message});
  });
  archive.on('end', () => {
    console.log('Archive wrote %d bytes', archive.pointer());
  });
  archive.on('close', () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });
  archive.on('warning', function(err) {
    console.log(err);
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err;
    }
  });
  archive.pipe(res);
  res.attachment('action-server-nodejs.zip');

  console.log(path.join(__dirname, '..', '..', 'action-server'));

  archive.directory(path.join(__dirname, '..', '..', 'action-server'), 'action-server');
  // archive.directory(path.join(__dirname, '..', '..', 'api-mapping'), 'action-server/api-mapping');

  archive.glob('**/*', {
    cwd: path.join(__dirname, '..', '..', 'api-mapping'),
    ignore: ['dist/**.d.ts', 'tests/**', 'src/**', 'tslint.json', 'tsconfig.json', 'package-lock.json'],
  }, { prefix: 'action-server/api-mapping'});

  console.log('end');
  archive.finalize();
});

module.exports = router;

