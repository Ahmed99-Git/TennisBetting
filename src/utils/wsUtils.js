const { getDataFromReceive } = require("./common.js");

async function safeSendReceive(ws, data, requestId) {
    const timeout = ws.timeout;
  
    if (requestId)
        ws.requestId = requestId;
    else{
        ws.wait_match_id = data.matchId;
    }

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
    safeSendReceive
  }