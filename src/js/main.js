/*global $, moment, bootstrap*/

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

let verticalPhoneModal;

function checkTightSpot() {
  if (window.innerWidth < 468) {
    if (localStorage.getItem("dont-bother-vertical") == null || localStorage.getItem("dont-bother-vertical") == "false") {
      verticalPhoneModal.show();
    }
  } else if (window.innerWidth < 564) {
    document.getElementById("one-page-calendar").classList.add("table-sm");
  } else {
    let hideModalHandler = function() {
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

$(document).ready(function() {
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
  let cantPrintModal = new bootstrap.Modal(document.getElementById("cant-print-modal"));
  document.getElementById("launch-cant-print-modal-button").addEventListener("click", () => {
    cantPrintModal.show();
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
  let weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData()
      .firstDayOfWeek()),
    monthsNames = moment.monthsShort(),
    now = moment(),
    year = now.year(),
    tempMoment = moment(now),
    count = 0;
  $(".days").each(function() {
    $(this).children(".day").each(function() {
      $(this).data("day", count);
      count++;
      if (count > 6)
        count = 0;
    });
    count++;
  });
  for (var i = 0; i < 12; i++) {
    tempMoment.set({
      "year": year,
      "date": 1,
      "month": i
    });
    $(".months>.month:nth-child(" + (tempMoment.isoWeekday() + 1) +
      "):empty:first").data("month", i).text(monthsNames[i]).append(
      " <span class='badge bg-secondary position-absolute'>" +
      tempMoment.daysInMonth() + "</span>");
    let columnSelector = ".days>.day:nth-child(" + (tempMoment.isoWeekday() +
        5) + ")",
      columnData = $(columnSelector).data("months");
    if (columnData === undefined) {
      $(columnSelector).data("months", [i]);
    } else {
      $(columnSelector).data("months", columnData.concat([i]));
    }
  }
  $("#date").text(now.format("LL"));
  $("#year, #copyleft-year").text(year);
  $(".day").each(function() {
    $(this).text(weekDaysNames[$(this).data("day")]).toggleClass(
      "table-danger", $(this).data("day") === 6);
  });
  $(".month").filter(function() {
    return $(this).data("month") === now.toObject().months;
  }).addClass("table-active");
  let dateCell = $(".date").filter(function() {
    return $(this).text() == now.toObject().date;
  });
  dateCell.addClass("table-active").parent().find(".day").each(
    function() {
      if ($(this).data("months").includes(now.toObject().months)) {
        $(this).addClass("table-active");
      }
    });
  // Tooltips
  [].slice.call(document.querySelectorAll("[data-bs-toggle=\"tooltip\"]")).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: "d-print-none",
      trigger: "hover"
    });
  });
});
