/**
 * Example usage of winamaxParser.js
 * This demonstrates how to parse Winamax tennis betting data
 */

const { parseWinamaxData, getMatchBettingInfo } = require('./winamaxParser');

// Example JSON data (simplified structure from user's input)
const exampleData = {
    "matches": {
        "68620934": {
            "matchId": 68620934,
            "title": "M.Granollers / H.Zeballos - T.Arribage / A.Olivetti",
            "competitor1Name": "M.Granollers / H.Zeballos",
            "competitor2Name": "T.Arribage / A.Olivetti"
        },
        "68621548": {
            "matchId": 68621548,
            "title": "Taylor Fritz - Ben Shelton",
            "competitor1Name": "Taylor Fritz",
            "competitor2Name": "Ben Shelton"
        }
    },
    "outcomes": {
        "1461149016": {
            "betId": 460192591,
            "label": "Gaël Monfils",
            "available": true,
            "competitorId": 14844
        },
        "1461149017": {
            "betId": 460192591,
            "label": "Novak Djokovic",
            "available": true,
            "competitorId": 14882
        }
    },
    "odds": {
        "1461149016": 500,
        "1461149017": 12,
        "1461149018": 75,
        "1461149019": 12
    },
    "bets": {
        "460192591": {
            "betId": 460192591,
            "matchId": 68621548,
            "marketId": 534,
            "betTitle": "Vainqueur",
            "betTypeName": "Vainqueur",
            "betType": 4981,
            "outcomes": [1461149016, 1461149017],
            "available": true
        }
    }
};

// Example 1: Parse all betting data
console.log('=== Example 1: Parse All Betting Data ===');
try {
    const result = parseWinamaxData(exampleData);
    
    console.log('\n1. Match Winner (1*2):');
    console.log(JSON.stringify(result.matchWinner, null, 2));
    
    console.log('\n2. Total Games Over/Under:');
    console.log(JSON.stringify(result.totalGamesOU, null, 2));
    
    console.log('\n3. Game Handicap:');
    console.log(JSON.stringify(result.gameHandicap, null, 2));
    
    console.log('\n4. First Set Winner:');
    console.log(JSON.stringify(result.firstSetWinner, null, 2));
    
    console.log('\n5. Total Games:');
    console.log(JSON.stringify(result.totalGames, null, 2));
} catch (error) {
    console.error('Error parsing data:', error.message);
}

// Example 2: Get betting info for a specific match
console.log('\n=== Example 2: Get Betting Info for Specific Match ===');
try {
    const matchInfo = getMatchBettingInfo(exampleData, 68621548);
    console.log(JSON.stringify(matchInfo, null, 2));
} catch (error) {
    console.error('Error getting match info:', error.message);
}

// Example 3: Usage with real data from scraper
console.log('\n=== Example 3: Usage with Real Scraper Data ===');
console.log(`
// In your main code:
const winamaxParser = require('./analyze/winamaxParser');
const winamaxScraper = require('./winamax/index.js');

async function analyzeWinamaxData() {
    // Get data from scraper
    const rawData = await winamaxScraper.runScraper(0);
    
    // Parse the data
    const bettingInfo = winamaxParser.parseWinamaxData(rawData);
    
    // Access the 5 betting types:
    // 1. bettingInfo.matchWinner
    // 2. bettingInfo.totalGamesOU
    // 3. bettingInfo.gameHandicap
    // 4. bettingInfo.firstSetWinner
    // 5. bettingInfo.totalGames
    
    return bettingInfo;
}
`);
