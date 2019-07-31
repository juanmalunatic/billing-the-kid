# Billing the Kid

## What is it for
It grabs entries from a Google Calendar, sorts/filters them, and 
outputs a nice table ready to be attached to invoices.

Default output is the console for now. CSV coming asap.

## Options
```
  Minimal options

  billtk          
  --date-start      2019-07-01
  --date-end        2019-07-02
  --title-include   regex "(b:WP)"
  --native-q        Native GCal's API [1]

  Quick (and highly personalized) options
    These options are temporary and override "native-q"
  --weeks    Show the amount of hours worked this week
  --days    
  --months
    

  Planned options

    --title-exclude regex
    --title-split   Split format into columns     
    --desc-include
    --desc-exclude
    --output-format
    --output-timezone "America/Bogota" by default

[1] "Free text search terms to find events that match these terms in any field,
except for extended properties. Optional. ".
Using native search relays filtering to Google instead of my own CPU :)
```

## Formatting
WIP
(b:WP) Hola - HolaHola [Categoría]

## Dependencies
https://github.com/yuhong90/node-google-calendar
To handle auth b/c I'm efficient (lazy).

### Preparations needed
Follow https://github.com/yuhong90/node-google-calendar/wiki#preparations-needed

## Roadmap

- [X] Receive essential CLI arguments
  - [x] Switch to commander.js
- [X] Auth to Google Calendar
- [X] Fetch N entries
- [x] Fetch N entries delimited by dates
  - [x] Format dates as RFC3339
  - [x] Add dates to query
- [x] Filter entries
  - [x] Filter with Google's native "q" option
  - [ ] Exclude locally w/ regex
- [x] Calculate time of events
- [x] Construct primitive report
  - [x] JSON
  - [ ] CSV
    - [ ] Convert JSON to CSV string using [json2csv](https://github.com/zemirco/json2csv).
- [ ] Split titles to columns to categorize
- [x] Make shortcuts to analyze day/week/month 
  - [x] Allow both a specific day OR all events since day
- [x] Generate aggregate stats
  - [x] Very simple sum of the minutes of retrieved events
- [ ] Use HTML-like tags to separate content from the description box
  - [ ] <summary>
  - [ ] <to-do>
  
## References
https://www.twilio.com/blog/how-to-build-a-cli-with-node-js