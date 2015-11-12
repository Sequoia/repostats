/* jshint esnext: true */
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
const resolve = require('url').resolve;
const join = require('path').join;

//@see https://github.com/npm/download-counts
const npmUriBase = 'https://api.npmjs.org/downloads/';
const pkgs = ['express', 'loopback', 'sails', 'restify',  'hapi'];
const range = 'last-month';
const npmUri = resolve(npmUriBase, join('point',range,'/'));

const log = console.log.bind(console);
const err = console.error.bind(console);

const makeNpmRangeUri = pkg => resolve(npmUri,pkg);
const getStats = uri => request.get(uri).endAsync();
const getBody = response => response.body;

//monthly download comparisons NPM
const getDownloadCounts = pkgs => {
  return Promise.map(pkgs , makeNpmRangeUri)
    .map(getStats)
    .map(getBody);
};

//turn downloadCount results into a row for gdocs
const buildRow = pkgstats => {
  return pkgstats.reduce((out, pkgstats) => {
      out.start = pkgstats.start;   //redundant
      out.end = pkgstats.end;       //redundant
      out[pkgstats.package] = pkgstats.downloads;
      return out;
    }, {});
};

//@see https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method
const credsPath = join(__dirname, '../../google-creds.json');              //CHANGE THIS AS NEEDED

const creds = require(credsPath);
const sheet_id = '1cRwJdc89Tubpzobm0yJQF4qXwIHs6AwER3uJYor8Di4';
const GoogleSheets = require('google-spreadsheet');
//this ends up getting used "globally" here :(
const doc = Promise.promisifyAll(new GoogleSheets(sheet_id));

//sheet-collection util fns
const getinfo = () => doc.getInfoAsync();
const logDocTitle = doc_info => log(doc_info.title + ' is loaded');
const getSheet = (idx) => (allSheets) => Promise.promisifyAll(allSheets.worksheets[idx]);

//single-sheet fns
//@TODO promisify the individual rows (this sheets thing has a bit of a crazy API tbh :/)
const getRows = sheet => sheet.getRowsAsync();

//rows fns
const logRowInfo = (rows) => log('rows:', rows.length);
//shifting index here to match normal worksheet 
const addRow = (sheet, rowData) => sheet.addRowAsync(rowData);

const getFrameworksSheet = () => {
  return doc
    .useServiceAccountAuthAsync(creds)
    .then(getinfo)
    .tap(logDocTitle)
    .then(getSheet(0));
};

Promise.join(
  getFrameworksSheet(),                   //get google sheet
  getDownloadCounts(pkgs).then(buildRow), //get new NPM data & build row
  addRow);                                //send it to google
