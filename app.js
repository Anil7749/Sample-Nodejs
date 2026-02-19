const express = require("express");
const app = express();

const PORT = 3000;

// View engine
app.set("view engine", "ejs");

// Static files
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/about", (req, res) => res.render("about"));
app.get("/projects", (req, res) => res.render("projects"));
app.get("/contact", (req, res) => res.render("contact"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Healthy 🚀" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
