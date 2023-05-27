const axios = require('axios');
const os = require('os');

const sendDataToServer = async () => {
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

    await axios.post('http://localhost:3000/report', data);
};

setInterval(sendDataToServer, 6000); // send data every minute