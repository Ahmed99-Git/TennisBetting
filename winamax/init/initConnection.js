const axios = require('axios');
const yeast = require('yeast');
const { v4 } = require("uuid");
const { getTHeader, getSIDHeader } = require('../config.js');
const {getCookieValue} = require('../utils/common.js');

async function initializeWebSocket() {
    const t = yeast();
    const originUrl = `https://sports-eu-west-3.winamax.fr/uof-sports-server/socket.io/`;
      const query = new URLSearchParams({
      language: "FR",
      version: "3.38.0",
      embed: "false",
      EIO: "3",
      transport: "polling",
      t, // short for t: t
    });
    const url  = `${originUrl}?${query.toString()}`;
    try {
      const response = await axios.get(url, {
        headers: getTHeader.headers,
        timeout: 15000, // 15s - fail fast instead of hanging
      });
      console.log(response.data);
      return response;
    } catch (err) {
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.error('Network error: cannot reach Winamax. Check firewall, VPN, and that https://www.winamax.fr works in your browser.');
      }
      throw err;
    }
}
  
async function sendWithSID(data){
    const t = yeast();
    
    const url = `https://sports-eu-west-3.winamax.fr/uof-sports-server/socket.io/?language=FR&version=3.37.0&embed=false&EIO=3&transport=polling&t=${t}&sid=${data.sid}`;
    getSIDHeader.headers.Cookie = `AWSALB=${data.AWSALB}; AWSALBCORS=${data.AWSALBCORS}`;
    const response = await axios.get(url,  { headers: getSIDHeader.headers });
    return response?.data;
}
async function isAvailableUse(data){
const t = yeast();
const requestId = v4();
console.log(requestId);
const payload = `42${JSON.stringify([
    "m",
    {
    route: "sport:5",
    requestId,
    }
])}`;
const body = `${payload.length}:${payload}`;
const url = `https://sports-eu-west-3.winamax.fr/uof-sports-server/socket.io/?language=FR&version=3.37.0&embed=false&EIO=3&transport=polling&t=${t}&sid=${data.sid}`;
getSIDHeader.headers.Cookie = `AWSALB=${data.AWSALB}; AWSALBCORS=${data.AWSALBCORS}`;

const response = await axios.post(
url,
body,
{
    headers:  getSIDHeader.headers
}
);
return response?.data;
}

async function initSocketInfo() {
    const receivedSID = await initializeWebSocket();
    const cookies = receivedSID.headers["set-cookie"];
    const AWSALB = getCookieValue(cookies[0], 'AWSALB');
    const AWSALBCORS = getCookieValue(cookies[1], 'AWSALBCORS');
    
    const jsonStr = receivedSID.data;
    const jsonString = jsonStr.substring(jsonStr.indexOf('{'));
    const jData = JSON.parse(jsonString);
    const {sid, pingInterval, pingTimeout,maxPayload} = jData;

    const confirmSID = await sendWithSID({sid, AWSALB, AWSALBCORS});
    // if(confirmSID == '2:40'); //40

    const availabe = await isAvailableUse({sid, AWSALB, AWSALBCORS});
    if(availabe != 'ok' && availabe != 'OK') return null;

    const initTennisInfo = await  sendWithSID({sid, AWSALB, AWSALBCORS});

    return {sid, AWSALB, AWSALBCORS, pingInterval, pingTimeout,maxPayload};
}
module.exports = {
    initSocketInfo,
}
