import React from 'react'

const MEDAL = ['🥇', '🥈', '🥉']

const TEAM_ESPN_IDS = {
  'Indiana': 84, 'Boise St': 68, 'Toledo': 252, 'Clemson': 228,
  'Louisiana': 309, 'UCF': 2116, 'Mississippi St': 344, 'Michigan St': 127,
  'Miami': 2390, 'Vanderbilt': 238, 'Cincinnati': 2132, 'Cal': 25,
  'Texas St': 326, 'Florida': 57, 'Bowling Green': 189, 'UCLA': 26,
  'Ohio St': 194, 'Duke': 150, 'NC St': 152, 'USF': 58,
  'Memphis': 235, 'Kansas St': 2306, 'Boston College': 103, 'South Carolina': 2579,
  'UTSA': 2638, 'USC': 30, 'LSU': 99, 'Baylor': 239,
  'Liberty': 2335, 'San Jose St': 23, 'Northern Illinois': 2459, 'Virginia Tech': 259,
  'Ole Miss': 145, 'BYU': 252, 'Oklahoma': 201, 'Michigan': 130,
  'Stanford': 24, 'Auburn': 2, 'Wisconsin': 275, 'Colorado': 38,
  'James Madison': 2977, 'Jacksonville St': 55, 'Texas A&M': 245, 'Navy': 2426,
  'Minnesota': 135, 'Notre Dame': 87, 'Georgia Tech': 59, 'West Virginia': 277,
  'Georgia': 61, 'Ohio': 197, 'Hawaii': 62, 'Iowa St': 66,
  'Nebraska': 158, 'Florida St': 52, 'Kansas': 2305, 'South Alabama': 6,
  'Houston': 248, 'Iowa': 2294, 'Missouri': 142, 'Arizona St': 9,
  'UTEP': 2638, 'Syracuse': 183, 'Colorado St': 36, 'Arkansas': 8,
  'Texas Tech': 2641, 'Oregon': 2483, 'Tulane': 2116, 'UNLV': 2439,
  'Louisiana Tech': 2338, 'Pitt': 221, 'Tennessee': 2633, 'Buffalo': 2084,
  'Utah': 254, 'Louisville': 97, 'Troy': 231, 'Fresno St': 278,
  'Penn St': 213, 'Kentucky': 96, 'App St': 2026, 'Marshall': 276,
  'Texas': 251, 'TCU': 2628, 'Washington': 264, 'SMU': 2567,
  'Washington St': 265, 'Arizona': 12, 'Coastal Carolina': 324, 'Oregon St': 204,
  'Alabama': 333, 'Illinois': 356, 'Miami OH': 193, 'Western Kentucky': 2729,
  'Georgia Southern': 290, 'Air Force': 2005, 'UNC': 153, 'Oklahoma St': 197,
  'NC State': 152,
}

function teamLogoUrl(school) {
  const id = TEAM_ESPN_IDS[school]
  if (!id) return null
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`
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
        marginBottom: 24
      }}>
        {[
          { label: 'Leader', value: standings[0]?.name, sub: `${standings[0]?.totalPoints?.toLocaleString()} pts` },
          { label: 'Current week', value: 'Off-season', sub: '2025 final standings' },
          { label: 'Top team', value: standings[0]?.topTeam?.school, sub: `${standings[0]?.topTeam?.points} pts` },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: '#c9920e'
            }} />
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Standings
        </span>
        <div style={{ flex: 1, height: 0.5, background: 'var(--border-light)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {standings.map((mgr, i) => {
          const barWidth = Math.round((mgr.totalPoints / maxPoints) * 100)
          const isLeader = i === 0
          const topTeam = mgr.topTeam
          const logoUrl = topTeam ? teamLogoUrl(topTeam.school) : null

          return (
            <button
              key={mgr.name}
              onClick={() => onSelectManager(mgr)}
              style={{
                background: isLeader ? '#fdf8ef' : 'var(--bg-card)',
                border: `1.5px solid ${isLeader ? '#c9920e' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '11px 13px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isLeader && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: '#c9920e'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: i < 3 ? 16 : 14,
                  fontWeight: 900,
                  color: isLeader ? '#c9920e' : 'var(--text-muted)',
                  width: 18,
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {i < 3 ? MEDAL[i] : `${i + 1}`}
                </div>

                <div style={{
                  width: 36, height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: isLeader ? '#fdf6e3' : '#f2f2f7',
                  border: `0.5px solid ${isLeader ? '#e5c96a' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden'
                }}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={topTeam?.school}
                      style={{ width: 26, height: 26, objectFit: 'contain' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <span style={{ fontSize: 8, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#c9920e' }}>
                      {topTeam?.school?.substring(0, 4).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    marginBottom: 5
                  }}>
                    {mgr.name}
                  </div>
                  <div style={{ height: 3, background: '#f2f2f7', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      borderRadius: 2,
                      background: isLeader ? '#c9920e' : '#e5e5ea'
                    }} />
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 900,
                    color: isLeader ? '#c9920e' : 'var(--text-muted)',
                    lineHeight: 1
                  }}>
                    {mgr.totalPoints.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    pts
                  </div>
                </div>

                <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>›</span>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
        Tap any manager to expand their full roster
      </div>
    </div>
  )
}
