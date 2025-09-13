// FILE: utils/email.util.js (Corrected and Hardened)

const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

const generatePassHTML = (visit, visitor, qrCodeDataUri, selfieDataUri) => {
    // Use optional chaining (?.) and provide default values ('N/A') to prevent errors
    const scheduledDate = new Date(visit?.scheduled_at).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const scheduledTime = new Date(visit?.scheduled_at).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
            <div style="text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #333;">Visitor Entry Pass</h1>
                <p style="font-size: 1.1em; color: #555;">${visit?.companyName || 'Innovate Corp'}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; vertical-align: top; width: 150px;">
                        <img src="${selfieDataUri}" alt="Visitor Selfie" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid #007bff;">
                    </td>
                    <td style="padding: 10px; vertical-align: top;">
                        <h2 style="color: #007bff; margin-top: 0;">${visitor?.name || 'Guest Name'}</h2>
                        <p style="margin: 5px 0; color: #555;"><strong>Organization:</strong> ${visitor?.organization || 'N/A'}</p>
                        <p style="margin: 5px 0; color: #555;"><strong>Phone:</strong> ${visitor?.phone || 'N/A'}</p>
                        <p style="margin: 5px 0; color: #555;"><strong>Host:</strong> ${visit?.hostName || 'N/A'}</p>
                        <p style="margin: 5px 0; color: #555;"><strong>Purpose:</strong> ${visit?.purpose || 'N/A'}</p>
                    </td>
                </tr>
            </table>

            <div style="text-align: center; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
                <h3 style="color: #333;">Scan this QR Code at the entry point</h3>
                <img src="${qrCodeDataUri}" alt="Visit Pass QR Code" style="width: 200px; height: 200px; margin-top: 10px;">
                <p style="margin-top: 10px; font-size: 1.2em; color: #333; font-weight: bold; letter-spacing: 2px;">
                    Pass Code: ${visit?.pass_code || 'N/A'}
                </p>
                <p style="margin-top: 10px; color: #555;">
                    <strong>Date:</strong> ${scheduledDate}<br>
                    <strong>Time:</strong> ${scheduledTime}
                </p>
            </div>
        </div>
    `;
};

const sendVisitPass = async (visit, visitor) => {
    // --- VITAL DEBUG LOGS ---
    console.log('--- ATTEMPTING TO GENERATE AND SEND PASS ---');
    console.log('Visit Object Received:', JSON.stringify(visit, null, 2));
    console.log('Visitor Object Received:', JSON.stringify(visitor, null, 2));

    if (!visit || !visitor) {   
        console.error("ERROR: Cannot send pass, visit or visitor data is missing.");
        return;
    }
    console.log(visit)
    console.log(visitor)
    try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const qrCodeDataUri = await qrcode.toDataURL(visit.pass_code || '');
        
        let selfieDataUri = 'https://i.imgur.com/835tI3m.png'; // A better default placeholder
        if (visitor.selfie && visitor.selfie.data) {
            selfieDataUri = `data:${visitor.selfie.contentType};base64,${visitor.selfie.data.toString('base64')}`;
        }

        const htmlBody = generatePassHTML(visit, visitor, qrCodeDataUri, selfieDataUri);

        const info = await transporter.sendMail({
            from: '"Visitor Management System" <noreply@vms.com>',
            to: visitor.email,
            subject: `Your Visitor Pass for ${visit.hostName}`,
            html: htmlBody,
        });

        console.log('Email sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('--- FAILED TO SEND EMAIL ---');
        console.error(error);
    }
};

module.exports = { sendVisitPass };