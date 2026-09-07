const slotLayout = {
    "Monday": ["A", "B", "C", "D", "PG", "G", "P", "H", "J", "M"],
    "Tuesday": ["A", "B", "C", "D", "PG", "F", "Q", "H", "M", "E"],
    "Wednesday": ["E", "B", "C", "D", "PG", "F", "R", "G", "J", "K"],
    "Thursday": ["E", "F", "G", "A", "PG", "D", "S", "H", "L", "J"],
    "Friday": ["F", "G", "A", "B", "C", "PG", "T", "E", "K", "L"]
};

const defaultDate = "2026-07-26T00:00:00.000+05:30";
let STARTDATE = "";
let ENDDATE = "";

const colorList = {
    "A": "lite_green",
    "B": "lavender",
    "C": "sky",
    "D": "orange",
    "E": "red",
    "F": "yellow",
    "G": "mossgreen",
    "H": "green",
    "J": "pink",
    "K": "blue",
    "L": "gray",
    "M": "lite_blue",
    "P": "sandal",
    "Q": "sandal",
    "R": "sandal",
    "S": "sandal",
    "T": "sandal",
    "PG": "gray_light",
}

var slotData = {}; // { slot: { courseNo, name, venue } }
var overrideData = {}; // { "Monday-A": { courseNo, name, venue } }
var MtechData = {}
var quizData = {}; // { slot: { courseNo, name, examType, midsemDate?, endsemDate? } }
var quizDateOverrides = {}; // { slot: { quiz1Date, quiz2Date, endsemDate } }

let ACADS_COURSES = {}; // Add courses after pulling from file
let CURRENT_SEMESTER = "";

// Quiz-eligible slots and their exam dates (update dates per semester)
const QUIZ_ELIGIBLE_SLOTS = ["E", "F", "L", "K", "A", "H", "B", "M", "C", "J", "D", "G"];

const QUIZ_DATES_CALENDAR = {
    "A": { quiz1Date: "2026-08-31", quiz2Date: "2026-10-12", endsemDate: "2026-11-10" },
    "B": { quiz1Date: "2026-09-01", quiz2Date: "2026-10-06", endsemDate: "2026-11-13" },
    "C": { quiz1Date: "2026-09-02", quiz2Date: "2026-10-07", endsemDate: "2026-11-14" },
    "D": { quiz1Date: "2026-09-03", quiz2Date: "2026-10-15", endsemDate: "2026-11-16" },
    "E": { quiz1Date: "2026-08-27", quiz2Date: "2026-10-08", endsemDate: "2026-11-17" },
    "F": { quiz1Date: "2026-08-28", quiz2Date: "2026-10-13", endsemDate: "2026-11-18" },
    "G": { quiz1Date: "2026-09-04", quiz2Date: "2026-10-09", endsemDate: "2026-11-19" },
    "H": { quiz1Date: "2026-08-31", quiz2Date: "2026-10-12", endsemDate: "2026-11-11" },
    "J": { quiz1Date: "2026-09-02", quiz2Date: "2026-10-07", endsemDate: "2026-11-11" },
    "K": { quiz1Date: "2026-08-28", quiz2Date: "2026-10-08", endsemDate: "2026-11-12" },
    "L": { quiz1Date: "2026-08-27", quiz2Date: "2026-10-08", endsemDate: "2026-11-12" },
    "M": { quiz1Date: "2026-09-01", quiz2Date: "2026-10-06", endsemDate: "" }
};

