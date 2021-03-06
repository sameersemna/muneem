const logger = require("./fakeLogger");
var pump = require('pump')

HttpAnswer.prototype.type = function(c_type){
    if(!c_type) {
        return this._headers["content-type"]
    }else{
        this._headers["content-type"] = c_type;
    }
}

HttpAnswer.prototype.length = function(len){
    if(len === undefined) {
        return this._headers["content-length"];
    }else{
        this._headers["content-length"] = len;
    }
}

HttpAnswer.prototype.answered = function(){
    return this._native.finished;
}

HttpAnswer.prototype.skip = function(num){
    this.chain.skip = num;
}

HttpAnswer.prototype.status = function(code){
    this._statusCode = code;
    //msg && (this._native.statusMessage = msg);
}

HttpAnswer.prototype.getHeader = function(name){
    return this._headers[name.toLowerCase()];
}

/* HttpAnswer.prototype.setCookie = function(val){
    if (this._headers['set-cookie']) {
        this._headers['set-cookie'] = [this._headers['set-cookie']].concat(val);
      } else {
        this._headers['set-cookie'] = val
      }
} */

HttpAnswer.prototype.setHeader = function(name,val){
    name = name.toLowerCase();
    if (this._headers[name] && name === 'set-cookie') {
        this._headers[name] = [this._headers[name]].concat(val);
    } else {
        this._headers[name] = val
    }
}

HttpAnswer.prototype.removeHeader = function(name){
    delete this._headers[name];
}

/**
 * Write if it is not written before
 * @param {*} data 
 * @param {string} type : content-type
 * @param {number|string} length : content-length
 */
HttpAnswer.prototype.write = function(data,type,length, safe){
    if(! (safe && this.data) ) { //Don't set if it is already set
        this.data = data;   
        type && this.type(type);
        length && this.length(length);
    } 
}

HttpAnswer.prototype.close = function(code, reason){
    this.chain.skip = -1;
    if(this.answered()){
        logger.log.warn("This response has been rejected as client has already been answered. Reason: " + this.answeredReason);
    }else{
        this.answeredReason = reason;
        this._native.end( '', this.encoding );

        logger.log.debug(`Request Id:${this._for.id} has been closed`);
    }
}
/**
 * Serialize -> compress -> set length -> send
 * if data parametre is null, undefined then it'll read data from this.data
 * otherwise it'll overwrite this.data
 
 * @param {string} reason 
 * 
 * @param {number} code 
 * @param {string} reason 
 * 
 * @param {string} type
 * @param {number} length
 * @param {string} reason 
 * 
 * 
 */
HttpAnswer.prototype.end = function(){
    this.chain.skip = -1;
    if(this.answered()){
        logger.log.warn("This response has been rejected as client has already been answered. Reason: " + this.answeredReason);
    }else{
        let code,type,length,reason;

        if(typeof arguments[0] === "string" && typeof arguments[1] === "number"){
            type = arguments[0];
            length = arguments[1];
            reason = arguments[2];
        }else if(typeof arguments[0] === "number"){
            this._statusCode = arguments[0];
            reason = arguments[1];
        }else{
            reason = arguments[0];
        }

        this.answeredReason = reason;
        if(this.data === null || this.data === undefined){
            this.data = "";
        }

        type && this.type(type);
        length && this.length(length);
        
        if(this.data instanceof Error){
            logger.log.error( this.data );
            this.data = "";
            this._statusCode = 500;
            this.length(0);
        }else if(this.data && !isStream(this.data) ){
            this._setContentLength();
        }
        
        //a user may call end() from beforeAnswer event
        if( !this._beforeAnswerEventCall){
            this.eventEmitter.emit("beforeAnswer", this._for, this);
            this._beforeAnswerEventCall = true;
        } 

        if( ! this.answered() ){
            this._native.writeHead(this._statusCode, this._headers);
            if( isStream(this.data) ){
                pump(this.data, this._native);
            }else{
                this._native.end(this.data ,this.encoding);
            }
            this.eventEmitter.emit("afterAnswer",this._for,this);
        }
        logger.log.debug(`Request Id:${this._for.id} has been answered`);
    }
}

//TODO: test
// Check section https://tools.ietf.org/html/rfc7230#section-3.3.2
// we should not send content-length for status code < 200, 204.
// or status code === 2xx and method === CONNECT
HttpAnswer.prototype._setContentLength = function(){
    if ( !this._headers['content-length'] && !this._headers['transfer-encoding'] ){
        if(this._statusCode < 200 || this._statusCode === 204 || 
            (this._for.method === "CONNECT" && this._statusCode > 199 &&  this._statusCode < 300)) 
        {
            //don't send content length
        }else if( ! this.length() && typeof this.data === 'string' ){
            this.length( this.length( Buffer.byteLength(this.data) ) );
        }
    } 
}

const isStream = function(data){
    return data && data.pipe && typeof data.pipe === "function"
}

HttpAnswer.prototype.redirectTo = function(loc){
    this._headers['location'] = loc;
    this._native.writeHead(302, this._headers);
    this._native.end("");
}

function HttpAnswer(res,asked,containers,eventEmitter){
    this.containers = containers;
    this._for = asked;
    this._native = res;
    this.encoding = "utf-8";
    this._statusCode = 200;
    this._headers = {};
    this.eventEmitter = eventEmitter;
    this.logger = logger;
    this.chain = {
        skip : 0
    }
}

module.exports = HttpAnswer;