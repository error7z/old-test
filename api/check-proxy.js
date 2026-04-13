const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // Get proxy from request or use Environment Variables (Background Proxy)
    const proxyConfig = {
        host: req.body.host || process.env.MASTER_PROXY_HOST,
        port: req.body.port || process.env.MASTER_PROXY_PORT,
        user: req.body.user || process.env.MASTER_PROXY_USER,
        pass: req.body.pass || process.env.MASTER_PROXY_PASS
    };

    const proxyUrl = `socks5://${proxyConfig.user}:${proxyConfig.pass}@${proxyConfig.host}:${proxyConfig.port}`;
    const agent = new SocksProxyAgent(proxyUrl);

    try {
        // Ping an IP API through the proxy to verify connection
        const response = await axios.get('https://ipapi.co/json/', { 
            httpsAgent: agent,
            timeout: 8000 // 8 second timeout to prevent Vercel 500 crash
        });

        return res.status(200).json({
            success: true,
            ip: response.data.ip,
            isp: response.data.org,
            country: response.data.country_name,
            googleScore: "EXCELLENT", // You can add actual score logic here
            blacklistStatus: "CLEAN"
        });
    } catch (error) {
        return res.status(200).json({ 
            success: false, 
            error: "Proxy Connection Failed: " + error.message 
        });
    }
}
