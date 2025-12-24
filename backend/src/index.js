// src/index.js
'use strict';
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const routes  = require('./routes');
const cookieParser = require('cookie-parser');
const NODE_ENV    = process.env.NODE_ENV || 'development';
const PORT        = parseInt(process.env.PORT, 10) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const { webhookController } = require('./controllers/subscriptionController');



const app = express();

console.log('Starting server with config:', { NODE_ENV, PORT, CORS_ORIGIN });

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookController
);

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(cookieParser());

app.use(express.json());

if (NODE_ENV !== 'test') {
  app.use(morgan('tiny'));
}

const personalizeRoutes = require('../src/routes');
app.use('/api/personalize', personalizeRoutes);




app.get('/health', (_req, res) => res.json({ status: 'OK' }));


app.use('/api', routes);

if (NODE_ENV === "development") {
  console.log("⚡ Dev mode: Proxying frontend to Vite dev server");

  const { createProxyMiddleware } = require("http-proxy-middleware");

  app.use(
    (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/health") ||
        req.path.startsWith("/webhooks")
      ) {
        return next();
      }
      return next("route");
    },
    createProxyMiddleware({
      target: "http://localhost:5173",
      changeOrigin: true,
      ws: true
    })
  );
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
});


app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
      console.log(`✔️  Server running in ${NODE_ENV} mode on port ${PORT} (bound to 0.0.0.0)`);
     });
