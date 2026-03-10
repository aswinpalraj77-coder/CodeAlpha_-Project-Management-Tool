import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Project name required");
    setLoading(true);
    try {
      const { data } = await api.post("/projects", form);
      onCreate(data);
      toast.success("Project created!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Project</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                placeholder="e.g. Marketing Campaign"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Color Theme</label>
              <div className="color-options">
                {COLORS.map((c) => (
                  <div
                    key={c}
                    className={`color-dot ${form.color === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const getStatusClass = (status) => {
    if (status === "active") return "status-active";
    if (status === "completed") return "status-completed";
    return "status-on-hold";
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>👋 Welcome, {user?.name?.split(" ")[0]}!</h1>
          <p>Here are all your projects</p>
        </div>
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
          <p>No projects yet. Create your first one!</p>
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowCreate(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <Link
              key={p._id}
              to={`/project/${p._id}`}
              className="project-card"
              style={{ "--project-color": p.color }}
            >
              <h3>{p.name}</h3>
              <p>{p.description || "No description"}</p>
              <div className="project-meta">
                <div className="member-stack">
                  {p.members.slice(0, 4).map((m) => (
                    <div key={m._id} className="avatar" title={m.name}>
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {p.members.length > 4 && (
                    <div className="avatar" style={{ background: "#374151" }}>
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                <span className={`status-badge ${getStatusClass(p.status)}`}>{p.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={(p) => setProjects([p, ...projects])}
        />
      )}
    </div>
  );
}
