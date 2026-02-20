const winamaxParser = require('../../dataParsers/winamaxParser.js');
const {initSocketInfo} = require ("./init/initConnection.js");
const {makeSendMsgContent} = require ("../../utils/common.js");
const {safeSendReceive} = require ("../../utils/wsUtils.js");
const {createSocket} = require ('../../services/ws.js');
const { v4 } = require("uuid");
async function getStandardTennisInfo(ws) {
  const requestId = v4();
  ws.requestId = requestId;
  const response = await safeSendReceive(ws, makeSendMsgContent("sport:5", requestId), requestId);
  return response?.payload;
}
async function getFullMatchInfo(ws) {
  const fullMatchInfo = [];
  const matchsArray = ws.standardInfo?.matches || [];
  for(const key of Object.keys(matchsArray)) {
    const response = await safeSendReceive(ws, makeSendMsgContent(`match:${key}`, null), null);
    fullMatchInfo.push(response?.payload);
  }
  return fullMatchInfo;
}

function waitForConnection(ws) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (ws.status === "connected") {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
async function run (ws, count) {
  const FULL_FETCH_INTERVAL_TIMES = parseInt(process.env.WINAMAX_FULL_FETCH_PERIOD / process.env.FETCH_ONCE_TIME) || 6 ;
  if(count == null) count = 1;
  if(ws == null) {
    const data = await initSocketInfo();
    if(data == null)
      return null;
    const {sid, AWSALB, AWSALBCORS, pingInterval, pingTimeout,maxPayload} = data;
    ws = await createSocket({sid, AWSALB, AWSALBCORS});
    ws.timeout = pingTimeout;
    ws.interval = pingInterval;
    ws.maxPayload = maxPayload;
    ws.sid = sid;
  }
  await waitForConnection(ws);

  const standardTennisInfo = await getStandardTennisInfo(ws);
  ws.standardInfo = standardTennisInfo;
  if(count % FULL_FETCH_INTERVAL_TIMES == 0) {
    const fullMatchInfo = await getFullMatchInfo(ws);
    ws.fullMatchInfo = fullMatchInfo;
  }
  const sortedData = await winamaxParser.resortAllData({standardInfo: ws.standardInfo, fullMatchInfo: ws.fullMatchInfo});
  return ws;
}

module.exports = { run };