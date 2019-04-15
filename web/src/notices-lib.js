//@ts-check

// Initialise spxTodayDate to UTC of current day at 0000 hours
const spxTodayDate = setToUtcZero(new Date());
let currDate = new Date(spxTodayDate);
let prevDate = new Date(spxTodayDate);
let nextDate = new Date(spxTodayDate);

let currentGroupQueryStr = "5,6,7,8,9,10,11,12";

let spxTextDateInfo    = document.getElementById("spx-js-text-date-info");
let spxTextDateNotices = document.getElementById("spx-js-text-date-notices");
let spxButtonToday     = document.getElementById("spx-js-button-today");
let spxButtonNextDay   = document.getElementById("spx-js-button-nextday");
let spxButtonPrevDay   = document.getElementById("spx-js-button-prevday");
let spxButtonViewAll   = document.getElementById("spx-js-button-view-all");
let spxButtonView5     = document.getElementById("spx-js-button-view-5");
let spxButtonView6     = document.getElementById("spx-js-button-view-6");
let spxButtonView7     = document.getElementById("spx-js-button-view-7");
let spxButtonView8     = document.getElementById("spx-js-button-view-8");
let spxButtonView9     = document.getElementById("spx-js-button-view-9");
let spxButtonView10    = document.getElementById("spx-js-button-view-10");
let spxButtonView11    = document.getElementById("spx-js-button-view-11");
let spxButtonView12    = document.getElementById("spx-js-button-view-12");

spxButtonToday.onclick = viewToday;
spxButtonNextDay.onclick = viewNextDay;
spxButtonPrevDay.onclick = viewPrevDay;

updateDates();





async function getNotices(date=Date.prototype) {
    return new Promise(function executor(resolve, reject){
        let xhr = new XMLHttpRequest();
        xhr.timeout = 5000;
        let begin = encodeURIComponent(currDate.toISOString());
        let end = encodeURIComponent(currDate.toISOString());
        xhr.open("GET", "/api/get?groups="+currentGroupQueryStr+"&begin="+begin+"&end="+end);
        xhr.send();
        xhr.onreadystatechange = function(){
            if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                resolve(xhr.responseText);
                console.log(xhr.responseText);
            } else if (xhr.readyState === xhr.DONE) {
                console.log("ERRR");
                reject("");
            }
        };
    });
    
}

// Update the previous and next days based on current view date .
function updateDates() {
    prevDate = new Date(currDate);
    nextDate = new Date(currDate);
    prevDate.setDate(currDate.getDate() - 1);
    nextDate.setDate(currDate.getDate() + 1);
    updateDateText();
}

function viewToday() {
    currDate = new Date(spxTodayDate);
    getNotices(currDate).then(()=>{
        updateDates();
    });
}

function viewNextDay() {
    currDate = new Date(nextDate);
    getNotices(currDate).then(()=>{
        updateDates();
    });
}

function viewPrevDay() {
    currDate = new Date(prevDate);
    getNotices(currDate).then(()=>{
        updateDates();
    });
}

function updateDateText () {
    
    let spxTodayFmt = fmtDate(spxTodayDate);
    let spxCurrDayFmt = fmtDate(currDate);
    let spxPrevDayFmt = fmtDate(prevDate);
    let spxNextDayFmt = fmtDate(nextDate);

    // Initialise Text: Dates, Button Labels
    spxTextDateInfo.textContent = spxTodayFmt.dayName+" "+spxTodayFmt.date+spxTodayFmt.dateSuffix+" "+spxTodayFmt.monthName+" "+spxTodayFmt.year;
    spxTextDateNotices.textContent = "Notices - "+spxCurrDayFmt.dayName+" "+spxCurrDayFmt.date+spxCurrDayFmt.dateSuffix+" "+spxCurrDayFmt.monthName;
    
    spxButtonPrevDay.textContent = "View "+spxPrevDayFmt.shortDayName+" "+spxPrevDayFmt.padDate+"."+spxPrevDayFmt.month+"."+spxPrevDayFmt.shortYear;
    spxButtonNextDay.textContent = "View "+spxNextDayFmt.shortDayName+" "+spxNextDayFmt.padDate+"."+spxNextDayFmt.month+"."+spxNextDayFmt.shortYear;
}





function fmtDate (date=Date.prototype) {
    let dayName = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ][date.getUTCDay()];
    let shortDayName = [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ][date.getUTCDay()];
    let monthName = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ][date.getUTCMonth()];
    let dateSuffix = [
        "st","nd","rd","th","th","th","th","th","th",
        "th","th","th","th","th","th","th","th","th","th",
        "th","st","nd","rd","th","th","th","th","th","th",
        "th","st"
    ][date.getUTCDate()-1];
    return {
        dayName: dayName,
        shortDayName: shortDayName,
        monthName: monthName,
        dateSuffix: dateSuffix,
        year: String(date.getUTCFullYear()),
        month: String(date.getUTCMonth()).padStart(2,"0"),
        date: String(date.getUTCDate()),
        padDate: String(date.getUTCDate()).padStart(2,"0"),
        shortYear: String(date.getUTCFullYear()).slice(-2)
    };
}

function setToUtcZero (date=Date.prototype) {
    date.setUTCHours(0,0,0,0);
    date.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return date;
}
