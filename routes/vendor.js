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

router.post('/vendor', basicAuthMiddleware, async (req, res) => {
  try {
    const { id, name, cpf, telephone } = req.body;

    if (!name || !cpf || !telephone) {
      return res.status(400).json({ message: 'Parâmetros inválidos.' });
    }

    const cpfFormatted = cpf.replace(/\D/g, '');
    const telephoneFormatted = telephone.replace(/\D/g, '');

    if (id) {
      await prisma.vendor.update({
        where: { id },
        data: { name, cpf: cpfFormatted, telephone: telephoneFormatted },
      });
    } else {
      await prisma.vendor.create({
        data: { name, cpf: cpfFormatted, telephone: telephoneFormatted },
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
