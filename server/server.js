
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://my-portfolio-seven-pearl-dq7cqnix3h.vercel.app",
    ],
  })
);

app.use(express.json({ limit: "10kb" }));

// Home
app.get("/", (req, res) => {
  res.send("CodeFolio server is running!");
});

// Test backend
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "CodeFolio backend connected successfully!",
  });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const User = require("./models/User");
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    if (!/^[a-z0-9_-]{3,30}$/i.test(username)) {
      return res.status(400).json({
        message: "Username must be 3-30 characters.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: normalizedEmail },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message: "Username or email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: username.toLowerCase(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(error.code === 11000 ? 409 : 500).json({
      message:
        error.code === 11000
          ? "Username or email is already registered."
          : "Could not create account. Check server logs.",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const User = require("./models/User");
    const { email, password } = req.body;

    const user = await User.findOne({
      email: String(email || "").trim().toLowerCase(),
    });

    if (
      !user ||
      !(await bcrypt.compare(password || "", user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Could not log in.",
    });
  }
});

// Authentication middleware
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  try {
    if (!token) {
      throw new Error("Missing token");
    }

    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }
}

// Get logged-in user's profile
app.get("/api/me", authenticate, async (req, res) => {
  try {
    const User = require("./models/User");

    const user = await User.findById(req.auth.id)
      .select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Could not load profile.",
    });
  }
});

// Save portfolio
app.put("/api/me", authenticate, async (req, res) => {
  try {
    const User = require("./models/User");

    const allowed = [
      "name",
      "bio",
      "resumeUrl",
      "socialLinks",
      "projects",
      "skills",
      "templateId",
    ];

    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (
      updates.templateId &&
      !["minimalist", "cyberpunk"].includes(updates.templateId)
    ) {
      return res.status(400).json({
        message: "Invalid theme.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      message: "Portfolio saved successfully.",
      user,
    });
  } catch (error) {
    console.error("Save error:", error.message);

    return res.status(400).json({
      message: "Could not save portfolio.",
    });
  }
});

// Public portfolio (email and password hash stay private)
app.get("/api/users/:username", async (req, res) => {
  try {
    const User = require("./models/User");

    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("-passwordHash -email");

    if (!user) {
      return res.status(404).json({
        message: "Portfolio not found.",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error("Public portfolio error:", error.message);

    return res.status(500).json({
      message: "Could not load portfolio.",
    });
  }
});

// Nodemailer transporter
function createMailTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail environment variables are not configured.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
    },
  });
}

// Contact form: send message to portfolio owner
app.post("/api/users/:username/contact", async (req, res) => {
  try {
    const User = require("./models/User");
    const { name, email, message } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim() ||
      name.length > 100 ||
      email.length > 254 ||
      message.length > 3000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email, and message.",
      });
    }

    const username = req.params.username.toLowerCase();

    const owner = await User.findOne({ username }).select(
      "name email username"
    );

    if (!owner || !owner.email) {
      return res.status(404).json({
        message: "Portfolio owner not found.",
      });
    }

    const transporter = createMailTransporter();

    await transporter.sendMail({
      from: `"CodeFolio Contact" <${process.env.GMAIL_USER}>`,
      to: owner.email,
      replyTo: email.trim(),
      subject: `New CodeFolio message for ${owner.name}`,
      text: [
        `Portfolio owner: ${owner.name}`,
        `Portfolio username: ${owner.username}`,
        `Sender name: ${name.trim()}`,
        `Sender email: ${email.trim()}`,
        "",
        "Message:",
        message.trim(),
      ].join("\n"),
    });

    return res.json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact email error:", error.message);

    return res.status(500).json({
      message: "Unable to send your message right now.",
    });
  }
});

// Start server only after MongoDB connects
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error(
    "Missing MONGODB_URI or JWT_SECRET in environment."
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`CodeFolio server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
