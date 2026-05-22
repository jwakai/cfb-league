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
      const { data: events, error: eventsError } = await supabase
        .from('Scoring_Events')
        .select(`
          points,
          event_type,
          season,
          team_id,
          manager_id,
          Teams (school, conference),
          Managers (name)
        `)
        .eq('season', season)

      if (eventsError) throw eventsError

      const { data: rosters, error: rosterError } = await supabase
        .from('Managers_Teams')
        .select(`
          manager_id,
          team_id,
          Managers (name),
          Teams (school, conference, rival_1, rival_2)
        `)
        .eq('season', season)

      if (rosterError) throw rosterError

      const managerMap = {}

      rosters.forEach(row => {
        const mgrName = row.Managers?.name
        if (!mgrName) return
        if (!managerMap[mgrName]) {
          managerMap[mgrName] = { name: mgrName, totalPoints: 0, teams: [] }
        }
        managerMap[mgrName].teams.push({
          id: row.team_id,
          school: row.Teams?.school,
          conference: row.Teams?.conference,
          rival_1: row.Teams?.rival_1,
          rival_2: row.Teams?.rival_2,
          points: 0
        })
      })

      events.forEach(event => {
        const mgrName = event.Managers?.name
        const teamSchool = event.Teams?.school
        if (!mgrName || !managerMap[mgrName]) return
        managerMap[mgrName].totalPoints += event.points || 0
        const team = managerMap[mgrName].teams.find(t => t.school === teamSchool)
        if (team) team.points += event.points || 0
      })

      Object.values(managerMap).forEach(mgr => {
        mgr.teams.sort((a, b) => b.points - a.points)
        mgr.topTeam = mgr.teams[0]
      })

      const sorted = Object.values(managerMap).sort(
        (a, b) => b.totalPoints - a.totalPoints
      )

      setStandings(sorted)
    } catch (err) {
      console.error(err)
      setError('Failed to load standings. Check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  const maxPoints = standings.length > 0 ? standings[0].totalPoints : 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header season={season} setSeason={setSeason} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 60px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            Loading season data...
          </div>
        )}
        {error && (
          <div style={{
            margin: '32px 0', padding: '16px 20px',
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 13
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
    </div>
  )
}
