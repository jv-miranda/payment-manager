import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/validate_name', basicAuthMiddleware, async (req, res) => {
  try {
    const { table, name } = req.body;

    if (!table || !name) {
      return res.status(400).json({ valid: false, message: 'Parâmetros table e name são obrigatórios.' });
    }

    if (!['client', 'vendor'].includes(table)) {
      return res.status(400).json({ valid: false, message: 'Valor inválido para table. Deve ser "client" ou "vendor".' });
    }

    const record = await prisma[table].findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (record) {
      return res.json({ valid: false, message: 'Nome já existe no sistema.' });
    }

    return res.json({ valid: true, message: 'Nome disponível para cadastro.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ valid: false, message: 'Erro interno no servidor.' });
  }
});

export default router;
