/**
 * Winamax Tennis Betting Parser
 * Extracts 5 types of betting information from Winamax JSON data:
 * 1. 1*2 Match Winner
 * 2. Total Games (Over/Under)
 * 3. Game Handicap
 * 4. First Set Winner
 * 5. Total Games (alternative format)
 */

/**
 * Converts decimal odds to European format (multiply by 100)
 * @param {number} decimalOdds - Decimal odds (e.g., 2.5)
 * @returns {number} - European odds (e.g., 250)
 */
function convertToEuropeanOdds(decimalOdds) {
  if (typeof decimalOdds === 'number') {
    return Math.round(decimalOdds * 100);
  }
  return decimalOdds;
}

/**
 * Converts European odds to decimal format (divide by 100)
 * @param {number} europeanOdds - European odds (e.g., 250)
 * @returns {number} - Decimal odds (e.g., 2.5)
 */
function convertToDecimalOdds(europeanOdds) {
  if (typeof europeanOdds === 'number' && europeanOdds >= 100) {
    return europeanOdds / 100;
  }
  return europeanOdds;
}

/**
 * Identifies bet type based on betTitle, betTypeName, and marketId
 * @param {Object} bet - Bet object
 * @returns {string|null} - Bet type identifier
 */
function identifyBetType(bet) {
  const betTitle = (bet.betTitle || '').toLowerCase();
  const betTypeName = (bet.betTypeName || '').toLowerCase();
  const marketId = bet.marketId;

  // 1. Match Winner (1*2)
  if (betTitle.includes('vainqueur') || betTypeName.includes('vainqueur')) {
    return 'match_winner';
  }

  // 2. Total Games Over/Under
  if (
    betTitle.includes('total') && 
    (betTitle.includes('jeux') || betTitle.includes('games')) &&
    (betTitle.includes('over') || betTitle.includes('under') || betTitle.includes('plus') || betTitle.includes('moins'))
  ) {
    return 'total_games_ou';
  }

  // 3. Game Handicap
  if (
    betTitle.includes('handicap') && 
    (betTitle.includes('jeux') || betTitle.includes('games'))
  ) {
    return 'game_handicap';
  }

  // 4. First Set Winner
  if (
    betTitle.includes('1er set') || 
    betTitle.includes('premier set') ||
    betTitle.includes('first set') ||
    betTypeName.includes('1er set') ||
    betTypeName.includes('premier set')
  ) {
    return 'first_set_winner';
  }

  // 5. Total Games (alternative - just "Total" with games/jeux)
  if (
    betTitle.includes('total') && 
    (betTitle.includes('jeux') || betTitle.includes('games')) &&
    !betTitle.includes('over') && !betTitle.includes('under') &&
    !betTitle.includes('plus') && !betTitle.includes('moins')
  ) {
    return 'total_games';
  }

  return null;
}

/**
 * Finds a match by ID, checking both direct key lookup and matchId property
 * @param {Object} matches - Matches object
 * @param {number|string} matchId - Match ID to find
 * @returns {Object|null} - Match object or null
 */
function findMatch(matches, matchId) {
  // Try direct key lookup first
  if (matches[matchId]) {
    return matches[matchId];
  }
  
  // Try finding by matchId property
  for (const [key, match] of Object.entries(matches)) {
    if (match && (match.matchId === matchId || String(match.matchId) === String(matchId))) {
      return match;
    }
  }
  
  return null;
}

/**
 * Extracts match winner (1*2) betting information
 * @param {Object} data - Full JSON data object
 * @returns {Array} - Array of match winner betting info
 */
function extractMatchWinner(data) {
  const results = [];
  const { matches, bets, outcomes, odds } = data;

  for (const [betId, bet] of Object.entries(bets)) {
    if (identifyBetType(bet) === 'match_winner') {
      const match = findMatch(matches, bet.matchId);
      
      const matchInfo = {
        matchId: bet.matchId,
        matchTitle: match?.title || null,
        competitor1: match?.competitor1Name || null,
        competitor2: match?.competitor2Name || null,
        betId: bet.betId,
        betTitle: bet.betTitle,
        marketId: bet.marketId,
        outcomes: []
      };

      // Extract outcomes for this bet
      for (const outcomeId of bet.outcomes || []) {
        const outcome = outcomes[outcomeId];
        const odd = odds[outcomeId];

        if (outcome && odd !== undefined) {
          matchInfo.outcomes.push({
            outcomeId: outcomeId,
            label: outcome.label,
            competitorId: outcome.competitorId,
            odds: {
              european: convertToEuropeanOdds(odd),
              decimal: convertToDecimalOdds(odd)
            },
            available: outcome.available
          });
        }
      }

      if (matchInfo.outcomes.length > 0) {
        results.push(matchInfo);
      }
    }
  }

  return results;
}

