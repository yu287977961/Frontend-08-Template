const net = require('net')
class ResponseParser {
    constructor(){
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;//status line会以/r/n状态结束，所以需要判断两个状态才会结束
        this.WAITING_HEADER_NAME = 2 ;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;//head line有四个状态
        this.WAITING_HEADER_BLOCK_END = 6;//headline 后有一个空行，所以还需要一个空行状态
        this.WAITING_BODY = 7;//最后就是body状态

        this.current = this. WAITING_STATUS_LINE;//当前状态，初始化为最开始的那个常量0的状态
        this.statusLine = "";
        this.headers = {};
        this.headerName ="";
        this.headerValue = "";
        this.bodyParser = null;

    }
    get isFinished(){
        return this.bodyParser && this.bodyParser.isFinished;
    }
    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return{
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }
        
    receive(string){
        for(let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i)) ;
        }
    }
    receiveChar(char){//状态机判断
        if(this.current === this.WAITING_STATUS_LINE) {
            if(char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END;
            } else {
                this.statusLine += char ;
            }
        } else if(this.current === this.WAITING_STATUS_LINE_END) {
            if(char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if(this.current === this.WAITING_HEADER_NAME) {
            if(char === ':') {
                this.current = this.WAITING_HEADER_SPACE;
            } else if(char === '\r') {
                this.current = this.WAITING_HEADER_BLOCK_END;//空行状态找到后，进行header判断
                if(this.headers['Transfer-Encoding'] === 'chunked')//node默认值为chunked
                    this.bodyParser = new TrunkedBodyParser();

            }else{
                this.headerName += char;
            }
        } else if(this.current === this.WAITING_HEADER_SPACE) {
            if(char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        } else if(this.current === this.WAITING_HEADER_VALUE) {
        } else if(this.current === this.WAITING_HEADER_VALUE) {
            if(char === '\r') {
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers [this.headerName] = this.headerValue;
                this.headerName = "";
                this.headerValue = "";
            } else {
                this.headerValue += char;
            }
        } else if(this.current === this.WAITING_HEADER_LINE_END) {
            if(char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if(this.current === this.WAITING_HEADER_BLOCK_END) {
            if(char === '\n') {
                this.current = this.WAITING_BODY ;
            }
        } else if(this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char);

        }   
    }
}

class TrunkedBodyParser {
    constructor(){
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK= 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [] ;
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }
    receiveChar(char){
        if(this.current === this.WAITING_LENGTH) {
            if(chad === '\r') {
                if(this.length === 0) {
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            } else {
                this.length *= 16;
                this.length += parseInt(char, 16);
            }
        } else if(this.current === this.WAITING_LENGTH_LINE_END){
            //console. log ("WAITING_ LENGTH_ LINE_ END") ;
            if(char === '\n') {
                this.current = this.READING_TRUNK;
            }
        } else if(this.current === this.READING_TRUNK) {
            this.content.push(char);
            this.length --;
            if(this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        } else if(this.current === this.WAITING_NEW_LINE) {
            if(char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        } else if(this.current === this.WAITING_NEW_LINE_END) {
            if(char === '\n') {
                this.current = this .WAITING_LENGTH;
            }
        }   
    }    
}    
    
class Request{
    constructor(options){//config的配置
        this. method = options.method || "GET";
        this.host = options.host;
        this.port = options.port||80;//http协议默认端口为80
        this.path = options.path||"/";
        this.body = options.body||{};
        this.headers = options.headers || {};
        if(!this.headers["Content-Type"]) {//必须，否则http没办法解析，所以给了默认值
            this.headers ["Content-Type"] = "application/x-www-form-urlencoded" ;
        }
        if(this.headers ["Content-Type"] === "application/json" ) 
            this.bodyText = JSON.stringify (this.body);//json格式通常为post方法的时候使用的body格式
        else if(this.headers["Content-Type"] === "application/x-www-form-urlencoded")
            this.bodyText = Object.keys(this.body).map(key =>`${key}=${encodeURIComponent(this.body[key])}`).join('&');//&参数的形式主要是get方法时候传输参数

        
        this.headers["Content-Length"] = this.bodyText.length;
    }
    send(connection){
        return new Promise((resolve,reject)=>{
            const parser = new ResponseParser;
            if(connection) {
                connection.write(this.toString());//已有的connection会直接写入
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                },()=>{
                    connection.write(this.toString());//没有则新建自己的connection发送到服务端
                })
            }
            connection.on('data',(data) => {
                console.log(data.toString());//服务端收到的data进行tostring解析
                parser.receive(data.toString());//解析后传给parser

                if(parser.isFinished){
                    resolve(parser.response); //根据parser的状态resolve
                    connection.end() ;
                }
            });
            connection.on('error',(err) =>{
                reject(err);
                connection.end();
            });
        })
    }
    toString(){
        return `${this.method} ${this.path} HTTP/1.1\r
            ${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}` ).join('\r\n')}\r
            \r
            ${this.bodyText}`
            
    }
        
}

void async function (){//void定义的函数会自动运行
    let request = new Request({
        method: "POST" ,
        host: "127.0.0.1",
        port: "8088",
        path: "/" ,
        headers: {
            ["X-Foo2"]: "customed" //通过js对象来描述
        },
        body: {
            name :"xiLin" 
        }
    });
    let response = await request.send();//通过send发送请求，返回值是服务端的请求结果。
    console.log(response);
}();

