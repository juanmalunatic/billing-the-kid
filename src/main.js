// Requisites
const { Parser }  = require('json2csv');
const moment      = require('moment-timezone');
const CalendarAPI = require('node-google-calendar');
const CONFIG      = require('../conf/gcal-settings');

// Defaults
moment.tz.setDefault("America/Bogota");
const OUTPUT_DATE_FORMAT = 'YYYY-MM-DD HH:mm';
const GCAL_DATE_FORMAT   = 'YYYY-MM-DDTHH:mm:ssZ';

export async function billtk(program) {

  let calendarId = CONFIG.calendarId['primary'];
  let queryParams = formatQueryParams(program);

  let cal = new CalendarAPI(CONFIG);

  cal.Events
    .list (calendarId, queryParams)
    .then (
      jsonEvents => handleEventList(jsonEvents, program, queryParams)
    )
    .catch(handleEventListError);

}

function handleEventList (jsonEventList, program, queryParams) {
  // Do all the heavy lifting:
  // event processing, field computation, title formatting
  let report = reportProcessData(jsonEventList);

  // Format output
  let output = reportFormatOutput(report, program, queryParams);
  console.log (output);
}

function handleEventListError (err) {
  //Error
  console.log('Error: listSingleEvents -' + err.message);
}

function formatQueryParams(program) {
  // Format the query that brings the calendar's events

  let params = {
    timeMin: program.dateStart,
    timeMax: program.dateEnd,
    singleEvents: true,
    singleDay: program.singleDay,
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
  } else if (program.singleDay !== undefined) {
    period = 'singleDay';
  }
  if (period !== null) {
    let paramsToMerge = paramsPeriod(program, period);
    Object.assign(params, paramsToMerge);
  }

  return params;

}


function reportProcessData (jsonEventList) {

  // Heavy processing
  let reportColumns = [];
  reportColumns = filterFields(jsonEventList);
  reportColumns = addCalculatedFields(reportColumns);
  reportColumns = splitTitleFields   (reportColumns);
  reportColumns = formatFieldDisplay (reportColumns);

  // Short summary
  let reportSummary = summarizeReport(reportColumns);

  return {
    "name": "report",
    "columns": reportColumns,
    "summary": reportSummary,
  }
}

function filterFields(jsonEventList) {
  let reportData = [];
  for (let event of jsonEventList) {
    let reportEvent = {
      "title": event["summary"],
      "start": event["start"]["dateTime"],
      "end"  : event["end"]["dateTime"],
      "desc" : JSON.stringify(event["description"], null, 2),
    };
    reportData.push(reportEvent);
  }
  return reportData;
}

function addCalculatedFields(reportData) {
  for (let event of reportData) {
    // Format dates
    event["start"] = moment(event["start"], GCAL_DATE_FORMAT);
    event["end"]   = moment(event["end"]  , GCAL_DATE_FORMAT);

    // Know how many minutes elapsed
    let duration = moment.duration(
      event["end"].diff(event["start"])
    );
    let minutes = duration.asMinutes();
    event["minutes"] = minutes;
  }
  return reportData;
}

function splitTitleFields(reportData) {
  for (let event of reportData) {
    // Temporary format:
    // (b:WP) Project :: Title [Category-plural]
    // (b:WP) General :: Scrum [Meetings]

    let longTitle = event["title"];

    event["project"]    = getTitleProject(longTitle);
    event["category"]   = getTitleCategory(longTitle);
    event["title"]      = getTitleTitle(longTitle);
    event["title-long"] = longTitle;

  }
  return reportData;
}

function getTitlePart(title, regex, start = 0, end = 0) {
  let search = title.match(regex);
  let result = "";

  if (search !== null) {
    result = search[0]
      .slice(start, end)
      .trim();
  }

  return result;
}

function getTitleProject(title) {
  let regex = /\).*?\:\:/g;
  return getTitlePart(title, regex, 1, -2);
}

function getTitleCategory(title) {
  let regex = /\[.*?\]/g;
  return getTitlePart(title, regex, 1, -1);
}

function getTitleTitle(title) {
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

  // If period is a string, store its value
  let periodSub = (program[period] === true) ? 0 : program[period];

  let periodStart = moment().subtract(periodSub, period).startOf(period);
  let periodEnd = moment().subtract(periodSub, period).endOf(period);

  if (period === 'singleDay') {
    const singleDay = moment(program.singleDay, "YYYY-MM-DD");
    periodStart = moment(singleDay);
    periodEnd   = moment(singleDay).add(1, 'days').startOf('day');
  }

  //console.log("sub"  , periodSub);
  //console.log("start", periodStart);
  //console.log("end"  , periodEnd);

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

  let hoursHour = Math.trunc(sumMinutes / (60));
  let hoursMin = sumMinutes % 60;

  let obj = {
    "minutes": sumMinutes,
    "hours": sumMinutes / (60),
    "hoursF": hoursHour + ":" + hoursMin,
  }

  return {
    "summary": obj
  };
}


function reportFormatOutput(report, program, queryParams) {

  let output = ""

  if (program.output === undefined || program.ouptut === "verbose") {
    output = reportFormatVerbose(report, queryParams)
  } else if (program.output === "json") {
    output = reportFormatJson(report);
  } else if (program.output === "csv") {
    output = reportFormatCsv(report);
  }

  return output;
}

function reportFormatVerbose (report, queryParams) {
  
  let obj = {
    "queryParams": queryParams,
    "events"     : report.columns,
    "summary"    : report.summary,
  };
    
  return JSON.stringify( 
    obj, null, 2
  )
}

function reportFormatJson (report) {
  return JSON.stringify( 
    report.columns, null, 2
  )
}

function reportFormatCsv (report) {

  const fields = ['title', 'start', 'end', 'minutes', 'project', 'category', 'title-long', 'desc'];
  const opts = {
    "fields": fields,
    "delimiter": "\t",
  };

  let reportData = report.columns;

  try {

    const parser = new Parser(opts);
    const csv = parser.parse(reportData);
    return csv;

  } catch (err) {

    return error;

  }
}