/**
 * Extracts Total Games Over/Under betting information
 * @param {Object} data - Full JSON data object
 * @returns {Array} - Array of total games O/U betting info
 */
function extractTotalGamesOU(data) {
  const results = [];
  const { matches, bets, outcomes, odds } = data;

  for (const [betId, bet] of Object.entries(bets)) {
    if (identifyBetType(bet) === 'total_games_ou') {
      const match = findMatch(matches, bet.matchId);
      
      const matchInfo = {
        matchId: bet.matchId,
        matchTitle: match?.title || null,
        competitor1: match?.competitor1Name || null,
        competitor2: match?.competitor2Name || null,
        betId: bet.betId,
        betTitle: bet.betTitle,
        marketId: bet.marketId,
        specialBetValue: bet.specialBetValue,
        outcomes: []
      };

      // Extract outcomes for this bet
      for (const outcomeId of bet.outcomes || []) {
        const outcome = outcomes[outcomeId];
        const odd = odds[outcomeId];

        if (outcome && odd !== undefined) {
          matchInfo.outcomes.push({
            outcomeId: outcomeId,
            label: outcome.label,
            odds: {
              european: convertToEuropeanOdds(odd),
              decimal: convertToDecimalOdds(odd)
            },
            available: outcome.available
          });
        }
      }

      if (matchInfo.outcomes.length > 0) {
        results.push(matchInfo);
      }
    }
  }

  return results;
}

/**
 * Extracts Game Handicap betting information
 * @param {Object} data - Full JSON data object
 * @returns {Array} - Array of game handicap betting info
 */
function extractGameHandicap(data) {
  const results = [];
  const { matches, bets, outcomes, odds } = data;

  for (const [betId, bet] of Object.entries(bets)) {
    if (identifyBetType(bet) === 'game_handicap') {
      const match = findMatch(matches, bet.matchId);
      
      const matchInfo = {
        matchId: bet.matchId,
        matchTitle: match?.title || null,
        competitor1: match?.competitor1Name || null,
        competitor2: match?.competitor2Name || null,
        betId: bet.betId,
        betTitle: bet.betTitle,
        marketId: bet.marketId,
        specialBetValue: bet.specialBetValue,
        outcomes: []
      };

      // Extract outcomes for this bet
      for (const outcomeId of bet.outcomes || []) {
        const outcome = outcomes[outcomeId];
        const odd = odds[outcomeId];

        if (outcome && odd !== undefined) {
          matchInfo.outcomes.push({
            outcomeId: outcomeId,
            label: outcome.label,
            competitorId: outcome.competitorId,
            odds: {
              european: convertToEuropeanOdds(odd),
              decimal: convertToDecimalOdds(odd)
            },
            available: outcome.available
          });
        }
      }

      if (matchInfo.outcomes.length > 0) {
        results.push(matchInfo);
      }
    }
  }

  return results;
}

/**
 * Extracts First Set Winner betting information
 * @param {Object} data - Full JSON data object
 * @returns {Array} - Array of first set winner betting info
 */
function extractFirstSetWinner(data) {
  const results = [];
  const { matches, bets, outcomes, odds } = data;

  for (const [betId, bet] of Object.entries(bets)) {
    if (identifyBetType(bet) === 'first_set_winner') {
      const match = findMatch(matches, bet.matchId);
      
      const matchInfo = {
        matchId: bet.matchId,
        matchTitle: match?.title || null,
        competitor1: match?.competitor1Name || null,
        competitor2: match?.competitor2Name || null,
        betId: bet.betId,
        betTitle: bet.betTitle,
        marketId: bet.marketId,
        outcomes: []
      };

      // Extract outcomes for this bet
      for (const outcomeId of bet.outcomes || []) {
        const outcome = outcomes[outcomeId];
        const odd = odds[outcomeId];

        if (outcome && odd !== undefined) {
          matchInfo.outcomes.push({
            outcomeId: outcomeId,
            label: outcome.label,
            competitorId: outcome.competitorId,
            odds: {
              european: convertToEuropeanOdds(odd),
              decimal: convertToDecimalOdds(odd)
            },
            available: outcome.available
          });
        }
      }

      if (matchInfo.outcomes.length > 0) {
        results.push(matchInfo);
      }
    }
  }

  return results;
}

/**
 * Extracts Total Games betting information (alternative format)
 * @param {Object} data - Full JSON data object
 * @returns {Array} - Array of total games betting info
 */
