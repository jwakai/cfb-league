const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const CFBD_API_KEY = process.env.REACT_APP_CFBD_API_KEY
const CFBD_BASE = 'https://api.collegefootballdata.com'

// ── 2026 Finalized Scoring System ───────────────────────────
const POINTS = {
  regularWin: 10,
  rivalWin: 25,           // rivalry win (unranked opponent)
  top25Win: 25,           // top 25 win (non-rival)
  rivalTop25Win: 40,      // rivalry win vs ranked opponent
  confChampAppearance: 40,
  confChampWin: 70,       // flat — does not stack with appearance
  nonCfpBowlWin: 40,
  cfpAppearance: 40,
  cfpFirstRoundBye: 25,
  cfpRound1Win: 50,
  cfpQuarterFinalWin: 75,
  cfpSemiFinalWin: 75,
  nationalChampionship: 100,
}

// ── Rankings poll to use ─────────────────────────────────────
// Use AP Top 25 until CFP rankings are released mid-season (~Week 9)
// To switch to CFP rankings, change this to 'College Football Playoff'
const RANKINGS_POLL = 'AP Top 25'

// ── CFP round mapping ────────────────────────────────────────
const CFP_ROUND_LABELS = {
  'cfp-first-round': 'firstround',
  'cfp-quarterfinal': 'quarterfinal',
  'cfp-semifinal': 'semifinal',
  'cfp-national-championship': 'championship',
}

// ── CFBD API name translations ───────────────────────────────
// Maps our DB school names to what CFBD expects in API calls
const CFBD_NAME_MAP = {
  'NC St': 'NC State',
  'Florida St': 'Florida State',
  'Mississippi St': 'Mississippi State',
  'Michigan St': 'Michigan State',
  'Jacksonville St': 'Jacksonville State',
  'Jacksonville St': 'Jacksonville State',
  'Ohio St': 'Ohio State',
  'Oklahoma St': 'Oklahoma State',
  'Iowa St': 'Iowa State',
  'Kansas St': 'Kansas State',
  'Arizona St': 'Arizona State',
  'Colorado St': 'Colorado State',
  'Washington St': 'Washington State',
  'Oregon St': 'Oregon State',
  'App St': 'Appalachian State',
  'San Jose St': 'San José State',
  'Boise St': 'Boise State',
  'Fresno St': 'Fresno State',
  'Utah St': 'Utah State',
  'Texas St': 'Texas State',
  'Ball St': 'Ball State',
  'Kent St': 'Kent State',
  'Sam Houston': 'Sam Houston State',
  'Miami OH': 'Miami (OH)',
  'UNC': 'North Carolina',
  'Pitt': 'Pittsburgh',
  'Cal': 'California',
  'Hawaii': "Hawai'i",
  'Southern Miss': 'Southern Mississippi',
  'Ole Miss': 'Mississippi',
  'Louisiana': 'Louisiana Lafayette',
  'UTSA': 'UT San Antonio',
  'UTEP': 'Texas-El Paso',
  'UAB': 'Alabama-Birmingham',
  'USF': 'South Florida',
  'UCF': 'Central Florida',
  'SMU': 'Southern Methodist',
  'BYU': 'Brigham Young',
  'TCU': 'TCU',
  'LSU': 'LSU',
}

function toCFBDName(school) {
  return CFBD_NAME_MAP[school] || school
}


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

// ── Current season ───────────────────────────────────────────
function getCurrentSeason() {
  const now = new Date()
  return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
}

