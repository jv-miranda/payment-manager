import { PrismaClient } from '@prisma/client';
import express from 'express';
import basicAuthMiddleware from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const isValidCPF = cpf => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const cpfArray = cpf.split('').map(digit => parseInt(digit));
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpfArray[i] * (10 - i);
  }
  let firstVerifyingDigit = sum % 11;
  firstVerifyingDigit = firstVerifyingDigit < 2 ? 0 : 11 - firstVerifyingDigit;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpfArray[i] * (11 - i);
  }
  let secondVerifyingDigit = sum % 11;
  secondVerifyingDigit = secondVerifyingDigit < 2 ? 0 : 11 - secondVerifyingDigit;
  return firstVerifyingDigit === cpfArray[9] && secondVerifyingDigit === cpfArray[10];
};

router.post('/validate_cpf', basicAuthMiddleware, async (req, res) => {
  try {
    const { table, cpf } = req.body;
    if (!table || !cpf) {
      return res.status(400).json({ valid: false, message: 'Parâmetros inválidos.' });
    }
    if (!isValidCPF(cpf)) {
      return res.status(400).json({ valid: false, message: 'CPF inválido.' });
    }
    const record = await prisma[table].findUnique({
      where: { cpf: cpf.replace(/\D/g, '') },
    });
    if (record) {
      return res.json({ valid: false, message: 'CPF já existe no sistema.' });
    }
    return res.json({ valid: true, message: 'CPF válido e não cadastrado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ valid: false, message: 'Erro interno no servidor.' });
  }
});

export default router;
