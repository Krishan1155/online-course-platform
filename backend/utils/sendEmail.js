import nodemailer from 'nodemailer';

export const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return Boolean(user && pass);
};

const sendEmail = async ({ email, subject, html }) => {
  if (!isEmailConfigured()) {
    throw new Error(
      'Email is not configured. Check EMAIL_USER and EMAIL_PASS in .env'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

export default sendEmail;