const express = require("express");
const cors = require("cors");
const server = express();
const mysql = require("mysql2");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');

const corsOptions = {
  origin: "http://localhost:*",
};

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "catAPI",
});

connection.connect((error) => {
  if (error) throw error;
  console.log(`%c Database is connected`, +"color:green;");
});

server.use((req, res, next) => {
  console.log(`${req.method} - ${req.url},`);
  next();
});

server.use(cors(corsOptions));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static("landing"));

server.get("/", (req, res) => {
  res.redirect("index.html");
});

server.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", function (err, results) {
    if(err) console.error(err);
    res.json(results)
  });
});

server.post("/user", (req, res) => {
  const { email, password } = req.body;
  const hash = bcrypt.hashSync(password, 7)
  const id = uuidv4();
  connection.query("INSERT INTO users(uuid, email, password)"+"VALUES(?, ?, ?)",[id, email, hash], function (err, results) {
    if(err) res.json(err);
    res.json(email)
  });
});

server.patch('/user', (req, res) => {
    const { email, password, uuid } = req.body;
    const hash = bcrypt.hashSync(password, 7)
    console.log(hash)
    connection.query("UPDATE users SET email = ?, password = ? WHERE uuid = ?", [email, hash, uuid], function (err, results) {
        if(err) alert(err);
        res.json({message: 'User Updated', email: email})
    })
})

server.delete('/user', (req, res) => {
    const uuid = req.body.uuid
    connection.query('DELETE FROM users WHERE uuid = ?', [uuid], function (err, results) {
        if(err) console.error(err)
        if(results.affectedRows > 0) { res.json('User Deleted') }
        res.send('Not found')
    })
})

server.post('/login', (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    connection.query('SELECT * FROM users WHERE email = ?', [email], function (err, results) {
        if(results.length > 0){
            let user = results[0]
            if(bcrypt.compare(password, user.password)) {
                const accessToken = sign({
                    email: email, access: user.access
                }, 'secretcats');
                res.json(accessToken)
            }
        }
    })
})

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`%c Server listening on ${PORT}`, +"color:green;");
});
