const db = require('../database/db.js');

class Betting {
  constructor({
    match_id,
    bookmaker,
    home_team,
    away_team,
    bet,
    status,
    start_time,
    odds = [],
    set1_odds = [],
    handicap = {},
    total_rounds = {},
    set1_game_count = {}
  }) {
    this.match_id = match_id;
    this.bookmaker = bookmaker;
    this.home_team = home_team;
    this.away_team = away_team;
    this.bet = bet;
    this.status = status;

    // Convert Date → ISO string automatically
    this.start_time =
      start_time instanceof Date
        ? start_time.toISOString()
        : start_time;

    this.odds = odds;
    this.set1_odds = set1_odds;
    this.handicap = handicap;
    this.total_rounds = total_rounds;
    this.set1_game_count = set1_game_count;
  }

  // =============================
  // CREATE
  // =============================
  save() {
    const stmt = db.prepare(`
      INSERT INTO matches (
        match_id,
        bookmaker,
        home_team,
        away_team,
        status,
        start_time,
        bet,
        odds,
        set1_odds,
        handicap,
        total_rounds,
        set1_game_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      this.match_id ?? null,
      this.bookmaker ?? null,
      this.home_team ?? null,
      this.away_team ?? null,
      this.status ?? null,
      this.start_time ?? null,
      this.bet ?? null,
      JSON.stringify(this.odds ?? []),
      JSON.stringify(this.set1_odds ?? []),
      JSON.stringify(this.handicap ?? {}),
      JSON.stringify(this.total_rounds ?? {}),
      JSON.stringify(this.set1_game_count ?? {})
    );
  }

  // =============================
  // UPSERT (Best for Live Odds)
  // =============================
  upsert() {
    const stmt = db.prepare(`
      INSERT INTO matches (
        match_id,
        bookmaker,
        home_team,
        away_team,
        bet,
        status,
        start_time,
        odds,
        set1_odds,
        handicap,
        total_rounds,
        set1_game_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(match_id)
      DO UPDATE SET
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        bet = excluded.bet,
        status = excluded.status,
        start_time = excluded.start_time,
        odds = excluded.odds,
        set1_odds = excluded.set1_odds,
        handicap = excluded.handicap,
        total_rounds = excluded.total_rounds,
        set1_game_count = excluded.set1_game_count,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      this.match_id,
      this.bookmaker,
      this.home_team,
      this.away_team,
      JSON.stringify(this.bet ?? {}),
      this.status,
      this.start_time,
      JSON.stringify(this.odds ?? []),
      JSON.stringify(this.set1_odds ?? []),
      JSON.stringify(this.handicap ?? {}),
      JSON.stringify(this.total_rounds ?? {}),  
      JSON.stringify(this.set1_game_count ?? {}),
    );
  }

  // =============================
  // READ ONE
  // =============================
  static findByMatchId(matchId) {
    const row = db
      .prepare(`SELECT * FROM matches WHERE match_id = ?`)
      .get(matchId);

    if (!row) return null;

    return Betting.parseRow(row);
  }

  // =============================
  // READ ALL
  // =============================
  static findAll() {
    const rows = db.prepare(`SELECT * FROM matches`).all();
    return rows.map(row => Betting.parseRow(row));
  }

  // =============================
  // UPDATE STATUS ONLY
  // =============================
  static updateStatus(matchId, status) {
    return db.prepare(`
      UPDATE matches
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE match_id = ?
    `).run(status, matchId);
  }

  // =============================
  // DELETE
  // =============================
  static delete(matchId) {
    return db.prepare(`
      DELETE FROM matches WHERE match_id = ?
    `).run(matchId);
  }

  // =============================
  // INTERNAL JSON PARSER
  // =============================
  static parseRow(row) {
    return {
      ...row,
      odds: JSON.parse(row.odds || '[]'),
      set1_odds: JSON.parse(row.set1_odds || '[]'),
      handicap: JSON.parse(row.handicap || '{}'),
      total_rounds: JSON.parse(row.total_rounds || '{}'),
      set1_game_count: JSON.parse(row.set1_game_count || '{}')
    };
  }

  static save(matchInfo) {
    const stmt = db.prepare(`
      INSERT INTO matches (
        match_id,
        bookmaker,
        home_team,
        away_team,
        bet,
        status,
        start_time,
        odds,
        set1_odds,
        handicap,
        total_rounds,
        set1_game_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(match_id)
      DO UPDATE SET
        bookmaker = excluded.bookmaker,
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        bet = excluded.bet,
        status = excluded.status,
        start_time = excluded.start_time,
        odds = excluded.odds,
        set1_odds = excluded.set1_odds,
        handicap = excluded.handicap,
        total_rounds = excluded.total_rounds,
        set1_game_count = excluded.set1_game_count,
        updated_at = CURRENT_TIMESTAMP
    `);
  
    return stmt.run(
      matchInfo.id,
      matchInfo.bookmaker,
      matchInfo.competitor1Name,
      matchInfo.competitor2Name,
      JSON.stringify(matchInfo.bet ?? {}),
      matchInfo.status,
      matchInfo.startTime instanceof Date
        ? matchInfo.startTime.toISOString()
        : matchInfo.startTime,
      JSON.stringify(matchInfo.matchWinner ?? []),
      JSON.stringify(matchInfo.set1Winner ?? []),
      JSON.stringify(matchInfo.handicapInfo ?? {}),
      JSON.stringify(matchInfo.totalBigRounds ?? {}),
      JSON.stringify(matchInfo.set1GameCount ?? {})
    );
  }
}

module.exports = Betting;