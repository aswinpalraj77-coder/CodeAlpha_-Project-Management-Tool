# ⬡ ProjectFlow — Project Management Tool
### CodeAlpha Full Stack Internship — Task 3

A full-stack collaborative project management tool inspired by Trello/Asana, built with the MERN stack + real-time updates via Socket.io.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Real-time | Socket.io |
| Styling | Custom CSS (Dark Theme) |

---

## ✅ Features

### 🔐 Authentication
- User Register & Login
- JWT-based session management
- Protected routes

### 📋 Projects
- Create, update, delete projects
- Color-coded project themes
- Project status: Active / Completed / On Hold
- Member management (add/remove team members)

### 🗂 Kanban Board
- 4 columns: **To Do → In Progress → Review → Done**
- Create, edit, delete tasks on the board
- Task priority levels: Low / Medium / High / Urgent
- Due date tracking with overdue warnings
- Assign multiple team members to tasks

### 💬 Comments
- Comment on any task in real-time
- Delete your own comments
- Live comment feed per task

### ⚡ Real-time (Socket.io)
- Task creation/updates broadcast to all project members
- Member add/remove notifications
- Live board refresh without page reload

---

## 📁 Project Structure

```
CodeAlpha_ProjectManagement/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── comments.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── ProjectBoard.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── TaskModal.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/CodeAlpha_ProjectManagement
cd CodeAlpha_ProjectManagement
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/codealpha_pm
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```
> Backend runs on: http://localhost:5000

---

### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
> Frontend runs on: http://localhost:5173

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users?search=` | Search users |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/project/:projectId` | Get project tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/task/:taskId` | Get task comments |
| POST | `/api/comments` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |

---

## 🎨 Screenshots

### Dashboard — Project Cards
- Color-coded projects with member avatars and status badges

### Kanban Board — 4 Column Layout
- To Do | In Progress | Review | Done
- Task cards with priority badges and assignee avatars

### Task Detail Modal
- Edit title, description, status, priority, due date
- Assign/unassign team members
- Real-time comment thread

---

## 👨‍💻 Built By

**[Your Name]** — CodeAlpha Full Stack Development Intern

- GitHub: [github.com/YOUR_USERNAME](https://github.com)
- LinkedIn: [linkedin.com/in/YOUR_PROFILE](https://linkedin.com)

---

## 📄 License
MIT License — Free to use and modify.
