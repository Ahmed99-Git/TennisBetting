const winamaxScraper = require('./winamax/index.js');
const pinnacleScraper = require('./pinnacle/index.js');
const winamaxParser = require('./analyze/winamaxParser.js');
async function loopScraper() {
    let count = 0;
    let savedBrowser = null;
    let savedPage = null;
    let savedWs = null;
    while (true) {
      try {

        const {winamaxInfo, browser, page, ws} = await winamaxScraper.runScraper(count % 6, savedBrowser, savedPage, savedWs);
        savedBrowser = browser;
        savedPage = page;
        savedWs = ws;

        const pinnacleInfo = await pinnacleScraper.runScraper();
        if(winamaxInfo?.originData == null) continue;
        const sortedData = await winamaxParser.resortAllData(winamaxInfo.originData);
        count++;

      } catch (e) {
        console.error(e);
      }
  
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  
  loopScraper();