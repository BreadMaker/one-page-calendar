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
    return result;
}

$(document).ready(function () {
    moment.locale(window.navigator.userLanguage || window.navigator.language);
    var weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData()
        .firstDayOfWeek());
    var monthsNames = moment.monthsShort();
    var now = moment();
    var year = now.year();
    var tempMoment = moment(now);
    var count = 0;
    $(".days").each(function () {
        var that = $(this);
        that.children(".day").each(function () {
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
            " <span class='ui small top right attached label'>" +
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
    $("#date").text(now.format('LL'));
    $(".day").each(function () {
        $(this).text(weekDaysNames[$(this).data("day")]).toggleClass(
            "last", $(this).data("day") === 6);
    });
    $(".month").filter(function () {
        return $(this).data("month") === now.toObject().months;
    }).addClass("selected");
    var dateCell = $(".date").filter(function () {
        return $(this).text() == now.toObject().date;
    });
    dateCell.addClass("selected").parent().find(".day").each(
        function () {
            if ($(this).data("months").includes(now.toObject().months)) {
                $(this).addClass("selected");
            }
        });
});
