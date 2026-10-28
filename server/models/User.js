
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("CodeFolio server is running!");
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "CodeFolio backend connected successfully!"
  });
});

// Register a new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({
        message: "Username, name, email and password are required."
      });
    }

    if (!/^[a-z0-9_-]{3,30}$/i.test(username)) {
      return res.status(400).json({
        message: "Username must be 3-30 characters using letters, numbers, _ or -."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existing) {
      return res.status(409).json({
        message: "Username or email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: username.toLowerCase(),
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        username: user.username,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email is already registered."
      });
    }
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Could not create account." });
  }
});

// Log in
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: String(email || "").toLowerCase()
    });

    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        username: user.username,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Could not log in." });
  }
});

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  try {
    if (!token) throw new Error("Missing token");
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Please log in again." });
  }
}

// Get the logged-in user's dashboard data
app.get("/api/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.auth.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: "Could not load profile." });
  }
});

// Update the logged-in user's profile and portfolio
app.put("/api/me", authenticate, async (req, res) => {
  try {
    const allowed = [
      "name", "bio", "resumeUrl", "socialLinks",
      "projects", "skills", "templateId"
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.templateId &&
        !["minimalist", "cyberpunk"].includes(updates.templateId)) {
      return res.status(400).json({ message: "Invalid template." });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Portfolio saved successfully.", user });
  } catch (error) {
    console.error("Profile update error:", error.message);
    res.status(400).json({ message: "Could not save portfolio data." });
  }
});

// Public portfolio by username
app.get("/api/users/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase()
    }).select("-passwordHash -email");

    if (!user) {
      return res.status(404).json({ message: "Portfolio not found." });
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: "Could not load portfolio." });
  }
});

// Start only after required configuration and MongoDB are ready
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET environment variable.");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    app.listen(PORT, () => {
      console.log(`CodeFolio server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
