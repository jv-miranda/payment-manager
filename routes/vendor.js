import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/vendor', basicAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ erro: 'O ID é obrigatório.' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vendor) {
      return res.status(404).json({ erro: 'Vendedor não encontrado.' });
    }

    res.json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

export default router;
