var assert = require('assert');
import {add,mul} from "../add.js"

describe('add function testing',function(){
    it('1 + 1 should be 2', function () {
        assert.equal(add(1,1), 2);
    });

    it('1 + 2 should be 3', function () {
        assert.equal(add(1, 2), 3);
    });

    it('1 * 3 should be 3', function () {
        assert.equal(mul(1, 3), 3);
    });

})

