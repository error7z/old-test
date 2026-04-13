const nodemailer = require('nodemailer');
const { SocksProxyAgent } = require('socks-proxy-agent');

// --- QUANTUM IDENTITY MATRIX (For Algorithm Evasion) ---
const osList = [
    'Windows NT 10.0; Win64; x64', 
    'Macintosh; Intel Mac OS X 10_15_7', 
    'X11; Linux x86_64', 
    'iPhone; CPU iPhone OS 17_4 like Mac OS X'
];
const engineList = [
    'AppleWebKit/537.36 (KHTML, like Gecko)', 
    'Gecko/20100101 Firefox/124.0', 
    'Version/17.0 Safari/537.36'
];
const chromeVers = ['121.0.0.0', '122.0.0.0', '123.0.0.0', '124.0.6367.60'];

function getHighRepIdentity() {
    const os = osList[Math.floor(Math.random() * osList.length)];
    const eng = engineList[Math.floor(Math.random() * engineList.length)];
    const ver = chromeVers[Math.floor(Math.random() * chromeVers.length)];
    
    return {
        userAgent: `Mozilla/5.0 (${os}) ${eng} Chrome/${ver}`,
        msgId: `<${Math.random().toString(36).substring(2, 12)}.${Math.random().toString(36).substring(2, 8)}@mail.gmail.com>`,
        threadId: `thread-f:${Math.floor(Math.random() * 1e18)}`,
        boundary: `----=_Part_${Math.floor(Math.random() * 1000000)}_${Math.random().toString(36).substring(2, 8)}`
    };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { smtpConfig, mailData, proxy } = req.body;
  const id = getHighRepIdentity();

  // --- MANDATORY PROXY ENFORCEMENT ---
  // This ensures your real IP is never leaked if the proxy config is missing
  if (!proxy || !proxy.host || !proxy.port) {
    return res.status(400).json({ 
        success: false, 
        error: "CRITICAL: No Proxy provided. Request blocked to prevent IP leak." 
    });
  }

  // Establish SOCKS5 Tunnel
  const auth = (proxy.user && proxy.pass) ? `${proxy.user}:${proxy.pass}@` : '';
  const proxyUrl = `socks5://${auth}${proxy.host}:${proxy.port}`;
  const agent = new SocksProxyAgent(proxyUrl);

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port),
    secure: parseInt(smtpConfig.port) === 465, 
    auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    pool: false, 
    timeout: 12000,           // Increased timeout for proxy overhead
    connectionTimeout: 12000,
    agent: agent              // FORCED: The connection MUST go through the proxy
  });

  try {
    // Execute high-reputation send
    await transporter.sendMail({
      from: `"${mailData.fromName}" <${smtpConfig.user}>`,
      to: mailData.to,
      subject: mailData.subject,
      html: mailData.html,
      headers: {
        'User-Agent': id.userAgent,
        'Message-ID': id.msgId,
        'X-Gmail-Thread-ID': id.threadId,
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'Microsoft Outlook 16.0', 
        'X-Entity-Ref-ID': Math.random().toString(36).substring(2, 10),
        'List-Unsubscribe': `<mailto:unsub-${Math.random().toString(36).substring(2)}@gmail.com>`
      }
    });

    return res.status(200).json({ 
        success: true, 
        status: `Sent via ${proxy.host}` 
    });
  } catch (error) {
    console.error("Transmission Error:", error.message);
    // Returns full error so the frontend logic can detect 'auth' or 'timeout' errors
    return res.status(500).json({ success: false, error: error.message });
  }
}
