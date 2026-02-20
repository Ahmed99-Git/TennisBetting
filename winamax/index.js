const {initSocketInfo} = require ("./init/initConnection.js");
const {makeSendMsgContent} = require ("./utils/common.js");

async function getStandardTennisInfo(ws) {
  const requestId = v4();
  ws.requestId = requestId;
  const response = await ws.send(makeSendMsgContent("sport:5", requestId));
  return JSON.parse(response);
}
async function getFullMatchInfo(ws) {
  const matchsArray = ws.standardInfo.data.matchs;
  for(const match of matchsArray) {
    const requestId = v4();
    ws.requestId = requestId;
    const response = await ws.send(makeSendMsgContent("sport:5", requestId));
    return JSON.parse(response);
  }
  return null;
}

async function run (ws, count) {
  const data = await initSocketInfo();
  if(data == null)
    return null;
  const {sid, AWSALB, AWSALBCORS} = data;
  if(ws == null) {
    ws = await createSocket({sid, AWSALB, AWSALBCORS});
  }
  const standardTennisInfo = await getStandardTennisInfo(ws);
  ws.standardInfo = standardTennisInfo;
  if(count % 6 == 0) {
    const fullMatchInfo = await getFullMatchInfo(ws);
    ws.fullMatchInfo = fullMatchInfo;
  }
 return ws;
}

module.exports = { run };