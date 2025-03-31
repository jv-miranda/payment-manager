import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const isValidPhoneNumber = telephone => {
  const phoneRegex = /^[1-9]{2}[9]{1}[0-9]{8}$/;
  return phoneRegex.test(telephone.replace(/\D/g, ''));
};

router.post('/validate_telephone', basicAuthMiddleware, async (req, res) => {
  try {
    const { table, telephone } = req.body;
    if (!table || !telephone) {
      return res.status(400).json({ valid: false, message: 'Parâmetros inválidos.' });
    }
    if (!isValidPhoneNumber(telephone)) {
      return res.status(400).json({ valid: false, message: 'Telefone inválido.' });
    }

    const record = await prisma[table].findUnique({
      where: { telephone: telephone.replace(/\D/g, '') },
    });

    if (record) {
      return res.json({ valid: false, message: 'Telefone já existe no sistema.' });
    }

    return res.json({ valid: true, message: 'Telefone válido e não cadastrado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ valid: false, message: 'Erro interno no servidor.' });
  }
});

export default router;
