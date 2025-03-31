import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const calculateClientStatus = async client_id => {
  const result = await prisma.$queryRaw`
    SELECT MAX(CURRENT_DATE - scheduled_date::date) AS max_delay
    FROM bills
    WHERE client_id = ${client_id}
      AND status = 'pendente'
      AND scheduled_date < CURRENT_DATE
  `;

  const maxDelay = result[0]?.max_delay;
  if (maxDelay === null || maxDelay === undefined) return 'no_prazo';

  const delay = Number(maxDelay);
  if (delay > 5) return 'grande_atraso';
  if (delay > 0) return 'medio_atraso';
  return 'no_prazo';
};

router.get('/client', basicAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ erro: 'O ID é obrigatório.' });
    }

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: { vendor: true },
    });

    if (!client) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }

    const clientStatus = await calculateClientStatus(client.id);

    const clientResponse = {
      id: client.id,
      name: client.name,
      cpf: client.cpf,
      vendor_id: client.vendor_id,
      vendor_name: client.vendor ? client.vendor.name : null,
      notes: client.notes,
      telephone: client.telefone,
      address: client.address,
      cep: client.cep,
      status: clientStatus,
    };

    res.json(clientResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

router.post('/client', basicAuthMiddleware, async (req, res) => {
  try {
    const { id, name, cpf, vendor_id, notes, telephone, address, cep } = req.body;

    if (id) {
      await prisma.client.update({
        where: { id: Number(id) },
        data: {
          name,
          cpf,
          vendor: {
            connect: { id: vendor_id },
          },
          notes,
          telephone,
          address,
          cep,
        },
      });
    } else {
      await prisma.client.create({
        data: {
          name,
          cpf,
          vendor: {
            connect: { id: vendor_id },
          },
          notes,
          telephone,
          address,
          cep,
        },
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

export default router;
