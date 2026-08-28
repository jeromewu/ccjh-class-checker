// Parsers for the shin-her cloud2 ClassTable API
// (POST /ClassTableV2/ClassTableForTest/GetTimetable), which returns JSON.

const toObj = data =>
  typeof data === 'string' ? JSON.parse(data) : data || {};

// A real course cell has a non-negative section, is visible, and carries a
// subject. Entries with SectionSeq === -1 / empty subject are layout markers.
const isCourse = item =>
  !!item &&
  item.IsShow !== false &&
  item.SectionSeq >= 0 &&
  !!(item.SubjectName || item.CustomSubjectDisplay);

// The UI table keeps the legacy shape: 10 rows (早自習 + periods 1..9) x 6
// columns (週一..週六). The new API tops out at period 8 / 週五; extra cells
// stay null.
const ROWS = 10;
const COLS = 6;

const clean = v => (v == null ? '' : String(v).trim());

export const tblParser = data => {
  const res = toObj(data);
  const courses = (res.TimeTableItemList || []).filter(isCourse);
  const tbl = [];
  for (let row = 0; row < ROWS; row++) {
    const cols = [];
    for (let col = 0; col < COLS; col++) {
      const weekDay = col + 1;
      const item = courses.find(
        it => it.WeekDay === weekDay && it.SectionSeq === row,
      );
      if (!item) {
        cols.push(null);
        continue;
      }
      const items = [
        clean(item.CustomClassDisplay || item.ClassName).substring(0, 10),
        clean(item.CustomSubjectDisplay || item.SubjectName).substring(0, 5),
        clean(item.ClassroomName).substring(0, 5),
      ].filter(Boolean);
      cols.push({items});
    }
    tbl.push(cols);
  }
  return tbl;
};

export const titleParser = data => {
  const res = toObj(data);
  const course = (res.TimeTableItemList || []).find(isCourse);
  const name = course && (course.FirstTeacherName || course.TeacherNameDisplay);
  return name ? `${name} 教師課表` : '';
};

// Returns { [weekDay]: 'YYYY-MM-DD' } from the server-provided dates for the
// requested week.
export const headerParser = data => {
  const res = toObj(data);
  const dates = {};
  (res.TimeTableWeekDayList || []).forEach(d => {
    if (d.WeekDay >= 1 && d.DateDisplay) {
      dates[d.WeekDay] = d.DateDisplay;
    }
  });
  return dates;
};
