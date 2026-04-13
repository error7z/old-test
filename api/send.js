const nodemailer = require('nodemailer');
const { SocksProxyAgent } = require('socks-proxy-agent');

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { smtpConfig, mailData } = req.body;

  // 1. Pull the Master Proxy from Vercel Environment Variables
  const mHost = process.env.MASTER_PROXY_HOST;
  const mPort = process.env.MASTER_PROXY_PORT;
  const mUser = process.env.MASTER_PROXY_USER;
  const mPass = process.env.MASTER_PROXY_PASS;

  let agent = null;
  
  // 2. Force the connection through the Master Proxy
  if (mHost && mPort) {
    const proxyAuth = (mUser && mPass) ? `${mUser}:${mPass}@` : '';
    // Use socks5h for DNS resolution via proxy to prevent Vercel leaks
    agent = new SocksProxyAgent(`socks5h://${proxyAuth}${mHost}:${mPort}`);
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port),
    secure: parseInt(smtpConfig.port) === 465, 
    auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    pool: false, 
    timeout: 12000, // Increased for residential proxy lag
    connectionTimeout: 12000,
    ...(agent && { agent }) 
  });

  try {
    const info = await transporter.sendMail({
      from: `"${mailData.fromName}" <${smtpConfig.user}>`,
      to: mailData.to,
      subject: mailData.subject,
      html: mailData.html,
      headers: {
        'X-Mailer': 'Microsoft Outlook 16.0',
        'X-Priority': '1 (Highest)'
      }
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Blast Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
