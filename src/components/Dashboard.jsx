import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../api';

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit modal state

  // --- NEW: Profile Dropdown & Theme State ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  // -------------------------------------------


  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('pending');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = filterDate ? `/tasks?date=${filterDate}` : '/tasks';
      const data = await request(endpoint);
      setTasks(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      await request('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, due_date: dueDate }),
      });
      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (task) => {
    const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await request(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: updatedStatus }),
      });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await request(`/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.due_date);
    setEditStatus(task.status);
  };

  // Save Task Updates
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDueDate) return;

    try {
      await request(`/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          due_date: editDueDate,
          status: editStatus,
        }),
      });
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const setQuickFilter = (daysOffset) => {
    if (daysOffset === null) {
      setFilterDate('');
      return;
    }
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setFilterDate(target.toISOString().split('T')[0]);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter((t) => t.status === 'pending' && t.due_date < todayStr).length;
  const pendingCount = tasks.length - completedCount;


  const handleTestEmail = async () => {
    try {
      const res = await request('/tasks/trigger-reminders', { method: 'POST' });
      alert(`Success: ${res.message}. Tasks processed: ${res.details?.processed ?? 0}`);
    } catch (err) {
      alert(`Error sending email: ${err.message}`);
    }
  };


  return (
    <div className="workspace-layout">
      <header className="top-nav">
        <div className="nav-container">
          <div className="brand">
            <span className="brand-icon">✓</span>
            <span className="brand-name">TaskFlow Workspace</span>
          </div>
          {/* <div className="user-profile">
            <div className="avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <span className="email-label">{user?.email}</span>
            <button onClick={onLogout} className="btn-logout">Log out</button>
          </div> */}
          {/* --- NEW: Clickable Profile Dropdown --- */}
          <div className="user-profile-container" style={{ position: 'relative' }}>
            <div 
              className="user-profile" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div className="avatar">{user?.email?.charAt(0).toUpperCase()}</div>
              <span className="email-label">{user?.email}</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </div>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-info">
                  <small>Signed in as</small>
                  <br />
                  <strong>{user?.email}</strong>
                </div>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setTheme(theme === 'light' ? 'dark' : 'light');
                    setIsProfileOpen(false); // close menu after clicking
                  }}
                >
                  {theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item text-danger" onClick={onLogout}>
                  🚪 Log out
                </button>
              </div>
            )}
          </div>
          {/* --------------------------------------- */}
        </div>
      </header>



      {/* Main Workspace */}
      <main className="content-container">
        {/* Metric Badges */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-title">Total Tasks</span>
            <span className="stat-value">{tasks.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Pending</span>
            <span className="stat-value text-amber">{pendingCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Overdue</span>
            <span className="stat-value text-danger">{overdueCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Completed</span>
            <span className="stat-value text-green">{completedCount}</span>
          </div>
        </section>

        {/* Task Creation Form */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Add New Task</h3>
          </div>
          <form onSubmit={handleCreateTask} className="task-form">
            <div className="form-row">
              <div className="form-group flex-2">
                <label>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare client deliverables"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                placeholder="Add background context, requirements, or links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="2"
              />
            </div>
            <div className="form-action">
              <button type="submit" className="btn-primary">+ Create Task</button>
            </div>
          </form>
        </section>

        {/* Filter Bar */}
        <section className="panel-card filter-card">
          <div className="filter-actions">
            <div className="quick-buttons">
              <button
                type="button"
                className={`filter-btn ${filterDate === '' ? 'active' : ''}`}
                onClick={() => setQuickFilter(null)}
              >
                All Tasks
              </button>
              <button
                type="button"
                className={`filter-btn ${filterDate === todayStr ? 'active' : ''}`}
                onClick={() => setQuickFilter(0)}
              >
                Today
              </button>
              <button
                type="button"
                className={`filter-btn ${filterDate ===
                    new Date(Date.now() + 86400000).toISOString().split('T')[0]
                    ? 'active'
                    : ''
                  }`}
                onClick={() => setQuickFilter(1)}
              >
                Tomorrow
              </button>
            </div>
            <div className="date-picker-box">
              <label>Filter Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="date-select"
              />
            </div>
          </div>
        </section>

        {/* Task List */}
        <section className="task-feed">
          {loading ? (
            <div className="empty-panel">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-panel">
              <div className="empty-icon">📋</div>
              <h4>No tasks found</h4>
              <p>No tasks match your filter. Create a task above to get started.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isOverdue = task.status === 'pending' && task.due_date < todayStr;
              return (
                <div
                  key={task.id}
                  className={`task-row ${task.status === 'completed' ? 'task-done' : ''}`}
                >
                  <div className="task-main">
                    <input
                      type="checkbox"
                      className="task-check"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleStatus(task)}
                    />
                    <div className="task-body">
                      <div className="task-title-bar">
                        <span className="task-name">{task.title}</span>
                        {task.status === 'completed' ? (
                          <span className="badge badge-success">Completed</span>
                        ) : isOverdue ? (
                          <span className="badge badge-danger">Deadline Exceeded</span>
                        ) : (
                          <span className="badge badge-pending">Pending</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="task-notes">{task.description}</p>
                      )}
                      <span className={`task-deadline ${isOverdue ? 'deadline-exceeded' : ''}`}>
                        📅 Due: {task.due_date} {isOverdue ? '(Past Due)' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="task-buttons">
                    <button
                      onClick={() => openEditModal(task)}
                      className="btn-edit"
                    >
                      Edit / Extend
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* Edit / Reschedule Modal */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit & Reschedule Task</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingTask(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="task-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Due Date (Extend if Exceeded)</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="select-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}