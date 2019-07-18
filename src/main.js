const CONFIG = require('../conf/gcal-settings');
const CalendarAPI = require('node-google-calendar');
let cal = new CalendarAPI(CONFIG);

export async function billtk(options) {

  // Placeholder
  let dirRun = process.cwd();
  console.log(dirRun);
  console.log(options);

  // Test
  let calendarId = CONFIG.calendarId['primary'];
  let params = {
    timeMin: '2017-05-20T06:00:00+08:00',
    timeMax: '2019-10-25T22:00:00+08:00',
    //q: 'query term', <-- TO-DO
    singleEvents: true,
    orderBy: 'startTime'
  }; 	//Optional query parameters referencing google APIs

  cal.Events.list(calendarId, params)
    .then(json => {
      //Success
      console.log('List of events on calendar within time-range:');
      console.log(json);
    }).catch(err => {
      //Error
      console.log('Error: listSingleEvents -' + err.message);
    });
}