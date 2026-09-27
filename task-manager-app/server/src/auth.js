import { getAuth } from 'firebase-admin/auth';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    const token = header.slice('Bearer '.length);
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
