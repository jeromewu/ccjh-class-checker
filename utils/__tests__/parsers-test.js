import {tblParser, titleParser, headerParser} from '../parsers';
import fixture from './fixtures/timetable.json';

describe('titleParser', () => {
  it('builds the teacher title from the first course', () => {
    expect(titleParser(fixture)).toBe('吳文豪 教師課表');
  });

  it('returns empty string when there are no courses', () => {
    expect(titleParser({TimeTableItemList: []})).toBe('');
  });

  it('accepts a JSON string', () => {
    expect(titleParser(JSON.stringify(fixture))).toBe('吳文豪 教師課表');
  });
});

describe('tblParser', () => {
  const tbl = tblParser(fixture);

  it('produces a 10x6 grid', () => {
    expect(tbl).toHaveLength(10);
    tbl.forEach(row => expect(row).toHaveLength(6));
  });

  it('places 週一 第2節 (WeekDay 1 / SectionSeq 2)', () => {
    // row 2 = SectionSeq 2, col 0 = WeekDay 1
    expect(tbl[2][0]).toEqual({
      items: ['三年仁班', '數學探究與解析'.substring(0, 5)],
    });
  });

  it('places the 週五 第8節 (輔)數甲 cell', () => {
    // row 8 = SectionSeq 8, col 4 = WeekDay 5
    expect(tbl[8][4].items).toContain('(輔)數甲');
  });

  it('keeps empty slots null', () => {
    expect(tbl[0][0]).toBeNull();
    expect(tbl[9][0]).toBeNull();
  });
});

describe('headerParser', () => {
  it('maps weekdays to their ISO date', () => {
    const dates = headerParser(fixture);
    expect(dates[1]).toBe('2026-10-05');
    expect(dates[5]).toBe('2026-10-09');
  });
});
