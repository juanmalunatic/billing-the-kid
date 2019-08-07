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
  reportData = splitTitleFields(reportData);
  reportData = formatFieldDisplay(reportData);

  let summary = summarizeReport(reportData);
  reportData.push(summary);

  // TO-DO
  //reportData = reportFormat(reportData);

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

function splitTitleFields (reportData) {
  for (let event of reportData) {
    // Temporary format:
    // (b:WP) Project :: Title [Category-plural]
    // (b:WP) General :: Scrum [Meetings]

    let longTitle = event["title"];

    event["project"]    = getTitleProject (longTitle);
    event["category"]   = getTitleCategory(longTitle);
    event["title"]      = getTitleTitle   (longTitle);
    event["title-long"] = longTitle;

  }
  return reportData;
}

function getTitlePart (title, regex, start = 0, end = 0) {
  let search = title.match(regex);
  let result = "";

  if (search !== null) {
    result = search[0]
      .slice(start, end)
      .trim();
  }

  return result;
}

function getTitleProject (title) {
  let regex = /\).*?\:\:/g;
  return getTitlePart(title, regex, 1, -2);
}

function getTitleCategory (title) {
  let regex = /\[.*?\]/g;
  return getTitlePart(title, regex, 1, -1);
}

function getTitleTitle (title) {
  let regex = /\:\:.*?\[/g;
  return getTitlePart(title, regex, 2, -1);
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

function summarizeReport(reportData) {
  
  let sumMinutes = 0;
  for (let event of reportData) {
    sumMinutes += event.minutes;
  }

  let hoursHour = Math.trunc(sumMinutes/(60));
  let hoursMin  = sumMinutes % 60;

  let obj = {
    "minutes": sumMinutes, 
    "hours"  : sumMinutes/(60),
    "hoursF" : hoursHour + ":" + hoursMin,
  }

  return {
    "summary": obj
  };
}

