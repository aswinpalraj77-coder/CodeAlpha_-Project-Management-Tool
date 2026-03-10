const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/projects - get all projects for current user
router.get("/", protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/projects - create a project
router.post("/", protect, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required" });

    const project = await Project.create({
      name,
      description,
      color: color || "#6366f1",
      owner: req.user._id,
      members: [req.user._id],
    });
    await project.populate("owner", "name email avatar");
    await project.populate("members", "name email avatar");

    req.io.emit("project_created", project);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/projects/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember =
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/projects/:id - update project
router.put("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only project owner can update" });

    const { name, description, status, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;

    await project.save();
    await project.populate("owner", "name email avatar");
    await project.populate("members", "name email avatar");

    req.io.to(req.params.id).emit("project_updated", project);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only project owner can delete" });

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    req.io.emit("project_deleted", req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/projects/:id/members - add member
router.post("/:id/members", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only owner can add members" });

    const { userId } = req.body;
    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    if (project.members.includes(userId))
      return res.status(400).json({ message: "User already a member" });

    project.members.push(userId);
    await project.save();
    await project.populate("owner", "name email avatar");
    await project.populate("members", "name email avatar");

    req.io.to(req.params.id).emit("member_added", project);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member
router.delete("/:id/members/:userId", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only owner can remove members" });

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await project.populate("owner", "name email avatar");
    await project.populate("members", "name email avatar");

    req.io.to(req.params.id).emit("member_removed", project);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