function printTimetable() {
    captureFullTimetable((wrapper) => {
        const printWindow = window.open("", "_blank");

        // Collect all same-origin styles
        let styles = "";
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                Array.from(sheet.cssRules).forEach(rule => {
                    styles += rule.cssText;
                });
            } catch (e) {}
        });

        // ✅ Robust table detection
        const table =
            wrapper.tagName === "TABLE"
                ? wrapper
                : wrapper.querySelector("table") || wrapper.firstElementChild;

        if (!table) {
            console.error("Timetable table not found");
            return;
        }

        const tableWidth = table.scrollWidth;
        const tableHeight = table.scrollHeight;

        // A4 landscape printable area (@96dpi approx)
        const PAGE_WIDTH = 1120;
        const PAGE_HEIGHT = 780;

        const scale = Math.min(
            PAGE_WIDTH / tableWidth,
            PAGE_HEIGHT / tableHeight,
            1
        );

        printWindow.document.write(`
        <html>
          <head>
            <title style="text-align:center">Timetable</title>
            <style>
              ${styles}

              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              @page {
                size: A4 landscape;
                margin: 10mm;
              }

              html, body {
                margin: 0;
                padding: 0;
                background: white;
              }

              .print-scale {
                transform-origin: top left;
                width: ${tableWidth}px;
                height: ${tableHeight}px;
              }

              table {
                display: table !important;
                overflow: visible !important;
              }
            </style>
          </head>
          <body>
            <h1 style="margin: 0 auto; text-align: center;"> Timetable </h1>
            <div class="print-scale">
              ${table.outerHTML}
            </div>
          </body>
        </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        printWindow.onload = async () => {
            try {
                // 1. Wait for fonts
                if (printWindow.document.fonts) {
                    await printWindow.document.fonts.ready;
                }

                // 2. Wait for layout + styles
                await new Promise(resolve => setTimeout(resolve, 50));

                // 3. Final paint
                printWindow.requestAnimationFrame(() => {
                    printWindow.print();
                    printWindow.close();
                });
            } catch {
                // Fallback
                printWindow.print();
                printWindow.close();
            }
        };

    });
}



function captureFullTimetable(callback) {
    const table = document.getElementById("timetable");

    // Clone timetable
    const clone = table.cloneNode(true);

    // Wrapper for layout only
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "-99999px";
    wrapper.style.left = "0";
    wrapper.style.background = "transparent";
    wrapper.style.display = "inline-block";
    wrapper.style.padding = "0";
    wrapper.style.margin = "0";

    clone.style.display = "inline-block";

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    requestAnimationFrame(() => {
        callback(clone); // capture ONLY the table
        document.body.removeChild(wrapper);
    });
}

function download_tt() {
    captureFullTimetable((tableClone) => {
        html2canvas(tableClone, {
            backgroundColor: null,   // removes white background
            scale: 10
        }).then(canvas => {
            const link = document.createElement("a");
            link.download = "timetable.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    });
}


function addSlotRow(slot = "", course_num = "", course_name = "", venue = "") {
    const container = document.getElementById("slotInputs");
    const div = document.createElement("div");
    function get_selected_slot(check_slot) {
        if (slot == check_slot) {
            return "selected";
        }
        return "";
    }
    div.className = "form-row";
    div.innerHTML = `<span class="tt-data">
                    <select class="row_slot">
                        <option ${get_selected_slot('')}>Slot</option>
                        <option ${get_selected_slot('A')}>A</option>
                        <option ${get_selected_slot('B')}>B</option>
                        <option ${get_selected_slot('C')}>C</option>
                        <option ${get_selected_slot('D')}>D</option>
                        <option ${get_selected_slot('E')}>E</option>
                        <option ${get_selected_slot('F')}>F</option>
                        <option ${get_selected_slot('G')}>G</option>
                        <option ${get_selected_slot('H')}>H</option>
                        <option ${get_selected_slot('J')}>J</option>
                        <option ${get_selected_slot('K')}>K</option>
                        <option ${get_selected_slot('L')}>L</option>
                        <option ${get_selected_slot('M')}>M</option>
                        <option ${get_selected_slot('P')}>P</option>
                        <option ${get_selected_slot('Q')}>Q</option>
                        <option ${get_selected_slot('R')}>R</option>
                        <option ${get_selected_slot('S')}>S</option>
                        <option ${get_selected_slot('T')}>T</option>
                        <option ${get_selected_slot('PG')}>Lunch</option>
                    </select>
                    <input placeholder="Course No." class="row_course_number" value = "${course_num}">
                    <input placeholder="Course Name" class="row_course_name" value = "${course_name}">
                    <input placeholder="Venue" class="row_venue"  value = "${venue}">
                    </span>
                    <span class="close-btn" value="" onclick="this.parentElement.remove()">×</span>`;
    container.appendChild(div);

}

function addOverrideRow(day = "", slot = "", course_num = "", course_name = "", venue = "") {
    const container = document.getElementById("overrideInputs");
    const div = document.createElement("div");
    function get_selected_day(check_day) {
        if (day == check_day) {
            return "selected";
        }
        return "";
    }
    function get_selected_slot(check_slot) {
        if (slot == check_slot) {
            return "selected";
        }
        return "";
    }

    console.log(day);
    div.className = "form-row";
    div.innerHTML = ` <span class="tt-data">
                    <select class="row_day">
                        <option ${get_selected_day('')} disabled>Day</option>
                        <option ${get_selected_day('Monday')}>Monday</option>
                        <option ${get_selected_day('Tuesday')}>Tuesday</option>
                        <option ${get_selected_day('Wednesday')}>Wednesday</option>
                        <option ${get_selected_day('Thursday')}>Thursday</option>
                        <option ${get_selected_day('Friday')}>Friday</option>
                    </select>
                    <select class="row_slot">
                        <option ${get_selected_slot('')} disabled>Slot</option>
                        <option ${get_selected_slot('A')}>A</option>
                        <option ${get_selected_slot('B')}>B</option>
                        <option ${get_selected_slot('C')}>C</option>
                        <option ${get_selected_slot('D')}>D</option>
                        <option ${get_selected_slot('E')}>E</option>
                        <option ${get_selected_slot('F')}>F</option>
                        <option ${get_selected_slot('G')}>G</option>
                        <option ${get_selected_slot('H')}>H</option>
                        <option ${get_selected_slot('J')}>J</option>
                        <option ${get_selected_slot('K')}>K</option>
                        <option ${get_selected_slot('L')}>L</option>
                        <option ${get_selected_slot('M')}>M</option>
                        <option ${get_selected_slot('P')}>P</option>
                        <option ${get_selected_slot('Q')}>Q</option>
                        <option ${get_selected_slot('R')}>R</option>
                        <option ${get_selected_slot('S')}>S</option>
                        <option ${get_selected_slot('T')}>T</option>
                        <option ${get_selected_slot('PG')}>Lunch</option>
                    </select>
                    <input placeholder="Course No." class="row_course_number" value = "${course_num}">
                    <input placeholder="Course Name" class="row_course_name" value = "${course_name}">
                    <input placeholder="Venue" class="row_venue"  value = "${venue}">
                    </span>
                    <span class="close-btn" value="" onclick="this.parentElement.remove()">×</span>`;
    container.appendChild(div);

}

function gen_gcal() {
    parseInputs();
    let data = {}
    Object.keys(slotLayout).forEach(day => {
        slotLayout[day].forEach(slot => {
            const key = `${day}-${slot}`;
            data[key] = overrideData[key] || slotData[slot];
            if (data[key] != null) {
                if (data[key].courseNo == "" && data[key].name == "" && data[key].venue == "") {
                    data[key] = null;
                }
            }
        });
    });

    return data;
}

function download_gcal() {
    const data = gen_gcal();
    downloadICS(data, MtechData, STARTDATE, ENDDATE);
}


async function import_gcal() {
    message_field = document.getElementById('gcal_import_mesg');
    data = gen_gcal();
    message_field.innerHTML = `<b>Status:</b> Running import. Please wait ... <br><br>`
    let result = await importICSgcal(data, MtechData, STARTDATE, ENDDATE);
    if (result == true) {
        message_field.innerHTML = `<b>Status:</b> Successfully imported! <br><br>`
    }
    else if (result == false) {
        message_field.innerHTML = `<b>Status:</b> Failed to import! <br><br>`
    }
}

function setMtechInputs() {
    document.getElementById("use_mtech_slot")
        .querySelectorAll('input[type="checkbox"]')
        .forEach(cb => {
            const day = cb.value;
            if (MtechData[day]) {
                cb.checked = !!MtechData[day].value;
            }
        });
}

function readMtechInputs() {
    MtechData = { "Monday": { "slot": "G", value: false }, "Tuesday": { "slot": "A", value: false }, "Wednesday": { "slot": "B", value: false }, "Thursday": { "slot": "D", value: false }, "Friday": { "slot": "C", value: false } };
    document.getElementById("use_mtech_slot")
        .querySelectorAll('input[type="checkbox"]:checked')
        .forEach(cb => {
            const day = cb.value;
            if (MtechData[day]) {
                MtechData[day].value = true;
            }
        });
}

function parseInputs() {
    // Parse Slots
    slotData = {}
    overrideData = {}
    document.querySelectorAll("#slotInputs .tt-data").forEach(row => {
        var [slot, courseNo, name, venue] = Array.from(row.children).map(el => el.value.trim());
        if (slot == "Lunch") {
            slot = "PG";
        }
        if (slot) {
            slotData[slot] = { courseNo, name, venue };
        }
    });

    // Parse Overrides
    document.querySelectorAll("#overrideInputs .tt-data").forEach(row => {
        const [daySel, slot, courseNo, name, venue] = Array.from(row.children);
        const day = daySel.value;
        var slotVal = slot.value.trim();
        if (slotVal == "Lunch") {
            slotVal = "PG";
        }
        if (day && slotVal) {
            overrideData[`${day}-${slotVal}`] = {
                courseNo: courseNo.value.trim(),
                name: name.value.trim(),
                venue: venue.value.trim()
            };
        }
    });

    readMtechInputs();
}

async function initializeSemesterSelector() {
    const selector = document.getElementById("semesterSelect");
    // const heading = document.getElementById("semesterHeading");

    selector.innerHTML = "";

    Object.keys(SEMESTER_DATA_FILES).forEach((semester) => {
        const option = document.createElement("option");
        option.value = semester;
        option.textContent = semester;
        selector.appendChild(option);
    });

    const defaultSemester = Object.keys(SEMESTER_DATA_FILES)[0];

    CURRENT_SEMESTER =
        localStorage.getItem("selectedSemester") || defaultSemester;

    if (!SEMESTER_DATA_FILES[CURRENT_SEMESTER]) {
        CURRENT_SEMESTER = defaultSemester;
    }

    selector.value = CURRENT_SEMESTER;
    // heading.innerText = `Semester: ${CURRENT_SEMESTER}`;

    ACADS_COURSES = await fetch_courses_json(CURRENT_SEMESTER);
    [STARTDATE, ENDDATE] = await fetch_startenddate_json(CURRENT_SEMESTER);

    selector.addEventListener("change", async function () {
        CURRENT_SEMESTER = this.value;

        localStorage.setItem("selectedSemester", CURRENT_SEMESTER);

        // heading.innerText = `Semester: ${CURRENT_SEMESTER}`;

        ACADS_COURSES = await fetch_courses_json(CURRENT_SEMESTER);
        const [startDateString, endDateString] = await fetch_startenddate_json(CURRENT_SEMESTER);

        STARTDATE = Date(startDateString);
        ENDDATE = Date(endDateString);
    });
}

async function fetch_startenddate_json(semester) {
    if (!semester) return {};

    const startDate = SEMESTER_DATA_FILES[semester]["startdate"] || defaultDate;
    const endDate = SEMESTER_DATA_FILES[semester]["enddate"] || defaultDate;
    
    return [startDate, endDate];

}

async function fetch_courses_json(semester) {
    if (!semester) return {};

    const filePath = SEMESTER_DATA_FILES[semester]["datafile"];

    if (!filePath) {
        console.error(`No JSON mapped for semester: ${semester}`);
        return {};
    }

    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch semester course data:", error);
        return {};
    }
}

function getCourseDataAcads(courseNo) {
    const normalizedCourseNo = courseNo.toUpperCase();

    const defaultCourse = {
        slot: "",
        name: "",
        venue: "",
        courseNo: normalizedCourseNo
    };

    if (!ACADS_COURSES[normalizedCourseNo]) {
        return defaultCourse;
    }

    return {
        ...defaultCourse,
        ...ACADS_COURSES[normalizedCourseNo]
    };
}

function populateData() {
    document.querySelectorAll("#slotInputs .tt-data").forEach((row) => {
        const courseNoInput =
            row.getElementsByClassName("row_course_number")[0];

        const courseNo = courseNoInput.value.trim().toUpperCase();

        if (!courseNo) return;

        const courseData = getCourseDataAcads(courseNo);

        const elements = {
            slot: row.getElementsByClassName("row_slot")[0],
            courseNo: courseNoInput,
            name: row.getElementsByClassName("row_course_name")[0],
            venue: row.getElementsByClassName("row_venue")[0]
        };

        if (elements.slot.value === "Slot") {
            elements.slot.value = "";
        }

        if (!elements.slot.value && courseData.slot) {
            elements.slot.value = courseData.slot;
        }

        if (!elements.name.value && courseData.name) {
            elements.name.value = courseData.name;
        }

        if (!elements.venue.value && courseData.venue) {
            elements.venue.value = courseData.venue;
        }

        elements.courseNo.value = courseNo;
    });
}

async function upload_saved_data_file() {
    const upload_field = document.getElementById('upload_cal_save');

    // Return a Promise that resolves when the file is selected
    const file = await new Promise((resolve) => {
        // Temporary one-time event listener
        const handler = () => {
            upload_field.removeEventListener('change', handler);
            resolve(upload_field.files[0]);
        };
        upload_field.addEventListener('change', handler);
        upload_field.click();
    });

    if (!file) return; // user may cancel

    const GetFile = new FileReader();
    GetFile.readAsText(file);
    GetFile.onloadend = load_saved_data;
}

function load_saved_data(event) {

    clear_tables();
    let jsondata = event.target.result;
    process_saved_data(jsondata);

}

function process_saved_data(jsondata) {

    // jsondata = '{"slotData":{"A":{"courseNo":"asas","name":"aaa","venue":"aaa"}},"overrideData":{}}'

    data = JSON.parse(jsondata);
    slotData = data.slotData || {};
    overrideData = data.overrideData || {};
    MtechData = data.MtechData || {};
    quizData = data.quizData || {};
    quizDateOverrides = data.quizDateOverrides || {};

    Object.keys(slotData).forEach(slot => {
        addSlotRow(slot, slotData[slot].courseNo, slotData[slot].name, slotData[slot].venue);
    })

    Object.keys(overrideData).forEach(override => {
        [day, slot] = override.split("-");
        console.log(day, slot);
        addOverrideRow(day, slot, overrideData[override].courseNo, overrideData[override].name, overrideData[override].venue);
    })

    Object.keys(quizData).forEach(slot => {
        const course = quizData[slot];
        addQuizRow(slot, course.courseNo, course.name, course.examType, course.midsemDate, course.endsemDate);
    })

    Object.keys(quizDateOverrides).forEach(slot => {
        const override = quizDateOverrides[slot];
        addQuizOverrideRow(slot, override.quiz1Date, override.quiz2Date, override.endsemDate);
    })

    setMtechInputs();
    generateTable();
    
    // Sync timetable to quiz (one-way: TT -> Quiz for eligible slots only)
    syncTimetableToQuiz();

}

function download_data() {
    jsondata = save_data();
    const blob = new Blob([jsondata], { type: "text/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "timetable_save.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function save_data() {
    parseInputs();
    parseQuizInputs();
    parseQuizOverrides();
    data = { slotData: slotData, overrideData: overrideData, MtechData: MtechData, quizData: quizData, quizDateOverrides: quizDateOverrides };
    return JSON.stringify(data);
}


function save_to_cookie() {
    jsondata = save_data();
    // Build the expiration date string:
    var expiration_date = new Date();
    var cookie_string = '';
    expiration_date.setFullYear(expiration_date.getFullYear() + 1);
    // Build the set-cookie string:
    cookie_string = "save_data=" + jsondata + "; path=/; expires=" + expiration_date.toUTCString();
    // Create or update the cookie:
    document.cookie = cookie_string;
}

function RunMtechCheck(key) {
    [day, slot] = key.split("-")
    if (slot == "PG") {
        if (MtechData[day]["value"] == true) {
            return `${day}-${MtechData[day]["slot"]}-B`;
        } else if (MtechData[day]["value"] == false) {
            return `${day}-${MtechData[day]["slot"]}-M`;
        }
    }

    if (MtechData[day]["slot"] == slot && MtechData[day]["value"] == true) {
        return `${key}-M`;
    } else if (MtechData[day]["slot"] == slot && MtechData[day]["value"] == false) {
        return `${key}-B`;
    } else {
        return key;
    }
}

function generateTable() {

    parseInputs();
    // Generate Table

    Object.keys(slotLayout).forEach(day => {
        slotLayout[day].forEach(slot => {
            const key = `${day}-${slot}`;
            let data = overrideData[key] || slotData[slot] || null;

            if (data != null) {
                if (data.courseNo == "" && data.name == "" && data.venue == "") {
                    data = null;
                }
            }

            element = document.getElementById(`${RunMtechCheck(key)}`);

            element.classList.replace(element.classList.item(0), colorList[slot]);
            if (data == null) {
                if (slot != "PG"){
                    element.innerHTML = `(${slot})`;
                } else {
                    element.innerHTML = `Lunch`;
                }
                element.classList.add("td-muted");
            } else {
                element.innerHTML = `(${slot}) <br> <strong> ${data.courseNo} </strong><br>${data.name}<br> <span style="font-size: x-small">${data.venue}</span>`;
                element.classList.remove("td-muted");
            }
            


        });
    });

    save_to_cookie();
    syncTimetableToQuiz();

}

function clear_element(id) {
    const ele = document.getElementById(id);
    ele.innerHTML = "";
}

function clearSlotRows() {
    clear_element("slotInputs");
}

function clearOverrideRows() {
    clear_element("overrideInputs");
}

function clear_tables() {
    clearSlotRows();
    clearOverrideRows();
}

function load_from_cookie() {
    cookies = document.cookie.split(";");

    if (cookies.length == 0) {
        return;
    }

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].replace(/^\s+|\s+$/g, "");
        if (cookie.slice(0, 9) == "save_data") {
            process_saved_data((cookie).slice(10));
        }
    }
}

function setupDarkMode() {
    const toggle = document.getElementById("darkModeToggle");
    const savedTheme = localStorage.getItem("theme");

    // Apply saved preference
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        toggle.checked = true;
    } else if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        toggle.checked = false;
    } else {
        // No saved preference → follow system
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        toggle.checked = prefersDark;
    }

    toggle.addEventListener("change", () => {
        document.body.classList.remove("dark-mode", "light-mode");

        if (toggle.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.add("light-mode");
            localStorage.setItem("theme", "light");
        }
    });
}


function switchTab(tab) {
    document.querySelectorAll(".tab-page").forEach(p => {
        p.hidden = p.id !== `tab-${tab}`;
    });
    document.querySelectorAll(".nav-tab").forEach(b => {
        b.classList.toggle("active", b.id === `tab-btn-${tab}`);
    });
    localStorage.setItem("activeTab", tab);
    
    // Auto-populate quiz tab from timetable if switching to quiz and quizData is empty
    if (tab === "quiz") {
        autoPopulateQuizFromTimetable();
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    switchTab(localStorage.getItem("activeTab") || "timetable");
    load_from_cookie();
    await initializeSemesterSelector();
    setupDarkMode();
});

document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const isPrint =
        (isMac && e.metaKey && e.key === "p") ||
        (!isMac && e.ctrlKey && e.key === "p");

    if (isPrint) {
        e.preventDefault();
        printTimetable();
    }
});

document.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");

  const isSave =
    (isMac && e.metaKey && e.key === "s") ||
    (!isMac && e.ctrlKey && e.key === "s");

  if (isSave) {
    e.preventDefault();     // stop browser Save dialog
    e.stopPropagation();

    download_data();
  }
});


window.addEventListener("beforeprint", () => {
    // Redirect to your custom print
    printTimetable();
});


// ==================== QUIZ SCHEDULE FUNCTIONS ====================

function addQuizRow(slot = "", courseNo = "", courseName = "", examType = "quiz", midsemDate = "", endsemDate = "") {
    const container = document.getElementById("quizInputs");
    const div = document.createElement("div");
    
    function get_selected_slot(check_slot) {
        return slot === check_slot ? "selected" : "";
    }
    
    function get_selected_exam_type(check_type) {
        return examType === check_type ? "selected" : "";
    }
    
    const showMidsemDate = examType === "midsem" || examType === "Midsem-based" ? "" : "none";
    
    div.className = "form-row";
    div.innerHTML = `<span class="tt-data">
                    <select class="row_slot_quiz">
                        <option ${get_selected_slot('')}>Slot</option>
                        ${QUIZ_ELIGIBLE_SLOTS.map(s => `<option ${get_selected_slot(s)}>${s}</option>`).join('')}
                    </select>
                    <input placeholder="Course No." class="row_course_number_quiz" value="${courseNo}">
                    <input placeholder="Course Name" class="row_course_name_quiz" value="${courseName}">
                    <select class="row_exam_type" onchange="toggleMidsemDates(this)">
                        <option ${get_selected_exam_type('quiz')}>Quiz-based</option>
                        <option ${get_selected_exam_type('midsem')}>Midsem-based</option>
                    </select>
                    <input type="date" class="midsem_date_input" placeholder="Midsem Date" value="${midsemDate}" style="display: ${showMidsemDate}">
                    <span class="midsem_hint" style="display: ${showMidsemDate}; font-size: 0.85rem; color: #666; white-space: nowrap;">Enter midsem date</span>
                    </span>
                    <span class="close-btn" value="" onclick="this.parentElement.remove()">×</span>`;
    container.appendChild(div);
}

function toggleMidsemDates(selectElement) {
    const row = selectElement.closest('.form-row');
    const midsemInput = row.querySelector('.midsem_date_input');
    const midsemHint = row.querySelector('.midsem_hint');
    
    if (selectElement.value === "Midsem-based") {
        midsemInput.style.display = "";
        if (midsemHint) midsemHint.style.display = "";
    } else {
        midsemInput.style.display = "none";
        if (midsemHint) midsemHint.style.display = "none";
        midsemInput.value = "";
    }
}

function clearQuizRows() {
    const ele = document.getElementById("quizInputs");
    ele.innerHTML = "";
}

function parseQuizInputs() {
    quizData = {};
    document.querySelectorAll("#quizInputs .tt-data").forEach(row => {
        const slot = row.querySelector(".row_slot_quiz").value.trim();
        const courseNo = row.querySelector(".row_course_number_quiz").value.trim();
        const name = row.querySelector(".row_course_name_quiz").value.trim();
        const examType = row.querySelector(".row_exam_type").value;
        
        if (slot && slot !== "Slot") {
            quizData[slot] = { courseNo, name, examType };
            
            // If midsem-based, store the midsem date (endsem comes from calendar)
            if (examType === "Midsem-based") {
                const midsemDate = row.querySelector(".midsem_date_input").value;
                quizData[slot].midsemDate = midsemDate;
            }
        }
    });
}

function autoPopulateQuizFromTimetable() {
    // Check if cookie and slotData exist
    if (!document.cookie || Object.keys(slotData).length === 0) {
        return;
    }
    
    // Check if quizData already has entries
    const existingQuizInputs = document.querySelectorAll("#quizInputs .tt-data");
    if (existingQuizInputs.length > 0) {
        return; // Already populated
    }
    
    // Auto-populate from slotData
    Object.keys(slotData).forEach(slot => {
        if (QUIZ_ELIGIBLE_SLOTS.includes(slot)) {
            const course = slotData[slot];
            addQuizRow(slot, course.courseNo, course.name, "quiz");
        }
    });
}

function populateQuizData() {
    // Populate course name and slot from course database based on course number
    document.querySelectorAll("#quizInputs .tt-data").forEach((row) => {
        const courseNoInput = row.querySelector(".row_course_number_quiz");
        const courseNo = courseNoInput.value.trim().toUpperCase();
        
        if (!courseNo) return;
        
        const courseData = getCourseDataAcads(courseNo);
        
        const elements = {
            slot: row.querySelector(".row_slot_quiz"),
            courseNo: courseNoInput,
            name: row.querySelector(".row_course_name_quiz")
        };
        
        if (elements.slot.value === "Slot" || !elements.slot.value) {
            if (courseData.slot && QUIZ_ELIGIBLE_SLOTS.includes(courseData.slot)) {
                elements.slot.value = courseData.slot;
            }
        }
        
        if (!elements.name.value && courseData.name) {
            elements.name.value = courseData.name;
        }
        
        elements.courseNo.value = courseNo;
    });
}

function generateQuizTable() {
    parseQuizInputs();
    parseQuizOverrides();
    
    if (Object.keys(quizData).length === 0) {
        document.getElementById("quizTableContainer").innerHTML = "<p><i>No courses added. Please add courses above.</i></p>";
        return;
    }
    
    // Separate quiz-based and midsem-based courses
    const quizBasedCourses = [];
    const midsemBasedCourses = [];
    
    Object.keys(quizData).forEach(slot => {
        const course = quizData[slot];
        if (course.examType === "Midsem-based") {
            midsemBasedCourses.push({ slot, ...course });
        } else {
            quizBasedCourses.push({ slot, ...course });
        }
    });
    
    let tableHTML = "";
    
    // Generate Quiz-based table
    if (quizBasedCourses.length > 0) {
        // Sort by Quiz 1 date
        quizBasedCourses.sort((a, b) => {
            const dateA = getEffectiveDate(a.slot, 'quiz1Date');
            const dateB = getEffectiveDate(b.slot, 'quiz1Date');
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.localeCompare(dateB);
        });
        
        tableHTML += `
            <h3 style="margin-top: 1.5rem;">Quiz-based Courses</h3>
            <table class="timetable quiz-table" id="quizTable" style="margin-top: 20px;">
                <thead>
                    <tr class="gray_light">
                        <th>Slot</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Quiz 1</th>
                        <th>Quiz 2</th>
                        <th>End Sem</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        quizBasedCourses.forEach(course => {
            const quiz1Date = formatDateDisplay(getEffectiveDate(course.slot, 'quiz1Date'));
            const quiz2Date = formatDateDisplay(getEffectiveDate(course.slot, 'quiz2Date'));
            const endsemDate = formatDateDisplay(getEffectiveDate(course.slot, 'endsemDate'));
            
            tableHTML += `
                <tr>
                    <td class="${colorList[course.slot] || 'gray_light'}">${course.slot}</td>
                    <td>${course.courseNo}</td>
                    <td>${course.name}</td>
                    <td>${quiz1Date}</td>
                    <td>${quiz2Date}</td>
                    <td>${endsemDate}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
    }
    
    // Generate Midsem-based table
    if (midsemBasedCourses.length > 0) {
        // Sort by Midsem date
        midsemBasedCourses.sort((a, b) => {
            const dateA = a.midsemDate || "";
            const dateB = b.midsemDate || "";
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.localeCompare(dateB);
        });
        
        tableHTML += `
            <h3 style="margin-top: 1.5rem;">Midsem-based Courses</h3>
            <table class="timetable midsem-table" id="midsemTable" style="margin-top: 20px;">
                <thead>
                    <tr class="gray_light">
                        <th>Slot</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Midsem</th>
                        <th>End Sem</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        midsemBasedCourses.forEach(course => {
            const midsemDate = formatDateDisplay(course.midsemDate);
            // Get endsem from calendar or override
            const endsemDate = formatDateDisplay(getEffectiveDate(course.slot, 'endsemDate'));
            
            tableHTML += `
                <tr>
                    <td class="${colorList[course.slot] || 'gray_light'}">${course.slot}</td>
                    <td>${course.courseNo}</td>
                    <td>${course.name}</td>
                    <td>${midsemDate}</td>
                    <td>${endsemDate}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
    }
    
    document.getElementById("quizTableContainer").innerHTML = tableHTML;
    save_to_cookie();
    syncQuizToTimetable();
}

function getEffectiveDate(slot, dateType) {
    // Check override first
    if (quizDateOverrides[slot] && quizDateOverrides[slot][dateType]) {
        return quizDateOverrides[slot][dateType];
    }
    // Fallback to calendar
    if (QUIZ_DATES_CALENDAR[slot] && QUIZ_DATES_CALENDAR[slot][dateType]) {
        return QUIZ_DATES_CALENDAR[slot][dateType];
    }
    return "";
}

function formatDateDisplay(isoDate) {
    if (!isoDate) return "—";
    
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const parts = isoDate.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
}

function printQuizSchedule() {
    const quizTable = document.getElementById("quizTable");
    const midsemTable = document.getElementById("midsemTable");
    
    if (!quizTable && !midsemTable) {
        alert("Please generate the quiz schedule first!");
        return;
    }
    
    const printWindow = window.open("", "_blank");
    
    let styles = "";
    Array.from(document.styleSheets).forEach(sheet => {
        try {
            Array.from(sheet.cssRules).forEach(rule => {
                styles += rule.cssText;
            });
        } catch (e) {}
    });
    
    const container = document.getElementById("quizTableContainer");
    
    printWindow.document.write(`
        <html>
          <head>
            <title>Quiz Schedule</title>
            <style>
              ${styles}
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              
              html, body {
                margin: 0;
                padding: 0;
                background: white;
              }
              
              table {
                display: table !important;
                overflow: visible !important;
                width: 100%;
              }
            </style>
          </head>
          <body>
            <h1 style="margin: 0 auto; text-align: center;">Quiz Schedule</h1>
            ${container.innerHTML}
          </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    printWindow.onload = async () => {
        try {
            if (printWindow.document.fonts) {
                await printWindow.document.fonts.ready;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
            printWindow.requestAnimationFrame(() => {
                printWindow.print();
                printWindow.close();
            });
        } catch {
            printWindow.print();
            printWindow.close();
        }
    };
}

function addQuizOverrideRow(slot = "", quiz1Date = "", quiz2Date = "", endsemDate = "") {
    const container = document.getElementById("quizOverrideInputs");
    const div = document.createElement("div");
    
    function get_selected_slot(check_slot) {
        return slot === check_slot ? "selected" : "";
    }
    
    div.className = "form-row";
    div.innerHTML = `<span class="tt-data">
                    <div class=date-with-label>
                        <label>Slot</label>
                        <select class="override_slot">
                            <option ${get_selected_slot('')}>Slot</option>
                            ${QUIZ_ELIGIBLE_SLOTS.map(s => `<option ${get_selected_slot(s)}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="date-with-label">
                        <label>Quiz 1</label>
                        <input type="date" class="override_quiz1_date" value="${quiz1Date}">
                    </div>
                    <div class="date-with-label">
                        <label>Quiz 2</label>
                        <input type="date" class="override_quiz2_date" value="${quiz2Date}">
                    </div>
                    <div class="date-with-label">
                        <label>Endsem</label>
                        <input type="date" class="override_endsem_date" value="${endsemDate}">
                    </div>
                    </span>
                    <span class="close-btn" value="" onclick="this.parentElement.remove()">×</span>`;
    container.appendChild(div);
}

function clearQuizOverrideRows() {
    const ele = document.getElementById("quizOverrideInputs");
    ele.innerHTML = "";
}

function parseQuizOverrides() {
    quizDateOverrides = {};
    document.querySelectorAll("#quizOverrideInputs .tt-data").forEach(row => {
        const slot = row.querySelector(".override_slot").value.trim();
        const quiz1Date = row.querySelector(".override_quiz1_date").value;
        const quiz2Date = row.querySelector(".override_quiz2_date").value;
        const endsemDate = row.querySelector(".override_endsem_date").value;
        
        if (slot && slot !== "Slot") {
            quizDateOverrides[slot] = { quiz1Date, quiz2Date, endsemDate };
        }
    });
}

function download_quiz_data() {
    parseQuizInputs();
    parseQuizOverrides();
    const data = { quizData: quizData, quizDateOverrides: quizDateOverrides };
    const jsondata = JSON.stringify(data);
    const blob = new Blob([jsondata], { type: "text/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "quiz_schedule_save.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function upload_saved_quiz_data_file() {
    const upload_field = document.getElementById('upload_quiz_save');

    const file = await new Promise((resolve) => {
        const handler = () => {
            upload_field.removeEventListener('change', handler);
            resolve(upload_field.files[0]);
        };
        upload_field.addEventListener('change', handler);
        upload_field.click();
    });

    if (!file) return;

    const GetFile = new FileReader();
    GetFile.readAsText(file);
    GetFile.onloadend = load_saved_quiz_data;
}

function load_saved_quiz_data(event) {
    clearQuizRows();
    clearQuizOverrideRows();
    
    let jsondata = event.target.result;
    process_saved_quiz_data(jsondata);
}

function process_saved_quiz_data(jsondata) {
    const data = JSON.parse(jsondata);
    quizData = data.quizData || {};
    quizDateOverrides = data.quizDateOverrides || {};

    Object.keys(quizData).forEach(slot => {
        const course = quizData[slot];
        addQuizRow(slot, course.courseNo, course.name, course.examType, course.midsemDate, course.endsemDate);
    });

    Object.keys(quizDateOverrides).forEach(slot => {
        const override = quizDateOverrides[slot];
        addQuizOverrideRow(slot, override.quiz1Date, override.quiz2Date, override.endsemDate);
    });
}

function download_quiz_ics() {
    parseQuizInputs();
    parseQuizOverrides();
    
    if (Object.keys(quizData).length === 0) {
        alert("No quiz data found. Please add courses first.");
        return;
    }
    
    // Build events array
    const events = [];
    
    Object.keys(quizData).forEach(slot => {
        const course = quizData[slot];
        
        if (course.examType === "Midsem-based") {
            // Midsem event
            if (course.midsemDate) {
                events.push({
                    summary: `${course.courseNo} - Midsem`,
                    description: `${course.name} (Slot ${slot})`,
                    date: course.midsemDate
                });
            }
            // Endsem from calendar/override
            const endsemDate = getEffectiveDate(slot, 'endsemDate');
            if (endsemDate) {
                events.push({
                    summary: `${course.courseNo} - Endsem`,
                    description: `${course.name} (Slot ${slot})`,
                    date: endsemDate
                });
            }
        } else {
            // Quiz-based events
            const quiz1Date = getEffectiveDate(slot, 'quiz1Date');
            const quiz2Date = getEffectiveDate(slot, 'quiz2Date');
            const endsemDate = getEffectiveDate(slot, 'endsemDate');
            
            if (quiz1Date) {
                events.push({
                    summary: `${course.courseNo} - Quiz 1`,
                    description: `${course.name} (Slot ${slot})`,
                    date: quiz1Date
                });
            }
            if (quiz2Date) {
                events.push({
                    summary: `${course.courseNo} - Quiz 2`,
                    description: `${course.name} (Slot ${slot})`,
                    date: quiz2Date
                });
            }
            if (endsemDate) {
                events.push({
                    summary: `${course.courseNo} - Endsem`,
                    description: `${course.name} (Slot ${slot})`,
                    date: endsemDate
                });
            }
        }
    });
    
    if (events.length === 0) {
        alert("No exam dates found to export.");
        return;
    }
    
    // Generate ICS content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IITM Timetable Generator//Exam Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Exam Schedule
X-WR-TIMEZONE:Asia/Kolkata
`;

    events.forEach(event => {
        const dateStr = event.date.replace(/-/g, ''); // YYYY-MM-DD -> YYYYMMDD
        const uid = `${dateStr}-${event.summary.replace(/\s+/g, '-')}@iitm-timetable`;
        
        icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:${event.summary} tomorrow
END:VALARM
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;

    // Download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exam_schedule.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function exportQuizToGoogleCalendar() {
    parseQuizInputs();
    parseQuizOverrides();
    
    if (Object.keys(quizData).length === 0) {
        alert("No quiz data found. Please add courses and generate the schedule first.");
        return;
    }
    
    const messageField = document.getElementById('quizGcalMessage');
    messageField.innerHTML = `<b>Status:</b> Preparing export to Google Calendar... <br><br>`;
    
    // Build events array
    const events = [];
    
    Object.keys(quizData).forEach(slot => {
        const course = quizData[slot];
        
        if (course.examType === "Midsem-based") {
            // Midsem event
            if (course.midsemDate) {
                events.push({
                    summary: `${course.courseNo} - Midsem`,
                    description: `${course.name} (Slot ${slot})`,
                    start: { date: course.midsemDate },
                    end: { date: course.midsemDate }
                });
            }
            // Endsem from calendar/override
            const endsemDate = getEffectiveDate(slot, 'endsemDate');
            if (endsemDate) {
                events.push({
                    summary: `${course.courseNo} - Endsem`,
                    description: `${course.name} (Slot ${slot})`,
                    start: { date: endsemDate },
                    end: { date: endsemDate }
                });
            }
        } else {
            // Quiz-based events
            const quiz1Date = getEffectiveDate(slot, 'quiz1Date');
            const quiz2Date = getEffectiveDate(slot, 'quiz2Date');
            const endsemDate = getEffectiveDate(slot, 'endsemDate');
            
            if (quiz1Date) {
                events.push({
                    summary: `${course.courseNo} - Quiz 1`,
                    description: `${course.name} (Slot ${slot})`,
                    start: { date: quiz1Date },
                    end: { date: quiz1Date }
                });
            }
            if (quiz2Date) {
                events.push({
                    summary: `${course.courseNo} - Quiz 2`,
                    description: `${course.name} (Slot ${slot})`,
                    start: { date: quiz2Date },
                    end: { date: quiz2Date }
                });
            }
            if (endsemDate) {
                events.push({
                    summary: `${course.courseNo} - Endsem`,
                    description: `${course.name} (Slot ${slot})`,
                    start: { date: endsemDate },
                    end: { date: endsemDate }
                });
            }
        }
    });
    
    if (events.length === 0) {
        messageField.innerHTML = `<b>Status:</b> No exam dates found to export. <br><br>`;
        return;
    }
    
    messageField.innerHTML = `<b>Status:</b> Exporting ${events.length} events to Google Calendar. Please wait... <br><br>`;
    
    try {
        await loadGapi();
        await authenticate();
        
        const calendarId = await createCalendar("Exam Schedule");
        await insertEvents(calendarId, events);
        
        messageField.innerHTML = `<b>Status:</b> Successfully exported ${events.length} exam events to Google Calendar! <br><br>`;
    } catch (error) {
        console.error(error);
        messageField.innerHTML = `<b>Status:</b> Failed to export to Google Calendar. ${error.message || ''} <br><br>`;
    }
}

// ==================== TIMETABLE-QUIZ SYNC FUNCTIONS ====================

function syncTimetableToQuiz() {
    // Sync from timetable to quiz (one-way: TT -> Quiz for eligible slots only)
    // Only updates quiz if slot doesn't already exist in quizData
    
    parseInputs(); // Refresh slotData
    
    Object.keys(slotData).forEach(slot => {
        if (QUIZ_ELIGIBLE_SLOTS.includes(slot)) {
            // Check if this slot already exists in quizData
            if (!quizData[slot]) {
                // Add to quizData if not present
                quizData[slot] = {
                    courseNo: slotData[slot].courseNo,
                    name: slotData[slot].name,
                    examType: "quiz"
                };
            } else {
                // Update course info but keep exam type and dates
                quizData[slot].courseNo = slotData[slot].courseNo;
                quizData[slot].name = slotData[slot].name;
            }
        }
    });
    
    // Remove quiz entries for slots no longer in timetable
    Object.keys(quizData).forEach(slot => {
        if (!slotData[slot]) {
            delete quizData[slot];
        }
    });
    
    save_to_cookie();
}

function syncQuizToTimetable() {
    // Sync from quiz back to timetable (for eligible slots only)
    // Updates course info in slotData if changed in quizData
    
    parseQuizInputs(); // Refresh quizData
    
    Object.keys(quizData).forEach(slot => {
        if (QUIZ_ELIGIBLE_SLOTS.includes(slot)) {
            if (slotData[slot]) {
                // Update course info in timetable
                slotData[slot].courseNo = quizData[slot].courseNo;
                slotData[slot].name = quizData[slot].name;
                // Keep venue from timetable
            }
        }
    });
    
    save_to_cookie();
}