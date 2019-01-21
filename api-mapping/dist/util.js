'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
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
