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
var rmlmapper_1 = require('./rmlmapper');
var defaultResponseOptions = {
  type: 'json',
  evalMethod: 'eval',
  iteratorPath: '$ite',
  rmlOptions: {
    replace: true,
    compress: {
      '@vocab': 'http://schema.org/',
    },
  },
};
var doMapping = function(mappingObj, input, result, iterators, options) {
  if (!input || !mappingObj) {
    return;
  }
  if (Array.isArray(mappingObj) && Array.isArray(input)) {
    if (mappingObj.length === 1) {
      var iterator_1 = util_1.get(mappingObj[0], options.iteratorPath);
      input.forEach(function(inputElem, i) {
        var _a;
        return doMapping(
          mappingObj[0],
          inputElem,
          result,
          iterator_1
            ? Object.assign(iterators, ((_a = {}), (_a[iterator_1] = i), _a))
            : iterators,
          options,
        );
      });
    } else {
      mappingObj.forEach(function(mappingElem, i) {
        return doMapping(mappingElem, input[i], result, iterators, options);
      });
    }
  } else if (typeof mappingObj === 'object') {
    Object.entries(mappingObj)
      .filter(function(_a) {
        var key = _a[0];
        return key !== '$ite';
      })
      .forEach(function(_a) {
        var key = _a[0],
          value = _a[1];
        if (typeof value === 'string' && value.trim().startsWith('$')) {
          if (key === '_set') {
            var setVals = value.split(',');
            setVals.forEach(function(setVal) {
              var _a = setVal.split('='),
                setValPath = _a[0],
                setValVal = _a[1];
              var path = util_1.parsePathStr(setValPath, true).path;
              var iteratorPath = util_1.replaceIterators(path, iterators);
              util_1.set(result, iteratorPath, setValVal);
            });
          } else if (input[key] !== undefined) {
            var _b = util_1.parsePathStr(value, true),
              path = _b.path,
              transformFunction = _b.transformFunction;
            var iteratorPath = util_1.replaceIterators(path, iterators);
            console.log(iterators);
            if (options.evalMethod && transformFunction) {
              var transformedValue = util_1.transFormValue(
                input[key],
                transformFunction,
                options.evalMethod,
              );
              util_1.set(result, iteratorPath, transformedValue);
            } else {
              util_1.set(result, iteratorPath, input[key]);
            }
          }
        } else if (typeof value === 'object') {
          doMapping(value, input[key], result, iterators, options);
        }
      });
  } else {
    console.log('mapping not object');
  }
};
exports.responseMapping = function(
  userInputResponse,
  userMapping,
  userOptions,
  mergeObj,
) {
  if (userOptions === void 0) {
    userOptions = defaultResponseOptions;
  }
  return __awaiter(_this, void 0, void 0, function() {
    var input,
      mapping,
      result,
      options,
      _a,
      _b,
      yarrrml,
      rmlStr,
      rmlResult,
      e_1;
    return __generator(this, function(_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 8, , 9]);
          input = util_1.clone(userInputResponse);
          mapping = util_1.clone(userMapping);
          result = {};
          options = Object.assign(defaultResponseOptions, userOptions);
          if (!(options.type === 'xml' && mapping.body && input.body))
            return [3, 3];
          _a = mapping;
          return [4, util_1.xmlToJson(mapping.body)];
        case 1:
          _a.body = _c.sent();
          _b = input;
          return [4, util_1.xmlToJson(input.body)];
        case 2:
          _b.body = _c.sent();
          if (
            !options.iteratorPath ||
            options.iteratorPath === defaultResponseOptions.iteratorPath
          ) {
            options.iteratorPath = '$.ite';
          }
          _c.label = 3;
        case 3:
          if (options.type === 'json' && typeof mapping.body === 'string') {
            mapping.body = JSON.parse(mapping.body);
          }
          if (options.type === 'json' && typeof input.body === 'string') {
            input.body = JSON.parse(input.body);
          }
          if (!(options.type === 'json' || options.type === 'xml'))
            return [3, 4];
          doMapping(mapping, input, result, {}, options);
          return [3, 7];
        case 4:
          if (!(options.type === 'yarrrml')) return [3, 7];
          yarrrml = mapping;
          if (mapping.body) {
            yarrrml = mapping.body;
          }
          return [4, rmlmapper_1.yarrrmlPlusToRml(yarrrml)];
        case 5:
          rmlStr = _c.sent();
          return [
            4,
            rmlmapper_1.runRmlMapping(
              rmlStr,
              input.body ? input.body : input,
              options.rmlOptions,
            ),
          ];
        case 6:
          rmlResult = _c.sent();
          if (mapping.headers && input.headers) {
            doMapping(mapping.headers, input.headers, result, {}, options);
            util_1.mergeResult(rmlResult, result.$, new RegExp('$^'));
          }
          result.$ = rmlResult;
          _c.label = 7;
        case 7:
          if (mergeObj) {
            util_1.mergeResult(result.$, mergeObj, new RegExp('-input$'));
          }
          return [2, result.$];
        case 8:
          e_1 = _c.sent();
          util_1.logError(e_1);
          return [2, {}];
        case 9:
          return [2];
      }
    });
  });
};
