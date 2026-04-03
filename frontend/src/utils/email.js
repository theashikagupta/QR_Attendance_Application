const nodemailer = require('nodemailer');

const createTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    console.warn('SMTP is not fully configured; emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const sendMail = async ({ to, subject, html }) => {
  const transport = createTransport();
  if (!transport) return;

  const fromName = process.env.SMTP_FROM_NAME || 'QR Attendance Admin';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
  });
};

const sendTeacherCredentialsEmail = async ({ to, name, password }) => {
  const subject = 'Your Teacher Account Credentials';
  const html = `
    <p>Dear ${name},</p>
    <p>Your teacher account has been created for the QR-based attendance system.</p>
    <p><strong>Email:</strong> ${to}<br/>
    <strong>Temporary password:</strong> ${password}</p>
    <p>Please log in and change your password as soon as possible.</p>
  `;

  await sendMail({ to, subject, html });
};

const sendStudentStatusEmail = async ({ to, name, status }) => {
  const subject = 'Update to Your Attendance Status';
  const readable = status.toLowerCase();
  const html = `
    <p>Dear ${name},</p>
    <p>Your attendance status has been updated to: <strong>${readable}</strong>.</p>
    <p>If you think this is a mistake, please contact your department or admin.</p>
  `;

  await sendMail({ to, subject, html });
};

module.exports = {
  sendTeacherCredentialsEmail,
  sendStudentStatusEmail,
};
