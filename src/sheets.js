const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
const GoogleSheets = require('google-spreadsheet');

//turn downloadCount results into a row for gdocs
const buildNpmRow = pkgstats => {
  return pkgstats.reduce((out, pkgstats) => {
      out.start = pkgstats.start;   //redundant
      out.end = pkgstats.end;       //redundant
      out[pkgstats.package] = pkgstats.downloads;
      return out;
    }, {});
};

const buildTopUsersRow = (daterange) => (stats) => {
  return {
    username : stats.author.login,
    additions: stats.totals.a,
    deletions: stats.totals.d,
    changes:   stats.totals.c,
    total:     stats.grandTotal,
    daterange: daterange
  };
};

//sheet-collection util fns
const logDocTitle = doc_info => log(doc_info.title + ' is loaded');
const getSheetNum = (idx) => (allSheets) => Promise.promisifyAll(allSheets.worksheets[idx]);

//single-sheet fns
const getRows = sheet => sheet.getRowsAsync();

//rows fns
const logRowInfo = (rows) => log('rows:', rows.length);
//shifting index here to match normal worksheet 
const addRow = (sheet, rowData) => sheet.addRowAsync(rowData);

module.exports = function(sheetid, creds){
  //SETUP
  const doc = Promise.promisifyAll(new GoogleSheets(sheetid));
  const getinfo = () => doc.getInfoAsync();
  const sheets = doc.useServiceAccountAuthAsync(creds)
                    .then(getinfo);
  //END SETUP
  return {
    getSheet : idx => sheets.then(getSheetNum(idx)),
    buildNpmRow,
    buildTopUsersRow,
    addRow
  };
};
