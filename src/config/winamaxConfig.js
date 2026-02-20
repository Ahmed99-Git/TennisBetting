const chromeOptions = {
    browserHeader: {
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
    },
    chromeSettings: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

};
const websocketOptions = {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Origin": "https://www.winamax.fr",
        "Host": "sports-eu-west-3.winamax.fr",

        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Connection": "Upgrade",
        "Sec-WebSocket-Version": "13",
        "Sec-WebSocket-Key": "6d91TNKG06Ukokb0aCgAeQ==",
        "Upgrade": "websocket",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
    }
};

const getTHeader = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    "Origin": "https://www.winamax.fr",
    "Host": "sports-eu-west-3.winamax.fr",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Priority": "u=1, i",
    "Referer": "https://www.winamax.fr/",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Dest": "empty",
    "Sec-Ch-Ua-Mobile": "?0",
    // "Cookie":"PHPSESSIONID=019c767f-0a0c-766d-883b-2ebbdf4c0b53",
    "Sec-Ch-Ua-Platform": "Windows"
  }
}
const getSIDHeader = {
    headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.winamax.fr",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Priority": "u=1, i",
    "Referer": "https://www.winamax.fr/",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Dest": "empty",
    "Sec-Ch-Ua-Mobile": "?0",
    // "Cookie":"PHPSESSIONID=019c767f-0a0c-766d-883b-2ebbdf4c0b53",
    "Sec-Ch-Ua-Platform": "Windows",
    "sec-ch-ua":'"Not:A-Brand";v="99", "Google Chrome";v="120", "Chromium";v="120"'
  }
}
module.exports = {
  chromeOptions,
    websocketOptions,
    getTHeader,
    getSIDHeader,
};