import nodemailer from 'nodemailer';

export const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return Boolean(
    process.env.EMAIL_HOST &&
      user &&
      pass &&
      user !== 'your_email@gmail.com' &&
      pass !== 'your_app_password'
  );
};

const sendEmail = async ({ email, subject, html }) => {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env.');
  }

  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
