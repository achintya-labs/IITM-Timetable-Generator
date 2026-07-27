/*
acads_data.js

Maps semester name shown in UI
to the JSON file that should be fetched.
Only fetch when selected.
*/

const SEMESTER_DATA_FILES = {
    "Jul-Nov 2026": {
        "datafile": "./data/JUL-NOV-2026.json",
        "startdate": "2026-07-26T00:00:00.000+05:30",
        "enddate": "2026-11-07T00:00:00.000+05:30"
    },
    "Jan-May 2026": {
        "datafile": "./data/JAN-MAY-2026.json",
        "startdate": "2026-01-18T00:00:00.000+05:30",
        "enddate": "2026-05-05T00:00:00.000+05:30"
    }
};