const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const CFBD_API_KEY = process.env.REACT_APP_CFBD_API_KEY
const CFBD_BASE = 'https://api.collegefootballdata.com'
const SEASON = 2025

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

module.exports = async function handler(req, res) {
  // Safety check — only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[backfill-2025] Starting 2025 season backfill...')

    // 1. Load all drafted teams for 2025
    const { data: teams, error: teamsError } = await supabase
      .from('Teams').select('id, school, rival_1, rival_2, conference')
    if (teamsError) throw teamsError

    const { data: rosters, error: rostersError } = await supabase
      .from('Managers_Teams').select('manager_id, team_id').eq('season', SEASON)
    if (rostersError) throw rostersError

    const draftedTeamIds = new Set(rosters.map(r => r.team_id))
    const draftedTeams = teams.filter(t => draftedTeamIds.has(t.id))

    console.log(`[backfill-2025] Found ${draftedTeams.length} drafted teams`)

    // 2. Load existing game_ids to avoid duplicates
    const { data: existingGames } = await supabase
      .from('team_games').select('game_id').eq('season', SEASON)
    const existingGameIds = new Set((existingGames || []).map(g => g.game_id))
    console.log(`[backfill-2025] ${existingGameIds.size} games already recorded`)

    // 3. Fetch AP rankings for 2025 — all weeks
    console.log('[backfill-2025] Fetching 2025 AP rankings...')
    const rankings = {}
    try {
      const [regRankData, postRankData] = await Promise.all([
        cfbdFetch(`/rankings?season=${SEASON}&seasonType=regular`),
        cfbdFetch(`/rankings?season=${SEASON}&seasonType=postseason`),
      ])
      regRankData.forEach(week => {
        if (!rankings[week.week]) rankings[week.week] = {}
        week.polls?.forEach(poll => {
          if (poll.poll === 'AP Top 25') {
            poll.ranks?.forEach(r => { rankings[week.week][r.school] = r.rank })
          }
        })
      })
      postRankData.forEach(week => {
        const key = `post_${week.week}`
        if (!rankings[key]) rankings[key] = {}
        week.polls?.forEach(poll => {
          if (poll.poll === 'AP Top 25') {
            poll.ranks?.forEach(r => { rankings[key][r.school] = r.rank })
          }
        })
      })
      console.log(`[backfill-2025] Loaded rankings for ${Object.keys(rankings).length} weeks`)
    } catch (e) {
      console.warn('[backfill-2025] Could not fetch rankings:', e.message)
    }

    // 4. Fetch all postseason games for 2025
    console.log('[backfill-2025] Fetching 2025 postseason games...')
    let confChampGames = []
    let cfpGames = []
    let bowlGames = []
    try {
      // Week 1 postseason = conf championships
      const week1 = await cfbdFetch(`/games?season=${SEASON}&seasonType=postseason&week=1`)
      confChampGames = week1.filter(g =>
        g.notes?.toLowerCase().includes('championship')
      )
      // Weeks 2-5 = CFP and bowls
      for (const week of [2, 3, 4, 5]) {
        const weekGames = await cfbdFetch(
          `/games?season=${SEASON}&seasonType=postseason&week=${week}`
        )
        // Separate CFP from bowl games
        weekGames.forEach(g => {
          const notes = g.notes?.toLowerCase() || ''
          if (
            notes.includes('cfp') ||
            notes.includes('college football playoff') ||
            notes.includes('quarterfinal') ||
            notes.includes('semifinal') ||
            notes.includes('national championship') ||
            notes.includes('first round')
          ) {
            cfpGames.push({ ...g, _week: week })
          } else if (notes.includes('bowl') || g.season_type === 'postseason') {
            bowlGames.push({ ...g, _week: week })
          }
        })
      }
      console.log(`[backfill-2025] Found ${confChampGames.length} conf champ, ${cfpGames.length} CFP, ${bowlGames.length} bowl games`)
    } catch (e) {
      console.warn('[backfill-2025] Could not fetch postseason games:', e.message)
    }

    function getOpponentRank(week, seasonType, opponent) {
      const key = seasonType === 'regular' ? week : `post_${week}`
      return rankings[key]?.[opponent] || null
    }

    function getCfpRound(game) {
      const notes = game.notes?.toLowerCase() || ''
      if (notes.includes('national championship')) return 'championship'
      if (notes.includes('semifinal')) return 'semifinal'
      if (notes.includes('quarterfinal')) return 'quarterfinal'
      if (notes.includes('first round') || notes.includes('first-round')) return 'firstround'
      return null
    }

    // 5. Process each team
    const newGameRows = []
    let processedTeams = 0

    for (const team of draftedTeams) {
      // Fetch regular season games
      let regularGames = []
      try {
        regularGames = await cfbdFetch(
          `/games?season=${SEASON}&team=${encodeURIComponent(team.school)}&seasonType=regular`
        )
      } catch (e) {
        console.warn(`[backfill-2025] Could not fetch regular games for ${team.school}:`, e.message)
      }

      // Find this team's postseason games
      const teamConfChamp = confChampGames.filter(
        g => g.home_team === team.school || g.away_team === team.school
      )
      const teamCfpGames = cfpGames.filter(
        g => g.home_team === team.school || g.away_team === team.school
      )
      const teamBowlGames = bowlGames.filter(
        g => g.home_team === team.school || g.away_team === team.school
      )

      // Combine all games
      const allTeamGames = [
        ...regularGames.map(g => ({ ...g, _type: 'regular', _seasonType: 'regular' })),
        ...teamConfChamp.map(g => ({ ...g, _type: 'confchamp', _seasonType: 'postseason', week: 1 })),
        ...teamBowlGames.map(g => ({ ...g, _type: 'bowl', _seasonType: 'postseason', week: g._week || 2 })),
        ...teamCfpGames.map(g => ({ ...g, _type: 'cfp', _seasonType: 'postseason', week: g._week || 2 })),
      ]

      for (const game of allTeamGames) {
        // Skip unplayed games
        if (game.home_points === null || game.away_points === null) continue

        const gameId = `${SEASON}_${game.id}`
        if (existingGameIds.has(gameId)) continue

        const isHome = game.home_team === team.school
        const opponent = isHome ? game.away_team : game.home_team
        const teamScore = isHome ? game.home_points : game.away_points
        const oppScore = isHome ? game.away_points : game.home_points
        const won = teamScore > oppScore
        const result = won ? 'W' : 'L'
        const week = game.week || 1
        const isRival = opponent === team.rival_1 || opponent === team.rival_2
        const isConfChamp = game._type === 'confchamp'
        const isCfp = game._type === 'cfp'
        const isBowl = game._type === 'bowl'
        const opponentRank = getOpponentRank(week, game._seasonType, opponent)
        const cfpRound = isCfp ? getCfpRound(game) : null

        newGameRows.push({
          season: SEASON,
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
          is_bowl: isBowl,
          is_cfp: isCfp,
          cfp_round: cfpRound,
          cfp_bye: false,
          points_earned: 0, // display only — 2025 points stay in Scoring_Events
          game_id: gameId,
        })

        existingGameIds.add(gameId)
      }

      processedTeams++
      console.log(`[backfill-2025] Processed ${team.school} (${processedTeams}/${draftedTeams.length})`)
    }

    // 6. Insert in batches of 50
    let inserted = 0
    const batchSize = 50
    for (let i = 0; i < newGameRows.length; i += batchSize) {
      const batch = newGameRows.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('team_games').insert(batch)
      if (insertError) throw insertError
      inserted += batch.length
      console.log(`[backfill-2025] Inserted ${inserted}/${newGameRows.length} rows`)
    }

    console.log(`[backfill-2025] Complete! ${inserted} game rows inserted.`)

    return res.status(200).json({
      success: true,
      season: SEASON,
      teamsProcessed: processedTeams,
      gamesInserted: inserted,
      message: 'Scoring_Events unchanged — display data only',
    })

  } catch (err) {
    console.error('[backfill-2025] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
