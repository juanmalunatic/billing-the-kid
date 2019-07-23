const moment = require('moment-timezone');
moment.tz.setDefault("America/Bogota");

const CONFIG = require('../conf/gcal-settings');
const CalendarAPI = require('node-google-calendar');
let cal = new CalendarAPI(CONFIG);

const OUTPUT_DATE_FORMAT = 'YYYY-MM-DD HH:mm';
const GCAL_DATE_FORMAT   = 'YYYY-MM-DDTHH:mm:ssZ';

export async function billtk(program) {

  // Placeholder
  let dirRun = process.cwd();

  // Test
  let calendarId = CONFIG.calendarId['primary'];
  let params = {
    timeMin: program.dateStart,
    timeMax: program.dateEnd,
    singleEvents: true,
    orderBy: 'startTime'
  };

  if (program.nativeQ !== undefined) {
    params.q = program.nativeQ;
  }

  // Override inputs for special flags

  let period = null;
  if (program.days !== undefined) {
    period = 'days';
  } else if (program.weeks !== undefined) {
    period = 'weeks';
  } else if (program.months !== undefined) {
    period = 'months';
  }
  if (period !== null) {
    let paramsToMerge = paramsPeriod(program, period);
    Object.assign(params, paramsToMerge);
  }

  console.log('Params:')
  console.log(
    JSON.stringify(params, null, 2)
  );
  console.log('--------------------------------------');

  cal.Events.list(calendarId, params)
    .then(jsonEventList => {
      //Success
      let report = createReport(jsonEventList);

      

      console.log(
        JSON.stringify(report, null, 2)
      );
    }).catch(err => {
      //Error
      console.log('Error: listSingleEvents -' + err.message);
    });

}

function createReport(jsonEventList) {
  let reportData = [];
  reportData = filterFields(jsonEventList);
  reportData = addCalculatedFields(reportData);
  reportData = formatFieldDisplay(reportData);
  return reportData;
}

function filterFields(jsonEventList) {
  let reportData = [];
  for (let event of jsonEventList) {
    let reportEvent = {
      "title": event["summary"],
      "start": event["start"]["dateTime"],
      "end"  : event["end"]["dateTime"],
      //"desc" : event["description"],
    };
    reportData.push(reportEvent);
  }
  return reportData;
}

function addCalculatedFields(reportData) {
  for (let event of reportData) {
    // Format dates
    event["start"] = moment(event["start"], GCAL_DATE_FORMAT);
    event["end"]   = moment(event["end"], GCAL_DATE_FORMAT);

    // Know how many minutes elapsed
    let duration = moment.duration(
      event["end"].diff(event["start"])
    );
    let minutes = duration.asMinutes();
    event["minutes"] = minutes;
  }
  return reportData;
}


function formatFieldDisplay(reportData) {
  for (let event of reportData) {
    // Format dates
    event["start"] = event["start"].format(OUTPUT_DATE_FORMAT);
    event["end"]   = event["end"].format(OUTPUT_DATE_FORMAT);
  }
  return reportData;
}

moment.fn.toGCal = function () {
  return this.format("YYYY-MM-DDTHH:mm:ssZ");
}

// I've been bitten off before by over-generalizing and noticing
// afterwards there's a need to apply custom formatting/processing.
// Hope it's not the case here.

function paramsPeriod(program, period) {
  let periodSub  = (program[period] === true) ? 0 : program[period];
  let periodStart = moment().subtract(periodSub, period).startOf(period);
  let periodEnd   = moment().subtract(periodSub, period).endOf(period);
  if (program.cumulative === true) {
    periodEnd = moment().endOf('day'); // Since start to the end of today
  }
  let obj = {
    timeMin: periodStart.toGCal(),
    timeMax: periodEnd.toGCal(),
  }
  return obj;
}