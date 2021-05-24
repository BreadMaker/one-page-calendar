var $, moment, bootstrap;

function sortWeekDays(arr, firstDay) {
  var result = {};
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
  var printModal = new bootstrap.Modal(document.getElementById("print-modal"));
  document.getElementById("launch-print-modal-button").addEventListener("click", () => {
    printModal.show();
  });
  document.getElementById("print-calendar-button").addEventListener("click", () => {
    window.print();
  });
  // Main functionality
  moment.locale(window.navigator.language);
  var weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData()
    .firstDayOfWeek());
  var monthsNames = moment.monthsShort();
  var now = moment();
  var year = now.year();
  var tempMoment = moment(now);
  var count = 0;
  $(".days").each(function() {
    var that = $(this);
    that.children(".day").each(function() {
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
    var columnSelector = ".days>.day:nth-child(" + (tempMoment.isoWeekday() +
      5) + ")";
    var columnData = $(columnSelector).data("months");
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
  var dateCell = $(".date").filter(function() {
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
