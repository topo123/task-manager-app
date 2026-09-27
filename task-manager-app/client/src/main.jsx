import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';
import './styles.css';

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Unable to authenticate.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand">Tasks</div>
        <h1>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h1>
        <p className="muted">A quiet place to keep track of what matters.</p>

        <form onSubmit={submit} className="stack">
          <label>
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>

        <button className="link-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
}

function TaskItem({ task, user, onChange }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  async function toggle() {
    await onChange(task.id, { completed: !task.completed });
  }

  async function save() {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === task.title) {
      setTitle(task.title);
      setEditing(false);
      return;
    }
    await onChange(task.id, { title: nextTitle });
    setEditing(false);
  }

  return (
    <li className={`task ${task.completed ? 'done' : ''}`}>
      <button className="check" aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'} onClick={toggle}>
        {task.completed ? '✓' : ''}
      </button>
      {editing ? (
        <input autoFocus className="edit-input" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setTitle(task.title); setEditing(false); } }} onBlur={save} />
      ) : (
        <button className="task-title" onDoubleClick={() => setEditing(true)} title="Double-click to edit">{task.title}</button>
      )}
      <button className="delete" onClick={() => onChange(task.id, { _delete: true })} aria-label="Delete task">×</button>
    </li>
  );
}

function TaskApp({ user }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTasks() {
    setLoading(true);
    try {
      setTasks(await api.listTasks(user));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, [user]);

  async function addTask(event) {
    event.preventDefault();
    const title = input.trim();
    if (!title) return;
    try {
      const task = await api.createTask(user, { title });
      setTasks((current) => [task, ...current]);
      setInput('');
    } catch (err) { setError(err.message); }
  }

  async function changeTask(id, changes) {
    try {
      if (changes._delete) {
        await api.deleteTask(user, id);
        setTasks((current) => current.filter((task) => task.id !== id));
      } else {
        const updated = await api.updateTask(user, id, changes);
        setTasks((current) => current.map((task) => task.id === id ? updated : task));
      }
    } catch (err) { setError(err.message); }
  }

  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'all' || (filter === 'active' ? !task.completed : task.completed)), [tasks, filter]);
  const remaining = tasks.filter((task) => !task.completed).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">Tasks</div>
          <span className="muted small">{user.email}</span>
        </div>
        <button className="ghost" onClick={() => signOut(auth)}>Sign out</button>
      </header>

      <section className="content">
        <div className="heading-row">
          <div>
            <h1>Your tasks</h1>
            <p className="muted">{remaining === 0 ? 'Nothing urgent. Nice.' : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} remaining`}</p>
          </div>
        </div>

        <form className="add-form" onSubmit={addTask}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="What needs doing?" aria-label="New task" />
          <button className="primary add-button">Add</button>
        </form>

        <div className="filters" role="tablist">
          {['all', 'active', 'completed'].map((item) => (
            <button key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
          ))}
        </div>

        {error && <div className="notice error">{error}</div>}
        {loading ? <div className="empty">Loading your tasks…</div> : visibleTasks.length === 0 ? <div className="empty">{filter === 'all' ? 'Your list is clear.' : `No ${filter} tasks.`}</div> : (
          <ul className="task-list">
            {visibleTasks.map((task) => <TaskItem key={task.id} task={task} user={user} onChange={changeTask} />)}
          </ul>
        )}
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return <div className="loading-screen">Loading…</div>;
  return user ? <TaskApp user={user} /> : <AuthScreen />;
}

createRoot(document.getElementById('root')).render(<App />);