function extractTotalGames(data) {
  const results = [];
  const { matches, bets, outcomes, odds } = data;

  for (const [betId, bet] of Object.entries(bets)) {
    if (identifyBetType(bet) === 'total_games') {
      const match = findMatch(matches, bet.matchId);
      
      const matchInfo = {
        matchId: bet.matchId,
        matchTitle: match?.title || null,
        competitor1: match?.competitor1Name || null,
        competitor2: match?.competitor2Name || null,
        betId: bet.betId,
        betTitle: bet.betTitle,
        marketId: bet.marketId,
        specialBetValue: bet.specialBetValue,
        outcomes: []
      };

      // Extract outcomes for this bet
      for (const outcomeId of bet.outcomes || []) {
        const outcome = outcomes[outcomeId];
        const odd = odds[outcomeId];

        if (outcome && odd !== undefined) {
          matchInfo.outcomes.push({
            outcomeId: outcomeId,
            label: outcome.label,
            odds: {
              european: convertToEuropeanOdds(odd),
              decimal: convertToDecimalOdds(odd)
            },
            available: outcome.available
          });
        }
      }

      if (matchInfo.outcomes.length > 0) {
        results.push(matchInfo);
      }
    }
  }

  return results;
}

/**
 * Main parser function - extracts all 5 betting types
 * @param {Object} data - Full JSON data object from Winamax
 * @returns {Object} - Object containing all 5 betting types
 */
function parseWinamaxData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data: Expected an object');
  }

  // Ensure required properties exist
  if (!data.matches) data.matches = {};
  if (!data.bets) data.bets = {};
  if (!data.outcomes) data.outcomes = {};
  if (!data.odds) data.odds = {};

  return {
    matchWinner: extractMatchWinner(data),
    totalGamesOU: extractTotalGamesOU(data),
    gameHandicap: extractGameHandicap(data),
    firstSetWinner: extractFirstSetWinner(data),
    totalGames: extractTotalGames(data)
  };
}

/**
 * Get betting info for a specific match
 * @param {Object} data - Full JSON data object
 * @param {number|string} matchId - Match ID to filter by
 * @returns {Object} - Betting info for the specific match
 */
function getMatchBettingInfo(data, matchId) {
  const allBetting = parseWinamaxData(data);
  const matchIdStr = String(matchId);

  const filterByMatchId = (arr) => 
    arr.filter(item => String(item.matchId) === matchIdStr);

  return {
    matchId: matchId,
    matchWinner: filterByMatchId(allBetting.matchWinner),
    totalGamesOU: filterByMatchId(allBetting.totalGamesOU),
    gameHandicap: filterByMatchId(allBetting.gameHandicap),
    firstSetWinner: filterByMatchId(allBetting.firstSetWinner),
    totalGames: filterByMatchId(allBetting.totalGames)
  };
}

function resortAllData(data) {
    const { matches, bets, outcomes, odds, sports } = data;
    const matchIdArr= sports['5']?.matches || [];
    const result = [];

    for(const matchId of matchIdArr) {
        const matchInfo = {};
        if(matches[matchId]?.available == true) {
            if(matches[matchId]?.sportId != '5')
                continue;
            if(matches[matchId] == null) continue;
            try{
            matchInfo.matchId = matchId;
            matchInfo.player1Info = {};
            matchInfo.player2Info = {};

            matchInfo.player1Info.name = matches[matchId].competitor1Name;
            matchInfo.player1Info.id = matches[matchId].competitor1Id;
            matchInfo.player2Info.name = matches[matchId].competitor2Name;
            matchInfo.player2Info.id = matches[matchId].competitor2Id;
            matchInfo.matchStart = matches[matchId].matchStart;
            matchInfo.status = matches[matchId].status;

            const betId = matches[matchId].mainBetId;
            matchInfo.outcomeIds = bets[betId]?.outcomes;
            // matchInfo.player1Info.hotUsers = outcomes[matchInfo.outcomeIds[0]]?.hotUsers;
            // matchInfo.player2Info.hotUsers = outcomes[matchInfo.outcomeIds[1]]?.hotUsers;

            matchInfo.player1Info.odds = (matchInfo.outcomeIds[0] in odds ) ? odds[matchInfo.outcomeIds[0]] : -1;
            matchInfo.player2Info.odds = (matchInfo.outcomeIds[1] in odds ) ? odds[matchInfo.outcomeIds[1]] : -1;
            }
            catch(e) {
                console.error(`Error in match ${matchId}:`, e);
                continue;
            }
        }
        result.push(matchInfo);
    }
    return result;
}

module.exports = {
  parseWinamaxData,
  getMatchBettingInfo,
  extractMatchWinner,
  extractTotalGamesOU,
  extractGameHandicap,
  extractFirstSetWinner,
  extractTotalGames,
  identifyBetType,
  findMatch,
  convertToEuropeanOdds,
  convertToDecimalOdds,
  resortAllData
};
