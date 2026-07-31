import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

const getBooleanEnv = (value, fallback = false) => {
  if (typeof value === 'undefined' || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const buildTransportOptions = ({ host, port, user, pass }) => {
  const parsedPort = Number(port || 587);
  const secure = getBooleanEnv(process.env.SMTP_SECURE, parsedPort === 465);
  const requireTls = getBooleanEnv(process.env.SMTP_REQUIRE_TLS, true);
  const rejectUnauthorized = getBooleanEnv(process.env.SMTP_REJECT_UNAUTHORIZED, false);

  const baseConfig = {
    auth: { user, pass },
    authMethod: 'LOGIN',
    requireTLS: requireTls,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized,
      minVersion: 'TLSv1.2'
    },
    family: 4
  };

  const options = [];

  if (host) {
    options.push({
      ...baseConfig,
      host,
      port: parsedPort,
      secure
    });
  }

  options.push({
    ...baseConfig,
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false
  });

  options.push({
    ...baseConfig,
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true
  });

  return options;
};

// GET /api/debug/smtp
router.get('/smtp', async (req, res) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return res.status(400).json({ ok: false, error: 'SMTP_USER or SMTP_PASS not set in environment' });
  }

  let lastError = null;

  for (const opts of buildTransportOptions({ host, port, user, pass })) {
    const transporter = nodemailer.createTransport(opts);
    try {
      await transporter.verify();
      return res.json({ ok: true, host: opts.host || 'smtp.gmail.com', port: opts.port, secure: !!opts.secure });
    } catch (err) {
      lastError = err;
    }
  }

  return res.status(502).json({ ok: false, error: lastError?.message || 'All SMTP transports failed' });
});

export default router;
