import { Prisma, PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

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
      skip: Number(page) * 10,
      take: 10,
      include: { vendor: true },
    });

    const clientIds = clients.map(client => client.id);

    const rawStatus = await prisma.$queryRaw`
      SELECT c.id,
        CASE
          WHEN MAX(CURRENT_DATE - b.scheduled_date::date) IS NULL THEN 'no_prazo'
          WHEN MAX(CURRENT_DATE - b.scheduled_date::date) > 5 THEN 'grande_atraso'
          WHEN MAX(CURRENT_DATE - b.scheduled_date::date) > 0 THEN 'medio_atraso'
          ELSE 'no_prazo'
        END AS status
      FROM clients c
      LEFT JOIN bills b 
        ON b.client_id = c.id 
       AND b.status = 'pendente' 
       AND b.scheduled_date < CURRENT_DATE
      WHERE c.id IN (${Prisma.join(clientIds)})
      GROUP BY c.id
    `;

    const statusMap = {};
    for (const row of rawStatus) {
      statusMap[row.id] = row.status;
    }

    const clientsWithStatus = clients.map(client => ({
      id: client.id,
      name: client.name,
      cpf: client.cpf,
      vendor_id: client.vendor_id,
      vendor_name: client.vendor ? client.vendor.name : null,
      notes: client.notes,
      telephone: client.telefone,
      address: client.address,
      cep: client.cep,
      status: statusMap[client.id] || 'no_prazo',
    }));

    const filteredClients = status ? clientsWithStatus.filter(client => client.status === status) : clientsWithStatus;

    return res.json(filteredClients);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
