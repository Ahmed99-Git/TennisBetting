function americanOddsToDecimal(odds) {
  return odds > 0
    ? (odds / 100) + 1
    : (100 / Math.abs(odds)) + 1;
}
function getCookieValue(cookieString, name) {
  const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
function getDataFromReceive(raw){
  if (!raw) return null;
  const msg = raw.toString();
  if (msg === "2") {
    return { type: "ping" };
  }
  if (msg.startsWith("0")) {
    return { type: "open", data: JSON.parse(msg.slice(1)) };
  }
  if (msg.startsWith("42")) {
    const [event, payload] = JSON.parse(msg.slice(2));
    return { type: "event", event, payload };
  }
  return null;
}
function makeSendMsgContent (route, requestId) {
  const payload = [];
  payload.push("m");
  if(requestId) {
    payload.push({route: route, requestId: requestId});
  } else {
    payload.push({route: route});
  }
  return `42${JSON.stringify(payload)}`;
}

module.exports = {
  getCookieValue,
  getDataFromReceive,
  makeSendMsgContent,
  americanOddsToDecimal,
};