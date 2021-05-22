
const {antiCaptchaKey } = require('../config');
const ac = require("@antiadmin/anticaptchaofficial");

const solveCaptcha = {
  solveCaptcha: async (url, sitekey) =>  {
    let token;
    let authenticated;

    ac.setAPIKey(antiCaptchaKey);
    
    // get balance
    await ac.getBalance()
      .then(balance => {
          console.log(`My remaining anti-captha balance is ${balance}$`);
          authenticated = true;
        })
      .catch(error => {
        console.log(`Error with authorisation: ${error}`);
        authenticated = false;
      })  
      
      if (authenticated) {
        token = await ac.solveRecaptchaV2Proxyless(url, sitekey);
      } else {
        return null;
      }
      return token;
  }


}

module.exports = solveCaptcha;