import arg from 'arg';
import { billtk } from './main';

// Constants
const DATE_START_DEFAULT = new Date("1970-01-01T00:00:00Z").toISOString();
const DATE_END_DEFAULT   = (new Date()).toISOString();

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--date-start': Date,
      '--date-end'  : Date,
      '--title-include': String,
      '-s': '--date-start',
      '-e': '--date-end',
      '-ti': '--title-include',
    },
    {
      argv: rawArgs.slice(2),
    }
  );


  return {
    dateStart    : args['--date-start']    || DATE_START_DEFAULT,
    dateEnd      : args['--date-end']      || DATE_END_DEFAULT,
    titleInclude : args['--title-include'] || "TODO implement wildcard regex",
  };
}


export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  await billtk(options);
}