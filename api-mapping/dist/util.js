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
var xml2js = require('xml2js');
var vm = require('vm');
exports.deepMapValues = function(obj, f) {
  return Array.isArray(obj)
    ? obj.map(function(val) {
        return exports.deepMapValues(val, f);
      })
    : typeof obj === 'object'
    ? Object.entries(obj).reduce(function(acc, _a) {
        var key = _a[0],
          val = _a[1];
        acc[key] = exports.deepMapValues(val, f);
        return acc;
      }, {})
    : f(obj);
};
exports.pathStringToArr = function(path) {
  return path
    .replace(/\[([^\[\]]*)\]/g, '.$1.')
    .split('.')
    .filter(function(t) {
      return t !== '';
    });
};
exports.get = function(obj, selector) {
  return exports.pathStringToArr(selector).reduce(function(prev, cur) {
    return prev && prev[cur];
  }, obj);
};
var isDefined = function(t) {
  return !!t;
};
exports.URLJoin = function() {
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
exports.isNodeJs = function() {
  return typeof window === 'undefined';
};
exports.isBrowser = function() {
  return ![typeof window, typeof document].includes('undefined');
};
exports.removeUndef = function(obj) {
  return Object.entries(obj).reduce(function(acc, _a) {
    var k = _a[0],
      v = _a[1];
    if (!exports.isEmptyObject(v)) {
      acc[k] = v;
    }
    return acc;
  }, {});
};
exports.isEmptyObject = function(obj) {
  return (
    obj === null ||
    obj === undefined ||
    (Array.isArray(obj) && obj.length === 0) ||
    (typeof obj === 'object' && Object.keys(obj).length === 0)
  );
};
exports.isObject = function(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
};
exports.mergeResult = function(input, mergeObj, ignoreKeyRegex) {
  if (Array.isArray(input)) {
    input.forEach(function(_, i) {
      exports.mergeResult(input[i], mergeObj, ignoreKeyRegex);
    });
  } else {
    Object.entries(mergeObj).forEach(function(_a, i) {
      var key = _a[0],
        val = _a[1];
      if (ignoreKeyRegex && !ignoreKeyRegex.test(key)) {
        if (typeof val === 'object' && input[key] !== undefined) {
          exports.mergeResult(input[key], val, ignoreKeyRegex);
        } else if (input[key] === undefined && typeof val !== 'object') {
          input[key] = val;
        }
      }
    });
  }
};
exports.isNumeric = function(num) {
  return !isNaN(num);
};
exports.replaceIterators = function(path, iterators) {
  var newPath = path;
  Object.entries(iterators).forEach(function(_a) {
    var ite = _a[0],
      index = _a[1];
    newPath = newPath.replace(
      new RegExp('\\[' + ite + '\\]', 'g'),
      '[' + index + ']',
    );
  });
  return newPath;
};
exports.set = function(obj, path, value) {
  var paths = exports.pathStringToArr(path);
  setPath(obj, paths, value);
};
var setPath = function(obj, path, value) {
  var _a;
  var prop = path[0],
    rest = path.slice(1);
  if (path.length === 1) {
    if (Array.isArray(obj)) {
      if (exports.isNumeric(prop)) {
        if (obj[Number(prop)] !== undefined) {
          if (Array.isArray(obj[Number(prop)])) {
            obj[Number(prop)].push(value);
          } else {
            obj[Number(prop)] = [obj[Number(prop)], value];
          }
        } else {
          obj[Number(prop)] = value;
        }
      } else {
        if (
          obj.every(function(elem) {
            return typeof elem !== 'object';
          })
        ) {
          obj.push(((_a = {}), (_a[prop] = value), _a));
        } else {
          obj.forEach(function(elem, i) {
            if (typeof elem === 'object') {
              if (obj[i][prop] !== undefined) {
                if (Array.isArray(obj[i][prop])) {
                  obj[i][prop].push(value);
                } else {
                  obj[i][prop] = [obj[i][prop], value];
                }
              } else {
                console.log(obj[i]);
                console.log(i);
                obj[i][prop] = value;
              }
            }
          });
        }
      }
    } else {
      if (obj[prop] !== undefined) {
        if (Array.isArray(obj[prop])) {
          obj[prop].push(value);
        } else {
          obj[prop] = [obj[prop], value];
        }
      } else {
        obj[prop] = value;
      }
    }
  } else {
    if (Array.isArray(obj)) {
      if (exports.isNumeric(prop)) {
        if (obj[Number(prop)] !== undefined) {
          if (typeof obj[Number(prop)] === 'object') {
            setPath(obj[Number(prop)], rest, value);
          } else {
            obj[Number(prop)] = [obj[Number(prop)]];
            setPath(obj[Number(prop)], rest, value);
          }
        } else {
          obj[Number(prop)] = exports.isNumeric(rest[0]) ? [] : {};
          setPath(obj[Number(prop)], rest, value);
        }
      } else {
        if (
          obj.every(function(elem) {
            return typeof elem !== 'object';
          })
        ) {
          obj.push(exports.isNumeric(rest[0]) ? [] : {});
          setPath(obj[obj.length - 1], path, value);
        } else {
          obj.forEach(function(elem, i) {
            if (typeof elem === 'object') {
              setPath(obj[i], path, value);
            }
          });
        }
      }
    } else if (typeof obj === 'object') {
      if (obj[prop] !== undefined) {
        setPath(obj[prop], rest, value);
      } else {
        obj[prop] = exports.isNumeric(rest[0]) ? [] : {};
        setPath(obj[prop], rest, value);
      }
    } else {
      console.log('Object neither');
    }
  }
};
exports.xmlToJson = function(xml) {
  return __awaiter(_this, void 0, void 0, function() {
    return __generator(this, function(_a) {
      return [
        2,
        new Promise(function(resolve, reject) {
          xml2js.parseString(xml, { explicitCharkey: true }, function(
            err,
            result,
          ) {
            if (err) {
              reject(err);
            }
            resolve(result);
          });
        }),
      ];
    });
  });
};
exports.jsonToXml = function(json) {
  var xmlBuilder = new xml2js.Builder({ renderOpts: { pretty: true } });
  return xmlBuilder.buildObject(json);
};
exports.logError = function(e) {
  console.log('Mapping Error:');
  console.log(e);
};
exports.parsePathStr = function(pathStr, keepDollar) {
  if (keepDollar === void 0) {
    keepDollar = false;
  }
  var _a = pathStr.split(/\|>/).map(function(s) {
      return s.trim();
    }),
    path = _a[0],
    transformFunction = _a[1];
  return {
    transformFunction: transformFunction,
    path: keepDollar ? path : path.substring(2),
  };
};
exports.transFormValue = function(val, transformFunctionStr, evalMethod) {
  var cleanVal = typeof val === 'string' ? val.replace(/'/g, "\\'") : val;
  var code = '(' + transformFunctionStr + ")('" + cleanVal + "')";
  return exports.runCode(code, evalMethod);
};
exports.runCode = function(code, evalMethodType) {
  switch (evalMethodType) {
    case 'vm-runInNewContext':
      return vm.runInNewContext(code);
    case 'eval':
    default:
      return eval(code);
  }
};
