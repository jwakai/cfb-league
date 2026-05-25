import React, { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './supabaseClient'
import Standings from './components/Standings'
import ManagerDetail from './components/ManagerDetail'
import Header from './components/Header'

export default function App() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedManager, setSelectedManager] = useState(null)
  const [season, setSeason] = useState(2025)

  useEffect(() => {
    fetchStandings()
  }, [season])

  async function fetchStandings() {
    setLoading(true)
    setError(null)
    try {
      const { data: managers, error: mgrError } = await supabase
        .from('Managers').select('*')
      if (mgrError) throw mgrError

      const { data: teams, error: teamsError } = await supabase
        .from('Teams').select('*')
      if (teamsError) throw teamsError

      const { data: rosters, error: rosterError } = await supabase
        .from('Managers_Teams').select('*').eq('season', season)
      if (rosterError) throw rosterError

      const { data: events, error: eventsError } = await supabase
        .from('Scoring_Events').select('*').eq('season', season)
      if (eventsError) throw eventsError

      const managerMap = {}

      managers.forEach(mgr => {
        managerMap[mgr.id] = { name: mgr.name, totalPoints: 0, teams: [] }
      })

      rosters.forEach(row => {
        const mgr = managerMap[row.manager_id]
        const team = teams.find(t => t.id === row.team_id)
        if (!mgr || !team) return
        mgr.teams.push({
          id: team.id,
          school: team.school,
          conference: team.conference,
          rival_1: team.rival_1,
          rival_2: team.rival_2,
          points: 0
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

      // Find the single highest scoring team across all managers
      const allTeams = Object.values(managerMap).flatMap(mgr => mgr.teams)
      const globalTopTeam = allTeams.reduce((best, team) =>
        team.points > (best?.points || 0) ? team : best, null)

      // Attach to the standings leader so Standings.js can access it
      if (sorted.length > 0) sorted[0].globalTopTeam = globalTopTeam

      setStandings(sorted)
    } catch (err) {
      console.error(err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const maxPoints = standings.length > 0 ? standings[0].totalPoints : 1

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

        {!loading && !error && !selectedManager && (
          <Standings
            standings={standings}
            maxPoints={maxPoints}
            onSelectManager={setSelectedManager}
            season={season}
          />
        )}

        {!loading && !error && selectedManager && (
          <ManagerDetail
            manager={selectedManager}
            rank={standings.findIndex(m => m.name === selectedManager.name) + 1}
            totalManagers={standings.length}
            onBack={() => setSelectedManager(null)}
            season={season}
          />
        )}
      </main>

      <div style={{ height: 2, background: '#c9920e', position: 'fixed', bottom: 0, left: 0, right: 0 }} />
    </div>
  )
}
