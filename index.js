const reddit = require('./reddit');

(async () => {
    await reddit.initialize('CryptoMoonShots');

    let results = await reddit.getResults(10);
})();
