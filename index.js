const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs'); // For reading files.
const config = require('./config');

const httpServer = http.createServer((req, res) => commonServer(req, res));

const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem'),
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => commonServer(req, res));

httpServer.listen(config.httpPort, () => {
    console.log(`Server listening on port: ${config.httpPort} in ${config.envName}`);
});

httpsServer.listen(config.httpsPort, () => {
    console.log(`Server listening on port: ${config.httpsPort} in ${config.envName}`);
});

let visitorCounter = 0;

const commonServer = (req, res) => {
    visitorCounter += 1;

    // Parse request's url, second parameter is a bool to parse the querystring data using the querystring module
    const parsedUrl = url.parse(req.url, true);

    // Get the pathname (all path before queries with ? or #).
    const { pathname } = parsedUrl;

    // Trim the slashes at the start and end of the path
    const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');

    // Get the HTTP method. Lower or Uppercased always to keep consistency
    const method = req.method.toLowerCase();

    // Get the query string as an object
    /* NOTE: Query has doesn't have object prototype (i.e it has null as prototype), so it doesn't have toString method,
     * thus it can't be used with `${}` becouse it tries to do a toString() or a Symbol.toPrimitive if the object doesn't have toString.
     * NOTE2: It's better to print objects without `${}`, becouse it shows all the content instead of things like [Object object]
     */
    const { query } = parsedUrl;

    // Get the headers as an object
    const { headers } = req;

    // Get payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => buffer += decoder.write(data));
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the right handler the req should go to.
        const chosenHandler = router[trimmedPath] || router.notFound;

        // Construct the data to send to the handler
        const data = {
            trimmedPath,
            query,
            method,
            headers,
            payload: buffer,
            visitorCounter,
        };

        console.log(`Request received on path: ${trimmedPath}, with method: ${method} and this querystring params: `, query);
        console.log(`Request received with this headers: `, headers);
        console.log(`Request received with this payload: `, buffer);

        // Route the request to the chosen handler
        chosenHandler(data, (statusCode, payload) => {
            // Use the called back status code, if it is a number, or default to 200.
            const resultStatusCode = typeof(statusCode) === 'number' ? statusCode : 200;
            // Use the called back payload if it's an object or use an empty one.
            let resultPayload = typeof(payload) === 'object' ? payload : {};
            resultPayload = JSON.stringify(resultPayload);

            // Set header for content-type, it should be done before writing head.
            res.setHeader('Content-Type', 'application/json');
            // Return the response
            res.writeHead(resultStatusCode);
            res.end(resultPayload);

            console.log('Returning this response', resultStatusCode, resultPayload);
        });
    });
};

// Define route handlers
const handlers = {
    ping: (__, callback) => { // __ is a convention used when the parameter is not used
        callback(200, { 'status': 200 });
    },
    hello: ({ visitorCounter }, callback) => {
        // Callback an http status code, and a payload object
        callback(200, { 'welcomeMessage': `Hello, you are the visitor #${visitorCounter}` });
    },
    notFound: (data, callback) => {
        callback(404);
    },
};

const { hello, notFound, ping } = handlers;

// Define a request router
const router = {
    ping,
    hello,
    notFound,
};
