import { Prisma, PrismaClient } from '@prisma/client';
import express from 'express';
import moment from 'moment-timezone';
import basicAuthMiddleware from '../middlewares/auth.js';
import utils from '../utils/mainUtils.js';

const router = express.Router();
const prisma = new PrismaClient();

const formatDate = date => {
  return moment(date).format('DD/MM/YYYY');
};

router.get('/clients', basicAuthMiddleware, async (req, res) => {
  try {
    const { name, id, cpf, telephone, vendor_id, page = 0, status } = req.query;

    const email = utils.getEmailFromAuthHeader(req.headers.authorization);
    if (!email) return res.status(401).json({ erro: 'Usuário não autenticado.' });

    const filters = {};
    if (id) filters.id = Number(id);
    if (name) filters.name = { contains: name, mode: 'insensitive' };
    if (cpf) filters.cpf = cpf;
    if (telephone) filters.telephone = telephone;
    if (vendor_id) filters.vendor_id = Number(vendor_id);

    filters.belongs_to = email;

    let clientIdsFilteredByStatus = null;

    if (status) {
      const statusRaw = await prisma.$queryRaw`
        SELECT c.id
        FROM clients c
        LEFT JOIN bills b 
          ON b.client_id = c.id 
         AND b.status = 'pendente' 
         AND b.scheduled_date < CURRENT_DATE
        WHERE c.belongs_to = ${email}
        GROUP BY c.id
        HAVING
          CASE
            WHEN MAX(CURRENT_DATE - b.scheduled_date::date) IS NULL THEN 'no_prazo'
            WHEN MAX(CURRENT_DATE - b.scheduled_date::date) > 5 THEN 'grande_atraso'
            WHEN MAX(CURRENT_DATE - b.scheduled_date::date) > 0 THEN 'medio_atraso'
            ELSE 'no_prazo'
          END = ${status}
      `;

      clientIdsFilteredByStatus = statusRaw.map(row => row.id);

      if (clientIdsFilteredByStatus.length === 0) {
        return res.json([]);
      }

      filters.id = { in: clientIdsFilteredByStatus };
    }

    const clients = await prisma.client.findMany({
      where: filters,
      skip: Number(page) * 10,
      take: 10,
      include: { vendor: true },
    });

    const clientIds = clients.map(client => client.id);

    let rawStatus = [];
    if (clientIds.length > 0) {
      rawStatus = await prisma.$queryRaw`
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
        WHERE c.id IN (${Prisma.join(clientIds)}) AND c.belongs_to = ${email}
        GROUP BY c.id
      `;
    }

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
      created_at: formatDate(client.created_at),
    }));

    return res.json(clientsWithStatus);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
