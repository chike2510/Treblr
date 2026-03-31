import jwt from 'jsonwebtoken';

export function getUser(req) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET || 'treblr_dev_secret');
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  return user;
}
