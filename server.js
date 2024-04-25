const { createServer } = require("http");
const { appendFile } = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

const NewsLetter = new EventEmitter();

const server = createServer((req, res) => {
  const chunks = [];
  const { url, method } = req;

  req.on("error", (err) => {
    console.log(err);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ msg: "invalid request" }));
    res.end();
  });

  res.on("error", (err) => {
    console.log(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ msg: "Server error" }));
    res.end();
  });

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });
  req.on("end", () => {
    if (url === "/newsletter_signup" && method === "POST") {
      const body = JSON.parse(Buffer.concat(chunks).toString());

      const newContact = `${body.name}, ${body.email}\n`;

      NewsLetter.emit("signup", newContact, res);

      res.setHeader("Content-Type", "application/json");
      res.write(
        JSON.stringify({ msg: "Successfully signed up to newsletter" })
      );
      res.end();
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify({ msg: "not a valid endpoint" }));
      res.end();
    }
  });
});

server.listen(3000, () => console.log("Server is Listening..."));

NewsLetter.on("signup", (newContact, res) => {
  appendFile(path.join(__dirname, "/newsletter.csv"), newContact, (err) => {
    if (err) {
      NewsLetter.emit("error", err, res);
      return;
    }
    console.log("the file was updated successfully!");
  });
});

NewsLetter.on("error", (err, res) => {
  console.log(err);
  res.statusCode = 500;
  res.setHeader("Content-Type", "application/json");
  res.write(JSON.stringify({ msg: "ERROR adding new contact to news letter" }));
  res.end();
});
