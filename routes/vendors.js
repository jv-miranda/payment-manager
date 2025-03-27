import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/vendors', basicAuthMiddleware, async (req, res) => {
  try {
    const { name, page = 0 } = req.query;
    const pageSize = 10;
    const skip = parseInt(page) * pageSize;

    const where = name ? { name: { contains: name, mode: 'insensitive' } } : {};

    const vendors = await prisma.vendor.findMany({
      where,
      take: pageSize,
      skip,
    });

    res.json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

export default router;
