import { PrismaClient } from '@prisma/client';
import express from 'express';
import moment from 'moment-timezone';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const formatDate = date => {
  return moment(date).format('DD/MM/YYYY');
};

router.get('/cash_registers', basicAuthMiddleware, async (req, res) => {
  try {
    const { vendor_id, client_id, page = 0 } = req.query;
    const pageSize = 10;
    const where = {};

    if (vendor_id) {
      where.vendor_id = Number(vendor_id);
    }
    if (client_id) {
      where.client_id = Number(client_id);
    }

    const cashRegisters = await prisma.cashRegister.findMany({
      where,
      skip: Number(page) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: {
            name: true,
          },
        },
        vendor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const formattedRegisters = cashRegisters.map(reg => ({
      id: reg.id,
      client_id: reg.client_id,
      client_name: reg.client?.name || null,
      vendor_id: reg.vendor_id,
      vendor_name: reg.vendor?.name || null,
      date: reg.date ? formatDate(reg.date) : null,
      bill_id: reg.bill_id,
      bill_value: reg.bill_value,
      vendor_day_costs: reg.vendor_day_costs,
    }));

    return res.json(formattedRegisters);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
