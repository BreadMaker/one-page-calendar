/*global moment, bootstrap*/

// Custom $(document).ready() function
function ready(fn) {
  if (document.readyState != "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

// Takes the list of days and reoders it depending of the locale's first day
function sortWeekDays(arr, firstDay) {
  let result = {};
  if (firstDay === 0) {
    result = arr.splice(1);
    return result.concat(arr);
  } else if (firstDay === 6) {
    result = arr.splice(2);
    return result.concat(arr);
  } else {
    return arr;
  }
}

// Populates the calendar with the proper days/months order
function populateCalendar() {
  let weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData().firstDayOfWeek()),
    monthsNames = moment.monthsShort(),
    now = moment(),
    eod = moment().endOf("day"),
    year = now.year(),
    tempMoment = moment(now),
    count = 0;
  document.querySelectorAll(".days").forEach(element => {
    element.querySelectorAll(".day").forEach(dayElement => {
      dayElement.dataset.day = count;
      count++;
      if (count > 6) {
        count = 0;
      }
    });
    count++;
  });
  let monthsElements = document.querySelectorAll(".months>.month");
  monthsElements.forEach(element => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
  for (var i = 0; i < 12; i++) {
    tempMoment.set({
      "year": year,
      "date": 1,
      "month": i
    });
    let month = document.querySelector(".months > .month:nth-child(" +
      (tempMoment.isoWeekday() + 1) + "):empty");
    month.dataset.month = i;
    month.textContent = monthsNames[i];
    let monthContent = document.createElement("span");
    monthContent.classList.add("badge", "bg-secondary", "position-absolute");
    monthContent.appendChild(document.createTextNode(tempMoment.daysInMonth()));
    month.appendChild(monthContent);
    document.querySelectorAll(".days > .day:nth-child(" + (tempMoment.isoWeekday() + 5) + ")").forEach(element => {
      let dayData = element.dataset;
      if (dayData.months === undefined) {
        dayData.months = JSON.stringify([i]);
      } else {
        dayData.months = JSON.stringify(JSON.parse(dayData.months).concat([i]));
      }
    });
  }
  document.getElementById("date").textContent = now.format("LL");
  document.getElementById("year").textContent = year;
  document.getElementById("copyleft-year").textContent = year;
  document.querySelectorAll(".day").forEach(element => {
    element.textContent = weekDaysNames[element.dataset.day];
    element.classList.toggle("table-danger", element.dataset.day == 6);
  });
  document.querySelectorAll(".month").forEach(element => {
    if (element.dataset.month == now.toObject().months)
      element.classList.add("table-active");
  });
  let dateCell = document.evaluate("//td[text()='" + now.toObject().date + "']",
    document, null, XPathResult.ANY_TYPE, null).iterateNext();
  dateCell.classList.add("table-active");
  dateCell.parentNode.querySelectorAll(".day").forEach(element => {
    if (element.dataset.months !== undefined && JSON.parse(element.dataset.months).includes(now.toObject().months))
      element.classList.add("table-active");
  });
  // Setting a timeout to autoupdate calendar 100ms past midnight
  setTimeout(populateCalendar, eod.diff(now) + 100);
}

let verticalPhoneModal;

// Displays a modal suggesting the use of vertical mode on mobile devices
function checkTightSpot() {
  if (window.innerWidth < 468) {
    if (localStorage.getItem("dont-bother-vertical") == null || localStorage.getItem("dont-bother-vertical") == "false") {
      verticalPhoneModal.show();
    }
  } else if (window.innerWidth < 564) {
    document.getElementById("one-page-calendar").classList.add("table-sm");
  } else {
    let hideModalHandler = () => {
      verticalPhoneModal.hide();
    };
    document.getElementById("vertical-mobile-modal").addEventListener("hidden.bs.modal", hideModalHandler, {
      once: true
    });
    document.getElementById("one-page-calendar").classList.remove("table-sm");
    hideModalHandler();
    document.getElementById("vertical-mobile-modal").removeEventListener("hidden.bs.modal", hideModalHandler);
  }
}

ready(() => {
  // Dark Mode
  if (localStorage.getItem("dark-mode") !== null && localStorage.getItem("dark-mode") == "false") {
    document.querySelector("#toggle-darkmode-button .bi-sun-fill").classList.remove("d-none");
    document.querySelector("#toggle-darkmode-button .bi-moon-fill").classList.add("d-none");
    document.querySelectorAll("[data-dark-mode]").forEach(element => {
      let modes = JSON.parse(element.dataset.darkMode);
      modes[1].split(" ").forEach(cls => {
        element.classList.add(cls);
      });
      modes[0].split(" ").forEach(cls => {
        element.classList.remove(cls);
      });
    });
  }
  document.getElementById("toggle-darkmode-button").addEventListener("click", () => {
    let darkMode = localStorage.getItem("dark-mode") === null ? true : Boolean(localStorage.getItem("dark-mode") == "true");
    localStorage.setItem("dark-mode", !darkMode);
    document.querySelectorAll("#toggle-darkmode-button i").forEach(element => {
      element.classList.toggle("d-none");
    });
    document.querySelectorAll("[data-dark-mode]").forEach(element => {
      let modes = JSON.parse(element.dataset.darkMode);
      modes[+darkMode].split(" ").forEach(cls => {
        element.classList.add(cls);
      });
      modes[+!darkMode].split(" ").forEach(cls => {
        element.classList.remove(cls);
      });
    });
  });
  // Print functionality
  let printModal = new bootstrap.Modal(document.getElementById("print-modal"));
  document.getElementById("launch-print-modal-button").addEventListener("click", () => {
    printModal.show();
  });
  document.getElementById("print-calendar-button").addEventListener("click", () => {
    document.getElementById("print-modal").addEventListener("hidden.bs.modal", () => {
      window.print();
    }, {
      once: true
    });
  });
  // Vertical phone mode warning
  document.getElementById("dont-bother-checkbox").checked = false;
  verticalPhoneModal = new bootstrap.Modal(document.getElementById("vertical-mobile-modal"));
  checkTightSpot();
  window.addEventListener("resize", checkTightSpot);
  document.getElementById("dont-bother-checkbox").addEventListener("change", (event) => {
    localStorage.setItem("dont-bother-vertical", event.target.checked);
  });
  // Main functionality
  moment.locale(window.navigator.language);
  populateCalendar();
  // Tooltips
  [].slice.call(document.querySelectorAll("[data-bs-toggle=\"tooltip\"]")).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: "d-print-none",
      trigger: "hover"
    });
  });
});
