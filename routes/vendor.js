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
      select: {
        id: true,
        name: true,
        cpf: true,
        telephone: true,
      },
    });
    if (!vendor) {
      return res.status(404).json({ erro: 'Vendedor não encontrado.' });
    }

    const clientsQuantity = await prisma.client.count({
      where: { vendor_id: parseInt(id) },
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
        WHERE c.vendor_id = ${parseInt(id)}
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

    res.json({
      ...vendor,
      clients_quantity: clientsQuantity,
      clients_quantitiy_by_status: clientsQuantityByStatus,
    });
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

    return res.status(200).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
