import express from 'express';
import cors from 'cors';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebaseAdmin.js';
import { requireAuth } from './auth.js';

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(cors({
    origin: clientOrigin === '*' ? true : clientOrigin,
  }));
  app.use(express.json({ limit: '50kb' }));

  // Netlify/serverless adapters can expose the request body as a string.
  // Normalize it here so the API always receives an object for JSON requests.
  app.use((req, res, next) => {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
    }

    if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
    }

    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/tasks', requireAuth);

  const tasks = () => db.collection('tasks');

  app.get('/api/tasks', async (req, res) => {
    try {
      const snapshot = await tasks().where('userId', '==', req.user.uid).get();
      const result = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Could not load tasks.' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Task title is required.' });
    if (title.length > 200) return res.status(400).json({ error: 'Task title must be 200 characters or fewer.' });

    try {
      const ref = tasks().doc();
      const task = {
        userId: req.user.uid,
        title,
        completed: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await ref.set(task);
      const saved = await ref.get();
      res.status(201).json({ id: ref.id, ...saved.data() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Could not create task.' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    const allowed = {};
    if (typeof req.body.title === 'string') {
      const title = req.body.title.trim();
      if (!title) return res.status(400).json({ error: 'Task title is required.' });
      if (title.length > 200) return res.status(400).json({ error: 'Task title must be 200 characters or fewer.' });
      allowed.title = title;
    }
    if (typeof req.body.completed === 'boolean') allowed.completed = req.body.completed;
    if (!Object.keys(allowed).length) return res.status(400).json({ error: 'No valid task changes supplied.' });

    try {
      const ref = tasks().doc(req.params.id);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data().userId !== req.user.uid) return res.status(404).json({ error: 'Task not found.' });

      allowed.updatedAt = FieldValue.serverTimestamp();
      await ref.update(allowed);
      const updated = await ref.get();
      res.json({ id: ref.id, ...updated.data() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Could not update task.' });
    }
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const ref = tasks().doc(req.params.id);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data().userId !== req.user.uid) return res.status(404).json({ error: 'Task not found.' });
      await ref.delete();
      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Could not delete task.' });
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Unexpected server error.' });
  });

  return app;
}
