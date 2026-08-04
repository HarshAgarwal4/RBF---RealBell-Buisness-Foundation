import { sendMail } from "./mail.js";

let otpStorage = new Map()

function genereateOTP() {
    return Math.floor(100000 + Math.random() * 900000)
}

async function sendOtp(email) {
    if (!email) return false
    const otp = genereateOTP()
    if (otpStorage.has(email)) otpStorage.delete(email)
    otpStorage.set(email, otp)
    setTimeout(() => {
        otpStorage.delete(email)
    }, 5 * 60 * 1000);
    let html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Verify Your Email</title>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
        <tr>
            <td align="center">

                <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">

                    <!-- Header -->
                    <tr>
                        <td align="center"
                            style="background:#9d1d27;padding:35px 20px;color:#ffffff;">
                            <h1 style="margin:0;font-size:30px;font-weight:bold;">
                                RealBell Business Foundation
                            </h1>
                            <p style="margin:10px 0 0;font-size:15px;opacity:.9;">
                                Empowering Businesses • Supporting Entrepreneurs
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:45px 40px;color:#333333;">

                            <h2 style="margin-top:0;font-size:26px;color:#9d1d27;">
                                Email Verification
                            </h2>

                            <p style="font-size:16px;line-height:1.8;">
                                Hello,
                            </p>

                            <p style="font-size:16px;line-height:1.8;">
                                Thank you for registering with
                                <strong>RealBell Business Foundation (RBF)</strong>.
                                To complete your verification, please use the One-Time Password (OTP) below.
                            </p>

                            <!-- OTP -->
                            <div style="margin:35px 0;text-align:center;">
                                <div style="
                                    display:inline-block;
                                    padding:18px 40px;
                                    background:#fdf1f2;
                                    border:2px dashed #9d1d27;
                                    border-radius:10px;
                                    font-size:36px;
                                    font-weight:bold;
                                    letter-spacing:10px;
                                    color:#9d1d27;">
                                    ${otp}
                                </div>
                            </div>

                            <p style="text-align:center;font-size:15px;color:#666;">
                                This OTP is valid for
                                <strong>5 minutes</strong>.
                            </p>

                            <hr style="border:none;border-top:1px solid #eeeeee;margin:35px 0;">

                            <div style="
                                background:#fff7f7;
                                border-left:4px solid #9d1d27;
                                padding:18px;
                                border-radius:6px;">

                                <strong style="color:#9d1d27;">
                                    Security Notice
                                </strong>

                                <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:#555;">
                                    Never share this OTP with anyone.
                                    RealBell Business Foundation will never ask
                                    for your OTP via phone, email, or message.
                                </p>

                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background:#fafafa;
                            padding:25px 35px;
                            text-align:center;
                            color:#777777;
                            font-size:13px;
                            line-height:1.8;">

                            © ${new Date().getFullYear()} RealBell Business Foundation.
                            <br>
                            All Rights Reserved.
                            <br><br>

                            If you didn't request this verification,
                            you can safely ignore this email.

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>

</html>
`;
    try {
        let r = await sendMail(
    email,
    "Your Verification OTP - RealBell Business Foundation",
    html
);
        if (!r) return false
        else return true
    } catch (err) {
        console.log(err)
        return false
    }
}

async function verifyOtp(email, otp) {
    if (!email || !otp) return false
    if (!otpStorage.has(email)) return false
    let storedOTP = otpStorage.get(email)
    if (String(storedOTP) !== String(otp)) return false
    otpStorage.delete(email)
    return true
}

export { sendOtp, verifyOtp }