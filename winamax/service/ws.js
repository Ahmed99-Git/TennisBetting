const WebSocket = require("ws");

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
  });

  websocket.on("message", (data) => {
    console.log("📩 Message:", data.toString());
  });

  websocket.on("close", (code, reason) => {
    console.log("❌ Closed:", code, reason.toString());
  });

  websocket.on("error", (err) => {
    console.error("⚠️ Error:", err.message);
  });

  return websocket;
}
module.exports = {
    createSocket
};