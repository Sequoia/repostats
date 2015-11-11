/* jshint esnext: true */
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
const resolve = require('url').resolve;
const join = require('path').join;

//@see https://github.com/npm/download-counts
const npmUriBase = 'https://api.npmjs.org/downloads/';
const pkgs = ['express', 'loopback', 'hapi', 'restify', 'sails'];
const range = 'last-month';
const npmUri = resolve(npmUriBase, join('point',range,'/'));

const log = console.log.bind(console);

const makeNpmRangeUri = pkg => resolve(npmUri,pkg);
const getStats = uri => request.get(uri).endAsync();
const getBody = response => response.body;
const sortByDownloads = ray => ray.sort((x,y) => y.downloads - x.downloads);

//monthly download comparisons NPM

Promise.map(pkgs , makeNpmRangeUri)
  .map(getStats)
  .map(getBody)
  .then(sortByDownloads)
  .then(log);
  
//send it to google sheets
