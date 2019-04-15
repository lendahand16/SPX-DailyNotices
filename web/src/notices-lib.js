//@ts-check

// Main Code

// Initialise spxTodayDate to UTC of current day at 0000 hours
const spxTodayDate = setToUtcZero(new Date());
let currDate = new Date(spxTodayDate);
let currentGroupStr = "";

let spxButtonToday   = document.getElementById("spx-js-button-today");
let spxButtonNextDay = document.getElementById("spx-js-button-nextday");
let spxButtonPrevDay = document.getElementById("spx-js-button-prevday");
let spxButtonViewAll = document.getElementById("spx-js-button-view-all");
let spxButtonView5   = document.getElementById("spx-js-button-view-5");
let spxButtonView6   = document.getElementById("spx-js-button-view-6");
let spxButtonView7   = document.getElementById("spx-js-button-view-7");
let spxButtonView8   = document.getElementById("spx-js-button-view-8");
let spxButtonView9   = document.getElementById("spx-js-button-view-9");
let spxButtonView10  = document.getElementById("spx-js-button-view-10");
let spxButtonView11  = document.getElementById("spx-js-button-view-11");
let spxButtonView12  = document.getElementById("spx-js-button-view-12");

spxButtonToday.onclick=()=>{currDate=new Date(spxTodayDate);loadNotices(currentGroupStr,spxTodayDate);};
spxButtonNextDay.onclick=()=>{currDate=getNextDate(currDate);loadNotices(currentGroupStr,currDate);};
spxButtonPrevDay.onclick=()=>{currDate=getPrevDate(currDate);loadNotices(currentGroupStr,currDate);};

spxButtonViewAll.addEventListener("click",function(e){loadNotices("all",currDate);setActiveGroupButton(this);});
spxButtonView5.addEventListener("click",function(e){loadNotices("5",currDate);setActiveGroupButton(this);});
spxButtonView6.addEventListener("click",function(e){loadNotices("6",currDate);setActiveGroupButton(this);});
spxButtonView7.addEventListener("click",function(e){loadNotices("7",currDate);setActiveGroupButton(this);});
spxButtonView8.addEventListener("click",function(e){loadNotices("8",currDate);setActiveGroupButton(this);});
spxButtonView9.addEventListener("click",function(e){loadNotices("9",currDate);setActiveGroupButton(this);});
spxButtonView10.addEventListener("click",function(e){loadNotices("10",currDate);setActiveGroupButton(this);});
spxButtonView11.addEventListener("click",function(e){loadNotices("11",currDate);setActiveGroupButton(this);});
spxButtonView12.addEventListener("click",function(e){loadNotices("12",currDate);setActiveGroupButton(this);});

spxButtonViewAll.click();

function setActiveGroupButton (selected=HTMLElement.prototype) {
	spxButtonViewAll.className = "spx-button";
	spxButtonView5.className   = "spx-button";
	spxButtonView6.className   = "spx-button";
	spxButtonView7.className   = "spx-button";
	spxButtonView8.className   = "spx-button";
	spxButtonView9.className   = "spx-button";
	spxButtonView10.className  = "spx-button";
	spxButtonView11.className  = "spx-button";
	spxButtonView12.className  = "spx-button";
	selected.className = "spx-button current";
}

function getNotices(groupQueryStr="", date=Date.prototype, callback=(res="")=>{}) {
	let xhr = new XMLHttpRequest();
	xhr.timeout = 5000;
	let begin = encodeURIComponent(date.toISOString());
	let end = encodeURIComponent(date.toISOString());
	xhr.open("GET", "/api/get?groups="+groupQueryStr+"&begin="+begin+"&end="+end);
	xhr.send();
	xhr.onreadystatechange = function(){
		if (xhr.readyState === xhr.DONE && xhr.status === 200) {
			callback(xhr.responseText);
			//console.log(xhr.responseText);
		} else if (xhr.readyState === xhr.DONE) {
			console.error("Error Getting Notices");
		}
	};
}

function getNextDate(date=Date.prototype) {
	let nextDate = new Date(date);
	nextDate.setDate(date.getDate() + 1);
	return nextDate;
}

function getPrevDate(date=Date.prototype) {
	let prevDate = new Date(date);
	prevDate.setDate(date.getDate() - 1);
	return prevDate;
}

function loadNotices(group="", date=Date.prototype) {
	let spxNoticeList = document.getElementById("spx-js-notice-list");
	let groupQueryStr = "5,6,7,8,9,10,11,12";
	switch (group) {
		case "5": groupQueryStr = "5"; break;
		case "6": groupQueryStr = "6"; break;
		case "7": groupQueryStr = "7"; break;
		case "8": groupQueryStr = "8"; break;
		case "9": groupQueryStr = "9"; break;
		case "10": groupQueryStr = "10"; break;
		case "11": groupQueryStr = "11"; break;
		case "12": groupQueryStr = "12"; break;
		default: break;
	}
	currentGroupStr = groupQueryStr;
	getNotices(groupQueryStr, date, function callback(res){
		while (spxNoticeList.lastChild) spxNoticeList.removeChild(spxNoticeList.lastChild);
		updateDateTexts();
		console.log(res);
		let notices = JSON.parse(res)["notices"];
		for (let note of notices) {
			let noticeElement = document.createElement("div");
			let noticeTitle = document.createElement("div");
			let noticeMessage = document.createElement("div");
			let noticeInfo = document.createElement("div");
			noticeTitle.textContent = note["title"];
			noticeTitle.className = "title";
			noticeMessage.textContent = note["message"];
			noticeMessage.className = "message";
			noticeInfo.textContent = note["author"];
			noticeInfo.className = "info";
			noticeElement.appendChild(noticeTitle);
			noticeElement.appendChild(noticeMessage);
			noticeElement.appendChild(noticeInfo);
			noticeElement.className = "notices-notice";
			spxNoticeList.appendChild(noticeElement);
		}
	});
}

// Update the previous and next days based on current view date .
function updateDateTexts () {

	let spxTextDateInfo = document.getElementById("spx-js-text-date-info");
	let spxTextDateNotices = document.getElementById("spx-js-text-date-notices");
	let spxTodayFmt = fmtDate(spxTodayDate);
	let spxCurrDayFmt = fmtDate(currDate);
	let spxPrevDayFmt = fmtDate(getPrevDate(currDate));
	let spxNextDayFmt = fmtDate(getNextDate(currDate));

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
