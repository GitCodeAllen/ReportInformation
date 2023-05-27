const axios = require('axios');
const os = require('os');
const dns = require('dns');
const util = require('util');
const lookup = util.promisify(dns.lookup);
const { client } = require('./config.json');

let serverIp = '';

async function main() {
    await getIpFromDomain();
    setInterval(sendDataToServer, client.report_interval);
    setInterval(getIpFromDomain, client.server_refresh_interval);
}

async function getIpFromDomain() {
    try {
        const { address } = await lookup(client.server_host);
        console.log(`IP address: ${address}`);
        serverIp = address;
    } catch (err) {
        console.error(err);
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

    await axios.post(`http://${serverIp}:${client.server_port}/report`, data);
};

main();