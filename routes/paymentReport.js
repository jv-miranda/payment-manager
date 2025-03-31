import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/payment_report', basicAuthMiddleware, async (req, res) => {
  try {
    const totalClientsResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total FROM clients;
    `;
    const total_clients_quantity = totalClientsResult[0]?.total || 0;

    const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*)::int AS count
      FROM (
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
        GROUP BY c.id
      ) sub
      GROUP BY status;
    `;

    const percentages_by_status = {
      no_prazo: 0,
      medio_atraso: 0,
      grande_atraso: 0,
    };

    for (const row of statusCounts) {
      const percentage = total_clients_quantity > 0 ? Math.round((Number(row.count) / total_clients_quantity) * 100) : 0;
      if (row.status === 'no_prazo') percentages_by_status.no_prazo = percentage;
      else if (row.status === 'medio_atraso') percentages_by_status.medio_atraso = percentage;
      else if (row.status === 'grande_atraso') percentages_by_status.grande_atraso = percentage;
    }

    res.json({
      total_clients_quantity,
      percentages_by_status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
