"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMapValues = function (obj, f) {
    return Array.isArray(obj)
        ? obj.map(function (val) { return exports.deepMapValues(val, f); })
        : typeof obj === 'object'
            ? Object.entries(obj).reduce(function (acc, _a) {
                var key = _a[0], val = _a[1];
                acc[key] = exports.deepMapValues(val, f);
                return acc;
            }, {})
            : f(obj);
};
exports.get = function (obj, selector) {
    return selector
        .replace(/\[([^\[\]]*)\]/g, '.$1.')
        .split('.')
        .filter(function (t) { return t !== ''; })
        .reduce(function (prev, cur) { return prev && prev[cur]; }, obj);
};
var isDefined = function (t) { return !!t; };
exports.URLJoin = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return args
        .filter(isDefined)
        .join('/')
        .replace(/[\/]+/g, '/')
        .replace(/^(.+):\//, '$1://')
        .replace(/^file:/, 'file:/')
        .replace(/\/(\?|&|#[^!])/g, '$1')
        .replace(/\?/g, '&')
        .replace('&', '?');
};
exports.isNodeJs = function () { return typeof window === 'undefined'; };
exports.isBrowser = function () {
    return ![typeof window, typeof document].includes('undefined');
};
