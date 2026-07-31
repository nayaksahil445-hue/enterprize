import nodemailer from 'nodemailer';

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

/**
 * Send Email utility using Nodemailer
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} [options.name] - Recipient name
 */
export const sendOtpEmail = async ({ email, subject, otp, name = 'User' }) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || (user ? `"Jagannath Enterprises" <${user}>` : '"Jagannath Enterprises" <no-reply@jagannath.com>');

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; background-color: #0b0b0b; color: #e8e8e8; border: 1px solid #333; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="background: linear-gradient(135deg, #141414, #1f1f1f); padding: 25px; text-align: center; border-bottom: 2px solid #c9a227;">
        <h2 style="color: #c9a227; margin: 0; font-size: 24px; letter-spacing: 1px;">JAGANNATH ENTERPRISES</h2>
        <p style="color: #888; margin: 5px 0 0 0; font-size: 13px;">Industrial Furniture & Solutions</p>
      </div>
      <div style="padding: 30px; line-height: 1.6;">
        <h3 style="color: #ffffff; margin-top: 0;">Password Reset Request</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password for your account associated with <strong>${email}</strong>.</p>
        <p>Your 6-digit Verification OTP code is:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #c9a227; background: #181818; padding: 14px 28px; border-radius: 8px; border: 1px dashed #c9a227;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 13px; color: #aaa;">This OTP is valid for <strong>10 minutes</strong>. Do not share this OTP code with anyone for your security.</p>
        <p style="font-size: 13px; color: #aaa;">If you did not request a password reset, please ignore this email.</p>
      </div>
      <div style="background-color: #121212; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #222;">
        &copy; ${new Date().getFullYear()} Jagannath Enterprises. All rights reserved.
      </div>
    </div>
  `;

  // Always log OTP to server console for testing convenience
  console.log(`\n==================================================`);
  console.log(`[PASSWORD RESET OTP] For: ${email}`);
  console.log(`[OTP CODE]: ${otp}`);
  console.log(`==================================================\n`);

  const isDevMode = process.env.NODE_ENV !== 'production';

  if (!user || !pass) {
    const errorMsg = '[SMTP ERROR] SMTP credentials are missing in server environment.';
    console.error(errorMsg);
    if (isDevMode) {
      console.log('[SMTP INFO] SMTP credentials not provided in .env. OTP printed to server console for dev testing.');
      return { success: true, simulated: true };
    }
    throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS. If you are using Gmail, use a 16-character app password instead of your normal password.');
  }

  try {
    let transporter;
    let lastError;

    for (const opts of buildTransportOptions({ host, port, user, pass })) {
      transporter = nodemailer.createTransport(opts);
      try {
        await transporter.verify();
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[SMTP WARN] Transport verify failed for ${opts.host}:${opts.port} (${opts.secure ? 'SSL' : 'TLS'}): ${err.message}`);
        transporter = null;
      }
    }

    if (!transporter) {
      const msg = lastError?.message || 'SMTP transport verification failed';
      throw new Error(msg);
    }

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: subject || 'Password Reset OTP - Jagannath Enterprises',
      html: htmlContent
    });

    console.log(`[SMTP SUCCESS] OTP Email sent successfully to ${email}`);
    return { success: true, sent: true };
  } catch (error) {
    console.error('[SMTP ERROR] Failed to send email via SMTP:', error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};
