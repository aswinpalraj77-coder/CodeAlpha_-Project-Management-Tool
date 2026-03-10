import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⬡ ProjectFlow
      </Link>
      <div className="navbar-right">
        <div className="user-badge">
          <div className="avatar">{getInitials(user?.name)}</div>
          <span style={{ fontSize: 14 }}>{user?.name}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
