/*global moment, bootstrap*/

// Custom $(document).ready() function
function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
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
    eod = moment().endOf('day'),
    year = now.year(),
    tempMoment = moment(now),
    count = 0;
  document.querySelectorAll('.days').forEach(element => {
    element.querySelectorAll('.day').forEach(dayElement => {
      dayElement.dataset.day = count;
      count++;
      if (count > 6) {
        count = 0;
      }
    });
    count++;
  });
  let monthsElements = document.querySelectorAll('.months>.month');
  monthsElements.forEach(element => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
  for (var i = 0; i < 12; i++) {
    tempMoment.set({
      'year': year,
      'date': 1,
      'month': i
    });
    let month = document.querySelector('.months > .month:nth-child(' +
      (tempMoment.isoWeekday() + 1) + '):empty');
    month.dataset.month = i;
    month.textContent = monthsNames[i];
    let monthContent = document.createElement('span');
    monthContent.classList.add('badge', 'bg-secondary', 'position-absolute');
    monthContent.appendChild(document.createTextNode(tempMoment.daysInMonth()));
    month.appendChild(monthContent);
    document.querySelectorAll('.days > .day:nth-child(' + (tempMoment.isoWeekday() + 5) + ')').forEach(element => {
      let dayData = element.dataset;
      if (dayData.months === undefined) {
        dayData.months = JSON.stringify([i]);
      } else {
        dayData.months = JSON.stringify(JSON.parse(dayData.months).concat([i]));
      }
    });
  }
  document.getElementById('date').textContent = now.format('LL');
  document.getElementById('year').textContent = year;
  document.getElementById('copyleft-year').textContent = year;
  document.querySelectorAll('.day').forEach(element => {
    element.textContent = weekDaysNames[element.dataset.day];
    element.classList.toggle('table-danger', element.dataset.day == 6);
  });
  document.querySelectorAll('.month').forEach(element => {
    if (element.dataset.month == now.toObject().months)
      element.classList.add('table-active');
  });
  let dateCell = document.evaluate("//td[text()='" + now.toObject().date + "']",
    document, null, XPathResult.ANY_TYPE, null).iterateNext();
  dateCell.classList.add('table-active');
  dateCell.parentNode.querySelectorAll('.day').forEach(element => {
    if (element.dataset.months !== undefined && JSON.parse(element.dataset.months).includes(now.toObject().months))
      element.classList.add('table-active');
  });
  // Setting a timeout to autoupdate calendar 100ms past midnight
  setTimeout(populateCalendar, eod.diff(now) + 100);
}

let verticalPhoneModal;
let activePopup = null;
let activeDayElement = null;

function clearAllHighlights() {
  document.querySelectorAll('.hover-highlight').forEach(el => {
    el.classList.remove('hover-highlight');
  });
}

function clearAllBreatheAnimations() {
  document.querySelectorAll('.breathe-animation').forEach(el => {
    el.classList.remove('breathe-animation');
  });
}

function closeDayPopup() {
  if (activePopup) {
    activePopup.classList.remove('show');
    setTimeout(() => {
      if (activePopup && activePopup.parentNode) {
        activePopup.parentNode.removeChild(activePopup);
      }
      activePopup = null;
    }, 300);
  }
  clearAllBreatheAnimations();
  activeDayElement = null;
}

function getColumnIndex(cell) {
  let index = 0;
  let sibling = cell.previousElementSibling;
  while (sibling) {
    if (!sibling.classList.contains('d-none')) {
      let colspan = parseInt(sibling.getAttribute('colspan')) || 1;
      index += colspan;
    }
    sibling = sibling.previousElementSibling;
  }
  return index;
}

function getDayCellsByColumn(columnIndex) {
  const cells = [];
  document.querySelectorAll('.days > .day').forEach(day => {
    if (getColumnIndex(day) === columnIndex) {
      cells.push(day);
    }
  });
  return cells;
}

function getMonthsByDayCells(dayCells) {
  const months = new Set();
  dayCells.forEach(cell => {
    if (cell.dataset.months) {
      JSON.parse(cell.dataset.months).forEach(m => months.add(m));
    }
  });
  return Array.from(months);
}

function getDateCellsInRow(row) {
  return Array.from(row.querySelectorAll('.date'));
}

function highlightCrosshair(dayElement) {
  clearAllHighlights();
  
  const row = dayElement.closest('tr');
  const columnIndex = getColumnIndex(dayElement);
  
  const dateCells = getDateCellsInRow(row);
  dateCells.forEach(cell => {
    cell.classList.add('hover-highlight');
  });
  
  const dayCellsInColumn = getDayCellsByColumn(columnIndex);
  const months = getMonthsByDayCells(dayCellsInColumn);
  
  document.querySelectorAll('.month').forEach(month => {
    if (months.includes(parseInt(month.dataset.month))) {
      month.classList.add('hover-highlight');
    }
  });
}

