const CONFIG = require('../conf/gcal-settings');
const CalendarAPI = require('node-google-calendar');
const moment = require('moment-timezone');
moment.tz.setDefault("America/Bogota");

const GCAL_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';
let cal = new CalendarAPI(CONFIG);
const OUTPUT_DATE_FORMAT = 'YYYY-MM-DD HH:mm';

export async function billtk(options) {

  // Placeholder
  let dirRun = process.cwd();
  console.log(dirRun);
  console.log(options);


  // Test
  let calendarId = CONFIG.calendarId['primary'];
  let params = {
    timeMin: options['dateStart'],
    timeMax: options['dateEnd'],
    singleEvents: true,
    orderBy: 'startTime'
  };

  if ('nativeQ' in options) {
    params.q = options['nativeQ'];
  }

  cal.Events.list(calendarId, params)
    .then(jsonEventList => {
      //Success
      console.log('List of events on calendar within time-range:');
      let report = createReport(jsonEventList);
      console.log(report);
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
      "desc" : event["description"],
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
    event["end"]   = event["end"]  .format(OUTPUT_DATE_FORMAT);
  }
  return reportData;
}