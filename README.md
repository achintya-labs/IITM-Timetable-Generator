# IITM Timetable & Calendar Generator

An interactive, web-based tool designed for IIT Madras students to generate, customize, export, and sync semester course timetables with Google Calendar or standard `.ics` calendar clients.

---

## Live Application

The project is hosted live at [tt.mathiitm.com](https://tt.mathiitm.com). The contents of the `web/` directory are deployed directly to serve the site.

---

## Features

- **Auto-Populate Courses**: Enter course codes (e.g., `CS1100`, `EE2001`) to automatically fetch slot information, course names, and venues from the pre-parsed semester database.
- **Multi-Semester Support**: Switch between academic semesters (e.g., *Jul-Nov 2026*, *Jan-May 2026*) with pre-configured semester start and end dates.
- **B.Tech / M.Tech Lunch Slot Switch**: Toggle lunch slot timings per day to fit B.Tech or M.Tech schedule variations.
- **Manual Overrides**: Customize specific day-slot assignments or leave fields blank to delete specific slots.
- **Direct Google Calendar Sync**: Integrates with Google Identity Services and Google Calendar API to directly push recurring course events into `@smail.iitm.ac.in` Google Calendars.
- **Export to `.ics`**: Generate standard iCalendar (`.ics`) files with weekly recurring rules (`RRULE`) compatible with Apple Calendar, Outlook, and Google Calendar.
- **High-Res Export & PDF Print**: Download your visual timetable grid as a PNG image or print/save as an A4 landscape PDF.
- **Save & Restore Progress**: Export your custom timetable setup to `timetable_save.json` or reload previously saved sessions from file or browser cookies.
- **Dark & Light Mode**: Built-in dark mode toggle with automatic system theme detection.
- **Classic Theme Option**: An optional classic styling theme is available for users who prefer it by appending `?style=classic` to the URL.

---

## Repository Structure

```text
IITM-Calendar-Generator/
├── web/                   # Deployed web application directory (Static HTML/CSS/JS)
│   ├── index.html         # Main web application interface
│   ├── script.js          # Core application logic, grid generator & state management
│   ├── style.css          # Modern stylesheet with Dark/Light theme support
│   ├── classic.css        # Optional classic theme stylesheet (?style=classic)
│   ├── course_jsons.js    # Semester dataset mapping and date configurations
│   ├── gen_gcal.js        # iCalendar (.ics) file generator engine
│   ├── g_cal_push.js      # Google Calendar API integration & OAuth push
│   └── data/              # Parsed JSON course data per semester
│       ├── JAN-MAY-2026.json
│       └── JUL-NOV-2026.json
├── course_data/           # Raw TSV course data files exported from IITM portals
│   ├── aug-nov-26.tsv
│   └── jan-may-26.tsv
├── scripts/               # Utility scripts for data processing
│   └── parse.py           # Python script to convert raw TSV files into JSON for web/data/
└── README.md              # Project documentation
```

---

## How It Works

### 1. Web Application (`web/`)
The web application is built with vanilla HTML5, CSS3, and JavaScript, requiring no build steps. 
- Serves directly from the `web/` folder.
- Dynamic course lookups query JSON datasets in `web/data/`.
- Google Calendar sync uses client-side Google API JavaScript libraries (`gapi` & `accounts.google.com/gsi/client`).

### 2. Course Data Parsing (`scripts/ & course_data/`)
Raw course slotting tables downloaded from academic portals are stored in `course_data/*.tsv`. 
The Python script `scripts/parse.py` parses these TSV files, normalizes slot codes and course details, and outputs structured JSON files formatted for the web app.

To generate updated JSON data from a TSV file:
```bash
python3 scripts/parse.py > web/data/JUL-NOV-2026.json
```

---

## Running Locally

To run and test the web app locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/achintya-labs/IITM-Calendar-Generator.git
   cd IITM-Calendar-Generator
   ```
2. Serve the `web/` directory using any HTTP server:
   ```bash
   # Using Python
   python3 -m http.server 8000 --directory web

   # Or using Node npx
   npx serve web
   ```
3. Open `http://localhost:8000` in your web browser.

---

## Feedback & Contributions

Created by **Achintya Raghavan**.

For any feedback, bug reports, suggestions, or dataset updates/contributions, please email `ar@smail.iitm.ac.in`.
