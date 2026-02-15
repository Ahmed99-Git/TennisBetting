let cdpClient = null;
let wsRequestId = null;
let pageInstance = null;

/**
 * Send a WebSocket message via page evaluation
 * @param {string} message - The message string to send via WebSocket
 */
async function sendMsg(message) {
  if (!pageInstance) {
    throw new Error('Page instance not initialized. Call setupWebSocketMonitoring first.');
  }

  try {
    await pageInstance.evaluate((message) => {
      if (window.__wsInstances && window.__wsInstances.length > 0) {
        const ws = window.WebSocket;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          return true;
        }
      }
      
      for (let key in window) {
        try {
          const obj = window[key];
          if (obj && obj.constructor && obj.constructor.name === 'WebSocket' && obj.readyState === WebSocket.OPEN) {
            obj.send(message);
            return true;
          }
        } catch (e) {
          // Ignore errors when checking properties
        }
      }
      
      return false;
    }, message);
    console.log('WebSocket message sent via sendMsg:', message);
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    throw error;
  }
}

async function initRequest(){
    return await sendMsg('5');
}
async function setupWebSocketMonitoring(page) {
    let isInited = false;
    const client = await page.target().createCDPSession();
    
    // Store client and page globally
    cdpClient = client;
    pageInstance = page;
    
    // Inject code to capture WebSocket instances
    await page.evaluateOnNewDocument(() => {
      // Store WebSocket instances
      window.__wsInstances = [];
      
      // Override WebSocket constructor to capture instances
      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = function(...args) {
        const ws = new OriginalWebSocket(...args);
        window.__wsInstances.push(ws);
        return ws;
      };
      // Copy static properties
      Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
      window.WebSocket.prototype = OriginalWebSocket.prototype;
    });
    
    // Enable Network domain to intercept WebSocket frames
    await client.send('Network.enable');
    await client.send('Runtime.enable');
  
    // Store WebSocket requestId and track messages
    let lastRequestId = null;
  
    // Listen for WebSocket frame events
    client.on('Network.webSocketFrameReceived', async ({ requestId, timestamp, response }) => {
      const payload = response.payloadData;
      console.log('WebSocket message received:', {
        requestId,
        timestamp,
        payload
      });

      // Try to parse payload as JSON to extract requestId
      try {
        const parsed = JSON.parse(payload);
        if (parsed && typeof parsed === 'object') {
          // Check if it's an array with a requestId in the second element
          if (Array.isArray(parsed) && parsed[1] && parsed[1].requestId) {
            lastRequestId = parsed[1].requestId;
            console.log('Extracted requestId from message:', lastRequestId);
          }
          // Or if it's an object with requestId property
          else if (parsed.requestId) {
            lastRequestId = parsed.requestId;
            console.log('Extracted requestId from message:', lastRequestId);
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }

      // Check if payload is '3' and send the message (only first time)
      if (payload === '3' && !isInited) {
        isInited = false;
        
        const messageRequestId = lastRequestId || generateUUID();
        const messageToSend = JSON.stringify([
          "m",
          {
            "route": "sport:5",
            "requestId": messageRequestId
          }
        ]);

      if( await sendMsg(messageToSend) == false)
        console.log('************Error sending WebSocket message:', messageToSend);
      }
    });
  
    client.on('Network.webSocketFrameSent', ({ requestId, timestamp, response }) => {
      console.log('WebSocket message sent:', {
        requestId,
        timestamp,
        payload: response.payloadData
      });

      // Try to extract requestId from sent messages too
      try {
        const parsed = JSON.parse(response.payloadData);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed) && parsed[1] && parsed[1].requestId) {
            lastRequestId = parsed[1].requestId;
          } else if (parsed.requestId) {
            lastRequestId = parsed.requestId;
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    });
  
    client.on('Network.webSocketCreated', ({ requestId, url }) => {
      // Update global wsRequestId for sendMsg function
      wsRequestId = requestId;
      console.log('WebSocket created:', { requestId, url });
    });
  
    client.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
      console.log('WebSocket closed:', { requestId, timestamp });
    });
  
    return client;
  }

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  setupWebSocketMonitoring,
  sendMsg
};
  