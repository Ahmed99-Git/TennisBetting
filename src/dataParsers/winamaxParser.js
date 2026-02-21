const Betting = require('../models/Betting.js');

function getMatchWinner(matchSource, fullMatch) {
    const matchWinnerOdds =[];
    if(matchSource == null || matchSource.bets == null) return null;
    const betId = matchSource.bets[0];
    if (betId == null) return null;
    
    const bet = fullMatch?.bets?.[betId];
    if (bet == null) return null;
    try {
        if (bet.specialBetValue  && bet.specialBetValue == "type=prematch")
        {
            const outcomeIds = bet.outcomes;
            matchWinnerOdds.push(fullMatch.odds[outcomeIds[0]]);
            matchWinnerOdds.push(fullMatch.odds[outcomeIds[1]]);
        }else
        {
            for(let i=1; i< matchSource.bets.length; i++){
                const betId = matchSource.bets[i];
                const bet = fullMatch?.bets?.[betId];
                if(bet == null) continue;
                if(bet.available == false) continue;
                if(bet.specialBetValue  && bet.specialBetValue == "type=prematch")
                {
                    const outcomeIds = bet.outcomes;
                    matchWinnerOdds.push(fullMatch.odds[outcomeIds[0]]);
                    matchWinnerOdds.push(fullMatch.odds[outcomeIds[1]]);
                }
            }
        }
    }catch (e){
        console.error(e);
    }
    return matchWinnerOdds;
}
function getSet1Winner(matchSource, fullMatch) {
    if(matchSource == null || matchSource.bets == null) return null;
    if(matchSource.bets.length < 2) return null;
    const set1WinnerOdds =[];
    const betId = matchSource.bets[1];
    if(betId == null) return null;
    
    const bet = fullMatch?.bets?.[betId];
    if(bet == null) return null;
    try{
        if(bet.specialBetValue  && bet.specialBetValue == "setnr=1")
        {
            const outcomeIds = bet.outcomes;
            set1WinnerOdds.push(fullMatch.odds[outcomeIds[0]]);
            set1WinnerOdds.push(fullMatch.odds[outcomeIds[1]]);
        }else
        {
            for(let i=2; i< matchSource.bets.length; i++){
                const betId = matchSource.bets[i];
                const bet = fullMatch?.bets?.[betId];
                if(bet == null ) continue;
                if(bet.available == false) continue;
                if(bet.specialBetValue  && bet.specialBetValue == "setnr=1")
                {
                    const outcomeIds = bet.outcomes;
                    set1WinnerOdds.push(fullMatch.odds[outcomeIds[0]]);
                    set1WinnerOdds.push(fullMatch.odds[outcomeIds[1]]);
                }
            }
        }
    }catch (e){
        console.error(e);
    }
    return set1WinnerOdds;
}
function getHandicapInfo(matchSource, fullMatch) {
    const handicapInfo = {};
    const setnrBets = Object.values(fullMatch?.bets).filter(bet => bet.specialBetValue && bet.specialBetValue.startsWith("setnr=") );
    try{
        for(const bet of setnrBets){
            if(bet.available == false) continue;
            const handicapId = bet.specialBetValue;
            const outcomeIds = bet.outcomes;
            if(outcomeIds == null) continue;
            handicapInfo[handicapId] = {
                odds: [fullMatch.odds[outcomeIds[0]], fullMatch.odds[outcomeIds[1]]]
            }
        }
    }catch (e){
        console.error(e);
    }
    return handicapInfo;
}
function getTotalBigRounds(matchSource, fullMatch) {
    /////////**********get total big set count only : betType = 3755, other betType = 2958, 2842, 3307, 5682 */
    const bigRoundInfo = {};
    const setnrBets = Object.values(fullMatch?.bets).filter(bet => bet.specialBetValue && bet.specialBetValue.startsWith("total=") );
    try{
        for(const bet of setnrBets){
            if(bet.available == false) continue;
            const bigRoundId = bet.specialBetValue;
            const outcomeIds = bet.outcomes;
            if(outcomeIds == null) continue;
            bigRoundInfo[bigRoundId] = {
                odds: [fullMatch.odds[outcomeIds[0]], fullMatch.odds[outcomeIds[1]]]
            }
        }
    }catch (e){
        console.error(e);
    }
    return bigRoundInfo;
}
function getSet1GameCount(matchSource, fullMatch) {
    const set1GameCountInfo = {};
    const setnrBets = Object.values(fullMatch?.bets).filter(bet => bet.specialBetValue && bet.specialBetValue.startsWith("setnr=1|total=") );
    try{
        for(const bet of setnrBets){
            if(bet.available == false) continue;
            const set1GameCountId = bet.specialBetValue;
            const outcomeIds = bet.outcomes;
            if(outcomeIds == null) continue;
            set1GameCountInfo[set1GameCountId] = {
                odds: [fullMatch.odds[outcomeIds[0]], fullMatch.odds[outcomeIds[1]]]
            }
        }
    }catch (e){
        console.error(e);
    }
    return set1GameCountInfo;
}
async function resortAllData(data) {   
    const sortedData = {};
    const {standardInfo, fullMatchInfo} = data;
    if(fullMatchInfo == undefined || fullMatchInfo == null) return sortedData;
    for(const  fullMatch of fullMatchInfo) {
        const matchId = Object.keys(fullMatch.matches)[0];
        if(matchId == null) continue;

        const matchInfo = {};
        const matchSummarize = fullMatch.matches[matchId];
        if(matchSummarize == null) continue;
        matchInfo.id = matchId;
        matchInfo.title = matchSummarize.title;
        matchInfo.bookmaker = "winamax";
        matchInfo.startTime = new Date(matchSummarize.matchStart * 1000).toISOString().replace('00.000Z', '00Z');
        matchInfo.status = matchSummarize.status;

        matchInfo.competitor1Name = matchSummarize.competitor1Name;
        matchInfo.competitor2Name = matchSummarize.competitor2Name;
        matchInfo.competitor1Id = matchSummarize.competitor1Id;
        matchInfo.competitor2Id = matchSummarize.competitor2Id;
        matchInfo.competitor1Id = matchSummarize.competitor1Id;
        matchInfo.matchWinner = getMatchWinner(matchSummarize, fullMatch);
        matchInfo.set1Winner = getSet1Winner(matchSummarize, fullMatch);
        matchInfo.handicapInfo = getHandicapInfo(matchSummarize, fullMatch);
        matchInfo.totalBigRounds = getTotalBigRounds(matchSummarize, fullMatch);
        matchInfo.set1GameCount = getSet1GameCount(matchSummarize, fullMatch);
        sortedData[matchId] = matchInfo;

        if(matchInfo.matchWinner && matchInfo.matchWinner.length > 0 ){
            try {
                Betting.save(matchInfo);
            } catch (error) {
            console.error(`Error saving match ${matchId} to database:`, error);
        }}
    }
    return sortedData;
}

module.exports = {
    resortAllData
};
