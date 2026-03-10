const express = require("express");
const Comment = require("../models/Comment");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/comments/task/:taskId
router.get("/task/:taskId", protect, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/comments
router.post("/", protect, async (req, res) => {
  try {
    const { text, taskId } = req.body;
    if (!text || !taskId) return res.status(400).json({ message: "Text and taskId are required" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const comment = await Comment.create({
      text,
      author: req.user._id,
      task: taskId,
    });
    await comment.populate("author", "name email avatar");

    req.io.to(task.project.toString()).emit("comment_added", {
      taskId,
      comment,
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/comments/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
