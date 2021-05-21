const puppeteer = require('puppeteer');

const SUBREDDIT_URL = (reddit) => `https://old.reddit.com/r/${reddit}`

const self = {
  browser: null, 
  page: null,

  initialize: async (reddit) => {
    self.browser = await puppeteer.launch({
      headless:false
    });
     
    self.page = await self.browser.newPage();
    
    // Go to the subreddit
    await self.page.goto(SUBREDDIT_URL(reddit), { waitUntil: 'networkidle0' });

  },

  // TO DO: Get nr of results instead of all results on only one page.
  // Make API Endpoints 
  getResults: async (nr) => {
    let elements = await self.page.$$('#siteTable > div[class*="thing"]')
    let results = [];

    for (let element of elements) {

      let [title, rank, postTime, authorUrl, authorName, score, comments, promoted] = await element.evaluate((element) => {
        const titleNode = element.querySelector('p[class="title"]');
        const rankNode = element.querySelector('span.rank');
        const postTimeNode = element.querySelector('div.top-matter > p.tagline > time');
        const authorUrlNode = element.querySelector('p[class="tagline "] > a[class*="author"]');
        const authorNameNode = element.querySelector('p[class="tagline "] > a[class*="author"]');
        const scoreNode = element.querySelector('div[class="score likes"]');
        const commentsNode = element.querySelector('div[class="entry unvoted"] > div[class="top-matter"] > ul > li[class="first"] > a');
        const promotedNode = element.querySelector('div.entry.unvoted > div.top-matter > ul > li:nth-child(1) > span.promoted-tag > span.promoted-span')

        return [
          titleNode && titleNode.innerText.trim(),
          rankNode && rankNode.innerText.trim(),
          postTimeNode && postTimeNode.getAttribute('title'),
          authorUrlNode && authorUrlNode.getAttribute('href'),
          authorNameNode && authorNameNode.innerText.trim(),
          scoreNode && scoreNode.innerText.trim(),
          commentsNode && commentsNode.innerText.trim(),
          promotedNode && promotedNode.innerText.trim()
        ];
      });

      if(promoted === null) {
        results.push({
          title,
          rank,
          postTime,
          authorName,
          authorUrl,
          score,
          comments
        })
      }

      console.log(results);
    }

    return results;
  }
}

module.exports = self;