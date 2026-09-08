const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── 2026 Finalized Scoring System ───────────────────────────
const POINTS = {
  regularWin: 10,
  rivalWin: 25,
  top25Win: 25,
  rivalTop25Win: 40,
  confChampAppearance: 40,
  confChampWin: 70,
  nonCfpBowlWin: 40,
  cfpAppearance: 40,
  cfpFirstRoundBye: 25,
  cfpRound1Win: 50,
  cfpQuarterFinalWin: 75,
  cfpSemiFinalWin: 75,
  nationalChampionship: 100,
}

// ── Rankings poll ────────────────────────────────────────────
// 'ap' until ~Week 9, then switch to 'cfp'
const RANKINGS_POLL = 'ap'

// ── ESPN ID → DB school name ─────────────────────────────────
const ESPN_ID_TO_SCHOOL = {
  84: 'Indiana', 68: 'Boise St', 2649: 'Toledo', 228: 'Clemson',
  309: 'Louisiana', 2116: 'UCF', 344: 'Mississippi St', 127: 'Michigan St',
  2390: 'Miami', 238: 'Vanderbilt', 2132: 'Cincinnati', 25: 'Cal',
  326: 'Texas St', 57: 'Florida', 189: 'Bowling Green', 26: 'UCLA',
  194: 'Ohio St', 150: 'Duke', 152: 'NC St', 58: 'USF',
  235: 'Memphis', 2306: 'Kansas St', 103: 'Boston College', 2579: 'South Carolina',
  2636: 'UTSA', 30: 'USC', 99: 'LSU', 239: 'Baylor',
  2335: 'Liberty', 23: 'San Jose St', 2459: 'Northern Illinois', 259: 'Virginia Tech',
  145: 'Ole Miss', 252: 'BYU', 201: 'Oklahoma', 130: 'Michigan',
  24: 'Stanford', 2: 'Auburn', 275: 'Wisconsin', 38: 'Colorado',
  256: 'James Madison', 55: 'Jacksonville St', 245: 'Texas A&M', 2426: 'Navy',
  135: 'Minnesota', 87: 'Notre Dame', 59: 'Georgia Tech', 277: 'West Virginia',
  61: 'Georgia', 195: 'Ohio', 62: 'Hawaii', 66: 'Iowa St',
  158: 'Nebraska', 52: 'Florida St', 2305: 'Kansas', 6: 'South Alabama',
  248: 'Houston', 2294: 'Iowa', 142: 'Missouri', 9: 'Arizona St',
  2472: 'UTEP', 183: 'Syracuse', 36: 'Colorado St', 8: 'Arkansas',
  2641: 'Texas Tech', 2483: 'Oregon', 2655: 'Tulane', 2439: 'UNLV',
  2348: 'Louisiana Tech', 221: 'Pitt', 2633: 'Tennessee', 2084: 'Buffalo',
  254: 'Utah', 97: 'Louisville', 2653: 'Troy', 278: 'Fresno St',
  213: 'Penn St', 96: 'Kentucky', 2026: 'App St', 276: 'Marshall',
  251: 'Texas', 2628: 'TCU', 264: 'Washington', 2567: 'SMU',
  265: 'Washington St', 12: 'Arizona', 324: 'Coastal Carolina', 204: 'Oregon St',
  333: 'Alabama', 356: 'Illinois', 193: 'Miami OH', 98: 'Western Kentucky',
  290: 'Georgia Southern', 2005: 'Air Force', 153: 'UNC', 197: 'Oklahoma St',
  2572: 'Southern Miss', 349: 'Army', 2509: 'Purdue',
  328: 'Utah St', 242: 'Rice', 2751: 'Wyoming', 2711: 'Western Michigan',
  258: 'Virginia', 338: 'Kennesaw St',
  21: 'San Diego St', 77: 'Northwestern', 154: 'Wake Forest',
  249: 'North Texas', 151: 'East Carolina', 295: 'Old Dominion',
  120: 'Maryland', 164: 'Rutgers', 167: 'New Mexico',
  2117: 'Central Michigan', 5: 'UAB',
}

const SCHOOL_TO_ESPN_ID = Object.fromEntries(
  Object.entries(ESPN_ID_TO_SCHOOL).map(([id, school]) => [school, Number(id)])
)

// ── ESPN API fetch helpers ───────────────────────────────────
// Use site.web.api.espn.com for all requests — site.api.espn.com blocks server-side calls
const ESPN_WEB = 'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football'

