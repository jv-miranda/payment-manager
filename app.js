import express from 'express';
import basicAuthMiddleware from './middlewares/auth.js';
import clientRoute from './routes/client.js';
import loginRoute from './routes/login.js';
import validateCpfRoute from './routes/validadeCpf.js';
import validateTelephoneRoute from './routes/validateTelephone.js';
import vendorRoute from './routes/vendor.js';
import vendorsRoute from './routes/vendors.js';

const app = express();

app.use(express.json());

app.use(basicAuthMiddleware);

app.use(loginRoute);
app.use(vendorsRoute);
app.use(vendorRoute);
app.use(clientRoute);
app.use(validateCpfRoute);
app.use(validateTelephoneRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal server error.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
