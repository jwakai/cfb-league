const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service key for write access
)

const CFBD_API_KEY = process.env.REACT_APP_CFBD_API_KEY
const CFBD_BASE = 'https://api.collegefootballdata.com'

// ── Scoring rules ────────────────────────────────────────────
const POINTS = {
  regularWin: 10,
  top25Win: 18,          // win vs team ranked at time of game
  rivalWin: 30,
  confChampAppearance: 30,
  confChampWin: 60,
  nonCfpBowlWin: 40,
  cfpAppearance: 25,
  cfpFirstRoundBye: 20,
  cfpRound1Win: 35,
  cfpQuarterFinalWin: 50,
  cfpSemiFinalWin: 70,
  nationalChampionship: 100,
}

// CFP round name mapping from CFBD API
const CFP_ROUNDS = {
  'cfp-first-round': 'firstround',
  'cfp-quarterfinal': 'quarterfinal',
  'cfp-semifinal': 'semifinal',
  'cfp-national-championship': 'championship',
}

// ── Fetch helpers ────────────────────────────────────────────
async function cfbdFetch(path) {
  const res = await fetch(`${CFBD_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${CFBD_API_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`CFBD API error ${res.status}: ${path}`)
  return res.json()
}

// ── Get current season ───────────────────────────────────────
function getCurrentSeason() {
  const now = new Date()
  // CFB season: Aug-Dec = current year, Jan = previous year's season
  return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
}

// ── Main handler ─────────────────────────────────────────────
module.exports = async function handler(req, res) {
  try {
    const season = getCurrentSeason()
    console.log(`[update-scores] Running for season ${season}`)

    // 1. Load all drafted teams from Supabase
    const { data: teams, error: teamsError } = await supabase
      .from('Teams')
      .select('id, school, rival_1, rival_2, conference')
    if (teamsError) throw teamsError

    const { data: rosters, error: rostersError } = await supabase
      .from('Managers_Teams')
      .select('manager_id, team_id')
      .eq('season', season)
    if (rostersError) throw rostersError

    // Only process teams that are actually drafted this season
    const draftedTeamIds = new Set(rosters.map(r => r.team_id))
    const draftedTeams = teams.filter(t => draftedTeamIds.has(t.id))

    if (draftedTeams.length === 0) {
      console.log('[update-scores] No drafted teams found for season')
      return res.status(200).json({ message: 'No drafted teams' })
    }

    // 2. Load all existing game_ids from team_games to avoid duplicates
    const { data: existingGames } = await supabase
      .from('team_games')
      .select('game_id')
      .eq('season', season)
    const existingGameIds = new Set((existingGames || []).map(g => g.game_id))

    // 3. Fetch AP rankings for the current season (all weeks)
    let rankings = {}
    try {
      const rankData = await cfbdFetch(`/rankings?season=${season}&seasonType=regular`)
      rankData.forEach(week => {
        const weekNum = week.week
        if (!rankings[weekNum]) rankings[weekNum] = {}
        week.polls?.forEach(poll => {
          if (poll.poll === 'AP Top 25') {
            poll.ranks?.forEach(r => {
              rankings[weekNum][r.school] = r.rank
            })
          }
        })
      })
      // Also fetch postseason rankings
      const postRankData = await cfbdFetch(`/rankings?season=${season}&seasonType=postseason`)
      postRankData.forEach(week => {
        const weekNum = `post_${week.week}`
        if (!rankings[weekNum]) rankings[weekNum] = {}
        week.polls?.forEach(poll => {
          if (poll.poll === 'AP Top 25') {
            poll.ranks?.forEach(r => {
              rankings[weekNum][r.school] = r.rank
            })
          }
        })
      })
    } catch (e) {
      console.warn('[update-scores] Could not fetch rankings:', e.message)
    }

    // 4. Fetch conference championships
    let confChampGames = []
    try {
      confChampGames = await cfbdFetch(
        `/games?season=${season}&seasonType=postseason&week=1`
      )
      confChampGames = confChampGames.filter(g =>
        g.notes?.toLowerCase().includes('championship')
      )
    } catch (e) {
      console.warn('[update-scores] Could not fetch conf champ games:', e.message)
    }

    // 5. Fetch CFP games (postseason weeks 2-5)
    let cfpGames = []
    try {
      for (const week of [2, 3, 4, 5]) {
        const weekGames = await cfbdFetch(
          `/games?season=${season}&seasonType=postseason&week=${week}`
        )
        cfpGames.push(...weekGames)
      }
    } catch (e) {
      console.warn('[update-scores] Could not fetch CFP games:', e.message)
    }

    // Helper: get opponent rank at time of game
    function getOpponentRank(week, seasonType, opponent) {
      const key = seasonType === 'regular' ? week : `post_${week}`
      return rankings[key]?.[opponent] || null
    }

    // Helper: determine CFP round from game notes
    function getCfpRound(game) {
      const notes = game.notes?.toLowerCase() || ''
      if (notes.includes('national championship')) return 'championship'
      if (notes.includes('semifinal') || notes.includes('peach') || notes.includes('fiesta') || notes.includes('rose') || notes.includes('sugar') || notes.includes('orange')) return 'semifinal'
      if (notes.includes('quarterfinal')) return 'quarterfinal'
      if (notes.includes('first round') || notes.includes('first-round')) return 'firstround'
      return null
    }

    // 6. Process each drafted team
    const newGameRows = []
    const scoringEvents = []

    for (const team of draftedTeams) {
      const roster = rosters.find(r => r.team_id === team.id)
      if (!roster) continue

      // Fetch all regular season games for this team
      let games = []
      try {
        games = await cfbdFetch(
          `/games?season=${season}&team=${encodeURIComponent(team.school)}&seasonType=regular`
        )
      } catch (e) {
        console.warn(`[update-scores] Could not fetch games for ${team.school}:`, e.message)
        continue
      }

      // Add conf championship games involving this team
      const teamConfChamp = confChampGames.filter(
        g => g.home_team === team.school || g.away_team === team.school
      )
      games.push(...teamConfChamp.map(g => ({ ...g, _seasonType: 'postseason', _isConfChamp: true })))

      // Add CFP games involving this team
      const teamCfpGames = cfpGames.filter(
        g => g.home_team === team.school || g.away_team === team.school
      )
      games.push(...teamCfpGames.map(g => ({ ...g, _seasonType: 'postseason', _isCfp: true })))

      for (const game of games) {
        // Skip games not yet completed
        if (!game.completed && game.home_points === null) continue

        // Skip already recorded games
        const gameId = `${season}_${game.id}`
        if (existingGameIds.has(gameId)) continue

        const isHome = game.home_team === team.school
        const opponent = isHome ? game.away_team : game.home_team
        const teamScore = isHome ? game.home_points : game.away_points
        const oppScore = isHome ? game.away_points : game.home_points

        if (teamScore === null || oppScore === null) continue

        const won = teamScore > oppScore
        const result = won ? 'W' : 'L'
        const seasonType = game._seasonType || 'regular'
        const week = game.week || 1
        const isConfChamp = game._isConfChamp || false
        const isCfp = game._isCfp || false
        const isRival = opponent === team.rival_1 || opponent === team.rival_2
        const opponentRank = getOpponentRank(week, seasonType, opponent)
        const cfpRound = isCfp ? getCfpRound(game) : null

        // ── Calculate points ────────────────────────────────
        let points = 0
        let eventType = null

        if (isConfChamp) {
          points += POINTS.confChampAppearance
          eventType = 'conf_champ_appearance'
          if (won) {
            points += POINTS.confChampWin
            eventType = 'conf_champ_win'
          }
        } else if (isCfp) {
          // CFP appearance is a one-time event — check if already recorded
          // (handled separately below)
          if (won) {
            if (cfpRound === 'firstround') { points = POINTS.cfpRound1Win; eventType = 'cfp_round1_win' }
            else if (cfpRound === 'quarterfinal') { points = POINTS.cfpQuarterFinalWin; eventType = 'cfp_quarterfinal_win' }
            else if (cfpRound === 'semifinal') { points = POINTS.cfpSemiFinalWin; eventType = 'cfp_semifinal_win' }
            else if (cfpRound === 'championship') { points = POINTS.nationalChampionship; eventType = 'national_championship' }
          }
        } else if (won) {
          // Regular season win
          if (opponentRank && opponentRank <= 25) {
            points = POINTS.top25Win
            eventType = 'top25_win'
          } else {
            points = POINTS.regularWin
            eventType = 'regular_win'
          }
          // Rival bonus (stacks on top of win points)
          if (isRival) {
            points += POINTS.rivalWin
            eventType = isRival && opponentRank ? 'top25_rival_win' : 'rival_win'
          }
        }

        newGameRows.push({
          season,
          week,
          school: team.school,
          opponent,
          home: isHome,
          result,
          school_score: teamScore,
          opponent_score: oppScore,
          opponent_rank: opponentRank,
          is_rival: isRival,
          is_conference_championship: isConfChamp,
          is_bowl: false,
          is_cfp: isCfp,
          cfp_round: cfpRound,
          cfp_bye: false,
          points_earned: points,
          game_id: gameId,
        })

        if (points > 0 && eventType) {
          scoringEvents.push({
            season,
            manager_id: roster.manager_id,
            team_id: team.id,
            event_type: eventType,
            points,
            week,
            game_id: gameId,
          })
        }
      }

      // Check CFP appearance (one-time, if team has any CFP game)
      const hasCfpGame = teamCfpGames.length > 0
      if (hasCfpGame) {
        const cfpAppearanceId = `${season}_cfp_appearance_${team.id}`
        if (!existingGameIds.has(cfpAppearanceId)) {
          scoringEvents.push({
            season,
            manager_id: roster.manager_id,
            team_id: team.id,
            event_type: 'cfp_appearance',
            points: POINTS.cfpAppearance,
            week: 99,
            game_id: cfpAppearanceId,
          })
          existingGameIds.add(cfpAppearanceId)
        }
      }
    }

    // 7. Write new game rows to team_games
    if (newGameRows.length > 0) {
      const { error: gamesError } = await supabase
        .from('team_games')
        .insert(newGameRows)
      if (gamesError) throw gamesError
      console.log(`[update-scores] Inserted ${newGameRows.length} new game rows`)
    }

    // 8. Write new scoring events to Scoring_Events
    if (scoringEvents.length > 0) {
      // Check which game_ids already exist in Scoring_Events
      const { data: existingEvents } = await supabase
        .from('Scoring_Events')
        .select('game_id')
        .eq('season', season)
      const existingEventIds = new Set((existingEvents || []).map(e => e.game_id))

      const newEvents = scoringEvents.filter(e => !existingEventIds.has(e.game_id))
      if (newEvents.length > 0) {
        const { error: eventsError } = await supabase
          .from('Scoring_Events')
          .insert(newEvents)
        if (eventsError) throw eventsError
        console.log(`[update-scores] Inserted ${newEvents.length} new scoring events`)
      }
    }

    return res.status(200).json({
      success: true,
      season,
      newGames: newGameRows.length,
      newScoringEvents: scoringEvents.length,
    })

  } catch (err) {
    console.error('[update-scores] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
