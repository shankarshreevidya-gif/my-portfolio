
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    techStack: { type: [String], default: [] },
    repoLink: { type: String, default: "" },
    liveLink: { type: String, default: "" },
    screenshot: { type: String, default: "" }
  },
  { _id: true }
);

const skillSchema = new mongoose.Schema(
  {
    category: { type: String, default: "" },
    items: { type: [String], default: [] }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    bio: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" }
    },
    projects: {
      type: [projectSchema],
      default: []
    },
    skills: {
      type: [skillSchema],
      default: []
    },
    templateId: {
      type: String,
      enum: ["minimalist", "cyberpunk"],
      default: "minimalist"
    },
    isPro: { type: Boolean, default: false },
    customDomain: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
