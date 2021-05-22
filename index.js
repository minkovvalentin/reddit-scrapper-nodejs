const reddit = require('./reddit');
const {username, password } = require('./config');
const testPostSubreddit = 'BotsPlayHere';
const testReadSubreddit  = 'CryptoMoonShots';

(async () => {
    
    await reddit.initialize();

    /* Uncomment to login */
    // await reddit.login(username, password);

    /* Uncomment to post message to provided subreddit */
    // await reddit.post(testPostSubreddit,{
    //     type:'text',
    //     title:"test 2",
    //     text: "just testing, not a bot, nothing to see here"
    // })

    /* Uncomment to scrape N results from provided subreddit */
    //let results = await reddit.getResults(testReadSubreddit, 1000);

})();
