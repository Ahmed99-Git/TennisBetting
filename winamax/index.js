const puppeteer = require('puppeteer');
const serviceWebSocket = require('./service/websocket');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function initBrowser() {
  console.log('Launching virtual browser...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production (runs without GUI)
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const url = request.url();
    // Log WebSocket upgrade requests
    if (url.includes('ws://') || url.includes('wss://')) {
      console.log('WebSocket connection detected:', url);
    }
    request.continue();
  });

  page.on('response', (response) => {
    const url = response.url();
    if (response.request().resourceType() === 'websocket') {
      console.log('WebSocket response:', url);
    }
  });
  return { browser, page };
}

async function navigateToWinamax(page) {
  let url = process.env.URL1;
  url = url.trim().replace(/^['"]|['"]$/g, '');
  console.log(`Navigating to ${url}...`);
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2', // Wait until network is idle
      timeout: 40000
    });
    console.log('Page loaded successfully');

    // Wait a moment for the login/register modal to appear
    await page.waitForTimeout(5000);
    
    // Press Esc key to close the modal
    await page.keyboard.press('Escape');
    console.log('Pressed Esc to close login/register modal');
    
    // Wait a moment to ensure modal is closed
    await page.waitForTimeout(500);
    
    return true;
  } catch (error) {
    console.error('Error navigating to Winamax:', error);
    return false;
  }
}

async function runScraper() {
  let browser;
  let page;
  try {
    const browserSetup = await initBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;

    // Navigate to Winamax
    const navigated = await navigateToWinamax(page);
    if (!navigated) {
      throw new Error('Failed to navigate to Winamax');
    }
        // Setup WebSocket monitoring
        await serviceWebSocket.setupWebSocketMonitoring(page);
        console.log('WebSocket monitoring enabled');
        
  } catch (error) {
    console.error('Error in scraper:', error);
  } finally {
  }
}

// Run the scraper if this file is executed directly
if (require.main === module) {
  runScraper().catch(console.error);
}

module.exports = {
  initBrowser,
  navigateToWinamax,
  runScraper
};
