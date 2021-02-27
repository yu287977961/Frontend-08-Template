const EOF = Symbol('EOF')//结束状态
let currentToken = null;
let currentAttribute = null;

function emit(token){
    console.log(token)
}

function data(c){
    if(c == "<"){
        return tagOpen;
    }else if(c == EOF){
        return ;
    }else {
        return data;
    }
    
}

function tagOpen(c){
    if(c == "/"){
        return endTagOpen;
    }else if(c.match(/^[a-zA-z]$/)){
        currentToken = {
            type:"startTag",
            tagName:''
        }
        return tagName(c);
    }else {
        return ;
    }
}

function endTagOpen(c){
    if(c.match(/^[a-zA-z]$/)){
        currentToken = {
            type:"endTag",
            tagName:''
        }
        return tagName(c);
    }else if(c==">"){
        
        return ;
    }else if(c==EOF){
        return ;
    }else {

    }
}

function tagName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c=="/"){
        return selfClosingStartTag; 
    }else if(c.match(/^[a-zA-z]$/)){
        currentToken.tagName += c
        return tagName;
    }else if(c==">"){
        emit(currentToken)
        return data;
    }else{
        return tagName;
    }
}

function beforeAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c=="/"||c==">"||c==EOF){
        return afterAttributeName(c); 
    }else if(c=="="){

    }else{
        currentAttribute = {
            name:'',
            value:''
        }
        return attributeName(c)
    }
}

function attributeName(c){
    if(c.match(/^[\t\n\f ]$/)||c=="/"||c==">"||c==EOF){
        return afterAttributeName(c);
    }else if(c == "="){
        return beforeAttributeValue;
    }else if(c=="/u000"){

    }else if(c=="\""||c=="\'"||c=="<"){
        
    }else{
        currentAttribute.name += c;
        return attributeName;
    }
}

function beforeAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/)||c=="/"||c==">"||c==EOF){
        console.log(1)
        return beforeAttributeValue;
    }else if(c == "\""){
        console.log(2)
        return doubleQuotedAttributeValue;
    }else if(c=="\'"){
        console.log(3)
        return singleQuotedAttributeValue;
    }else if(c==">"){
        
    }else{
        console.log(4)
        return UnquotedAttributeValue(c);
    }

}

function doubleQuotedAttributeValue(c){
    if(c == "\""){
        currentToken[currentAttribute.name]=currentAttribute.value;
        return afterQuotedAttributeValue;

    }else if(c == "\u0000"){

    }else if(c==EOF){
        
    }else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }

}

function singleQuotedAttributeValue(c){
    if(c == "\'"){
        currentToken[currentAttribute.name]=currentAttribute.value;
        return afterQuotedAttributeValue;

    }else if(c == "\u0000"){

    }else if(c==EOF){
        
    }else{
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }

}

function UnquotedAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/)){
        currentToken[currentAttribute.name]=currentAttribute.value;
        return beforeAttributeValue;

    }else if(c == "/"){
        currentToken[currentAttribute.name]=currentAttribute.value;
        return selfClosingStartTag;
    }else if(c==">"){
        currentToken[currentAttribute.name]=currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c == "\u0000"){

    }else if(c=="\""||c=="\'"||c=="<"||c=="="||c=="`"){

    }else if(c==EOF){
        
    }else{
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }

}


function selfClosingStartTag(c){
    if(c==">"){
        currentToken.isSelfClosing = true;
        return data; 
    }else if(c==EOF){
        
    }else{

    }
}

function afterAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return afterAttributeName;
    }else if(c == "/"){
        return selfClosingStartTag;
    }else if(c == "="){
        return beforeAttributeValue;
    }else if(c==">"){
        currentToken[currentAttribute.name]=currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c==EOF){
        
    }else{
        currentToken[currentAttribute.name]=currentAttribute.value;
        currentAttribute={
            name:'',
            value:''
        };
        return attributeName(c);
    }

}
module.exports.parseHTML = function parseHTML(data){
    let state = data;
    for(let c of data){
        state = state(c);
    }
    state = state(EOF);
}