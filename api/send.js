const nodemailer = require('nodemailer');
const { SocksProxyAgent } = require('socks-proxy-agent');

export default async function handler(req, res) {
    const { smtpConfig, mailData, proxy } = req.body;

    // Build the Proxy Agent
    const proxyUrl = `socks5://${proxy.user}:${proxy.pass}@${proxy.host}:${proxy.port}`;
    const agent = new SocksProxyAgent(proxyUrl);

    // Create Transporter with a 15-second timeout
    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: true, // true for 465, false for 587
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
        },
        timeout: 15000, // 15 seconds
        connectionTimeout: 15000,
        proxy: proxyUrl // Some versions of nodemailer support this directly
    });

    try {
        await transporter.sendMail({
            from: `"${mailData.fromName}" <${smtpConfig.user}>`,
            to: mailData.to,
            subject: mailData.subject,
            html: mailData.html,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(200).json({ 
            success: false, 
            error: error.code === 'ETIMEDOUT' ? 'Proxy/SMTP Timeout' : error.message 
        });
    }
}
