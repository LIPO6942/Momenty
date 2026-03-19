const http = require('http');

const data = JSON.stringify({
    userEmail: 'test@example.com',
    placeName: 'Test Restaurant',
    cityName: 'Paris',
    dishName: 'Test Dish'
    // category defaults to 'restaurants'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sync-kol-youm',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
