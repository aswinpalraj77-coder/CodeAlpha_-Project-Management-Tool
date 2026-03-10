import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import TaskModal from "../components/TaskModal";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#94a3b8" },
  { id: "inprogress", label: "In Progress", color: "#f59e0b" },
  { id: "review", label: "Review", color: "#3b82f6" },
  { id: "done", label: "Done", color: "#22c55e" },
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

function AddMemberModal({ project, onClose, onUpdate }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (q) => {
    if (!q.trim()) return setResults([]);
    setLoading(true);
    try {
      const { data } = await api.get(`/auth/users?search=${q}`);
      const memberIds = project.members.map((m) => m._id);
      setResults(data.filter((u) => !memberIds.includes(u._id)));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId) => {
    try {
      const { data } = await api.post(`/projects/${project._id}/members`, { userId });
      onUpdate(data);
      toast.success("Member added!");
      setResults(results.filter((u) => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    try {
      const { data } = await api.delete(`/projects/${project._id}/members/${userId}`);
      onUpdate(data);
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Members</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <h4>Current Members</h4>
            <div className="members-row">
              {project.members.map((m) => (
                <div key={m._id} className="member-chip">
                  <div className="avatar sm">{getInitials(m.name)}</div>
                  <span>{m.name}</span>
                  {m._id !== project.owner._id && (
                    <button
                      onClick={() => removeMember(m._id)}
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h4>Add Members</h4>
            <input
              className="search-box"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                searchUsers(e.target.value);
              }}
            />
            {loading && <div style={{ color: "var(--text2)", fontSize: 13 }}>Searching...</div>}
            {results.map((u) => (
              <div key={u._id} className="user-result" onClick={() => addMember(u._id)}>
                <div className="avatar sm">{getInitials(u.name)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{u.email}</div>
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto", width: "auto" }}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({ project, defaultStatus, onClose, onCreate }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: defaultStatus || "todo",
    priority: "medium",
    dueDate: "",
    assignedTo: [],
  });
  const [loading, setLoading] = useState(false);

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Task title required");
    setLoading(true);
    try {
      const { data } = await api.post("/tasks", {
        ...form,
        project: project._id,
        assignedTo: form.assignedTo.map((u) => u._id || u),
      });
      onCreate(data);
      toast.success("Task created!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Task</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Add more details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="task-detail-grid">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Assign To (click to toggle)</label>
              <div className="members-row">
                {project.members.map((m) => {
                  const isAssigned = form.assignedTo.some((a) => (a._id || a) === m._id);
                  return (
                    <div
                      key={m._id}
                      className="member-chip"
                      style={{
                        cursor: "pointer",
                        opacity: isAssigned ? 1 : 0.5,
                        borderColor: isAssigned ? "var(--primary)" : "var(--border)",
                      }}
                      onClick={() =>
                        setForm({
                          ...form,
                          assignedTo: isAssigned
                            ? form.assignedTo.filter((a) => (a._id || a) !== m._id)
                            : [...form.assignedTo, m],
                        })
                      }
                    >
                      <div className="avatar sm">{getInitials(m.name)}</div>
                      <span>{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState("todo");
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchTasks();

    const socket = io("http://localhost:5000");
    socket.emit("join_project", id);

    socket.on("task_created", (task) => {
      setTasks((prev) => [...prev, task]);
      toast("📌 New task added by a team member", { icon: "🔔" });
    });

    socket.on("task_updated", (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    });

    socket.on("task_deleted", (taskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    });

    socket.on("member_added", (proj) => {
      setProject(proj);
      toast("👤 New member added to project", { icon: "🔔" });
    });

    socket.on("member_removed", (proj) => setProject(proj));

    return () => {
      socket.emit("leave_project", id);
      socket.disconnect();
    };
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch (err) {
      toast.error("Project not found or access denied");
      navigate("/");
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks/project/${id}`);
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  if (loading || !project) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      </div>
    );
  }

  const isOwner = project.owner._id === user._id || project.owner === user._id;

  return (
    <div>
      {/* Board Header */}
      <div className="board-header">
        <button className="board-back" onClick={() => navigate("/")}>←</button>
        <div
          style={{
            width: 14, height: 14, borderRadius: "50%",
            background: project.color, flexShrink: 0,
          }}
        />
        <div className="board-title">
          <h2>{project.name}</h2>
          <p>{project.description || "No description"}</p>
        </div>
        <div className="board-actions">
          <div className="member-stack">
            {project.members.slice(0, 5).map((m) => (
              <div key={m._id} className="avatar" style={{ width: 30, height: 30, fontSize: 11 }} title={m.name}>
                {getInitials(m.name)}
              </div>
            ))}
          </div>
          {isOwner && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowMembers(true)}>
              Manage Members
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            style={{ width: "auto" }}
            onClick={() => { setCreateTaskStatus("todo"); setShowCreateTask(true); }}
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="board-columns">
        {COLUMNS.map((col) => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div key={col.id} className="column">
              <div className="column-header">
                <div className="column-title">
                  <div className="col-dot" style={{ background: col.color }} />
                  {col.label}
                  <span className="col-count">{colTasks.length}</span>
                </div>
              </div>

              <div className="column-tasks">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    className="task-card"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="task-card-title">{task.title}</div>
                    {task.description && (
                      <div className="task-card-desc">{task.description}</div>
                    )}
                    {task.dueDate && (
                      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="task-card-footer">
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      <div style={{ display: "flex" }}>
                        {task.assignedTo?.slice(0, 3).map((u) => (
                          <div
                            key={u._id}
                            className="avatar"
                            style={{ width: 22, height: 22, fontSize: 9, marginLeft: -4, border: "2px solid var(--card)" }}
                            title={u.name}
                          >
                            {getInitials(u.name)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="add-task-btn"
                onClick={() => { setCreateTaskStatus(col.id); setShowCreateTask(true); }}
              >
                + Add Task
              </button>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
          }}
          onDelete={(taskId) => setTasks(tasks.filter((t) => t._id !== taskId))}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          project={project}
          defaultStatus={createTaskStatus}
          onClose={() => setShowCreateTask(false)}
          onCreate={(task) => setTasks([...tasks, task])}
        />
      )}

      {showMembers && (
        <AddMemberModal
          project={project}
          onClose={() => setShowMembers(false)}
          onUpdate={(updated) => setProject(updated)}
        />
      )}
    </div>
  );
}
