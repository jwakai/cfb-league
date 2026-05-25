import React, { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './supabaseClient'
import Standings from './components/Standings'
import Header from './components/Header'

export default function App() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [season, setSeason] = useState(2025)

  useEffect(() => {
    fetchStandings()
  }, [season])

  async function fetchStandings() {
    setLoading(true)
    setError(null)
    try {
      const [
        { data: managers, error: mgrError },
        { data: teams, error: teamsError },
        { data: rosters, error: rosterError },
        { data: events, error: eventsError },
        { data: gameRows, error: gamesError },
      ] = await Promise.all([
        supabase.from('Managers').select('*'),
        supabase.from('Teams').select('*'),
        supabase.from('Managers_Teams').select('*').eq('season', season),
        supabase.from('Scoring_Events').select('*').eq('season', season),
        supabase.from('team_games').select('*').eq('season', season),
      ])

      if (mgrError) throw mgrError
      if (teamsError) throw teamsError
      if (rosterError) throw rosterError
      if (eventsError) throw eventsError
      // team_games may not exist yet — handle gracefully
      if (gamesError && !gamesError.message?.includes('does not exist')) throw gamesError

      const allGames = gameRows || []

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

        // Next unplayed game
        const nextGame = teamGames.find(g => g.result === null)
        const nextOpponent = nextGame
          ? `${nextGame.home ? 'vs' : 'at'} ${nextGame.opponent}`
          : null

        // CFP projection — team has a CFP game recorded
        const cfpProjected = teamGames.some(g => g.is_cfp)

        // Current AP ranking — most recent week's ranking from team_games opponent data
        // Will be populated via Phase 5 rankings API; null during off-season
        const currentRank = team.current_rank || null

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
          cfpProjected,
          currentRank,
          schedule: teamGames.map(g => ({
            week: g.week,
            opponent: g.opponent,
            home: g.home,
            result: g.result,
            opponentRank: g.opponent_rank,
            schoolScore: g.school_score,
            opponentScore: g.opponent_score,
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

      // Current week — highest week number with completed games
      const completedWeeks = allGames.filter(g => g.result !== null).map(g => g.week)
      const currentWeek = completedWeeks.length > 0 ? Math.max(...completedWeeks) : null

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

      setStandings(sorted.map(s => ({ ...s, currentWeek, weeklyLeader })))
    } catch (err) {
      console.error(err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const maxPoints = standings.length > 0 ? standings[0].totalPoints : 1
  const currentWeek = standings[0]?.currentWeek || null
  const weeklyLeader = standings[0]?.weeklyLeader || null

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
          />
        )}
      </main>

      <div style={{ height: 2, background: '#c9920e', position: 'fixed', bottom: 0, left: 0, right: 0 }} />
    </div>
  )
}
