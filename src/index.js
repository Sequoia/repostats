/**
 * env vars relied upon:
 * GOOGLE_SHEET_ID
 * GOOGLE_CREDS_PATH
 * @todo come up with something better
 */
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
const sheets = require('./sheets');
const { getDownloadCounts } = require('./npmstuff.js');

const log = console.log.bind(console);
const err = console.error.bind(console);

//@see https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method
const creds = require(process.env.GOOGLE_CREDS_PATH);
const sheet_id = process.env.GOOGLE_SHEET_ID;
const doc = sheets(sheet_id, creds);

logDownloads('last-month');

function logDownloads(range){
  //pkgs map to google sheet rows so they are basically "fixed"
  const pkgs = ['express', 'loopback', 'sails', 'restify',  'hapi'];
  return Promise.join(
    doc.getSheet(0),               //get google sheet
    getDownloadCounts(pkgs, range) //get new NPM data
      .then(doc.buildNpmRow),        //build row
    doc.addRow                     //send it to google
  );
}
