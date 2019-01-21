'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var util_1 = require('./util');
var transFormValue = function(val, transformFunctionStr, evalMethodType) {
  var cleanVal = typeof val === 'string' ? val.replace(/'/g, "\\'") : val;
  var code = '(' + transformFunctionStr + ")('" + cleanVal + "')";
  switch (evalMethodType) {
    case 'vm-runInNewContext':
      var vm = require('vm');
      return vm.runInNewContext(code);
    case 'eval':
    default:
      return eval(code);
  }
};
var parsePathStr = function(pathStr, keepDollar) {
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
var useInputValue = function(inputObj, pathStr, options) {
  var _a = parsePathStr(pathStr),
    path = _a.path,
    transformFunction = _a.transformFunction;
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
exports.requestMapping = function(inputAction, mapping, options) {
  if (options === void 0) {
    options = defaultRequestOptions;
  }
  var transformValue = function(val) {
    return typeof val === 'string' && val.startsWith('$')
      ? useInputValue(inputAction, val, options)
      : val;
  };
  var newObj = util_1.removeUndef(
    util_1.deepMapValues(mapping, transformValue),
  );
  var path = newObj.path && newObj.path.join('/');
  var queryString =
    newObj.query &&
    Object.entries(newObj.query).map(function(_a) {
      var k = _a[0],
        v = _a[1];
      return '?' + encodeURIComponent(k) + '=' + encodeURIComponent(v);
    });
  var url = util_1.URLJoin(newObj.url, path, queryString);
  return util_1.removeUndef({
    url: url,
    headers: newObj.headers,
    body: newObj.body,
  });
};
var defaultResponseOptions = {
  evalMethod: 'eval',
};
var doMapping = function(mappingObj, input, result, iterators, options) {
  if (!input || !mappingObj) {
    return;
  }
  if (Array.isArray(mappingObj) && Array.isArray(input)) {
    if (mappingObj.length === 1) {
      var iterator_1 = mappingObj[0].$ite;
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
        if (
          typeof value === 'string' &&
          value.startsWith('$') &&
          input[key] !== undefined
        ) {
          var _b = parsePathStr(value, true),
            path = _b.path,
            transformFunction = _b.transformFunction;
          var iteratorPath = util_1.replaceIterators(path, iterators);
          if (options.evalMethod && transformFunction) {
            var transformedValue = transFormValue(
              input[key],
              transformFunction,
              options.evalMethod,
            );
            util_1.set(result, iteratorPath, transformedValue);
          } else {
            util_1.set(result, iteratorPath, input[key]);
          }
        } else if (typeof value === 'object') {
          doMapping(value, input[key], result, iterators, options);
        }
      });
  } else {
    console.log('mapping not object');
  }
};
exports.responseMapping = function(inputResponse, mapping, options, mergeObj) {
  if (options === void 0) {
    options = defaultResponseOptions;
  }
  var result = {};
  doMapping(mapping, inputResponse, result, {}, options);
  if (mergeObj) {
    util_1.mergeResult(result.$, mergeObj, new RegExp('-input$'));
  }
  return result.$;
};
