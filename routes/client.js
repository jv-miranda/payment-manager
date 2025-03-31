import { PrismaClient } from '@prisma/client';
import express from 'express';
import moment from 'moment-timezone';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const calculateClientStatus = async client_id => {
  const today = moment().startOf('day');
  const bills = await prisma.bills.findMany({
    where: {
      client_id,
      status: 'pendente',
      scheduled_date: { lt: today.toDate() },
    },
  });

  if (bills.length === 0) return 'no_prazo';

  let maxDelay = 0;
  for (const bill of bills) {
    const dueDate = moment(bill.scheduled_date).startOf('day');
    const delay = today.diff(dueDate, 'days');
    if (delay > maxDelay) maxDelay = delay;
  }

  if (maxDelay > 5) return 'grande_atraso';
  if (maxDelay > 0) return 'medio_atraso';
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

export default router;
