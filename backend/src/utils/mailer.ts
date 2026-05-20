import nodemailer from 'nodemailer';

// Create a transporter using Ethereal email or real SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string, attachments: any[] = []) => {
  try {
    const info = await transporter.sendMail({
      from: `"InvoicePro" <${process.env.SMTP_USER || 'no-reply@invoicepro.tn'}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log('Message sent: %s', info.messageId);
    
    // Preview only available when sending through an Ethereal account
    if (process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
