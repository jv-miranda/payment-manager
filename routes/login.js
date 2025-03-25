import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', basicAuthMiddleware, (req, res) => {
  const { name, email, password } = req.user;
  res.json({ name, email, password });
});

export default router;
