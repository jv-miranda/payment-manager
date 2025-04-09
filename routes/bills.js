import { PrismaClient } from '@prisma/client';
import express from 'express';
import moment from 'moment-timezone';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const formatDate = date => {
  return moment(date).utcOffset('+00:00').format('DD/MM/YYYY');
};

const parseDate = dateString => {
  return moment(dateString, 'DD/MM/YYYY').toDate();
};

router.get('/bills', basicAuthMiddleware, async (req, res) => {
  try {
    const { client_id, status, scheduled_date, page = 0 } = req.query;

    const parsedDate = scheduled_date ? parseDate(scheduled_date) : null;

    const where = {};
    if (client_id) where.client_id = Number(client_id);
    if (status) where.status = status;
    if (parsedDate) where.scheduled_date = parsedDate;

    const bills = await prisma.bills.findMany({
      where,
      orderBy: {
        scheduled_date: 'asc',
      },
      skip: page * 10,
      take: 10,
      include: {
        client: {
          include: {
            vendor: true,
          },
        },
      },
    });

    const formattedBills = bills.map(bill => ({
      id: bill.id,
      client_id: bill.client_id,
      client_name: bill.client?.name || null,
      vendor_id: bill.client?.vendor_id || null,
      vendor_name: bill.client?.vendor?.name || null,
      notes: bill.notes,
      status: bill.status,
      payment_method: bill.payment_method,
      scheduled_date: bill.scheduled_date ? formatDate(bill.scheduled_date) : null,
      value: bill.value,
      created_at: formatDate(bill.created_at),
    }));

    return res.json(formattedBills);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