async function espnFetch(url) {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.espn.com/',
      'Origin': 'https://www.espn.com',
    }
  })
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${url}`)
  return res.json()
}

async function fetchWeekGames(year, week, seasontype) {
  try {
    const data = await espnFetch(
      `${ESPN_WEB}/scoreboard?year=${year}&week=${week}&seasontype=${seasontype}&limit=300&groups=80`
    )
    return (data.events || []).map(e => ({ ...e, _seasontype: seasontype }))
  } catch(e) {
    console.warn(`[ESPN] week ${week} seasontype ${seasontype}:`, e.message)
    return []
  }
}

async function fetchRankings(year, week, poll) {
  try {
    const data = await espnFetch(
      `${ESPN_WEB}/rankings?year=${year}&week=${week}&seasontype=2`
    )
    const polls = data.rankings || []
    const target = polls.find(p =>
      poll === 'ap'
        ? p.name?.toLowerCase().includes('ap top')
        : p.name?.toLowerCase().includes('college football playoff')
    )
    const ranked = {}
    if (target) {
      ;(target.ranks || []).forEach(r => {
        const id = Number(r.team?.id)
        if (id && r.current <= 25) ranked[id] = r.current
      })
    }
    return ranked
  } catch(e) {
    console.warn(`[ESPN] rankings week ${week}:`, e.message)
    return {}
  }
}

// ── Parse ESPN event into normalized object ──────────────────
function parseEvent(event, draftedEspnIds) {
  const comp = event.competitions?.[0]
  if (!comp) return null
  const completed = comp.status?.type?.completed; if (!completed && completed !== "true") return null

  const home = comp.competitors?.find(c => c.homeAway === 'home')
  const away = comp.competitors?.find(c => c.homeAway === 'away')
  if (!home || !away) return null

  const homeId = Number(home.team?.id)
  const awayId = Number(away.team?.id)
  if (!draftedEspnIds.has(homeId) && !draftedEspnIds.has(awayId)) return null

  const homeScore = parseInt(home.score ?? 0, 10)
  const awayScore = parseInt(away.score ?? 0, 10)
  const homeRank = (home.curatedRank?.current > 0 && home.curatedRank?.current <= 25)
    ? home.curatedRank.current : null
  const awayRank = (away.curatedRank?.current > 0 && away.curatedRank?.current <= 25)
    ? away.curatedRank.current : null

  const notes = (comp.notes?.[0]?.headline || event.name || '').toLowerCase()
  const seasontype = event._seasontype || 2

  const isCfp = notes.includes('first round') || notes.includes('quarterfinal') ||
    notes.includes('semifinal') || notes.includes('national championship') ||
    notes.includes('cfp')
  // Only flag CCG if week 14+ AND notes explicitly mention championship
  // Never use comp.conferenceCompetition — it flags ALL conference games
  const weekNum = event.week?.number || 0
  const isConfChamp = !isCfp && weekNum >= 14 && (
    notes.includes('championship') || notes.includes('title game')
  )
  const isBowl = !isCfp && !isConfChamp && seasontype === 3

  let cfpRound = null
  if (isCfp) {
    if (notes.includes('national championship')) cfpRound = 'championship'
    else if (notes.includes('semifinal')) cfpRound = 'semifinal'
    else if (notes.includes('quarterfinal')) cfpRound = 'quarterfinal'
    else cfpRound = 'firstround'
  }

  return {
    espnGameId: event.id,
    week: event.week?.number || 1,
    homeId, awayId, homeScore, awayScore, homeRank, awayRank,
    homeIsDrafted: draftedEspnIds.has(homeId),
    awayIsDrafted: draftedEspnIds.has(awayId),
    isCfp, isConfChamp, isBowl, cfpRound,
  }
}

// ── Main handler ─────────────────────────────────────────────
module.exports = async function handler(req, res) {
  try {
    const season = new Date().getMonth() === 0
      ? new Date().getFullYear() - 1
      : new Date().getFullYear()

    console.log(`[update-scores] ESPN mode, season ${season}`)

    // 1. Load rosters
    const { data: teams } = await supabase.from('Teams')
      .select('id, school, rival_1, rival_2, conference')
    const { data: rosters } = await supabase.from('Managers_Teams')
      .select('manager_id, team_id').eq('season', season)

    const draftedTeamIds = new Set(rosters.map(r => r.team_id))
    const draftedTeams = teams.filter(t => draftedTeamIds.has(t.id))
    const rosterByTeamId = {}
    rosters.forEach(r => { rosterByTeamId[r.team_id] = r.manager_id })

    const draftedEspnIds = new Set()
    const espnIdToTeam = {}
    draftedTeams.forEach(t => {
      const eid = SCHOOL_TO_ESPN_ID[t.school]
      if (eid) { draftedEspnIds.add(eid); espnIdToTeam[eid] = t }
      else console.warn(`No ESPN ID for: ${t.school}`)
    })

    // 2. Load existing records
    const { data: existingGames } = await supabase
      .from('team_games').select('game_id').eq('season', season)
    const existingGameIds = new Set((existingGames || []).map(g => g.game_id))

    const { data: existingEvts } = await supabase
      .from('Scoring_Events').select('game_id').eq('season', season)
    const existingEventIds = new Set((existingEvts || []).map(e => e.game_id))

    // 3. Fetch all games from ESPN
    const allEvents = []
    for (let w = 1; w <= 15; w++) {
      const evts = await fetchWeekGames(season, w, 2)
      allEvents.push(...evts)
      if (evts.length === 0 && w > 3) break
    }
    for (let w = 1; w <= 5; w++) {
      const evts = await fetchWeekGames(season, w, 3)
      allEvents.push(...evts)
      if (evts.length === 0) break
    }
    console.log(`[update-scores] ${allEvents.length} ESPN events fetched`)

    // 4. Fetch rankings by week
    const weeks = [...new Set(allEvents.map(e => e.week?.number).filter(Boolean))]
    const weekRankings = {}
    for (const w of weeks) {
      weekRankings[w] = await fetchRankings(season, w, RANKINGS_POLL)
    }

    // 5. Process events
    const newGameRows = []
    const newScoringEvents = []
    const cfpAppDone = new Set()
    const ccgAppDone = new Set()
    const cfpTeamRounds = {}

    for (const event of allEvents) {
      const p = parseEvent(event, draftedEspnIds)
      if (!p) continue

      const perspectives = []
      if (p.homeIsDrafted && espnIdToTeam[p.homeId])
        perspectives.push({ team: espnIdToTeam[p.homeId], isHome: true, oppId: p.awayId, teamScore: p.homeScore, oppScore: p.awayScore, teamRank: p.homeRank, oppRank: p.awayRank })
      if (p.awayIsDrafted && espnIdToTeam[p.awayId])
        perspectives.push({ team: espnIdToTeam[p.awayId], isHome: false, oppId: p.homeId, teamScore: p.awayScore, oppScore: p.homeScore, teamRank: p.awayRank, oppRank: p.homeRank })

      for (const { team, isHome, oppId, teamScore, oppScore, oppRank } of perspectives) {
        const managerId = rosterByTeamId[team.id]
        if (!managerId) continue

        const won = teamScore > oppScore
        const weekRank = weekRankings[p.week] || {}
        const finalOppRank = oppRank ?? (weekRank[oppId] <= 25 ? weekRank[oppId] : null)
        const isRanked = finalOppRank !== null
        const oppSchool = ESPN_ID_TO_SCHOOL[oppId]
        const isRival = oppSchool === team.rival_1 || oppSchool === team.rival_2

        const gameId = `${season}_${p.espnGameId}_${team.school}`

        if (!existingGameIds.has(gameId)) {
          let points = 0, eventType = null

          if (p.isCfp && won) {
            if (p.cfpRound === 'championship')  { points = POINTS.nationalChampionship; eventType = 'national_championship' }
            else if (p.cfpRound === 'semifinal') { points = POINTS.cfpSemiFinalWin;     eventType = 'cfp_semifinal_win' }
            else if (p.cfpRound === 'quarterfinal') { points = POINTS.cfpQuarterFinalWin; eventType = 'cfp_quarterfinal_win' }
            else if (p.cfpRound === 'firstround')   { points = POINTS.cfpRound1Win;       eventType = 'cfp_round1_win' }
          } else if (p.isConfChamp && won) {
            points = POINTS.confChampWin; eventType = 'conf_champ_win'
          } else if (p.isBowl && won) {
            points = POINTS.nonCfpBowlWin; eventType = 'bowl_win'
          } else if (!p.isCfp && !p.isConfChamp && !p.isBowl && won) {
            if (isRival && isRanked)      { points = POINTS.rivalTop25Win; eventType = 'rival_top25_win' }
            else if (isRival)             { points = POINTS.rivalWin;      eventType = 'rival_win' }
            else if (isRanked)            { points = POINTS.top25Win;      eventType = 'top25_win' }
            else                          { points = POINTS.regularWin;    eventType = 'regular_win' }
          }

          newGameRows.push({
            season, week: p.week,
            school: team.school,
            opponent: oppSchool || `espn_${oppId}`,
            home: isHome,
            result: won ? 'W' : 'L',
            school_score: teamScore,
            opponent_score: oppScore,
            opponent_rank: finalOppRank,
            is_rival: isRival,
            is_conference_championship: p.isConfChamp,
            is_bowl: p.isBowl,
            is_cfp: p.isCfp,
            cfp_round: p.cfpRound,
            points_earned: points,
            game_id: gameId,
          })
          existingGameIds.add(gameId)

          if (points > 0 && eventType) {
            newScoringEvents.push({
              season, manager_id: managerId, team_id: team.id,
              event_type: eventType, points, week: p.week, game_id: gameId,
            })
          }

          if (p.isCfp) {
            if (!cfpTeamRounds[team.id]) cfpTeamRounds[team.id] = { managerId, rounds: [] }
            cfpTeamRounds[team.id].rounds.push(p.cfpRound)
          }
        }

        // CCG appearance — one-time
        if (p.isConfChamp && !ccgAppDone.has(team.id)) {
          ccgAppDone.add(team.id)
          const aid = `${season}_ccg_app_${team.id}`
          if (!existingEventIds.has(aid)) {
            newScoringEvents.push({ season, manager_id: managerId, team_id: team.id,
              event_type: 'conf_champ_appearance', points: POINTS.confChampAppearance,
              week: p.week, game_id: aid })
            existingEventIds.add(aid)
          }
        }

        // CFP appearance — one-time
        if (p.isCfp && !cfpAppDone.has(team.id)) {
          cfpAppDone.add(team.id)
          const aid = `${season}_cfp_app_${team.id}`
          if (!existingEventIds.has(aid)) {
            newScoringEvents.push({ season, manager_id: managerId, team_id: team.id,
              event_type: 'cfp_appearance', points: POINTS.cfpAppearance,
              week: p.week, game_id: aid })
            existingEventIds.add(aid)
          }
        }
      }
    }

    // 6. CFP bye — in playoff but no first-round game
    for (const [teamIdStr, { managerId, rounds }] of Object.entries(cfpTeamRounds)) {
      const teamId = Number(teamIdStr)
      if (!rounds.includes('firstround')) {
        const bid = `${season}_cfp_bye_${teamId}`
        if (!existingEventIds.has(bid)) {
          newScoringEvents.push({ season, manager_id: managerId, team_id: teamId,
            event_type: 'cfp_bye', points: POINTS.cfpFirstRoundBye,
            week: 16, game_id: bid })
          existingEventIds.add(bid)
        }
      }
    }

    // 7. Write to Supabase
    if (newGameRows.length > 0) {
      const { error } = await supabase.from('team_games').insert(newGameRows)
      if (error) throw error
    }
    if (newScoringEvents.length > 0) {
      // Use upsert to avoid duplicate key errors killing the whole batch
      const { error } = await supabase
        .from('Scoring_Events')
        .upsert(newScoringEvents, { onConflict: 'game_id', ignoreDuplicates: true })
      if (error) {
        // Fall back to inserting one by one so one failure doesn't block the rest
        console.warn('[update-scores] Batch upsert failed, trying one by one:', error.message)
        let inserted = 0
        for (const evt of newScoringEvents) {
          const { error: e } = await supabase
            .from('Scoring_Events')
            .upsert(evt, { onConflict: 'game_id', ignoreDuplicates: true })
          if (!e) inserted++
          else console.warn('[update-scores] Event insert failed:', evt.game_id, e.message)
        }
        console.log(`[update-scores] Inserted ${inserted}/${newScoringEvents.length} events individually`)
      }
    }

    return res.status(200).json({
      success: true, season,
      newGames: newGameRows.length,
      newScoringEvents: newScoringEvents.length,
      rankingsPoll: RANKINGS_POLL,
      teamsTracked: draftedTeams.length,
      teamsWithEspnId: Object.keys(espnIdToTeam).length,
    })

  } catch (err) {
    console.error('[update-scores] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
