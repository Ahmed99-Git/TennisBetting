/** Generate a UUID v4 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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

async function safeSend(ws, data, requestId) {
  const timeout = ws.timeout;

  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
      return reject(new Error("WebSocket is not open"));
    }
    
    const sendData = () => {
      ws.send(data);
    };
    if (ws.readyState === WebSocket.OPEN) {
      sendData();
    } else {
      ws.once("open", sendData);
    }
    // 3️⃣ Message listener
    const messageHandler = (message) => {
      const parsed = getDataFromReceive(message);
      if (!parsed) return;

      // Extract requestId from the parsed message structure
      // For event messages (type "42"), requestId is in parsed.payload.requestId
      const receivedRequestId = parsed.payload?.requestId || parsed.requestId;
      if (requestId !=null && receivedRequestId === requestId) {
        cleanup();
        resolve(parsed);
      }
      else{
        cleanup();
        resolve(parsed);
      }
    };

    // 4️⃣ Cleanup function
    const cleanup = () => {
      ws.off("message", messageHandler);
      clearTimeout(timer);
    };

    // 5️⃣ Timeout protection
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Request timeout"));
    }, timeout);

    ws.on("message", messageHandler);
  });
}

module.exports = {
  safeSend,
  generateUUID,
  getCookieValue,
  makeSendMsgContent,
};