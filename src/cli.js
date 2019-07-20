import arg from 'arg';
import { billtk } from './main';
const moment = require('moment');

// Default values
const DEFAULTS = {
  dateStart: formatDate(moment("1970-01-01")),
  dateEnd: formatDate(moment()),
  titleInclude: "TO-DO",
}

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--date-start': String,
      '--date-end': String,
      '--title-include': String,
      '--native-q': String,
      '-s': '--date-start',
      '-e': '--date-end',
      '-ti': '--title-include',
      '-q': '--native-q',
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  // Default handling
  let formattedArgs = formatArgs(args);
  return formattedArgs;
}

function formatArgs(args) {
  args = formatIncomingArgs(args);
  args = fillDefaultArgs(args);
  args = keysToCamel(args);
  return args;
}

function isArgsEmpty(args) {
  return Object.keys(args).length == 1;
}

function formatIncomingArgs(args) {

  // Remove if '_' is empty
  if (args['_'].length == 0) {
    delete args['_'];
  }

  for (let key in args) {
    // Dates
    if (key.indexOf('date') !== -1) { // Good enough for now
      args[key] = formatDate(moment(args[key]));
    }
  }
  return args;
}

function fillDefaultArgs(args) {
  for (let keyCamel in DEFAULTS) {
    let keyDashKebab = '--' + camelToKebab(keyCamel); //helloWorld → --hello-world
    if (typeof args[keyDashKebab] === 'undefined') {
      args[keyDashKebab] = DEFAULTS[keyCamel];
    }
  }
  return args;
}

function keysToCamel(args) {
  let obj = {};
  for (let key in args) {
    let keyCamel = kebabToCamel(key.slice(2));
    obj[keyCamel] = args[key];
  }
  return obj;
}

function camelToKebab(string) {
  return string
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
};

function kebabToCamel(string) {
  return string
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function formatDate(dateMoment) {
  return dateMoment.format("YYYY-MM-DDTHH:mm:ssZ");
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  await billtk(options);
}