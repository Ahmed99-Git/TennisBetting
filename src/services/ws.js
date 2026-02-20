const WebSocket = require("ws");
const { getDataFromReceive } = require("../utils/common.js");

async function receiveMessage(data, ws) {
  const msg = getDataFromReceive(data.toString());
  if (!msg) return;
  // if(ws.status == FULL_FETCH_STATUS) {
   
  // }
}

function createSocket(data) {
  const url = `wss://sports-eu-west-3.winamax.fr/uof-sports-server/socket.io/?language=FR&version=3.38.0&embed=false&EIO=3&transport=websocket&sid=${data.sid}`

  const websocket = new WebSocket(url, {
    headers: {
      Origin: "https://www.winamax.fr",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Cookie": `AWSALB=${data.AWSALB}; AWSALBCORS=${data.AWSALBCORS}`
    },
  });

  websocket.on("open", () => {
    console.log("✅ Connected");
    websocket.send("2probe");
    console.log("2probe");
  });

  websocket.on("message", (data) => {
    receiveMessage(data, websocket);
    console.log("📩 Message:", data.toString().length);
  });

  let pingInterval = null;

  websocket.on("message", (data) => {
    const msg = data.toString();
    if(msg == "3probe") {
      if (websocket.readyState === WebSocket.OPEN) {
      websocket.send("5");
      console.log("5");
      websocket.status = "connected";
      }
      
      // Start sending ping "2" every 25 seconds
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      pingInterval = setInterval(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send("2");
          console.log("Ping: 2");
        }
      }, 25000);
    }
    if (msg === "2") {
      websocket.send("3"); // pong
    }
  });

  websocket.on("close", (code, reason) => {
    console.log("❌ Closed:", code, reason.toString());
    // Clear ping interval on close
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  });

  websocket.on("error", (err) => {
    console.error("⚠️ Error:", err.message);
  });

  return websocket;
}
module.exports = {
    createSocket
};