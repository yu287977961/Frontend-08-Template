var assert = require('assert');
import {add,mul} from "../add.js"
import {parseHTML} from "../parser.js"

describe('parser html:',function(){
    // it('1 + 1 should be 2', function () {
    //     assert.equal(add(1,1), 2);
    // });

    // it('1 + 2 should be 3', function () {
    //     assert.equal(add(1, 2), 3);
    // });

    // it('1 * 3 should be 3', function () {
    //     assert.equal(mul(1, 3), 3);
    // });
    let arr = ["<a></a>","<a id=abc></a>","<a id=\'abc\'/>","<a />","<a href='//baidu.com'></a>"]
    for(let a of arr){
        it(a, function () {
            let tree = parseHTML(a);
            assert.equal(tree.children[0].tagName, "a");
            assert.equal(tree.children[0].children.length, 0);

        });
    }
    let arr2 = ['<a href id></a>',"<A />",]
    for(let a of arr2){
        it(a, function () {
            let tree = parseHTML(a);
            assert.equal(tree.children.length, 1);
            assert.equal(tree.children[0].children.length, 0);

        });
    }
    it('<>', function() {
        let tree = parseHTML('<>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].type, "text");
    });
})

