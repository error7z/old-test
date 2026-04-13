const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

export default async function handler(req, res) {
    // If the user didn't type a proxy in the UI, use the MASTER ones from Vercel settings
    const host = req.body.host || process.env.MASTER_PROXY_HOST;
    const port = req.body.port || process.env.MASTER_PROXY_PORT;
    const user = req.body.user || process.env.MASTER_PROXY_USER;
    const pass = req.body.pass || process.env.MASTER_PROXY_PASS;

    const proxyUrl = `socks5://${user}:${pass}@${host}:${port}`;
    const agent = new SocksProxyAgent(proxyUrl);

    try {
        const response = await axios.get('https://ipapi.co/json/', { 
            httpsAgent: agent,
            timeout: 5000 
        });

        res.status(200).json({
            success: true,
            ip: response.data.ip,
            isp: response.data.org
        });
    } catch (error) {
        res.status(200).json({ success: false, error: "Connect Failed" });
    }
}
