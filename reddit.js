// # Imports
const puppeteer = require('puppeteer');
const {solveCaptcha} = require('./util/solveCaptcha');

// # Const
const SUBREDDIT_URL = (reddit) => `https://old.reddit.com/r/${reddit}`;
const REDDIT_URL = `https://old.reddit.com/`;
const SUBREDDIT_SUBMIT_TEXT_URL = (subbreddit) => `https://old.reddit.com/r/${subbreddit}/submit?selftext=true`;
const SUBREDDIT_SUBMIT_LINK_URL = (subbreddit) => `https://old.reddit.com/r/${subbreddit}/submit?selftext=false`;

const self = {
  browser: null, 
  page: null,

  initialize: async () => {
    self.browser = await puppeteer.launch({
      headless:false
    });
     
    self.page = await self.browser.newPage();
  },

  login: async (username, password) => {
    await self.page.goto(REDDIT_URL);

    // Fill username and password
    await self.page.type('input[name="user"]', username, {delay: 30});
    await self.page.type('input[name="passwd"]', password, {delay: 30});

    // Click on login button
    await self.page.click('#login_login-main > div.submit > button');

    // Check if any error happened
    await self.page.waitForSelector('form[action="https://old.reddit.com/logout"],div[class="status error"]');

    let error = await self.page.$('div[class="status error"]');

    if(error) {
      const errorMessage = await (await error.getProperty('innerText')).jsonValue();
      console.log("Login attempt failed");
      console.log(`Error message: ${errorMessage}`);
      /* Exit the program */
      process.exit(1);
    } else {
      console.log(`${username} is now logged in.`)
    }
  },

  post: async (subreddit, data = {}) => {

    const websiteUrl = data.type === 'link' ? SUBREDDIT_SUBMIT_LINK_URL(subreddit) : SUBREDDIT_SUBMIT_TEXT_URL(subreddit);

    /* Navigate to page */
    if (data.type === 'link') {

      await self.page.goto(SUBREDDIT_SUBMIT_LINK_URL(subreddit), {waitUntil : "networkidle0"});

    } else { /* If its not link assume its text */

      await self.page.goto(SUBREDDIT_SUBMIT_TEXT_URL(subreddit), {waitUntil : "networkidle0"});

    }

    /* Ensure page has loaded */
    await self.page.waitForTimeout(50);

    /* If there is a captcha try to solve it */
    const captchaDataSiteKey = await self.page.$eval('div[class="c-form-group g-recaptcha"]', el => el.getAttribute('data-sitekey'));
    
    console.log(captchaDataSiteKey)

    if (captchaDataSiteKey) {
      console.log('Attempting to solve captcha');
      const captchaSolvedToken = await solveCaptcha(websiteUrl, captchaDataSiteKey);
      
      /* Captcha resolved */
      if(captchaSolvedToken) {
        console.log(`Captcha solved`);
        /* Fill token in captcha response field */
        await self.page.$eval('textarea[id="g-recaptcha-response"]',(element, captchaSolvedToken)=> 
        {
          console.log(`solved token ${captchaSolvedToken}`);
          element.value = captchaSolvedToken
        },captchaSolvedToken);    
        
      } else {
        console.log("Couldn't resolve captcha");
        /* Exit the program */
        process.exit(1);
      }
    }

    /* Fill the forms */
    if (data.type === 'text') {
        await self.page.type('textarea[name="title"]', data.title)
        await self.page.type('textarea[name="text"]', data.text)
    } else {
        await self.page.type('#url', data.url)
        await self.page.type('textarea[name="title"]', data.title)
    }

    // Submit the post
    await self.page.click('#newlink > div.spacer > button');
  },

  getResults: async (subreddit, nr) => {
    // To wait until page loaded insert
    //{ waitUntil: 'networkidle0' }
    await self.page.goto(SUBREDDIT_URL(subreddit));
    
    let results = [];

    do {

      let newResults = await self.praseResults();

      results = [...results, ...newResults];

      if(results.length < nr) {
        let nextPageButton = await self.page.$('span.next-button > a[rel="nofollow next"]')
        if (nextPageButton) {

          await nextPageButton.click();
          // To wait until page loaded insert
          // {waitUntil:'networkidle0'}
          await self.page.waitForNavigation();

        } else {

          break;

        }
      }
    } while (results.length <= nr);

    return results;
  },

  praseResults: async () => {
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
    }

    return results;
  }
}

module.exports = self;