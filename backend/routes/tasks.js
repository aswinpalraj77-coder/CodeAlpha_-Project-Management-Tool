const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/tasks/project/:projectId - get all tasks for a project
router.get("/project/:projectId", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember =
      project.owner.toString() === req.user._id.toString() ||
      project.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tasks - create task
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate, status, tags } = req.body;
    if (!title || !project) return res.status(400).json({ message: "Title and project are required" });

    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ message: "Project not found" });

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || [],
      createdBy: req.user._id,
      priority: priority || "medium",
      dueDate: dueDate || null,
      status: status || "todo",
      tags: tags || [],
    });

    await task.populate("assignedTo", "name email avatar");
    await task.populate("createdBy", "name email avatar");

    req.io.to(project).emit("task_created", task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/tasks/:id - update task
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    await task.populate("assignedTo", "name email avatar");
    await task.populate("createdBy", "name email avatar");

    req.io.to(task.project.toString()).emit("task_updated", task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const projectId = task.project.toString();
    await task.deleteOne();

    req.io.to(projectId).emit("task_deleted", req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
