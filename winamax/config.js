export const config = {
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

}