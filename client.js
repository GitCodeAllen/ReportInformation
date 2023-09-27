const axios = require('axios');
const os = require('os');
const dns = require('dns');
const util = require('util');
const net = require('net');
const lookup = util.promisify(dns.lookup);
const { client } = require('./config.json');

let serverIp = '';

async function main() {
    await getIpFromDomain();
    setInterval(sendDataToServer, client.report_interval);
    setInterval(getIpFromDomain, client.server_refresh_interval);
}

function logWithTimestamp(message) {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${message}`);
}

async function getIpFromDomain() {
    try {
        // 如果是IP地址，直接返回
        if(net.isIPv4(client.server_host) || net.isIPv6(client.server_host)) {
            serverIp = client.server_host;
            return;
        }
        const { address } = await lookup(client.server_host);
        logWithTimestamp(`IP address: ${address}`);
        serverIp = address;
    } catch (err) {
        logWithTimestamp(err);
    }
}

const sendDataToServer = async () => {
    if (serverIp.length === 0) {
        return;
    }
    const networkInterfaces = os.networkInterfaces();
    const data = {
        hostname: os.hostname(),
        networkInterfaces: [],
    };
    
    for (let interfaceName in networkInterfaces) {
        for (let interfaceInfo of networkInterfaces[interfaceName]) {
            if ('IPv4' !== interfaceInfo.family || interfaceInfo.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                continue;
            }
            data.networkInterfaces.push({
                name: interfaceName,
                ip: interfaceInfo.address,
                mac: interfaceInfo.mac,
            });
        }
    }

    try{
        await axios.post(`http://${serverIp}:${client.server_port}/report`, data);
    }catch(e){
        if (e.isAxiosError && e.code) {
            logWithTimestamp(`网络错误：${e.code}`);
        } else {
            logWithTimestamp(e.message);
        }
    }
};

main();