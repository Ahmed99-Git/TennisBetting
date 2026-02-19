const winamaxScraper = require('./winamax/index.js');
const pinnacleScraper = require('./pinnacle/index.js');
const winamaxParser = require('./analyze/winamaxParser.js');
const {createSocket} = require("./winamax/service/ws.js");
const { getSID, sendWithSID, firstPostShake } = require('./winamax/index.js');
const { getCookieValue } = require('./winamax/utils/common.js');  
const yeast = require('yeast');



async function main() {
    let count = 0;
    let savedBrowser = null;
    let savedPage = null;
    let savedWs = null;
    const firstShakeRes = await getSID();
    const cookies = firstShakeRes.headers["set-cookie"];
    console.log(cookies);


// Extract values
const AWSALB = getCookieValue(cookies[0], 'AWSALB');
const AWSALBCORS = getCookieValue(cookies[1], 'AWSALBCORS');

console.log('AWSALB:', AWSALB);
console.log('AWSALBCORS:', AWSALBCORS);

    const jsonStr = firstShakeRes.data;
    const jsonString = jsonStr.substring(jsonStr.indexOf('{'));
    const wsSID = JSON.parse(jsonString)?.sid;
    const secondShake = await sendWithSID({sid:wsSID, AWSALB, AWSALBCORS});
    const firstPost = await firstPostShake({sid:wsSID, AWSALB, AWSALBCORS});
    const initTennisInfo = await  sendWithSID({sid:wsSID, AWSALB, AWSALBCORS});


const websocket = createSocket({sid:wsSID, AWSALB, AWSALBCORS});
websocket.on("message", (data) => {
  const msg = data.toString();

  if (msg === "2") {
    websocket.send("3"); // pong
  }

  if (msg.startsWith("0")) {
    websocket.send("40"); // open socket.io connection
  }
});
    while (false) {
      try {

        const {winamaxInfo, browser, page, ws} = await winamaxScraper.runScraper(count % 6, savedBrowser, savedPage, savedWs);
        savedBrowser = browser;
        savedPage = page;
        savedWs = ws;

        const pinnacleInfo = await pinnacleScraper.runScraper();
        // if(winamaxInfo?.originData == null) continue;
        // const sortedData = await winamaxParser.resortAllData(winamaxInfo.originData);
        count++;

      } catch (e) {
        console.error(e);
      }
  
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  
  loopScraper();