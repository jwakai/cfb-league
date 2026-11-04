import React, { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './supabaseClient'
import Standings, { TEAM_ESPN_IDS } from './components/Standings'
import Header from './components/Header'

// Number of teams in the College Football Playoff field. Change if the format changes.
const CFP_FIELD_SIZE = 12

// 2026 CFP rules (as modeled here):
//  - 12-team field
//  - The highest-ranked Group of 6 team is guaranteed a spot, even if ranked outside the top 12
//    (the Group of 6 now includes the rebuilt Pac-12, e.g. Boise State)
//  - Notre Dame is guaranteed a spot if ranked in the top 12
//  - Everyone else fills the remaining spots in ranking order
// Not modeled: the Power 4 conference-champion guarantee (champions aren't known until
// conference title games are played). Once CFP games are recorded, those teams count too.
const POWER_FOUR_SCHOOLS = [
  // SEC
  'Alabama', 'Arkansas', 'Auburn', 'Florida', 'Georgia', 'Kentucky', 'LSU', 'Mississippi St',
  'Missouri', 'Oklahoma', 'Ole Miss', 'South Carolina', 'Tennessee', 'Texas', 'Texas A&M', 'Vanderbilt',
  // Big Ten
  'Illinois', 'Indiana', 'Iowa', 'Maryland', 'Michigan', 'Michigan St', 'Minnesota', 'Nebraska',
  'Northwestern', 'Ohio St', 'Oregon', 'Penn St', 'Purdue', 'Rutgers', 'UCLA', 'USC', 'Washington', 'Wisconsin',
  // Big 12
  'Arizona', 'Arizona St', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa St', 'Kansas',
  'Kansas St', 'Oklahoma St', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia',
  // ACC
  'Boston College', 'Cal', 'Clemson', 'Duke', 'Florida St', 'Georgia Tech', 'Louisville', 'Miami',
  'NC St', 'UNC', 'Pitt', 'SMU', 'Stanford', 'Syracuse', 'Virginia', 'Virginia Tech', 'Wake Forest',
]
const POWER_FOUR_IDS = new Set(POWER_FOUR_SCHOOLS.map(s => TEAM_ESPN_IDS[s]).filter(Boolean))

// liveRanks: { espnTeamId: rank } for the top 25. Returns the projected field.
function projectCfpField(liveRanks) {
  const ranked = Object.entries(liveRanks)
    .map(([id, rank]) => ({ id: Number(id), rank }))
    .sort((a, b) => a.rank - b.rank)
  const ndId = TEAM_ESPN_IDS['Notre Dame']

  // Highest-ranked Group of 6 team = highest-ranked team that isn't Power 4 or Notre Dame
  const g6 = ranked.find(t => !POWER_FOUR_IDS.has(t.id) && t.id !== ndId) || null
  const nd = ranked.find(t => t.id === ndId) || null

  const field = new Set()
  if (g6) field.add(g6.id)
  if (nd && nd.rank <= CFP_FIELD_SIZE) field.add(nd.id)
  for (const t of ranked) {
    if (field.size >= CFP_FIELD_SIZE) break
    field.add(t.id)
  }
  return { field, g6Id: g6 ? g6.id : null, g6Rank: g6 ? g6.rank : null }
}

export default function App() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [season, setSeason] = useState(2026)
  const [espnWeek, setEspnWeek] = useState(null)
  const [upcomingGames, setUpcomingGames] = useState([])

  useEffect(() => {
    fetchStandings()
  }, [season])

  // Keep the page current without a manual reload (iPad/iPhone browsers keep tabs
  // alive for days and restore them without refetching). Refresh quietly every
  // 5 minutes, when the tab becomes visible again, and when the page is restored.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') fetchStandings(true)
    }
    const onPageShow = (e) => { if (e.persisted) refresh() }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('pageshow', onPageShow)
    const timer = setInterval(refresh, 5 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('pageshow', onPageShow)
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season])

  async function fetchStandings(silent = false) {
    // Silent refreshes skip the loading screen and keep existing data on failure
    if (!silent) setLoading(true)
    if (!silent) setError(null)
    try {
      // ESPN current week + upcoming schedule comes via our own server route
      // (/api/espn-week) so it works on every device, including iPad/iPhone Safari

      const [
        { data: managers, error: mgrError },
        { data: teams, error: teamsError },
        { data: rosters, error: rosterError },
        { data: events, error: eventsError },
        { data: gameRows, error: gamesError },
        espnScoreboard,
      ] = await Promise.all([
        supabase.from('Managers').select('*'),
        supabase.from('Teams').select('*'),
        supabase.from('Managers_Teams').select('*').eq('season', season),
        supabase.from('Scoring_Events').select('*').eq('season', season),
        supabase.from('team_games').select('*').eq('season', season).limit(5000),
        fetch(`/api/espn-week?season=${season}`)
          .then(r => (r.ok ? r.json() : null)).catch(() => null),
      ])

      if (mgrError) throw mgrError
      if (teamsError) throw teamsError
      if (rosterError) throw rosterError
      if (eventsError) throw eventsError
      if (gamesError && !gamesError.message?.includes('does not exist')) throw gamesError

      const allGames = gameRows || []

      // Parse ESPN current week and upcoming games
      const fetchedEspnWeek = espnScoreboard?.week?.number || null
      if (fetchedEspnWeek) setEspnWeek(fetchedEspnWeek)

      // Build upcoming games list from ESPN scoreboard for current week
      const upcoming = []
      if (espnScoreboard?.events) {
        espnScoreboard.events.forEach(event => {
          const comp = event.competitions?.[0]
          if (!comp) return
          const home = comp.competitors?.find(c => c.homeAway === 'home')
          const away = comp.competitors?.find(c => c.homeAway === 'away')
          if (!home || !away) return
          upcoming.push({
            week: event.week?.number,
            homeId: Number(home.team?.id),
            awayId: Number(away.team?.id),
            homeName: home.team?.displayName,
            awayName: away.team?.displayName,
            homeRank: home.curatedRank?.current > 0 && home.curatedRank?.current <= 25 ? home.curatedRank.current : null,
            awayRank: away.curatedRank?.current > 0 && away.curatedRank?.current <= 25 ? away.curatedRank.current : null,
            completed: comp.status?.type?.completed,
            homeScore: home.score,
            awayScore: away.score,
            date: comp.date,
          })
        })
      }
      setUpcomingGames(upcoming)

      // Live rankings from ESPN (CFP once released, otherwise AP)
      const liveRanks = espnScoreboard?.rankings?.ranks || {}
      const rankPoll = espnScoreboard?.rankings?.poll || null
      const haveLiveRanks = Object.keys(liveRanks).length > 0
      const cfpProjection = rankPoll === 'cfp' ? projectCfpField(liveRanks) : null

      const managerMap = {}
      managers.forEach(mgr => {
        managerMap[mgr.id] = { name: mgr.name, totalPoints: 0, teams: [] }
      })

      rosters.forEach(row => {
        const mgr = managerMap[row.manager_id]
        const team = teams.find(t => t.id === row.team_id)
        if (!mgr || !team) return

        // Build schedule from team_games
        const teamGames = allGames
          .filter(g => g.school === team.school)
          .sort((a, b) => a.week - b.week)

        // Calculate record
        const wins = teamGames.filter(g => g.result === 'W').length
        const losses = teamGames.filter(g => g.result === 'L').length
        const record = teamGames.length > 0 ? `${wins}-${losses}` : null

        // Count Top 25 wins
        const top25Wins = teamGames.filter(
          g => g.result === 'W' && g.opponent_rank !== null && g.opponent_rank <= 25
        ).length

        // Next unplayed game (not yet in team_games since ESPN only returns completed)
        // Show last completed game instead
        const nextGame = teamGames.find(g => g.result === null)
        const nextOpponent = nextGame
          ? `${nextGame.home ? 'vs' : 'at'} ${nextGame.opponent}`
          : null
        const lastPlayedGame = [...teamGames].reverse().find(g => g.result !== null)
        const lastGame = lastPlayedGame
          ? `${lastPlayedGame.result} ${lastPlayedGame.home ? 'vs' : 'at'} ${lastPlayedGame.opponent}`
          : null

        // Current ranking from ESPN's live rankings (CFP once released, otherwise AP).
        // Falls back to the Teams table only if the live rankings couldn't be loaded.
        const espnId = TEAM_ESPN_IDS[team.school]
        const liveRank = espnId ? (liveRanks[espnId] ?? null) : null
        const currentRank = haveLiveRanks ? liveRank : (team.current_rank || null)

        // CFP projection — in the projected field (see rules above), or has played a CFP game
        const cfpRank = (rankPoll === 'cfp' && liveRank) ? liveRank : null
        const inCfpField = !!(cfpProjection && espnId && cfpProjection.field.has(espnId))
        const cfpProjected = teamGames.some(g => g.is_cfp) || inCfpField
        const cfpNote = (inCfpField && espnId === cfpProjection.g6Id && cfpRank > CFP_FIELD_SIZE)
          ? 'Highest-ranked Group of 6 team: guaranteed bid'
          : null

        mgr.teams.push({
          id: team.id,
          school: team.school,
          conference: team.conference,
          rival_1: team.rival_1,
          rival_2: team.rival_2,
          points: 0,
          record,
          top25Wins: teamGames.length > 0 ? top25Wins : null,
          nextOpponent,
          lastGame,
          cfpProjected,
          cfpRank,
          cfpNote,
          currentRank,
          schedule: teamGames.map(g => ({
            week: g.week,
            opponent: g.opponent,
            home: g.home,
            result: g.result,
            opponentRank: g.opponent_rank,
            schoolScore: g.school_score,
            opponentScore: g.opponent_score,
            isCfp: g.is_cfp,
            isBowl: g.is_bowl,
            isConfChamp: g.is_conference_championship,
            cfpRound: g.cfp_round,
            isRival: g.is_rival,
            pointsEarned: g.points_earned,
          })),
        })
      })

      events.forEach(event => {
        const mgr = managerMap[event.manager_id]
        if (!mgr) return
        mgr.totalPoints += event.points || 0
        const team = mgr.teams.find(t => t.id === event.team_id)
        if (team) team.points += event.points || 0
      })

      Object.values(managerMap).forEach(mgr => {
        mgr.teams.sort((a, b) => b.points - a.points)
        mgr.topTeam = mgr.teams[0]
      })

      const sorted = Object.values(managerMap)
        .filter(mgr => mgr.teams.length > 0)
        .sort((a, b) => b.totalPoints - a.totalPoints)

      // Find highest scoring team across all managers
      const allTeams = Object.values(managerMap).flatMap(mgr => mgr.teams)
      const globalTopTeam = allTeams.reduce((best, team) =>
        team.points > (best?.points || 0) ? team : best, null)
      if (sorted.length > 0) sorted[0].globalTopTeam = globalTopTeam

      // Current week — use ESPN's live week number, fall back to max completed week
      const completedWeeks = allGames.filter(g => g.result !== null).map(g => g.week)
      const maxCompletedWeek = completedWeeks.length > 0 ? Math.max(...completedWeeks) : null
      const currentWeek = fetchedEspnWeek || maxCompletedWeek

      // Weekly high scorer — manager with most points from current week's games
      let weeklyLeader = null
      if (currentWeek) {
        const weekEvents = (events || []).filter(e => e.week === currentWeek)
        const weekTotals = {}
        weekEvents.forEach(e => {
          weekTotals[e.manager_id] = (weekTotals[e.manager_id] || 0) + (e.points || 0)
        })
        const topMgrId = Object.entries(weekTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
        if (topMgrId) {
          const topMgr = managers.find(m => String(m.id) === String(topMgrId))
          weeklyLeader = { name: topMgr?.name, points: weekTotals[topMgrId], week: currentWeek }
        }
      }

      setStandings(sorted.map(s => ({ ...s, currentWeek, weeklyLeader, upcomingGames: upcoming, cfpAvailable: !!cfpProjection })))
    } catch (err) {
      console.error(err)
      if (!silent) setError(`Error: ${err.message}`)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const maxPoints = standings.length > 0 ? standings[0].totalPoints : 1
  const currentWeek = espnWeek || standings[0]?.currentWeek || null
  const weeklyLeader = standings[0]?.weeklyLeader || null
  const allUpcomingGames = upcomingGames

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header season={season} setSeason={setSeason} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Loading season data...
          </div>
        )}

        {error && (
          <div style={{
            margin: '32px 0', padding: '16px 20px',
            background: '#fff0f0', border: '1px solid #ffaaaa',
            borderRadius: 'var(--radius)', color: '#c0392b', fontSize: 13
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <Standings
            standings={standings}
            maxPoints={maxPoints}
            season={season}
            currentWeek={currentWeek}
            weeklyLeader={weeklyLeader}
            upcomingGames={allUpcomingGames}
          />
        )}
      </main>

      <div style={{ height: 2, background: '#c9920e', position: 'fixed', bottom: 0, left: 0, right: 0 }} />
    </div>
  )
}
