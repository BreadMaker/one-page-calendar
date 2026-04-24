import dayjs from 'dayjs';
import localeDataPlugin from 'dayjs/plugin/localeData';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/en';

dayjs.extend(localeDataPlugin);
dayjs.extend(isoWeek);

export function sortWeekDays(arr, firstDay) {
  let result = [];
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

export function getMonthFirstDay(year, month) {
  return dayjs().set('year', year).set('month', month).set('date', 1).isoWeekday();
}

export function getDaysInMonth(year, month) {
  return dayjs().set('year', year).set('month', month).daysInMonth();
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
