export { topUsers };

const GitHubApi = require('github');
const Promise = require('bluebird');
import {pick, sortBy, first, partialRight as pr, filter, take, reduce} from 'lodash';
const log = console.log.bind(console);

const gh = new GitHubApi({
  version: "3.0.0",
  headers: { "user-agent": "marzipan-pudding-pop" }
});

const repos = Promise.promisifyAll(gh.repos);

//take start seconds return fn to filter to weeks > that time
const weeksSince = timestamp => ray => ray.w > timestamp;

//returns sorted list of top X contributors
function topUsers(startDate, repoInfo, topX = 10){
  const startSeconds = (new Date(startDate)).getTime() / 1000;
  const trimWeeks = pr(filter, weeksSince(startSeconds));

  return repos.getStatsContributorsAsync(repoInfo)
    .map(r => {
      //filter weeks down to after X date, get totals
      r.totals = trimWeeks(r.weeks).reduce((acc, week) => {
        return {
          a : acc.a + week.a,
          d : acc.d + week.d,
          c : acc.c + week.c
        };
      }, {a:0,c:0,d:0});
      r.grandTotal = r.totals.a + r.totals.d + r.totals.c;
      return r;
    })
    .then(pr(sortBy,(x)=>-x.grandTotal))
    .then(pr(take, topX))
    .map(pr(pick,['author','totals','grandTotal']));
}

//later:
//1. orgs?
