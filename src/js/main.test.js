import { describe, it, expect } from 'vitest';
import { sortWeekDays, getMonthFirstDay, getDaysInMonth, isLeapYear } from './utils';

describe('核心矩阵计算函数测试', () => {
  describe('sortWeekDays 函数', () => {
    it('应该正确处理周一作为第一天的情况 (firstDay=1)', () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = sortWeekDays([...days], 1);
      expect(result).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('应该正确处理周日作为第一天的情况 (firstDay=0)', () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = sortWeekDays([...days], 0);
      expect(result).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });

    it('应该正确处理周六作为第一天的情况 (firstDay=6)', () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = sortWeekDays([...days], 6);
      expect(result).toEqual(['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']);
    });
  });

  describe('getMonthFirstDay 函数', () => {
    it('应该正确返回2026年1月1日是周几', () => {
      const result = getMonthFirstDay(2026, 0);
      expect(result).toBe(4);
    });

    it('应该正确返回2026年2月1日是周几', () => {
      const result = getMonthFirstDay(2026, 1);
      expect(result).toBe(7);
    });

    it('应该正确返回2024年2月1日是周几 (闰年)', () => {
      const result = getMonthFirstDay(2024, 1);
      expect(result).toBe(4);
    });
  });

  describe('getDaysInMonth 函数', () => {
    it('应该正确返回2026年1月有31天', () => {
      const result = getDaysInMonth(2026, 0);
      expect(result).toBe(31);
    });

    it('应该正确返回2026年2月有28天 (非闰年)', () => {
      const result = getDaysInMonth(2026, 1);
      expect(result).toBe(28);
    });

    it('应该正确返回2024年2月有29天 (闰年)', () => {
      const result = getDaysInMonth(2024, 1);
      expect(result).toBe(29);
    });

    it('应该正确返回2026年4月有30天', () => {
      const result = getDaysInMonth(2026, 3);
      expect(result).toBe(30);
    });

    it('应该正确返回2026年12月有31天', () => {
      const result = getDaysInMonth(2026, 11);
      expect(result).toBe(31);
    });
  });

  describe('isLeapYear 函数 (闰年判断)', () => {
    it('应该正确判断2024年是闰年', () => {
      expect(isLeapYear(2024)).toBe(true);
    });

    it('应该正确判断2026年不是闰年', () => {
      expect(isLeapYear(2026)).toBe(false);
    });

    it('应该正确判断2000年是闰年 (世纪闰年)', () => {
      expect(isLeapYear(2000)).toBe(true);
    });

    it('应该正确判断1900年不是闰年 (世纪非闰年)', () => {
      expect(isLeapYear(1900)).toBe(false);
    });

    it('应该正确判断2020年是闰年', () => {
      expect(isLeapYear(2020)).toBe(true);
    });

    it('应该正确判断2021年不是闰年', () => {
      expect(isLeapYear(2021)).toBe(false);
    });
  });

  describe('2026年月份偏移逻辑测试', () => {
    it('2026年各月第一天应该正确计算', () => {
      const expected = [4, 7, 7, 3, 5, 1, 3, 6, 2, 4, 7, 2];
      for (let i = 0; i < 12; i++) {
        expect(getMonthFirstDay(2026, i)).toBe(expected[i]);
      }
    });

    it('2026年各月天数应该正确计算', () => {
      const expected = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      for (let i = 0; i < 12; i++) {
        expect(getDaysInMonth(2026, i)).toBe(expected[i]);
      }
    });
  });
});
