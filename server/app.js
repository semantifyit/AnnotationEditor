const express = require("express");
const parser = require("body-parser");
const config = require("config");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(parser.json());
app.use(morgan("dev"));

// vocab routes
app.get("/annotation/api/vocabs/:vocabName", (req, res) => {
  const { vocabName } = req.params;
  try {
    const vocab = fs.readFileSync(
      path.join(__dirname, "vocabs", `${vocabName}.jsonld`),
      "utf8"
    );
    res.json(JSON.parse(vocab));
  } catch (e) {
    res.status(404).json({ err: `No such vocabulary available: ${vocabName}` });
  }
});

// server app route
if (process.env.NODE_ENV && process.env.NODE_ENV !== "default") {
  console.log("Use build");
  app.use('/annotation', express.static(path.join(__dirname, "..", "client", "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
  });
}

const port = config.get("port");
app.listen(port);
console.log(`Server started on port ${port}`);
console.log(`Started in mode: ${process.env.NODE_ENV || "default"}`);
