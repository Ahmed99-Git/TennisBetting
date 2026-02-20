const path = require('path');
const dotenv = require('dotenv');

const winamaxScraper = require('./scrapers/winamax/index.js');
const pinnacleScraper = require('./scrapers/pinnacle/index.js');
const Betting = require('./models/winamax/Betting.js');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    let count = 0;
    let savedWs = null;
    const fetchInterval =  parseInt(process.env.FETCH_ONCE_TIME);

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
  
      await new Promise(r => setTimeout(r, fetchInterval*1000));
    }
  }
  
  main();