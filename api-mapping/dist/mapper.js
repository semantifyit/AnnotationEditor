"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var transFormValue = function (val, transformFunctionStr, evalMethodType) {
    var cleanVal = typeof val === 'string' ? val.replace(/'/g, "\\'") : val;
    var code = "(" + transformFunctionStr + ")('" + cleanVal + "')";
    switch (evalMethodType) {
        case 'vm-runInNewContext':
            var vm = require('vm');
            return vm.runInNewContext(code);
        case 'eval':
        default:
            return eval(code);
    }
};
var parsePathStr = function (pathStr) {
    var _a = pathStr.split(/\|>/).map(function (s) { return s.trim(); }), path = _a[0], transformFunction = _a[1];
    return {
        transformFunction: transformFunction,
        path: path.substring(2),
    };
};
var useInputValue = function (inputObj, pathStr, options) {
    var _a = parsePathStr(pathStr), path = _a.path, transformFunction = _a.transformFunction;
    var inputVal = util_1.get(inputObj, path);
    if (transformFunction && options.evalMethod) {
        return transFormValue(inputVal, transformFunction, options.evalMethod);
    }
    return inputVal;
};
var defaultRequestOptions = {
    type: 'json',
    locator: 'simple',
    evalMethod: 'eval',
};
exports.requestMapping = function (inputAction, mapping, options) {
    if (options === void 0) { options = defaultRequestOptions; }
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
            return "?" + encodeURIComponent(k) + "=" + encodeURIComponent(v);
        });
    var url = util_1.URLJoin(newObj.url, path, queryString);
    return {
        url: url,
        headers: newObj.headers,
        body: newObj.body,
    };
};
var defaultResponseOptions = {
    evalMethod: 'eval',
};
exports.responseMapping = function (inputResponse, mapping, options) {
    if (options === void 0) { options = defaultResponseOptions; }
    var set = function (obj, path, val) {
        var paths = path.split('.');
        if (paths.length === 1) {
            if (obj[paths[0]]) {
                if (Array.isArray(obj[paths[0]])) {
                    obj[paths[0]].push(val);
                }
                else {
                    obj[paths[0]] = [obj[paths[0]], val];
                }
            }
            else {
                obj[paths[0]] = val;
            }
        }
        else {
            if (!obj[paths[0]]) {
                obj[paths[0]] = {};
            }
            set(obj[paths[0]], paths.slice(1).join('.'), val);
        }
    };
    if (!mapping.body) {
        return {};
    }
    var metadataProperties = ['$merge'];
    var doMapping = function (mappingObj, input) {
        var result = {};
        if (!input || !mappingObj) {
            return result;
        }
        if (Array.isArray(mappingObj) && Array.isArray(input)) {
            if (mappingObj.length === 1) {
                var forceMerge = !!mappingObj[0].$merge;
                var mappedElements = input.map(function (inputElem) {
                    return doMapping(mappingObj[0], inputElem);
                });
                result = forceMerge
                    ? util_1.mergeSame.apply(void 0, mappedElements) : util_1.mergeDiff.apply(void 0, mappedElements);
            }
            else {
                result = util_1.mergeSame.apply(void 0, mappingObj.map(function (mappingElem, i) {
                    return doMapping(mappingElem, input[i]);
                }));
            }
        }
        else if (typeof mappingObj === 'object') {
            Object.entries(mappingObj)
                .filter(function (_a) {
                var k = _a[0];
                return !metadataProperties.includes(k);
            })
                .forEach(function (_a) {
                var key = _a[0], value = _a[1];
                if (typeof value === 'string' &&
                    value.startsWith('$.') &&
                    input[key] !== undefined) {
                    var _b = parsePathStr(value), path = _b.path, transformFunction = _b.transformFunction;
                    if (options.evalMethod && transformFunction) {
                        var transformedValue = transFormValue(input[key], transformFunction, options.evalMethod);
                        set(result, path, transformedValue);
                    }
                    else {
                        set(result, path, input[key]);
                    }
                }
                else if (typeof value === 'object') {
                    result = util_1.mergeSame(doMapping(value, input[key]), result);
                }
            });
        }
        return result;
    };
    var resultOut = doMapping(mapping, inputResponse);
    return resultOut;
};
