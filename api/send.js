const nodemailer = require('nodemailer');
const { SocksProxyAgent } = require('socks-proxy-agent');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { smtpConfig, mailData } = req.body;

  // These must match your Vercel Environment Variables exactly
  const mHost = process.env.MASTER_PROXY_HOST;
  const mPort = process.env.MASTER_PROXY_PORT;
  const mUser = process.env.MASTER_PROXY_USER;
  const mPass = process.env.MASTER_PROXY_PASS;

  let agent = null;
  if (mHost && mPort) {
    const proxyAuth = (mUser && mPass) ? `${mUser}:${mPass}@` : '';
    // Use socks5h to ensure DNS also goes through your Comcast IP
    agent = new SocksProxyAgent(`socks5h://${proxyAuth}${mHost}:${mPort}`);
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port),
    secure: parseInt(smtpConfig.port) === 465, 
    auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    pool: false, 
    timeout: 15000, 
    connectionTimeout: 15000,
    ...(agent && { agent }) 
  });

  try {
    const info = await transporter.sendMail({
      from: `"${mailData.fromName}" <${smtpConfig.user}>`,
      to: mailData.to,
      subject: mailData.subject,
      html: mailData.html
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    // This sends the actual error back to your UI log
    return res.status(500).json({ success: false, error: error.message });
  }
}
