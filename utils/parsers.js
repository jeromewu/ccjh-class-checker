const parseRow = cols => {
  const row = [];
  cols.forEach(col => {
    if (col.indexOf('javascript') === -1) {
      row.push(null);
    } else {
      const nameRE = /<font .*><a .*>(.*)<\/a><\/font>/gm;
      const classRE = /<br \/><a .*>(.*)<\/a><br \/>/gm;
      row.push({
        name: nameRE.exec(col)[1],
        class: classRE.exec(col)[1],
      });
    }
  });
  return row;
};

export const tblParser = data => {
  const re = /<td class=\"tdColumn.*\">(.*)<\/td>/gm;
  const raw = data.match(re);
  const tbl = [];
  if (raw === null) {
    return [];
  }

  for (let i = 0; i < 10; i++) {
    tbl.push(parseRow(raw.slice(6 * i, 6 * (i + 1))));
  }
  return tbl;
};

export const titleParser = data => {
  const re =
    /<span class="view_title" style="display: none;">(.*)<\/span><span class="prn_title" style="display: none;">/gm;
  const raw = re.exec(data);
  if (raw === null) {
    return '';
  }

  let cols = raw[1].split(' ');
  cols[0] = cols[0].substring(0, cols[0].indexOf('第'));
  let title = cols.join(' ');
  return title.replace('老師課表', '教師課表');
};
