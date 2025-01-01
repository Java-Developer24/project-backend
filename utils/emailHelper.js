import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service provider
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or application-specific password
  },
});

// Function to send email verification email
export const sendVerificationEmail = async (to, verificationLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to, // Recipient's email address
    subject: 'Please verify your email address',
    html: `
      <h3>Welcome to our platform!</h3>
      <p>To complete your registration, please click the link below:</p>
      <a href="${verificationLink}" target="_blank">Verify Your Email</a>
      
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email sending failed');
  }
};


// Function to send OTP email 

export const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP is: ${otp}`,
  };
  return transporter.sendMail(mailOptions);
};