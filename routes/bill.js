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
  return moment.tz(dateString, 'DD/MM/YYYY', 'UTC');
};

router.post('/bill', basicAuthMiddleware, async (req, res) => {
  try {
    const { id, client_id, notes, payment_method, scheduled_date, value } = req.body;

    if (!client_id || !payment_method || !scheduled_date || value === undefined) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    const parsedDate = parseDate(scheduled_date);
    if (!parsedDate.isValid()) {
      return res.status(400).json({ message: 'Data programada inválida.' });
    }

    if (id) {
      const existingBill = await prisma.bills.findUnique({ where: { id } });
      if (existingBill && existingBill.status === 'pago') {
        return res.status(400).json({ message: 'Não é possível editar uma cobrança com status "pago".' });
      }

      await prisma.bills.update({
        where: { id },
        data: {
          client_id,
          notes,
          payment_method,
          scheduled_date: parsedDate.toDate(),
          value,
        },
      });
    } else {
      await prisma.bills.create({
        data: {
          client_id,
          notes,
          payment_method,
          scheduled_date: parsedDate.toDate(),
          value,
          status: 'pendente',
        },
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

router.get('/bill', basicAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'ID da cobrança é obrigatório.' });
    }

    const bill = await prisma.bills.findUnique({
      where: { id: Number(id) },
      include: {
        client: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!bill) {
      return res.status(404).json({ message: 'Cobrança não encontrada.' });
    }

    const formattedBill = {
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
    };

    return res.json(formattedBill);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

router.delete('/bill', basicAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'ID da cobrança é obrigatório.' });
    }

    const bill = await prisma.bills.findUnique({
      where: { id: Number(id) },
    });

    if (!bill) {
      return res.status(404).json({ message: 'Cobrança não encontrada.' });
    }

    if (bill.status === 'pago') {
      return res.status(400).json({ message: 'Não é possível excluir uma cobrança com status "pago".' });
    }

    await prisma.bills.delete({
      where: { id: Number(id) },
    });

    return res.status(200).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export default router;
