import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/vendors', basicAuthMiddleware, async (req, res) => {
  try {
    const { name, page = 0 } = req.query;
    const pageSize = 10;
    const skip = parseInt(page) * pageSize;

    const where = name ? { name: { contains: name, mode: 'insensitive' } } : {};

    const vendors = await prisma.vendor.findMany({
      where,
      take: pageSize,
      skip,
      select: {
        id: true,
        name: true,
        cpf: true,
        telephone: true,
      },
    });

    const vendorsWithAggregates = await Promise.all(
      vendors.map(async vendor => {
        const clientsQuantity = await prisma.client.count({
          where: { vendor_id: vendor.id },
        });

        const statusCounts = await prisma.$queryRaw`
          SELECT COALESCE(status, 'no_prazo') AS status, COUNT(*) AS count
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
            WHERE c.vendor_id = ${vendor.id}
            GROUP BY c.id
          ) sub
          GROUP BY status
        `;

        const clientsQuantityByStatus = {
          no_prazo: 0,
          medio_atraso: 0,
          grande_atraso: 0,
        };

        for (const row of statusCounts) {
          const count = Number(row.count);
          if (row.status === 'no_prazo') clientsQuantityByStatus.no_prazo = count;
          else if (row.status === 'medio_atraso') clientsQuantityByStatus.medio_atraso = count;
          else if (row.status === 'grande_atraso') clientsQuantityByStatus.grande_atraso = count;
        }

        return {
          ...vendor,
          clients_quantity: clientsQuantity,
          clients_quantitiy_by_status: clientsQuantityByStatus,
        };
      })
    );

    res.json(vendorsWithAggregates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

export default router;
