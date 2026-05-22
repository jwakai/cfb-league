import React from 'react'

const CONF_COLORS = {
  'SEC': { bg: '#1a1200', border: '#d4a020', text: '#f0c040' },
  'Big Ten': { bg: '#001a33', border: '#2060c0', text: '#60a0f0' },
  'Big 12': { bg: '#1a0010', border: '#c020a0', text: '#e060d0' },
  'ACC': { bg: '#001a10', border: '#20a060', text: '#40c080' },
  'Pac-12': { bg: '#1a1000', border: '#c08020', text: '#e0a040' },
  'Mountain West': { bg: '#001010', border: '#20a0a0', text: '#40c0c0' },
  'Sun Belt': { bg: '#1a0000', border: '#c04020', text: '#e06040' },
  'MAC': { bg: '#0a0a1a', border: '#6060c0', text: '#9090e0' },
  'AAC': { bg: '#0a1a0a', border: '#406040', text: '#70a070' },
  'CUSA': { bg: '#1a0a00', border: '#a06020', text: '#d09040' },
  'Independent': { bg: '#1a1a1a', border: '#808080', text: '#b0b0b0' },
}

function confStyle(conf) {
  return CONF_COLORS[conf] || { bg: '#111', border: '#444', text: '#aaa' }
}

function getRankSuffix(n) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

function PointBar({ points, max }) {
  const pct = max > 0 ? Math.round((points / max) * 100) : 0
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#d4a847' : '#555'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#1e1e1e', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', color: pct >= 70 ? '#4ade80' : 'var(--text-primary)', minWidth: 36, textAlign: 'right' }}>
        {points}
      </span>
    </div>
  )
}

export default function ManagerDetail({ manager, rank, totalManagers, onBack, season }) {
  const maxTeamPoints = Math.max(...manager.teams.map(t => t.points), 1)
  const totalPoints = manager.totalPoints

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontSize: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        Back to all managers
      </button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
            {manager.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            {rank}{getRankSuffix(rank)} place of {totalManagers} managers · {season} season
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '0.04em', color: rank === 1 ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1 }}>
            {totalPoints.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>total points</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Team breakdown
        </div>
        {manager.teams.map((team, i) => {
          const cs = confStyle(team.conference)
          const pct = Math.round((team.points / totalPoints) * 100)
          return (
            <div key={team.school} style={{ padding: '14px 20px', borderBottom: i < manager.teams.length - 1 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>{i + 1}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{team.school}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: cs.bg, border: `1px solid ${cs.border}`, color: cs.text }}>{team.conference}</span>
                  {team.rival_1 && (<span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs {team.rival_1} and {team.rival_2}</span>)}
                </div>
                <PointBar points={team.points} max={maxTeamPoints} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}% of total</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Scoring reference
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'Regular season win', pts: 10 },
            { label: 'Top 25 win', pts: 18 },
            { label: 'Rival win', pts: 30 },
            { label: 'Conf. championship appearance', pts: 30 },
            { label: 'Conf. championship win', pts: 60 },
            { label: 'Non-CFP bowl win', pts: 40 },
            { label: 'CFP appearance', pts: 25 },
            { label: 'CFP 1st round bye', pts: 20 },
            { label: 'CFP Round 1 win', pts: 35 },
            { label: 'CFP Quarterfinal win', pts: 50 },
            { label: 'CFP Semifinal win', pts: 70 },
            { label: 'National championship', pts: 100 },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 20px', borderBottom: i < 10 ? '1px solid var(--border)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', color: item.pts >= 50 ? 'var(--accent)' : 'var(--text-primary)' }}>{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
