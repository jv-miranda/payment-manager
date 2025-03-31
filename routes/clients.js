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

router.get('/clients', basicAuthMiddleware, async (req, res) => {
  try {
    const { name, id, cpf, telephone, vendor_id, page = 0, status } = req.query;
    const where = {};

    if (id) where.id = Number(id);
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (cpf) where.cpf = cpf;
    if (telephone) where.telephone = telephone;
    if (vendor_id) where.vendor_id = Number(vendor_id);

    const clients = await prisma.client.findMany({
      where,
      skip: page * 10,
      take: 10,
      include: {
        vendor: true,
      },
    });

    const clientsWithStatus = await Promise.all(
      clients.map(async client => {
        const clientStatus = await calculateClientStatus(client.id);
        return {
          id: client.id,
          name: client.name,
          cpf: client.cpf,
          vendor_id: client.vendor_id,
          vendor_name: client.vendor?.name || null,
          notes: client.notes,
          telephone: client.telephone,
          address: client.address,
          cep: client.cep,
          status: clientStatus,
        };
      })
    );

    const filteredClients = status ? clientsWithStatus.filter(client => client.status === status) : clientsWithStatus;

    return res.json(filteredClients);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
