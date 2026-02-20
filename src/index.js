const winamaxScraper = require('./scrapers/winamax/index.js');
const pinnacleScraper = require('./scrapers/pinnacle/index.js');
const winamaxParser = require('./dataParsers/winamaxParser.js');

async function main() {
    let count = 0;
    let savedWs = null;
    while (true) {
      try {
        const ws = await winamaxScraper.run(savedWs, count); 
        savedWs = ws;

        // const pinnacleInfo = await pinnacleScraper.runScraper();
        // if(winamaxInfo?.originData == null) continue;
        // const sortedData = await winamaxParser.resortAllData(winamaxInfo.originData);
        count++;

      } catch (e) {
        console.error(e);
      }
  
      await new Promise(r => setTimeout(r, 20000));
    }
  }
  
  main();