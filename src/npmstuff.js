export {getDownloadCounts};

const Promise = require('bluebird');
const request = Promise.promisifyAll(require('superagent'));
const resolve = require('url').resolve;
const join = require('path').join;
const partial = require('lodash').partial;

//@see https://github.com/npm/download-counts
const npmUriBase = 'https://api.npmjs.org/downloads/';

const makeNpmRangeUri = npmUri => partial(resolve, npmUri);
const getStats = uri => request.get(uri).endAsync();
const getBody = response => response.body;

//monthly download comparisons NPM
function getDownloadCounts (pkgs, range) {
  const npmUri = resolve(npmUriBase, join('point',range,'/'));
  return Promise.map(pkgs , makeNpmRangeUri(npmUri))
    .map(getStats)
    .map(getBody);
};
