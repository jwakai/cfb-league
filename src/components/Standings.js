import React from 'react'

const MEDAL = ['🥇', '🥈', '🥉']

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

export default function Standings({ standings, maxPoints, onSelectManager, season }) {
  if (standings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
        No data found for the {season} season.
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 28
      }}>
        {[
          { label: 'League leader', value: standings[0]?.name, sub: `${standings[0]?.totalPoints?.toLocaleString()} pts` },
          { label: 'Managers', value: standings.length, sub: '8 teams each' },
          { label: 'Top team', value: standings[0]?.topTeam?.school, sub: `${standings[0]?.topTeam?.points} pts` },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {standings.map((mgr, i) => {
          const barWidth = Math.round((mgr.totalPoints / maxPoints) * 100)
          const isLeader = i === 0
          const topTeam = mgr.topTeam

          return (
            <button
              key={mgr.name}
              onClick={() => onSelectManager(mgr)}
              style={{
                background: isLeader ? '#181410' : 'var(--bg-card)',
                border: `1px solid ${isLeader ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s'
              }}
              onMouseEnter={e => {
                if (!isLeader) e.currentTarget.style.borderColor = 'var(--border-light)'
                e.currentTarget.style.background = isLeader ? '#1e1810' : 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isLeader ? 'var(--accent)' : 'var(--border)'
                e.currentTarget.style.background = isLeader ? '#181410' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28,
                  fontSize: i < 3 ? 18 : 13,
                  textAlign: 'center',
                  color: i < 3 ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {i < 3 ? MEDAL[i] : `${i + 1}`}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {mgr.name}
                    </span>
                    {topTeam && (
                      <span style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: confStyle(topTeam.conference).bg,
                        border: `1px solid ${confStyle(topTeam.conference).border}`,
                        color: confStyle(topTeam.conference).text,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap'
                      }}>
                        {topTeam.school}
                      </span>
                    )}
                  </div>
                  <div style={{
                    height: 4,
                    background: 'var(--border)',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: isLeader ? 'var(--accent)' : 'var(--text-muted)',
                      borderRadius: 2,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 20,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em',
                    color: isLeader ? 'var(--accent)' : 'var(--text-primary)'
                  }}>
                    {mgr.totalPoints.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    pts
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 5,
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid var(--border)'
              }}>
                {mgr.teams.map(t => (
                  <span key={t.school} style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: t.points > 0 ? 'var(--text-secondary)' : 'var(--text-muted)'
                  }}>
                    {t.school} <span style={{ color: t.points >= 100 ? 'var(--green)' : 'var(--text-muted)' }}>
                      {t.points}
                    </span>
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
        Click any manager to see their full team breakdown
      </div>
    </div>
  )
}
