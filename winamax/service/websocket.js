// import { generateUUID } from '../utils/common.js';
const { writeFile, readFile } = require('fs/promises');
const { join, dirname } = require('path');
const { fileURLToPath } = require('url');

const outJsonPath = join(__dirname, '..', 'out.json');

const tennisInfo = {};

let pageInstance = null;
let lastRequestId = null;

async function writeToOutJson(data) {
  try {
    let existingData = [];
    try {
      const fileContent = await readFile(outJsonPath, 'utf-8');
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
        if (!Array.isArray(existingData)) {
          existingData = [existingData];
        }
      }
    } catch (e) {
      // File doesn't exist or is invalid, start with empty array
      existingData = [];
    }
    
    existingData.push(data);
    await writeFile(outJsonPath, JSON.stringify(existingData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to out.json:', error);
  }
}

function analyzeAndSortPayload(payloadData, messageType) {
  const result = {
    type: messageType, // 'received' or 'sent'
    kind: null,
    route: null,
    requestId: null,
    dataTypes: [],
    structure: null,
    parsed: null
  };

  try {

    switch (messageType) {
      case 'received':
        if(payloadData == '3'){
          result.kind =  'getInfo';
        }
        else{
          const jsonPart = payloadData.slice(payloadData.indexOf('['));
          const data = JSON.parse(jsonPart);
          if(data && data[1]){
            if(data[1]?.requestId && data[1]?.requestId == tennisInfo.requestId){
              tennisInfo.originData = data[1];
            }
            else{
              tennisInfo.recData = data[1];
            }
          }
        }
        break;

      case 'sent':
        // Sent messages are typically arrays: ['m', {route, requestId}]
        if (payloadData == '2') {
          result.kind =  'getInfo';
        }
        else{
          const jsonPart = payloadData.slice(payloadData.indexOf('['));
          const data = JSON.parse(jsonPart);
          if(data && data[1]){
            const sportId = data[1]?.route;
            const requestId = data[1]?.requestId;
            if(sportId && requestId){
              tennisInfo.sportId = sportId;
              tennisInfo.requestId = requestId;
            }
          }
        }
        break;

      default:
        result.structure = 'unknown';
    }

    return result;
  } catch (e) {
    // Not JSON or parsing error
    result.structure = 'parse_error';
    result.parsed = null;
    return result;
  }
}

async function setupWebSocketMonitoring(page) {
    const client = await page.target().createCDPSession();
    pageInstance = page;

    await page.evaluateOnNewDocument(() => {
      window.__wsInstances = [];
      
      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = function(...args) {
        const ws = new OriginalWebSocket(...args);
        window.__wsInstances.push(ws);
        return ws;
      };
      Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
      window.WebSocket.prototype = OriginalWebSocket.prototype;
    });
    
    // Enable Network domain to intercept WebSocket frames
    await client.send('Network.enable');
    await client.send('Runtime.enable');
  
    // Listen for WebSocket frame events
    client.on('Network.webSocketFrameReceived', async ({ requestId, timestamp, response }) => {
      const messageData = {
        requestId,
        timestamp,
        payload: response.payloadData
      };
      
      // Analyze and sort the payload
      const analysis = analyzeAndSortPayload(response.payloadData, 'received');
      console.log('WebSocket message received:', {
        ...messageData,
        analysis: {
          kind: analysis.kind,
          route: analysis.route,
          requestId: analysis.requestId,
          dataTypes: analysis.dataTypes,
          structure: analysis.structure
        }
      });
      
      await writeToOutJson(messageData);
    });
  
    client.on('Network.webSocketFrameSent', ({ requestId, timestamp, response }) => {
      // Analyze and sort the payload
      const analysis = analyzeAndSortPayload(response.payloadData, 'sent');
      
      console.log('WebSocket message sent:', {
        requestId,
        timestamp,
        payload: response.payloadData,
        analysis: {
          kind: analysis.kind,
          route: analysis.route,
          requestId: analysis.requestId,
          structure: analysis.structure
        }
      });
    });
  
    client.on('Network.webSocketCreated', ({ requestId, url }) => {
      console.log('WebSocket created:', { requestId, url });
    });
  
    client.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
      console.log('WebSocket closed:', { requestId, timestamp });
    });
  
    return client;
}

module.exports = {
  setupWebSocketMonitoring,
  tennisInfo ,
};
  