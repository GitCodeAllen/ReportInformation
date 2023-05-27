const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let serverData = {};

app.post('/report', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const clientData = req.body;

    // check if hostname is present and not empty
    if (!clientData.hostname || clientData.hostname.trim() === '') {
        return res.status(400).send('Invalid data: hostname is required');
    }
    
    const timestamp = Date.now();
    serverData[clientData.hostname] = {
        clientReported: clientData,
        serverAdded: {
            publicIp: clientIp,
            reportTime: timestamp,
            serverTime: new Date().toLocaleString()
        }
    };
    res.send('Data received');
});

app.get('/data', (req, res) => {
    if (req.query.hostname) {
        const hostnameData = serverData[req.query.hostname];
        if (hostnameData) {
            res.json(hostnameData);
        } else {
            res.status(404).send('No data found for the specified hostname');
        }
    } else {
        res.json(serverData);
    }
});

app.listen(3000, () => console.log('Server listening on port 3000'));
