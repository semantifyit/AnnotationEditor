"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var N3 = require("n3");
var yarrrmlParser = require("@rmlio/yarrrml-parser/lib/rml-generator");
var rmlMapperNode = require("rocketrml");
exports.yarrrmlParse = function (yaml) {
    return new Promise(function (resolve) {
        var y2r = new yarrrmlParser();
        var yamlQuads = y2r.convert(yaml);
        var prefixes = {
            rr: 'http://www.w3.org/ns/r2rml#',
            rml: 'http://semweb.mmlab.be/ns/rml#',
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            schema: 'http://schema.org/',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            fnml: 'http://semweb.mmlab.be/ns/fnml#',
            fno: 'http://w3id.org/function/ontology#',
            mex: 'http://mapping.example.com/',
        };
        prefixes = Object.assign({}, prefixes, y2r.getPrefixes());
        var writer = new N3.Writer({ prefixes: prefixes });
        writer.addQuads(yamlQuads);
        writer.end(function (_, result) {
            resolve(result);
        });
    });
};
exports.runRmlMapping = function (mappingFile, inputFile, options) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, rmlMapperNode.parseFileLive(mappingFile, { input: inputFile }, options)];
    });
}); };
exports.yarrrmlExtend = function (yarrrml) {
    var str = yarrrml.replace(/((?:parameters|pms): *\[)([\w@\^\.\/\$\(\)\"\' ,\[\]\|\=]+)(\])/g, function () {
        var e = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            e[_i] = arguments[_i];
        }
        var _a = e, cg1 = _a[1], cg2 = _a[2], cg3 = _a[3];
        var params = cg2
            .split(',')
            .map(function (el, i) { return "[schema:str" + i + ", " + el.trim() + "]"; })
            .join(', ');
        return cg1 + params + cg3;
    });
    str = str.replace(/join: *\[ *"?([\w@\^\.\/\$\:\-\*\,\ \'\)\()]+)"? *, *"?([\w@\^\.\/\$\:\-\*\,\ \'\(\)]+)"? *\]/g, 'condition:{function:equal,parameters:[[str1,"$($1)"],[str2,"$($2)"]]}');
    return str;
};
var escapeTable = {
    '(': '\\$LBR',
    ')': '\\$RBR',
    '{': '\\$LCB',
    '}': '\\$RCB',
};
var yarrrmlEncodeBrackets = function (str) {
    var level = 0;
    var ret = '';
    for (var i = 0; i < str.length; i += 1) {
        var c = str[i];
        if (level < 0) {
            throw new Error('failed parsing brackets');
        }
        if (level === 0) {
            switch (c) {
                case '$':
                    if (str[i + 1] === '(') {
                        level += 1;
                        i += 1;
                        ret += '$(';
                    }
                    else {
                        ret += c;
                    }
                    break;
                case '(':
                case ')':
                default:
                    ret += c;
            }
        }
        else {
            switch (c) {
                case '(':
                    level += 1;
                    ret += '$LBR';
                    break;
                case ')':
                    level -= 1;
                    if (level === 0) {
                        ret += ')';
                    }
                    else {
                        ret += '$RBR';
                    }
                    break;
                default:
                    ret += c;
            }
        }
    }
    return ret;
};
exports.decodeRMLReplacements = function (rml) {
    return Object.entries(escapeTable).reduce(function (str, _a) {
        var char = _a[0], code = _a[1];
        return str.replace(new RegExp(code, 'g'), char);
    }, rml);
};
exports.yarrrmlPlusToRml = function (yarrrml) { return __awaiter(_this, void 0, void 0, function () {
    var mappingStr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                mappingStr = exports.yarrrmlExtend(yarrrml);
                mappingStr = yarrrmlEncodeBrackets(mappingStr);
                return [4, exports.yarrrmlParse(mappingStr)];
            case 1:
                mappingStr = _a.sent();
                mappingStr = exports.decodeRMLReplacements(mappingStr);
                return [2, mappingStr];
        }
    });
}); };
