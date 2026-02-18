const { config } = require('./config');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const path = require('path');
const serviceWebSocket = require('./service/websocket');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function initBrowser() {
  console.log('Launching virtual browser...');
  
  const browser = await puppeteer.launch(config.browserHeader);
  const page = await browser.newPage();

  await page.setUserAgent( config.chromeSettings );
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

async function closeAlertModal(page) {
  try {
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    console.log('Pressed Esc to close login/register modal');
    return true;
  } catch (error) {
    console.error('Error closing alert modal:', error);
    return false;
  }
}
async function clickTennisMenu(page) {
  // Step 1: Click the "Tennis" menu <a> tag, then Step 2: Click the submenu link
  try {
    // Step 1: Click the "Tennis" menu <a> tag
    console.log('Waiting for Tennis menu to be available...');
    
    // Wait for the element to exist using waitForFunction
    await page.waitForFunction(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(link => {
        const span = link.querySelector('span');
        return span && span.textContent.trim() === 'Tennis';
      });
    }, { timeout: 10000 });
    
    // Find the <a> tag that contains "Tennis" text using XPath
    const tennisMenuXPath = '//a[.//span[text()="Tennis"]]';
    const [tennisMenuElement] = await page.$x(tennisMenuXPath);
    if (tennisMenuElement) {
      // Move mouse to the Tennis menu first (human-like)
      await tennisMenuElement.hover();
      await page.waitForTimeout(200); // Small delay before clicking
      
      // Click the Tennis menu with a delay to simulate human behavior
      await tennisMenuElement.click({ delay: 100 });
      // console.log('Clicked the Tennis menu');
      
      // Wait for the submenu to open
      await page.waitForTimeout(500);
    } else {
      console.log('Could not find the Tennis menu <a> tag');
      return;
    }
    
    // Step 2: Wait for the submenu to open and click the <a> tag with href="/paris-sportifs/sports/5"
    const linkSelector = 'a[href="/paris-sportifs/sports/5"]';
    // console.log('Waiting for the submenu link to be available...');
    await page.waitForSelector(linkSelector, { timeout: 10000 });
    
    // Click the specific <a> tag with human-like behavior (delay and move)
    const linkElement = await page.$(linkSelector);
    if (linkElement) {
      // Move mouse to the element first (human-like)
      await linkElement.hover();
      await page.waitForTimeout(200); // Small delay before clicking
      
      // Click with a delay to simulate human behavior
      await linkElement.click({ delay: 100 });
      // console.log('Clicked the submenu link with href="/paris-sportifs/sports/5"');
    } else {
      console.log('Could not find the <a> tag with href="/paris-sportifs/sports/5"');
    }
  } catch (error) {
    console.error('Error clicking the menu or link:', error);
  }
}

async function navigateToWinamax(page, ws) {
  let url = process.env.URL1;
  url = url.trim().replace(/^['"]|['"]$/g, '');
  // console.log(`Navigating to ${url}...`);
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2', // Wait until network is idle
      timeout: 60000
    });
    // console.log('Page loaded successfully');

    const closed = await closeAlertModal(page);
    if (!closed) {
      throw new Error('Failed to close alert modal');
    }
    
    // Setup WebSocket monitoring
    if(ws == null)
      ws = await serviceWebSocket.setupWebSocketMonitoring(page);
    // console.log('WebSocket monitoring enabled');

    await page.waitForTimeout(500);
    await clickTennisMenu(page);
  
    return true;
  } catch (error) {
    console.error('Error navigating to Winamax:', error);
    return false;
  }
}

async function runScraper(index, browser, page, ws) {

  if(index == 0) {
    try {
      if(browser == null || page == null) {
        const browserSetup = await initBrowser();
        browser = browserSetup.browser;
        page = browserSetup.page;
        const navigated = await navigateToWinamax(page, ws);
        if (!navigated) {
          throw new Error('Failed to navigate to Winamax');
        }
      }
      console.log("tennisInfo =", serviceWebSocket.tennisInfo);
    } catch (error) {
      console.error('Error in scraper:', error);
    } finally {
    }
  }
  return {winamaxInfo: serviceWebSocket?.tennisInfo, browser, page, ws : serviceWebSocket};
}

// Run the scraper if this file is executed directly
// if (require.main === module) {
//   runScraper().catch(console.error);
// }

module.exports = {
  initBrowser,
  runScraper
};
