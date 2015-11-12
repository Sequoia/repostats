const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
const resolve = require('url').resolve;
const join = require('path').join;
require("babel-core/register");
const sheets = require('./lib/sheets');

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

//@see https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method
const credsPath = join(__dirname, '../google-creds.json');              //CHANGE THIS AS NEEDED
const creds = require(credsPath);
const sheet_id = '1cRwJdc89Tubpzobm0yJQF4qXwIHs6AwER3uJYor8Di4';
const doc = sheets(sheet_id, creds);

//getDownloadCounts(pkgs).then(log);
Promise.join(
  doc.getSheet(0),                               //get google sheet
  getDownloadCounts(pkgs).tap(log).then(doc.buildNpmRow), //get new NPM data & build row
  doc.addRow                                     //send it to google
).catch(err);
