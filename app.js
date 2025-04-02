import cors from 'cors';
import express from 'express';
import basicAuthMiddleware from './middlewares/auth.js';
import billRoute from './routes/bill.js';
import billsRoute from './routes/bills.js';
import cashRegisterRoute from './routes/cashRegister.js';
import cashRegistersRoute from './routes/cashRegisters.js';
import clientRoute from './routes/client.js';
import clientsRoute from './routes/clients.js';
import loginRoute from './routes/login.js';
import paymentReportRoute from './routes/paymentReport.js';
import validateCpfRoute from './routes/validadeCpf.js';
import validateNameRoute from './routes/validateName.js';
import validateTelephoneRoute from './routes/validateTelephone.js';
import vendorRoute from './routes/vendor.js';
import vendorsRoute from './routes/vendors.js';

const app = express();

app.use(cors());

app.use(express.json());

app.use(basicAuthMiddleware);

app.use(loginRoute);
app.use(vendorsRoute);
app.use(vendorRoute);
app.use(clientRoute);
app.use(validateCpfRoute);
app.use(validateTelephoneRoute);
app.use(billsRoute);
app.use(billRoute);
app.use(clientsRoute);
app.use(cashRegisterRoute);
app.use(cashRegistersRoute);
app.use(paymentReportRoute);
app.use(validateNameRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal server error.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
