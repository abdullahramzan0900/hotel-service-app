import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

async function testEmail() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: node testEmail.js youremail@example.com');
    process.exit(1);
  }

  console.log('Using these SMTP settings:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  From:', process.env.SMTP_FROM);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully.');
  } catch (err) {
    console.error('❌ SMTP connection failed:', err.message);
    process.exit(1);
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: 'Grand Sapphire Hotel - Test Email',
      text: 'If you are reading this, your SMTP email setup is working correctly!'
    });
    console.log(`✅ Test email sent successfully to ${to}. Check your inbox (and spam folder).`);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    process.exit(1);
  }
}

testEmail();
