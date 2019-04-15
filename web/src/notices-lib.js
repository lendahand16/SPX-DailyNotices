//@ts-check

// ================================================================
//   Main Program
// ================================================================

const SPX_TODAY = setToUtcZero(new Date());
let SPX_CURRENT_NOTICES = [];
let SPX_CURRENT_DATE = new Date(SPX_TODAY);
let SPX_CURRENT_GROUP = "";
setGroup("all",document.getElementById("spx-js-button-view-all"));
viewCurrDay();


// ================================================================
//   Function Declarations
// ================================================================


function refreshView() {
    fetchNotices(SPX_CURRENT_DATE,()=>{
        updateDateLabels();
        displayGroup(SPX_CURRENT_GROUP);
    });
}
function viewCurrDay(){SPX_CURRENT_DATE=getRelativeDate(SPX_TODAY);refreshView();}
function viewNextDay(){SPX_CURRENT_DATE=getRelativeDate(SPX_CURRENT_DATE,1);refreshView();}
function viewPrevDay(){SPX_CURRENT_DATE=getRelativeDate(SPX_CURRENT_DATE,-1);refreshView();}

function getRelativeDate(date=Date.prototype, offset=0) {
	let nextDate = new Date(date);
	nextDate.setDate(date.getDate() + offset);
	return nextDate;
}

function fetchNotices(date=Date.prototype, callback=()=>{}) {
	let xhr = new XMLHttpRequest();
	xhr.timeout = 5000;
    let dateParam = encodeURIComponent(date.toISOString());
	xhr.open("GET", "/api/get?begin="+dateParam+"&end="+dateParam);
	xhr.send();
	xhr.onreadystatechange = function(){
		if (xhr.readyState === xhr.DONE && xhr.status === 200) {
            SPX_CURRENT_NOTICES = JSON.parse(xhr.responseText)["notices"];
            callback();
		} else if (xhr.readyState === xhr.DONE) {
			console.error("Error Getting Notices");
		}
    };
    xhr.onerror = function(e) {
        console.error(e);
    }
    return;
}

function setActiveGroupButton (selected=HTMLElement.prototype) {
    let groupControls = document.getElementById("spx-js-group-controls");
	for (let i=0; i<groupControls.children.length; i++) {
        groupControls.children[i].className = "spx-button";
    }
	selected.className = "spx-button current";
}

function setGroup(group="", button=HTMLElement.prototype) {
    setActiveGroupButton(button);
    displayGroup(group);
}

function displayGroup(group="") {
    SPX_CURRENT_GROUP = group;
    let spxNoticesElement = document.getElementById("spx-js-notice-list");
    let relevantNotices = [];
    if (group === "all") {
        relevantNotices = SPX_CURRENT_NOTICES;
    } else {
        relevantNotices = SPX_CURRENT_NOTICES.filter(function filter(value){
            // Tests where the groups field has the specified group
            return new RegExp(group+",").test(value["groups"]);
        });
    }
    while (spxNoticesElement.lastChild) spxNoticesElement.removeChild(spxNoticesElement.lastChild);
    for (let i=0;i<relevantNotices.length;i++) {
        let noticeElement = document.createElement("div");
        let noticeTitle = document.createElement("div");
        let noticeMessage = document.createElement("div");
        let noticeInfo = document.createElement("div");
        noticeTitle.textContent = relevantNotices[i]["title"];
        noticeTitle.className = "title";
        noticeMessage.textContent = relevantNotices[i]["message"];
        noticeMessage.className = "message";
        noticeInfo.textContent = relevantNotices[i]["author"];
        noticeInfo.className = "info";
        noticeElement.appendChild(noticeTitle);
        noticeElement.appendChild(noticeMessage);
        noticeElement.appendChild(noticeInfo);
        noticeElement.className = "notices-notice";
        spxNoticesElement.appendChild(noticeElement);
    }
}

// Update the previous and next days based on current view date .
function updateDateLabels () {

	let spxTextDateInfo = document.getElementById("spx-js-text-date-info");
	let spxTextDateNotices = document.getElementById("spx-js-text-date-notices");
	let spxButtonPrevDay = document.getElementById("spx-js-button-prevday");
	let spxButtonNextDay = document.getElementById("spx-js-button-nextday");
	let spxTodayFmt = fmtDate(SPX_TODAY);
	let spxCurrDayFmt = fmtDate(SPX_CURRENT_DATE);
	let spxPrevDayFmt = fmtDate(getRelativeDate(SPX_CURRENT_DATE,-1));
	let spxNextDayFmt = fmtDate(getRelativeDate(SPX_CURRENT_DATE,1));

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
	return new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0));
}
