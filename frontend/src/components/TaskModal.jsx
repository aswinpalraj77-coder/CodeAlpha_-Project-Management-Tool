import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { format, isPast } from "date-fns";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["todo", "inprogress", "review", "done"];

export default function TaskModal({ task, project, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState({ ...task });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/task/${task._id}`);
      setComments(data);
    } catch {
      /* silent */
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, {
        title: editing.title,
        description: editing.description,
        status: editing.status,
        priority: editing.priority,
        dueDate: editing.dueDate,
        assignedTo: editing.assignedTo?.map((u) => u._id || u),
      });
      onUpdate(data);
      toast.success("Task updated!");
      onClose();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDelete(task._id);
      toast.success("Task deleted");
      onClose();
    } catch {
      toast.error("Delete failed");
    }
  };

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const { data } = await api.post("/comments", { text: newComment, taskId: task._id });
      setComments([...comments, data]);
      setNewComment("");
    } catch {
      toast.error("Failed to send comment");
    } finally {
      setSendingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch {
      toast.error("Could not delete comment");
    }
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const isDuePast = editing.dueDate && isPast(new Date(editing.dueDate));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task Details</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Add a description..."
            />
          </div>

          {/* Status + Priority */}
          <div className="task-detail-grid">
            <div className="form-group">
              <label>Status</label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={editing.priority}
                onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label>Due Date {isDuePast && <span className="due-warning">⚠ Overdue!</span>}</label>
            <input
              type="date"
              value={editing.dueDate ? editing.dueDate.split("T")[0] : ""}
              onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
            />
          </div>

          {/* Assignees */}
          <div className="detail-section">
            <h4>Assigned To</h4>
            <div className="members-row">
              {editing.assignedTo?.length > 0 ? (
                editing.assignedTo.map((m) => (
                  <div key={m._id} className="member-chip">
                    <div className="avatar sm">{getInitials(m.name)}</div>
                    <span>{m.name}</span>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: 13, color: "var(--text2)" }}>Unassigned</span>
              )}
            </div>
            {/* Members available to assign */}
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
              Click to assign/unassign project members:
            </div>
            <div className="members-row">
              {project.members.map((m) => {
                const isAssigned = editing.assignedTo?.some((a) => (a._id || a) === m._id);
                return (
                  <div
                    key={m._id}
                    className="member-chip"
                    style={{
                      cursor: "pointer",
                      opacity: isAssigned ? 1 : 0.5,
                      borderColor: isAssigned ? "var(--primary)" : "var(--border)",
                    }}
                    onClick={() => {
                      const current = editing.assignedTo || [];
                      if (isAssigned) {
                        setEditing({
                          ...editing,
                          assignedTo: current.filter((a) => (a._id || a) !== m._id),
                        });
                      } else {
                        setEditing({ ...editing, assignedTo: [...current, m] });
                      }
                    }}
                  >
                    <div className="avatar sm">{getInitials(m.name)}</div>
                    <span>{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div className="detail-section">
            <h4>Comments ({comments.length})</h4>
            {loadingComments ? (
              <div style={{ color: "var(--text2)", fontSize: 13 }}>Loading...</div>
            ) : (
              <div className="comments-list">
                {comments.length === 0 && (
                  <div style={{ color: "var(--text2)", fontSize: 13 }}>No comments yet.</div>
                )}
                {comments.map((c) => (
                  <div key={c._id} className="comment-item">
                    <div className="avatar sm">{getInitials(c.author?.name)}</div>
                    <div className="comment-content">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="comment-author">{c.author?.name}</span>
                        {c.author?._id === user._id && (
                          <button
                            onClick={() => deleteComment(c._id)}
                            style={{
                              background: "none", border: "none", color: "var(--danger)",
                              cursor: "pointer", fontSize: 11,
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-time">
                        {format(new Date(c.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="comment-input-row">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
              />
              <button
                className="comment-send-btn"
                onClick={sendComment}
                disabled={sendingComment || !newComment.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete Task
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ width: "auto" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="spinner" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
