const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["active", "completed", "on-hold"],
      default: "active",
    },
    color: { type: String, default: "#6366f1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
