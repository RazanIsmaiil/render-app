import express from "express";
import mysql from "mysql";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




dotenv.config();

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
});



db.connect((err) => {
  if (err) console.log("DB Error");
  else console.log("DB Connected");
});


app.get("/events", (req, res) => {
  db.query("SELECT * FROM events", (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
});
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});



app.get("/events/:id", (req, res) => {
  const q = "SELECT * FROM events WHERE id = ?";
  db.query(q, [req.params.id], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).send("Event not found");
    res.status(200).json(data[0]);
  });
});


app.post("/events", (req, res) => {
  const { title, description, date, location } = req.body;
  if (!title || !description || !date || !location)
    return res.status(400).send("All fields required");

  const q =
    "INSERT INTO events (title, description, date, location) VALUES (?, ?, ?, ?)";
  db.query(q, [title, description, date, location], (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(201).json(data);
  });
});


app.put("/events/:id", (req, res) => {
  const { title, description, date, location } = req.body;
  const q =
    "UPDATE events SET title=?, description=?, date=?, location=? WHERE id=?";
  db.query(
    q,
    [title, description, date, location, req.params.id],
    (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.affectedRows === 0) return res.status(404).send("Event not found");
      res.status(200).send("Event updated successfully");
    }
  );
});


app.delete("/events/:id", (req, res) => {
  const q = "DELETE FROM events WHERE id=?";
  db.query(q, [req.params.id], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.affectedRows === 0) return res.status(404).send("Event not found");
    res.status(200).send("Event deleted successfully");
  });
});

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).send("All fields are required");

  const hashedPassword = bcrypt.hashSync(password, 10);

  const q =
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

  db.query(q, [name, email, hashedPassword], (err) => {
    if (err) {
      if (err.errno === 1062)
        return res.status(400).send("Email already exists");
      return res.status(500).json(err);
    }
    res.status(201).send("User registered successfully");
  });
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).send("All fields are required");

  const q = "SELECT * FROM users WHERE email = ?";

  db.query(q, [email], (err, data) => {
    if (err) return res.status(500).json(err);

    if (data.length === 0)
      return res.status(404).send("User not found");

    const isMatch = bcrypt.compareSync(password, data[0].password);

    if (!isMatch)
      return res.status(401).send("Invalid password");

    res.status(200).json({
      id: data[0].id,
      name: data[0].name,
      email: data[0].email,
    });
  });
});

