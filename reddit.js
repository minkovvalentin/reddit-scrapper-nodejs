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

  getResults: async (nr) => {
    let elements = await self.page.$$('#siteTable > div[class*="thing"]')
    
    console.log(elements.length);

    for (let element of elements) {

      let title = await element.$eval(('p[class="title"]'), node => node.innerText.trim());
      console.log(title);
    }
  }
}

module.exports = self;