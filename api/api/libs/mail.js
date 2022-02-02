const nodemailer = require("nodemailer");

exports.sendEmail = async (data) => {
    let transporter = nodemailer.createTransport({
        host: '127.0.0.1',
        port: 25,
        secure: false,
        tls: {
            rejectUnauthorized:false
        }
    });

    await transporter.sendMail({
        from: 'Cybertown Revival <donotreply@s1.cybertown.customerdns.com>',
        to: data.to,
        subject: data.subject,
        html: data.body
    });
}

