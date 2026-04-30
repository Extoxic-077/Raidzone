const nodemailer = require('nodemailer');
const { mail } = require('../config/env');

const transporter = nodemailer.createTransport({
  host:   mail.host,
  port:   mail.port,
  secure: mail.secure,
  auth:   { user: mail.user, pass: mail.pass },
});

function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from:    mail.from,
    to,
    subject: 'Your RAIDZONE verification code',
    text:    `Your code is ${code}. It expires in 10 minutes.`,
    html:    `<p>Your RAIDZONE code is <strong>${code}</strong>.</p><p>Expires in 10 minutes.</p>`,
  });
}

async function sendOrderConfirmation(to, order) {
  await transporter.sendMail({
    from:    mail.from,
    to,
    subject: `RAIDZONE — Order #${order._id} confirmed`,
    text:    `Your order has been confirmed. Total: $${order.totalAmount}`,
    html:    `<p>Order <strong>#${order._id}</strong> confirmed. Total: <strong>$${order.totalAmount}</strong></p>`,
  });
}

module.exports = { sendOtpEmail, sendOrderConfirmation, maskEmail };
