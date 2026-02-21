const path = require('path');
const dotenv = require('dotenv');
const { getTennisInfoByAxios } = require('../../services/api.js');
const { resortAllData } = require('../../dataParsers/pinnacleParser.js');
const { matchUrlInfo, marketUrlInfo } = require('../../config/pinnacleConfig.js');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
    const matchInfos = await getTennisInfoByAxios(matchUrlInfo);
    const marketInfos = await getTennisInfoByAxios(marketUrlInfo);

    const sortedData = await resortAllData({ matchInfos, marketInfos });
    return  sortedData ;
}
// Run the scraper if this file is executed directly
if (require.main === module) {
    run().catch(console.error);
}
module.exports = {
    run
}