function createDayPopup(dayElement) {
  const dayName = dayElement.textContent;
  const row = dayElement.closest('tr');
  const dateCells = getDateCellsInRow(row);
  
  let datesText = '';
  if (dateCells.length > 0) {
    const dates = dateCells.map(cell => cell.textContent).filter(d => d);
    datesText = dates.join(', ');
  }
  
  const columnIndex = getColumnIndex(dayElement);
  const dayCellsInColumn = getDayCellsByColumn(columnIndex);
  const months = getMonthsByDayCells(dayCellsInColumn);
  
  let monthsText = '';
  if (months.length > 0) {
    const monthsNames = moment.monthsShort();
    monthsText = months.map(m => monthsNames[m]).join(', ');
  }
  
  const popup = document.createElement('div');
  popup.className = 'day-popup';
  popup.innerHTML = `
    <div class="day-popup-title">${dayName}</div>
    <div class="day-popup-date">日期: ${datesText}</div>
    <div class="day-popup-date">月份: ${monthsText}</div>
  `;
  
  document.body.appendChild(popup);
  
  const rect = dayElement.getBoundingClientRect();
  let left = rect.left + (rect.width / 2) - 90;
  let top = rect.bottom + 10;
  
  const popupRect = popup.getBoundingClientRect();
  if (left + popupRect.width > window.innerWidth) {
    left = window.innerWidth - popupRect.width - 20;
  }
  if (left < 10) {
    left = 10;
  }
  if (top + popupRect.height > window.innerHeight) {
    top = rect.top - popupRect.height - 10;
  }
  
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  return popup;
}

function triggerBreatheAnimation(dayElement) {
  clearAllBreatheAnimations();
  
  const row = dayElement.closest('tr');
  const columnIndex = getColumnIndex(dayElement);
  
  const dateCells = getDateCellsInRow(row);
  dateCells.forEach(cell => {
    cell.classList.add('breathe-animation');
  });
  
  const dayCellsInColumn = getDayCellsByColumn(columnIndex);
  const months = getMonthsByDayCells(dayCellsInColumn);
  
  document.querySelectorAll('.month').forEach(month => {
    if (months.includes(parseInt(month.dataset.month))) {
      month.classList.add('breathe-animation');
    }
  });
  
  dayElement.classList.add('breathe-animation');
}

function bindDayInteractions() {
  document.querySelectorAll('.day').forEach(dayElement => {
    dayElement.addEventListener('mouseenter', function() {
      if (activeDayElement === this) return;
      highlightCrosshair(this);
    });
    
    dayElement.addEventListener('mouseleave', function() {
      if (activeDayElement === this) return;
      clearAllHighlights();
    });
    
    dayElement.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (activeDayElement === this) {
        closeDayPopup();
        return;
      }
      
      closeDayPopup();
      clearAllHighlights();
      
      activeDayElement = this;
      activePopup = createDayPopup(this);
      triggerBreatheAnimation(this);
    });
  });
  
  document.addEventListener('click', function(e) {
    if (activePopup && !activePopup.contains(e.target)) {
      closeDayPopup();
      clearAllHighlights();
    }
  });
}

// Displays a modal suggesting the use of vertical mode on mobile devices
function checkTightSpot() {
  if (window.innerWidth < 468) {
    if (localStorage.getItem('dont-bother-vertical') == null || localStorage.getItem('dont-bother-vertical') == 'false') {
      verticalPhoneModal.show();
    }
  } else if (window.innerWidth < 564) {
    document.getElementById('one-page-calendar').classList.add('table-sm');
  } else {
    let hideModalHandler = () => {
      verticalPhoneModal.hide();
    };
    document.getElementById('vertical-mobile-modal').addEventListener('hidden.bs.modal', hideModalHandler, {
      once: true
    });
    document.getElementById('one-page-calendar').classList.remove('table-sm');
    hideModalHandler();
    document.getElementById('vertical-mobile-modal').removeEventListener('hidden.bs.modal', hideModalHandler);
  }
}

// Find all elements that have any class ending in "-light" or "-dark"
function toggleLightDarkClasses() {
  document.body.querySelectorAll('[class*="-light"], [class*="-dark"]').forEach(el => {
    // get the full className string
    let cls = el.className;
    // regex to replace all "-light" suffixes with "-dark", and "-dark" with "-light"
    cls = cls.replace(/\b([^\s]+?)-(light|dark)\b/g, (match, base, suffix) => {
      return base + (suffix === 'light' ? '-dark' : '-light');
    });
    el.className = cls;
  });
}



ready(() => {
  // Dark Mode
  if (localStorage.getItem('dark-mode') === null)
    localStorage.setItem('dark-mode', 'dark');
  else if (localStorage.getItem('dark-mode') === 'light') {
    document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.toggle('d-none'));
    document.documentElement.setAttribute('data-bs-theme', 'light');
    toggleLightDarkClasses();
  }
  document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
    element.addEventListener('click', () => {
      document.documentElement.setAttribute('data-bs-theme', element.getAttribute('data-bs-theme-value'));
      localStorage.setItem('dark-mode', element.getAttribute('data-bs-theme-value'));
      document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.toggle('d-none'));
      toggleLightDarkClasses();
    });
  });
  // Print functionality
  let printModal = new bootstrap.Modal(document.getElementById('print-modal'));
  document.getElementById('launch-print-modal-button').addEventListener('click', () => {
    printModal.show();
  });
  document.getElementById('print-calendar-button').addEventListener('click', () => {
    document.getElementById('print-modal').addEventListener('hidden.bs.modal', () => {
      window.print();
    }, {
      once: true
    });
  });
  // Vertical phone mode warning
  document.getElementById('dont-bother-checkbox').checked = false;
  verticalPhoneModal = new bootstrap.Modal(document.getElementById('vertical-mobile-modal'));
  checkTightSpot();
  window.addEventListener('resize', checkTightSpot);
  document.getElementById('dont-bother-checkbox').addEventListener('change', (event) => {
    localStorage.setItem('dont-bother-vertical', event.target.checked);
  });
  // Main functionality
  moment.locale(window.navigator.language);
  populateCalendar();
  bindDayInteractions();
  // Tooltips
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
});
