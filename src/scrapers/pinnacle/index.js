const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { matchUrlInfo, marketUrlInfo } = require('../../config/pinnacleConfig.js');

const { getTennisInfoByAxios } = require('../../services/api.js');

async function run() {
    const matchInfo = await getTennisInfoByAxios(matchUrlInfo);
    const marketInfo = await getTennisInfoByAxios(marketUrlInfo);
    return { matchInfo, marketInfo };
}
// Run the scraper if this file is executed directly
if (require.main === module) {
    run().catch(console.error);
}
module.exports = {
    run
}