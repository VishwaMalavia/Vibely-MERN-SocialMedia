const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create transporter with Gmail settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

    const message = {
      from: `"Social-X" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${options.subject}</h2>
        <p>${options.message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from Social-X.</p>
      </div>`
    };

    console.log('Attempting to send email to:', options.email);
    console.log('Email configuration:', {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      user: process.env.EMAIL_USER
    });

    const result = await transporter.sendMail(message);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = sendEmail; 