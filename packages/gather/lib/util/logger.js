

const format = require('util').format;
const chalk = require('chalk');
const version = require('../../package.json').version;

/**
 * Prefix.
 */
const prefix = `[gather@${version}]`;
const sep = chalk.gray('-');

/**
 * Log a `message` to the console.
 *
 * @param {String} message
 */
exports.log = function (...args) {
  const msg = format.apply(format, args);
  console.log(chalk.cyan(prefix), sep, msg);
};

/**
 * Log an error `message` to the console and exit.
 *
 * @param {String} message
 */
exports.fatal = function (message) {
  exports.error(message);

  if (process.env.NODE_ENV === 'testing') {
    throw new Error('exit');
  } else {
    /* istanbul ignore next */
    process.exit(1);
  }
};

/**
 * Log an error `message` to the console and no exit.
 *
 * @param {String} message
 */
exports.error = function (...args) {
  // if (args[0] instanceof Error) {
    // args[0] = args[0].message.trim();
    // args[0] = args[0].toString();
  // }

  const msg = format.apply(format, args);
  console.error(chalk.red(prefix), sep, msg);
};

exports.warn = function (...args) {
  const msg = format.apply(format, args);
  console.log(chalk.yellow(prefix), sep, msg);
};

/**
 * Log a success `message` to the console and exit.
 *
 * @param {String} message
 */
exports.success = function (...args) {
  const msg = format.apply(format, args);
  console.log(chalk.green(prefix), sep, msg);
};
