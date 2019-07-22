'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function() {
          return this;
        }),
      g
    );
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var _this = this;
Object.defineProperty(exports, '__esModule', { value: true });
var util_1 = require('./util');
var useInputValue = function(inputObj, pathStr, options) {
  var _a = util_1.parsePathStr(pathStr),
    path = _a.path,
    transformFunction = _a.transformFunction;
  var inputVal = util_1.get(inputObj, path);
  if (transformFunction && options.evalMethod) {
    return util_1.transFormValue(
      inputVal,
      transformFunction,
      options.evalMethod,
    );
  }
  return inputVal;
};
var defaultRequestOptions = {
  type: undefined,
  locator: 'simple',
  evalMethod: 'eval',
};
exports.requestMapping = function(inputAction, userMapping, options) {
  return __awaiter(_this, void 0, void 0, function() {
    var userOptions,
      mapping,
      mappingType,
      _a,
      _b,
      e_1,
      _c,
      e_2,
      transformValue,
      newObj,
      path,
      queryString,
      url,
      mappingBody,
      evalCode,
      output;
    return __generator(this, function(_d) {
      switch (_d.label) {
        case 0:
          userOptions = Object.assign(defaultRequestOptions, options);
          mapping = util_1.clone(userMapping);
          mappingType = userOptions.type;
          if (!(typeof mapping.body === 'string')) return [3, 12];
          if (!mappingType) return [3, 6];
          _a = mappingType;
          switch (_a) {
            case 'xml':
              return [3, 1];
            case 'json':
              return [3, 3];
            case 'js':
              return [3, 4];
          }
          return [3, 4];
        case 1:
          _b = mapping;
          return [4, util_1.xmlToJson(mapping.body)];
        case 2:
          _b.body = _d.sent();
          return [3, 5];
        case 3:
          mapping.body = JSON.parse(mapping.body);
          return [3, 5];
        case 4:
          return [3, 5];
        case 5:
          return [3, 12];
        case 6:
          _d.trys.push([6, 7, , 12]);
          mapping.body = JSON.parse(mapping.body);
          mappingType = 'json';
          return [3, 12];
        case 7:
          e_1 = _d.sent();
          _d.label = 8;
        case 8:
          _d.trys.push([8, 10, , 11]);
          _c = mapping;
          return [4, util_1.xmlToJson(mapping.body)];
        case 9:
          _c.body = _d.sent();
          mappingType = 'xml';
          return [3, 11];
        case 10:
          e_2 = _d.sent();
          mappingType = 'js';
          return [3, 11];
        case 11:
          return [3, 12];
        case 12:
          try {
            transformValue = function(val) {
              return typeof val === 'string' && val.trim().startsWith('$')
                ? useInputValue(inputAction, val.trim(), userOptions)
                : val;
            };
            newObj = util_1.removeUndef(
              util_1.deepMapValues(mapping, transformValue),
            );
            path = newObj.path && newObj.path.join('/');
            queryString =
              newObj.query &&
              Object.entries(newObj.query).map(function(_a) {
                var k = _a[0],
                  v = _a[1];
                return (
                  '?' + encodeURIComponent(k) + '=' + encodeURIComponent(v)
                );
              });
            url = util_1.URLJoin(newObj.url, path, queryString);
            mappingBody = newObj.body;
            if (mappingType === 'js') {
              evalCode =
                "\n      (() => {\n      const $ = JSON.parse('" +
                JSON.stringify(inputAction) +
                "');\n      return " +
                mapping.body +
                ';\n      })();\n      ';
              mappingBody = util_1.runCode(evalCode, userOptions.evalMethod);
            }
            output = util_1.removeUndef({
              url: url,
              headers: newObj.headers,
              body: mappingBody,
            });
            if (mappingType === 'xml' && typeof output.body === 'object') {
              output.body = util_1.jsonToXml(output.body);
            }
            return [2, output];
          } catch (e) {
            util_1.logError(e);
            return [2, { url: '' }];
          }
          return [2];
      }
    });
  });
};
