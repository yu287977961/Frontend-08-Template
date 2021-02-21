const http = require('http');

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk.toString());
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        console.Log("body:", body);
        response.writeHead(200, {'Content-Type': 'text/htmt'});
        response.end(' Hello World\n');
    });
}). listen(8088);

console.log("server started");
