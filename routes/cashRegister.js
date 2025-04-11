import { PrismaClient } from '@prisma/client';
import express from 'express';
import moment from 'moment-timezone';
import basicAuthMiddleware from '../middlewares/auth.js';
import utils from '../utils/mainUtils.js';

const router = express.Router();
const prisma = new PrismaClient();

const formatDate = date => {
  return moment(date).format('DD/MM/YYYY');
};

router.post('/cash_register', basicAuthMiddleware, async (req, res) => {
  try {
    const { client_id, vendor_id, date, bill_id, vendor_day_costs } = req.body;
    const email = utils.getEmailFromAuthHeader(req.headers.authorization);
    if (!email) {
      return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    if (!client_id || !vendor_id || !date || !bill_id || vendor_day_costs === undefined) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    const bill = await prisma.bills.findFirst({
      where: {
        id: bill_id,
        belongs_to: email,
      },
      select: { value: true },
    });

    if (!bill) {
      return res.status(404).json({ erro: 'Cobrança não encontrada.' });
    }

    await prisma.cashRegister.create({
      data: {
        client_id,
        vendor_id,
        date: new Date(moment(date, 'DD/MM/YYYY').toISOString()),
        bill_id,
        bill_value: bill.value,
        vendor_day_costs,
        belongs_to: email,
      },
    });

    await prisma.bills.update({
      where: { id: bill_id },
      data: { status: 'pago' },
    });

    return res.status(200).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

router.delete('/cash_register', basicAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.query;
    const email = utils.getEmailFromAuthHeader(req.headers.authorization);
    if (!email) {
      return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    if (!id) {
      return res.status(400).json({ erro: 'O ID é obrigatório.' });
    }

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cashRegister || cashRegister.belongs_to !== email) {
      return res.status(404).json({ erro: 'Registro de caixa não encontrado.' });
    }

    await prisma.bills.update({
      where: { id: cashRegister.bill_id },
      data: { status: 'pendente' },
    });

    await prisma.cashRegister.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

router.get('/cash_register', basicAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.query;
    const email = utils.getEmailFromAuthHeader(req.headers.authorization);
    if (!email) {
      return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    if (!id) {
      return res.status(400).json({ erro: 'O ID é obrigatório.' });
    }

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: Number(id) },
      include: {
        client: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    });

    if (!cashRegister || cashRegister.belongs_to !== email) {
      return res.status(404).json({ erro: 'Registro de caixa não encontrado.' });
    }

    const profit = Number(cashRegister.bill_value) - Number(cashRegister.vendor_day_costs);

    const response = {
      id: cashRegister.id,
      client_id: cashRegister.client_id,
      client_name: cashRegister.client ? cashRegister.client.name : null,
      vendor_id: cashRegister.vendor_id,
      vendor_name: cashRegister.vendor ? cashRegister.vendor.name : null,
      date: cashRegister.date ? formatDate(cashRegister.date) : null,
      bill_id: cashRegister.bill_id,
      bill_value: cashRegister.bill_value,
      vendor_day_costs: cashRegister.vendor_day_costs,
      profit,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

export default router;
