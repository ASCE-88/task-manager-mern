import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [isLogin, setIsLogin] = useState(true);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [tasks, setTasks] = useState([]);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  const [editingTask, setEditingTask] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // AUTH
  // =========================

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin
        ? "/api/auth/login"
        : "/api/auth/register";

      const body = isLogin
        ? {
            email: authForm.email,
            password: authForm.password,
          }
        : authForm;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        setMessage("Login successful 🎉");
      } else {
        setMessage("Account created successfully. Please login.");

        setIsLogin(true);

        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });
      }
    } catch (error) {
      setMessage(
        "Unable to connect to backend. Make sure server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setTasks([]);
  };

  // =========================
  // TASK API
  // =========================

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }

        return;
      }

      setTasks(data);
    } catch (error) {
      setMessage("Unable to load tasks.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const handleTaskChange = (e) => {
    setTaskForm({
      ...taskForm,
      [e.target.name]: e.target.value,
    });
  };

  const addOrUpdateTask = async (e) => {
    e.preventDefault();

    if (!taskForm.title.trim()) {
      setMessage("Task title is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const isEditing = Boolean(editingTask);

      const endpoint = isEditing
        ? `${API_URL}/api/tasks/${editingTask._id}`
        : `${API_URL}/api/tasks`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to save task.");
        return;
      }

      if (isEditing) {
        setTasks(
          tasks.map((task) =>
            task._id === data._id ? data : task
          )
        );

        setMessage("Task updated successfully ✅");
      } else {
        setTasks([data, ...tasks]);
        setMessage("Task added successfully ✅");
      }

      resetTaskForm();
    } catch (error) {
      setMessage("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${task._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: !task.completed,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTasks(
          tasks.map((item) =>
            item._id === data._id ? data : item
          )
        );
      }
    } catch (error) {
      setMessage("Unable to update task.");
    }
  };

  const deleteTask = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setTasks(tasks.filter((task) => task._id !== id));
        setMessage("Task deleted 🗑️");
      }
    } catch (error) {
      setMessage("Unable to delete task.");
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);

    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      dueDate: task.dueDate
        ? task.dueDate.substring(0, 10)
        : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetTaskForm = () => {
    setEditingTask(null);

    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    });
  };

  // =========================
  // FILTER + SEARCH + SORT
  // =========================

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description || "").toLowerCase().includes(query)
      );
    }

    if (statusFilter === "completed") {
      result = result.filter((task) => task.completed);
    }

    if (statusFilter === "pending") {
      result = result.filter((task) => !task.completed);
    }

    if (priorityFilter !== "all") {
      result = result.filter(
        (task) => task.priority === priorityFilter
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt) - new Date(b.createdAt)
      );
    }

    if (sortBy === "priority") {
      const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3,
      };

      result.sort(
        (a, b) =>
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
      );
    }

    if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }

    return result;
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    sortBy,
  ]);

  // =========================
  // STATISTICS
  // =========================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = totalTasks - completedTasks;

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "high" && !task.completed
  ).length;

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  // =========================
  // AUTH SCREEN
  // =========================

  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            <div className="brand-icon">✓</div>

            <div>
              <h1>TaskFlow</h1>
              <p>Manage your work. Stay organized.</p>
            </div>
          </div>

          <div className="auth-heading">
            <h2>
              {isLogin
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {isLogin
                ? "Login to continue to your workspace."
                : "Start managing your tasks today."}
            </p>
          </div>

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <div className="field">
                <label>Full Name</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={authForm.name}
                  onChange={handleAuthChange}
                  required
                />
              </div>
            )}

            <div className="field">
              <label>Email</label>

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={authForm.email}
                onChange={handleAuthChange}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={authForm.password}
                onChange={handleAuthChange}
                required
              />
            </div>

            <button
              className="primary-btn full-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <div className="auth-switch">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
            >
              {isLogin ? "Create account" : "Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo-area">
          <div className="brand-icon">✓</div>

          <div>
            <h1>TaskFlow</h1>
            <span>Task Management System</span>
          </div>
        </div>

        <div className="user-area">
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container">
        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>

            <h2>
              Good to see you, {user.name.split(" ")[0]} 👋
            </h2>

            <p>
              Keep your tasks organized and stay productive.
            </p>
          </div>

          <div className="progress-box">
            <div className="progress-top">
              <span>Completion</span>
              <strong>{completionPercentage}%</strong>
            </div>

            <div className="progress-bar">
              <div
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* STATISTICS */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div>
              <span>Total Tasks</span>
              <strong>{totalTasks}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div>
              <span>Pending</span>
              <strong>{pendingTasks}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div>
              <span>Completed</span>
              <strong>{completedTasks}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div>
              <span>High Priority</span>
              <strong>{highPriorityTasks}</strong>
            </div>
          </div>
        </section>

        {/* ADD / EDIT TASK */}

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                {editingTask ? "EDIT TASK" : "NEW TASK"}
              </p>

              <h3>
                {editingTask
                  ? "Update your task"
                  : "Create a new task"}
              </h3>
            </div>

            {editingTask && (
              <button
                className="secondary-btn"
                onClick={resetTaskForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            className="task-form"
            onSubmit={addOrUpdateTask}
          >
            <div className="form-row">
              <div className="field large">
                <label>Task Title</label>

                <input
                  type="text"
                  name="title"
                  placeholder="What needs to be done?"
                  value={taskForm.title}
                  onChange={handleTaskChange}
                  required
                />
              </div>

              <div className="field">
                <label>Priority</label>

                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="field">
                <label>Due Date</label>

                <input
                  type="date"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleTaskChange}
                />
              </div>
            </div>

            <div className="field">
              <label>Description</label>

              <textarea
                name="description"
                placeholder="Add some details about this task..."
                value={taskForm.description}
                onChange={handleTaskChange}
                rows="3"
              />
            </div>

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingTask
                ? "Update Task"
                : "+ Add Task"}
            </button>
          </form>
        </section>

        {/* FILTERS */}

        <section className="toolbar">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value)
            }
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
            }
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </select>
        </section>

        {/* TASK LIST */}

        <section className="tasks-section">
          <div className="tasks-heading">
            <div>
              <p className="eyebrow">TASKS</p>

              <h3>My Tasks</h3>
            </div>

            <span className="task-count">
              {filteredTasks.length} tasks
            </span>
          </div>

          {message && (
            <div className="message dashboard-message">
              {message}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>

              <h3>
                {tasks.length === 0
                  ? "No tasks yet"
                  : "No matching tasks"}
              </h3>

              <p>
                {tasks.length === 0
                  ? "Create your first task using the form above."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article
                  className={`task-card ${
                    task.completed ? "task-completed" : ""
                  }`}
                  key={task._id}
                >
                  <button
                    className={`check-btn ${
                      task.completed ? "checked" : ""
                    }`}
                    onClick={() => toggleTask(task)}
                    title={
                      task.completed
                        ? "Mark pending"
                        : "Mark complete"
                    }
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="task-content">
                    <div className="task-title-row">
                      <h4>{task.title}</h4>

                      <span
                        className={`priority ${task.priority}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p>{task.description}</p>
                    )}

                    <div className="task-meta">
                      <span>
                        Created{" "}
                        {new Date(
                          task.createdAt
                        ).toLocaleDateString()}
                      </span>

                      {task.dueDate && (
                        <span>
                          Due{" "}
                          {new Date(
                            task.dueDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      className="action-btn"
                      onClick={() =>
                        startEditing(task)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="action-btn danger"
                      onClick={() =>
                        deleteTask(task._id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>
          TaskFlow • MERN Task Management System
        </p>
      </footer>
    </div>
  );
}

export default App;