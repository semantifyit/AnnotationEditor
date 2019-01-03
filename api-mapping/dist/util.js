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
exports.mergeDiff = function () {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i] = arguments[_i];
    }
    return objects.reduce(function (acc, cur) {
        Object.entries(cur).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (acc[k]) {
                if (Array.isArray(acc[k])) {
                    acc[k].push(v);
                }
                else {
                    acc[k] = [acc[k], v];
                }
            }
            else {
                acc[k] = v;
            }
        });
        return acc;
    }, {});
};
exports.mergeSame = function () {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i] = arguments[_i];
    }
    return objects.reduce(function (acc, cur) {
        if (typeof cur === 'object') {
            Object.entries(cur).forEach(function (_a) {
                var k = _a[0], v = _a[1];
                if (acc[k]) {
                    acc[k] = exports.mergeSame(acc[k], v);
                }
                else {
                    acc[k] = v;
                }
            });
            return acc;
        }
        if (Array.isArray(acc)) {
            acc.push(cur);
            return acc;
        }
        if (Object.keys(acc).length === 0) {
            return [cur];
        }
        return [acc, cur];
    }, {});
};
