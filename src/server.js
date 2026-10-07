require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter, authLimiter } = require('./middleware/security');

const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) =>
  res.json({ ok: true, service: 'motora-api', time: new Date().toISOString() }),
);

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/client', require('./routes/client'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/smart', require('./routes/smart'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wishlist', require('./routes/wishlist'));

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;

connectDB()
  .then(() =>
    app.listen(port, () => console.log(`Motora API running on port ${port}`)),
  )
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
