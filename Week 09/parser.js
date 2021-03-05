const EOF = Symbol('EOF')//结束状态
const css = require('css');

//加入一个新函数addCSSRules，css规则暂存到一个数组当中
let rules = [];
function addCSSRules(text) {
    let ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}

function getSelectorIntersection(selector) {
    const ret = {
        className: [],
        id: "",
        tagName: "",
    };
    let token = "";
    let current = "tag";
    for (const c of selector) {
        if (c === "#") {
            emit();
            current = "id";
        } else if (c === ".") {
            emit();
            current = "class";
        } else {
            token += c;
        }
    }
    emit();

    function emit() {
        if (token) {
            switch (current) {
                case "id":
                    ret.id = token;
                    break;
                case "tag":
                    ret.tagName = token;
                    break;
                case "class":
                    ret.className.push(token);
                    break;
            }
        }
        token = "";
    }
    return ret;
}

function match(element, selector) {
    if (!selector || !element.attributes) {
        return false;
    }

    const selectorIntersection = getSelectorIntersection(selector);
    var id = (element.attributes.find((attr) => attr.name === "id") || "").value;
    var classNames = (element.attributes.find((attr) => attr.name === "class") || "").value;
    if (selectorIntersection.tagName &&selectorIntersection.tagName !== element.tagName) {
        return false;
    }
    if (selectorIntersection.id && selectorIntersection.id != id) {
        return false;
    }

    if (selectorIntersection.className.length &&!compareArr(selectorIntersection.className, (classNames || "").split(" "))) {
        return false;
    }

    return true;
}

function specificity(selector){
    var selectorParts = selector.split(" ");
    var sp = [0, 0, 0, 0];
    for (let part of selectorParts) {
        const css = getSelectorIntersection(part);

        if (css.tagName) {
            sp[3] += 1;
        } else if (css.id) {
            sp[1] += 1;
        }
        sp[2] += css.className.length;
    }

    return sp;
}

function compare(sp1, sp2){
    for (var i = 0; i < 3; i++) {
        if (sp1[i] - sp2[i]) {
            return sp1[i] - sp2[i];
        }
    }
    return sp1[3] - sp2[3];
}    
    

function computeCSS(element) {
    var elements = stack.slice().reverse();
    if (!element.computedStyle) {
        element.computedStyle = {};
    }
    for (let rule of rules) {
        var selectorParts = rule.selectors[0].split([" "]).reverse();

        if (!match(element, selectorParts[0])) {
            continue;
        }

        let matched = false;

        var j = 1;
        for (let i = 0; i < elements.length; i++) {
            if (match(elements[i], selectorParts[j])) {
                j++;
            }
        }
        if (j >= selectorParts.length) {
            matched = true;
        }
        if (matched) {
            var sp = specificity(rule.selectors[0]);
            //   console.log("Element ", element, "matched rule", rule);
            var computedStyle = element.computedStyle;

            for (var declaration of rule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {};
                }
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                } else if (
                    compare(computedStyle[declaration.property].specificity, sp) < 0
                ) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }
            }
        }
    }
    console.log(rules);
    console.log("compute CSS for Element", element);

}

let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;

let stack = [{ type: "document", children: [] }];
function emit(token) {
    let top = stack[stack.length - 1];
    if (token.type == "startTag") {
        let element = {
            type: "element",
            children: [],
            attributes: [],
        };
        element.tagName = token.tagName;
        for (let p in token) {
            if (p != "type" && p != "tagName") {
                element.attributes.push({ name: p, value: token[p] });
            }
        }
        top.children.push(element);
        // element.parent = top;

        computeCSS(element, stack);
        if (!token.isSelfClosing) {
            stack.push(element);
        }
        currentTextNode = null;
    } else if (token.type === "endTag") {
        if (top.tagName != token.tagName) {
            throw new Error("Tag start end doesn't matchi !");
        } else {
            // 解析css规则
            if (top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.type === "text") {
        if (currentTextNode == null) {
            currentTextNode = {
                type: "text",
                content: "",
            };
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
    console.log(token);
}

function data(c) {
    if (c == "<") {
        return tagOpen;
    } else if (c === EOF) {
        emit({ type: "EOF" });
        return;
    } else {
        emit({ type: "text", content: c });
        return data;
    }
}
function tagOpen(c) {
    if (c === "/") {
        return endTagOpen;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName: "",
        };
        return tagName(c);
    } else {
        return;
    }
}
function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: "",
        };
        return tagName(c);
    } else if (c === ">") {
        // return data;
    } else if (c === EOF) {
    } else {
    }
}
function tagName(c) {
    if (c.match(/^[\t\n\f\s]$/)) {
        return beforeAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c;
        return tagName;
    } else if (c === ">") {
        emit(currentToken);
        return data;
    } else {
        return tagName;
    }
}
function beforeAttributeName(c) {
    if (c.match(/^[\t\n\f\s]$/)) {
        return beforeAttributeName;
    } else if (c === ">" || c === "/" || c === EOF) {
        return afterAttributeName(c);
    } else if (c === "=") {
    } else {
        currentAttribute = {
            name: "",
            value: "",
        };

        return attributeName(c);
    }
}
function afterAttributeName(c) {
    if (c.match(/^[\t\n\f\s]$/)) {
        return afterAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag;
    } else if (c === "=") {
        return beforeAttributeValue;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === EOF) {
    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: "",
        };
        return attributeName(c);
    }
}
function attributeName(c) {
    if (c.match(/^[\t\n\f\s]$/) || c === "/" || c === ">" || c === EOF) {
        return afterAttributeName(c);
    } else if (c === "=") {
        return beforeAttributeValue;
    } else if (c == "\u0000") {
    } else if (c == '"' || c === "'" || c == "<") {
    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}
function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f\s]$/) || c == "/" || c == ">" || c == EOF) {
        return beforeAttributeValue;
    } else if (c === '"') {
        return doubleQuotedAttributeValue;
    } else if (c === "'") {
        return singleQuoteAttributeValue;
    } else if (c === ">") {
    } else {
        return UnquotedAttributeValue(c);
    }
}
function doubleQuotedAttributeValue(c) {
    if (c === '"') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {
    } else if (c === EOF) {
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}
function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f\s]$/)) {
        return beforeAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c == EOF) {
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}
function singleQuoteAttributeValue(c) {
    if (c === "'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {
    } else if (c === EOF) {
    } else {
        currentAttribute.value += c;
        return singleQuoteAttributeValue;
    }
}
function UnquotedAttributeValue(c) {
    if (c.match(/^[\t\n\f\s]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === "/") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === "\u0000") {
    } else if (c === "'" || c === '"' || c === "<" || c === "=" || c === "`") {
    } else if (c === EOF) {
    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}
function selfClosingStartTag(c) {
    if (c === ">") {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c === "EOF") {
    } else {
    }
}
 
module.exports.parseHTML = function parseHTML(html) {
    let state = data;
    for (let c of html) {
        state = state(c);
        console.log(c,state.name)
    }
    state = state(EOF);
    console.log(stack[0]);
}
