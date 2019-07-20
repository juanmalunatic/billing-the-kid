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
    timeMin: options['dateStart'],
    timeMax: options['dateEnd'],
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