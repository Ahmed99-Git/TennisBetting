const Betting = require('../models/Betting.js');
const { americanOddsToDecimal } = require('../utils/common.js');

const infoSample = {
    "cutoffAt": "2026-02-21T15:00:00+00:00",
    "isAlternate": false,
    "key": "s;0;s;1.5",
    "limits": [
      {
        "amount": 375,
        "type": "maxRiskStake"
      }
    ],
    "matchupId": 1624626491,
    "period": 0,
    "prices": [
      {
        "designation": "home",
        "points": 1.5,
        "price": -227
      },
      {
        "designation": "away",
        "points": -1.5,
        "price": 183
      }
    ],
    "status": "open",
    "type": "spread",
    "version": 3465391300
  };
function pushOdds(odds, infos) {
    for(const info of infos){
        odds.push({
            designation: info.designation,
            odds: americanOddsToDecimal(info.price).toFixed(3)
        });
    }
}

function getMatchWinner(infos) {
    const matchWinnerOdds =[];
    const matchWinnerInfo = infos.find(info => info.key == "s;0;m");
    if(matchWinnerInfo == undefined || matchWinnerInfo == null) return null;
    pushOdds(matchWinnerOdds, matchWinnerInfo.prices);
    return matchWinnerOdds;
}
function getSet1Winner(infos) {
    const set1WinnerOdds =[];
    const set1WinnerInfo = infos.find(info => info.key == "s;1;m");
    if(set1WinnerInfo == undefined || set1WinnerInfo == null) return null;
    pushOdds(set1WinnerOdds, set1WinnerInfo.prices);
    return set1WinnerOdds;
}
function getHandicapInfo(infos) {
    const handicapOdds = {};
    const handicapInfos = infos.filter(info => info.type == "spread");
    if(handicapInfos.length == 0) return null;

    for(const info of handicapInfos){
        const handicapId = "handicap=" + info.key.split(";")[3];
        handicapOdds[handicapId] = [];
        pushOdds(handicapOdds[handicapId], info.prices);
    }
    return handicapOdds;
}
function getTotalBigRounds(infos) {
    const bigRoundInfo = {};
    const totalBigRoundsInfos = infos.filter(info => info.key?.startsWith("s;0;ou;") );  
    if(totalBigRoundsInfos.length == 0) return null;
    for(const info of totalBigRoundsInfos){
        const bigRoundId = "total=" + info.key.split(";")[3];
        bigRoundInfo[bigRoundId] = [];
        pushOdds(bigRoundInfo[bigRoundId], info.prices);
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
