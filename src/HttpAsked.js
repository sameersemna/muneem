var url = require('url');


function HttpAsked(request,params,context){
    this.id = request.id;
    this.params = params;
    this.headers = request.headers;
    this._native = request;
    this.stream = request;
    this.context = context;
    this.body =[];
    this.processQueryParam();
    if(request.headers['content-length'] !== undefined){
        this.contentLength = Number(request.headers['content-length']);
    }else{
        this.contentLength =  -1;
    }
}

//TODO: make it pluggable with readMsgpack, readJson, readBody (as per content type)
HttpAsked.prototype.readBody = async function(){
    if(this._mayHaveBody === false || this.contentLength === 0) return;
    else if(this.body && this.body.length > 0) return this.body;
    else{
        this.body = [];
        await new Promise((resolve, reject) => {
            this.stream.on('data', (chunk)=>this.body.push(chunk));
            this.stream.on('end', ()=>{
                this.body = Buffer.concat(this.body); 
                resolve(this.body)
            });
            this.stream.on('error', (err) => {
                reject(err);
                throw Error("Error in reading request stream");
            });
        });

        return this.body
    }
}

HttpAsked.prototype.processQueryParam = function(){
    if( this._native.url.indexOf("?") !== -1 ){//TODO: process #. move to anumargak
        var parsedURL = url.parse(this._native.url, true);
        this.url =parsedURL.pathname//without query param
        this.query = parsedURL.query//convert into map
    }else{
        this.url = this._native.url;
    }
}


module.exports = HttpAsked;