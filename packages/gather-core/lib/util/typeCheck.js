

exports.isBoolean = val => typeof (val) === 'boolean';
exports.isArray = val => Object.prototype.toString.call(val) === '[object Array]';
exports.isObject = val => Object.prototype.toString.call(val) === '[object Object]';
