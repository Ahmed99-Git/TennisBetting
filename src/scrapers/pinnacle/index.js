const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pinnacleUrl = process.env.URL2;

const { getTennisInfoByAxios } = require('../../services/api.js');

async function runScraper() {
    const tableInfo = await getTennisInfoByAxios(pinnacleUrl);
    return tableInfo;
}
// Run the scraper if this file is executed directly
if (require.main === module) {
    runScraper().catch(console.error);
}
module.exports = {
    runScraper
}