const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.sendinblue.com',
    port: process.env.BREVO_SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

// Send magic link email
const sendMagicLinkEmail = async (email, department, magicLinkUrl) => {
    const mailOptions = {
        from: `"NMK Intern Management - ${department}" <${process.env.EMAIL_FROM || 'noreply@nmk.org'}>`,
        to: email,
        subject: 'Your NMK Intern Management Login Link',
        html: `<p>Hello ${department} Staff,</p>
               <p>You recently requested a login link for the NMK Intern Management System.</p>
               <p><a href="${magicLinkUrl}">Click here to log in</a></p>
               <p>This link is valid for 15 minutes.</p>
               <p>If you did not request this, please ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Magic link sent to ${email} for department ${department}`);
};

module.exports = { sendMagicLinkEmail };