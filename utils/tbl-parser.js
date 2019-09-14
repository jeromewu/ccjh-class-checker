const parseRow = (cols) => {
  const row = [];
  cols.forEach((col) => {
    if (col.indexOf('javascript') === -1) {
      row.push(null);
    } else {
      const nameRE = /<font .*><a .*>(.*)<\/a><\/font>/gm
      const classRE = /<br \/><a .*>(.*)<\/a><br \/>/gm
      row.push({
        name: nameRE.exec(col)[1],
        class: classRE.exec(col)[1],
      });
    }
  });
  return row
}

export default (data) => {
  const re =/<td class=\"tdColumn.*\">(.*)<\/td>/gm;
  const raw = data.match(re);
  const tbl = [];

  for (let i=0; i < 10; i++) {
    tbl.push(parseRow(raw.slice(6*i, 6*(i+1))))
  }
  return tbl;
};
