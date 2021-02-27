const http = require('http');

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        console.log("body:", body);
        response.writeHead(200, {'Content-Type': 'text/htmt'});
        response.end('<html class="abc" data-a="124">Hello World</html>');
    });
}). listen(8089);

console.log("server started");
