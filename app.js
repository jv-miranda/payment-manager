import express from 'express';
import basicAuthMiddleware from './middlewares/auth.js';
import loginRoute from './routes/login.js';

const app = express();

app.use(express.json());
app.use(loginRoute);
app.use(basicAuthMiddleware);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal server error.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
