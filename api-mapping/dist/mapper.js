"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var useInputValue = function (inputObj, pathStr, options) {
    var _a = pathStr.split(/\|>/).map(function (s) { return s.trim(); }), path = _a[0], transformFunction = _a[1];
    var inputVal = util_1.get(inputObj, path.substring(2));
    var cleanVal = inputVal.replace(/'/g, "\\'");
    if (transformFunction) {
        var code = "(" + transformFunction + ")('" + cleanVal + "')";
        console.log(code);
        switch (options.evalMethod) {
            case 'vm-runInNewContext':
                var vm = require('vm');
                return vm.runInNewContext(code);
            case 'eval':
            default:
                return eval(code);
        }
    }
    return cleanVal;
};
var defaultOptions = {
    type: 'json',
    locator: 'simple',
    evalMethod: 'eval',
};
exports.requestMapping = function (inputAction, mapping, options) {
    if (options === void 0) { options = defaultOptions; }
    var transformValue = function (val) {
        return typeof val === 'string' && val.startsWith('$')
            ? useInputValue(inputAction, val, options)
            : val;
    };
    var newObj = util_1.deepMapValues(mapping, transformValue);
    var path = newObj.path && newObj.path.join('/');
    var queryString = newObj.query &&
        Object.entries(newObj.query).map(function (_a) {
            var k = _a[0], v = _a[1];
            return encodeURIComponent(k) + "=" + encodeURIComponent(v);
        });
    var url = util_1.URLJoin(newObj.url, path, queryString);
    return {
        url: url,
        headers: newObj.headers,
        body: newObj.body,
    };
};
