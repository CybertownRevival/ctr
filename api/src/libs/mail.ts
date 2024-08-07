import nodemailer from 'nodemailer';

export const sendEmail = async (data): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 25,
    //host: 'mailhog', // used for dev
    //port: 1025, // used for dev
    secure: false,
    tls: {
      rejectUnauthorized:false,
    },
  });

  await transporter.sendMail({
    from: 'Cybertown Revival <donotreply@cybertownrevival.com>',
    to: data.to,
    subject: data.subject,
    html: data.body,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject:  'Cybertown Revival Password Reset',
    body:
      `<p>Hello,</p>
      <p>
        We have received a request to reset the password on your account.
        Please click the link below to reset your password. If you did not request this,
        please ignore this email
      </p>
      <p>
        <a href='https://www.cybertownrevival.com/#/password_reset?token=${resetToken}'>
          Reset my password
        </a>
      </p>
      <p>This link will expire in 15 minutes.</p>`,
  });
};

export const sendPasswordResetUnknownEmail = async (email: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Cybertown Revival Password Reset',
    body:
      `<p>Hello,</p>
      <p>Sorry, we were unable to find an account attached to this email address.</p>`,
  });
};
