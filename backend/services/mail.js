import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.myGMAIL,
        pass: process.env.password
    }
})

async function sendMail(to, subject, text, attachments = []) {
    const mailOptions = {
        from: `"RealBell Business Foundation" <${process.env.myGMAIL}>`,
        to: to,
        subject: subject,
        html: text,
    };
    if (Array.isArray(attachments) && attachments.length > 0) {
        mailOptions.attachments = attachments.map((att) => ({
            filename: att.file_name || att.filename || 'attachment',
            path: att.url || att.path,
        }));
    }
    try {
        let r = await transporter.sendMail(mailOptions)
        if (!r) return false
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

export {sendMail}