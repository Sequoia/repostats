/**
 * env vars relied upon:
 * GOOGLE_SHEET_ID
 * GOOGLE_CREDS_PATH
 * @todo come up with something better
 */
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
import sheets from './sheets.js';
import moment from 'moment';
import {getDownloadCounts} from './npmstuff.js';
import {topUsers} from './ghstuff.js';
const config = require('rc')('repostats');

const log = console.log.bind(console);
const err = console.error.bind(console);

//@see https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method
const creds = require(config.creds);
const doc = sheets(config.sheetId, creds);

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

function logTopContributors(since, repoInfo){
  const daterange = [since,moment().format('MMMM d YYYY')].join(',');
  return Promise.join(
    doc.getSheet(1),              //get sheet
    topUsers(since, repoInfo)     //get new repo data
      .map(doc.buildTopUsersRow(daterange)),   //build row
    function(sheet, rows){        //add each to google sheet
      const addToSheet1 = doc.addRow.bind(null, sheet);
      rows.map(addToSheet1);
    }
  );
}

logTopContributors('January 1 2015', {user:'nodejs', repo:'node'});

//logDownloads(config.range || 'last-month');
