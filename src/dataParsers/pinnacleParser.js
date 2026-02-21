const Betting = require('../models/Betting.js');
const { americanOddsToDecimal } = require('../utils/common.js');

function pushOdds(odds, infos) {
    if (infos[0]?.designation == "home" || infos[0]?.designation == "over") {
        odds.push(Number(americanOddsToDecimal(infos[0].price).toFixed(3)))
        odds.push(Number(americanOddsToDecimal(infos[1].price).toFixed(3)))
    } else {
        odds.push(Number(americanOddsToDecimal(infos[1].price).toFixed(3)))
        odds.push(Number(americanOddsToDecimal(infos[0].price).toFixed(3)))
    }
}

function getMatchWinner(infos) {
    const matchWinnerOdds =[];
    const matchWinnerInfo = infos.find(info => info.key == "s;0;m");
    if (matchWinnerInfo == undefined || matchWinnerInfo == null) return null;
    pushOdds(matchWinnerOdds, matchWinnerInfo.prices);
    return matchWinnerOdds;
}   
function getSet1Winner(infos) {
    const set1WinnerOdds =[];
    const set1WinnerInfo = infos.find(info => info.key == "s;1;m");
    if (set1WinnerInfo == undefined || set1WinnerInfo == null) return null;
    pushOdds(set1WinnerOdds, set1WinnerInfo.prices);
    return set1WinnerOdds;
}
function getHandicapInfo(infos) {
    const handicapOdds = {};
    const handicapInfos = infos.filter(info => info.type == "spread");
    if (handicapInfos.length == 0) return null;

    for (const info of handicapInfos) {
        const tmpOdd = [];
        const tmpJson = {};
        const handicapId = "handicap=" + info.key.split(";")[3];
        pushOdds(tmpOdd, info.prices);
        tmpJson.odds = tmpOdd;
        handicapOdds[handicapId] = tmpJson;
    }
    return handicapOdds;
}
function getTotalBigRounds(infos) {
    const bigRoundInfo = {};
    const totalBigRoundsInfos = infos.filter(info => info.key?.startsWith("s;0;ou;") );  
    if (totalBigRoundsInfos.length == 0) return null;
    for (const info of totalBigRoundsInfos) {
        const tmpOdd = [];
        const tmpJson = {};
        const bigRoundId = "total=" + info.key.split(";")[3];
        bigRoundInfo[bigRoundId] = [];
        pushOdds(tmpOdd, info.prices);

        tmpJson.odds = tmpOdd;
        bigRoundInfo[bigRoundId] = tmpJson;
    }
    return bigRoundInfo;
}
async function resortAllData(data) {   
    const sortedData = {};
    const {matchInfos, marketInfos} = data;
    if(matchInfos == undefined || matchInfos == null || marketInfos == undefined || marketInfos == null) return sortedData;
    for(const  matchInfo of matchInfos) {
        if(matchInfo.units != "Sets") continue;

        const match = {};
        const sameMarketInfos = marketInfos.filter(marketInfo => marketInfo.matchupId == matchInfo.id);
        const playerNameInfo = matchInfo.participants;

        if(playerNameInfo.length != 2) continue;
        if(sameMarketInfos.length == 0) continue;
        match.id = matchInfo.id;
        match.bookmaker = "pinnacle";
        match.competitor1Name = playerNameInfo[0].alignment == "home" ? playerNameInfo[0].name : playerNameInfo[1].name;
        match.competitor2Name = playerNameInfo[0].alignment == "away" ? playerNameInfo[0].name : playerNameInfo[1].name;
        match.startTime = matchInfo.startTime;
        match.status = matchInfo.status;

        
        match.matchWinner = getMatchWinner( sameMarketInfos);
        match.set1Winner = getSet1Winner(sameMarketInfos);
        match.handicapInfo = getHandicapInfo(sameMarketInfos);
        match.totalBigRounds = getTotalBigRounds(sameMarketInfos);

        // match.set1GameCount = getSet1GameCount(sameMarketInfos);
        sortedData[match.id] = match;

        if(match.matchWinner){
            try {
                Betting.save(match);
            } catch (error) {
            console.error(`Error saving match ${match.id} to database:`, error);
        }}
    }
    return sortedData;
}

module.exports = {
    resortAllData
};
