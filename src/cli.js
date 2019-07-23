import { billtk } from './main';
const moment = require('moment');
const program = require('commander');

// Default values
const DEFAULTS = {
  "--date-start": formatDateGCal("1970-01-01"),
  "--date-end"  : formatDateGCal(), // <-- Empty means now
  "--native-q"  : "(b:WP)",
}

program
  .option(
    '-s, --date-start <YYYY-MM-dd>',
    'Collect events starting from this date',
    formatDateGCal,
    DEFAULTS["--date-start"]
  )
  .option(
    '-e, --date-end   <YYYY-MM-dd>',
    'Collect events up to this date',
    formatDateGCal,
    DEFAULTS["--date-end"]
  )
  .option(
    '-q, --native-q   <string>',
    'Google\'s native query to filter events',
    DEFAULTS["--native-q"]
  );

export async function cli(processArgv) {
  program.parse(processArgv);
  await billtk(program);
}

function formatDateGCal (dateStr) {
  return moment(dateStr).format("YYYY-MM-DDTHH:mm:ssZ");
}