// ── Main handler ─────────────────────────────────────────────
module.exports = async function handler(req, res) {
  try {
    const season = getCurrentSeason()
    console.log(`[update-scores] Running for season ${season}`)

    // 1. Load all drafted teams for this season
    const { data: teams, error: teamsError } = await supabase
      .from('Teams').select('id, school, rival_1, rival_2, conference')
    if (teamsError) throw teamsError

    const { data: rosters, error: rostersError } = await supabase
      .from('Managers_Teams').select('manager_id, team_id').eq('season', season)
    if (rostersError) throw rostersError

    const draftedTeamIds = new Set(rosters.map(r => r.team_id))
    const draftedTeams = teams.filter(t => draftedTeamIds.has(t.id))

    if (draftedTeams.length === 0) {
      console.log('[update-scores] No drafted teams found for season')
      return res.status(200).json({ message: 'No drafted teams' })
    }

    // 2. Load existing game_ids to avoid duplicates
    const { data: existingGames } = await supabase
      .from('team_games').select('game_id').eq('season', season)
    const existingGameIds = new Set((existingGames || []).map(g => g.game_id))

    // 3. Fetch AP rankings (switches to CFP rankings when RANKINGS_POLL is updated)
    let rankings = {}
    try {
      const [regRankData, postRankData] = await Promise.all([
        cfbdFetch(`/rankings?year=${season}&seasonType=regular`),
        cfbdFetch(`/rankings?year=${season}&seasonType=postseason`),
      ])
      regRankData.forEach(week => {
        if (!rankings[week.week]) rankings[week.week] = {}
        week.polls?.forEach(poll => {
          if (poll.poll === RANKINGS_POLL) {
            poll.ranks?.forEach(r => { rankings[week.week][r.school] = r.rank })
          }
        })
      })
      postRankData.forEach(week => {
        const key = `post_${week.week}`
        if (!rankings[key]) rankings[key] = {}
        week.polls?.forEach(poll => {
          if (poll.poll === RANKINGS_POLL) {
            poll.ranks?.forEach(r => { rankings[key][r.school] = r.rank })
          }
        })
      })
      console.log(`[update-scores] Rankings loaded for ${Object.keys(rankings).length} weeks using ${RANKINGS_POLL}`)
    } catch (e) {
      console.warn('[update-scores] Could not fetch rankings:', e.message)
    }

    // 4. Fetch conference championships (regular season week 15)
    let confChampGames = []
    try {
      const week15 = await cfbdFetch(`/games?year=${season}&week=15&seasonType=regular`)
      confChampGames = week15.filter(g => (g.notes || '').toLowerCase().includes('championship'))
      console.log(`[update-scores] Found ${confChampGames.length} conf championship games`)
    } catch (e) {
      console.warn('[update-scores] Could not fetch conf champ games:', e.message)
    }

    // 5. Fetch all postseason games (bowls + CFP)
    let bowlGames = []
    let cfpGames = []
    try {
      const postGames = await cfbdFetch(`/games?year=${season}&seasonType=postseason`)
      postGames.forEach(g => {
        const n = (g.notes || '').toLowerCase()
        if (n.includes('cfp') || n.includes('quarterfinal') || n.includes('semifinal') ||
            n.includes('national championship') || n.includes('first round')) {
          cfpGames.push(g)
        } else {
          bowlGames.push(g)
        }
      })
      console.log(`[update-scores] CFP games: ${cfpGames.length}, Bowl games: ${bowlGames.length}`)
    } catch (e) {
      console.warn('[update-scores] Could not fetch postseason games:', e.message)
    }

    // Helper: get opponent rank at time of game
    function getOpponentRank(week, seasonType, opponent) {
      const key = seasonType === 'regular' ? week : `post_${week}`
      return rankings[key]?.[opponent] || null
    }

    // Helper: determine CFP round from game notes
    function getCfpRound(notes) {
      const n = (notes || '').toLowerCase()
      if (n.includes('national championship')) return 'championship'
      if (n.includes('semifinal')) return 'semifinal'
      if (n.includes('quarterfinal')) return 'quarterfinal'
      if (n.includes('first round') || n.includes('first-round')) return 'firstround'
      return null
    }

    // Helper: calculate points for a single game — NO STACKING
    function calcPoints(game, school, rival1, rival2) {
      const cfbdSchoolName = toCFBDName(school)
      const isHome = game.home_team === cfbdSchoolName
      const opponent = isHome ? game.away_team : game.home_team
      const teamScore = isHome ? game.home_points : game.away_points
      const oppScore = isHome ? game.away_points : game.home_points
      const won = teamScore > oppScore
      const opponentRank = getOpponentRank(game.week || 1, game._seasonType || 'regular', opponent)
      const isRival = opponent === rival1 || opponent === rival2
      const isRanked = opponentRank !== null && opponentRank <= 25

      if (!won) return { points: 0, eventType: null }

      // Conference championship
      if (game._type === 'confchamp') {
        return { points: POINTS.confChampWin, eventType: 'conf_champ_win' }
      }

      // CFP games
      if (game._type === 'cfp') {
        const round = getCfpRound(game.notes || '')
        if (round === 'championship') return { points: POINTS.nationalChampionship, eventType: 'national_championship' }
        if (round === 'semifinal') return { points: POINTS.cfpSemiFinalWin, eventType: 'cfp_semifinal_win' }
        if (round === 'quarterfinal') return { points: POINTS.cfpQuarterFinalWin, eventType: 'cfp_quarterfinal_win' }
        if (round === 'firstround') return { points: POINTS.cfpRound1Win, eventType: 'cfp_round1_win' }
        return { points: 0, eventType: null }
      }

      // Bowl game
      if (game._type === 'bowl') {
        return { points: POINTS.nonCfpBowlWin, eventType: 'bowl_win' }
      }

      // Regular season — no stacking, pick highest applicable category
      if (isRival && isRanked) return { points: POINTS.rivalTop25Win, eventType: 'rival_top25_win' }
      if (isRival)             return { points: POINTS.rivalWin, eventType: 'rival_win' }
      if (isRanked)            return { points: POINTS.top25Win, eventType: 'top25_win' }
      return { points: POINTS.regularWin, eventType: 'regular_win' }
    }

    // 6. Process each drafted team
    const newGameRows = []
    const scoringEvents = []

    for (const team of draftedTeams) {
      const roster = rosters.find(r => r.team_id === team.id)
      if (!roster) continue

      // Fetch regular season games
      let regularGames = []
      try {
        const cfbdName = toCFBDName(team.school)
        regularGames = await cfbdFetch(
          `/games?year=${season}&team=${encodeURIComponent(cfbdName)}&seasonType=regular`
        )
      } catch (e) {
        console.warn(`[update-scores] Could not fetch games for ${team.school}:`, e.message)
        continue
      }

      // Find this team's postseason games
      const cfbdName = toCFBDName(team.school)
      const teamConfChamp = confChampGames.filter(g =>
        g.home_team === cfbdName || g.away_team === cfbdName
      )
      const teamCfp = cfpGames.filter(g =>
        g.home_team === cfbdName || g.away_team === cfbdName
      )
      const teamBowl = bowlGames.filter(g =>
        g.home_team === cfbdName || g.away_team === cfbdName
      )

      const allGames = [
        ...regularGames.map(g => ({ ...g, _type: 'regular', _seasonType: 'regular' })),
        ...teamConfChamp.map(g => ({ ...g, _type: 'confchamp', _seasonType: 'regular', week: 15 })),
        ...teamBowl.map(g => ({ ...g, _type: 'bowl', _seasonType: 'postseason' })),
        ...teamCfp.map(g => ({ ...g, _type: 'cfp', _seasonType: 'postseason' })),
      ]

      const cfbdSchool = toCFBDName(team.school)

      // Track one-time CFP events
      let cfpAppearanceRecorded = false
      let cfpByeRecorded = false
      let ccgAppearanceRecorded = false

      for (const game of allGames) {
        if (game.home_points === null || game.away_points === null) continue

        const gameId = `${season}_${game.id}_${team.school}`
        if (existingGameIds.has(gameId)) continue

        const isHome = game.home_team === cfbdSchool
        const opponent = isHome ? game.away_team : game.home_team

        // Skip games where opponent name is missing
        if (!opponent) continue
        const teamScore = isHome ? game.home_points : game.away_points
        const oppScore = isHome ? game.away_points : game.home_points
        const won = teamScore > oppScore
        const opponentRank = getOpponentRank(game.week || 1, game._seasonType, opponent)
        const isRival = opponent === team.rival_1 || opponent === team.rival_2
        const cfpRound = game._type === 'cfp' ? getCfpRound(game.notes || '') : null

        const { points, eventType } = calcPoints(game, team.school, team.rival_1, team.rival_2)

        newGameRows.push({
          season,
          week: game.week || 1,
          school: team.school,
          opponent,
          home: isHome,
          result: won ? 'W' : 'L',
          school_score: teamScore,
          opponent_score: oppScore,
          opponent_rank: opponentRank,
          is_rival: isRival,
          is_conference_championship: game._type === 'confchamp',
          is_bowl: game._type === 'bowl',
          is_cfp: game._type === 'cfp',
          cfp_round: cfpRound,
          cfp_bye: false,
          points_earned: points,
          game_id: gameId,
        })

        existingGameIds.add(gameId)

        if (points > 0 && eventType) {
          scoringEvents.push({
            season,
            manager_id: roster.manager_id,
            team_id: team.id,
            event_type: eventType,
            points,
            week: game.week || 1,
            game_id: gameId,
          })
        }

        // CCG appearance (one-time, awarded on first CCG game regardless of result)
        if (game._type === 'confchamp' && !ccgAppearanceRecorded) {
          ccgAppearanceRecorded = true
          const ccgAppId = `${season}_ccg_app_${team.id}`
          if (!existingGameIds.has(ccgAppId)) {
            scoringEvents.push({
              season,
              manager_id: roster.manager_id,
              team_id: team.id,
              event_type: 'conf_champ_appearance',
              points: POINTS.confChampAppearance,
              week: 15,
              game_id: ccgAppId,
            })
            existingGameIds.add(ccgAppId)
          }
        }
      }

      // CFP appearance + bye (one-time, based on being in CFP field)
      if (teamCfp.length > 0) {
        const cfpAppId = `${season}_cfp_app_${team.id}`
        if (!existingGameIds.has(cfpAppId)) {
          scoringEvents.push({
            season,
            manager_id: roster.manager_id,
            team_id: team.id,
            event_type: 'cfp_appearance',
            points: POINTS.cfpAppearance,
            week: 16,
            game_id: cfpAppId,
          })
          existingGameIds.add(cfpAppId)
        }

        // Bye — team has a CFP game but no Round 1 game (top 4 seed)
        const hasRound1Game = teamCfp.some(g =>
          getCfpRound(g.notes || '') === 'firstround'
        )
        if (!hasRound1Game) {
          const cfpByeId = `${season}_cfp_bye_${team.id}`
          if (!existingGameIds.has(cfpByeId)) {
            scoringEvents.push({
              season,
              manager_id: roster.manager_id,
              team_id: team.id,
              event_type: 'cfp_bye',
              points: POINTS.cfpFirstRoundBye,
              week: 16,
              game_id: cfpByeId,
            })
            existingGameIds.add(cfpByeId)
          }
        }
      }
    }

    // 7. Write new game rows
    if (newGameRows.length > 0) {
      const { error: gamesError } = await supabase
        .from('team_games').insert(newGameRows)
      if (gamesError) throw gamesError
      console.log(`[update-scores] Inserted ${newGameRows.length} game rows`)
    }

    // 8. Write new scoring events
    if (scoringEvents.length > 0) {
      const { data: existingEvents } = await supabase
        .from('Scoring_Events').select('game_id').eq('season', season)
      const existingEventIds = new Set((existingEvents || []).map(e => e.game_id))
      const newEvents = scoringEvents.filter(e => !existingEventIds.has(e.game_id))
      if (newEvents.length > 0) {
        const { error: eventsError } = await supabase
          .from('Scoring_Events').insert(newEvents)
        if (eventsError) throw eventsError
        console.log(`[update-scores] Inserted ${newEvents.length} scoring events`)
      }
    }

    return res.status(200).json({
      success: true,
      season,
      newGames: newGameRows.length,
      newScoringEvents: scoringEvents.length,
      rankingsPoll: RANKINGS_POLL,
    })

  } catch (err) {
    console.error('[update-scores] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
