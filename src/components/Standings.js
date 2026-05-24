import React, { useState } from 'react'
import { ConferenceLogo } from './conferenceLogo'

const MEDAL = ['🥇', '🥈', '🥉']

const TEAM_ESPN_IDS = {
  'Indiana': 84, 'Boise St': 68, 'Toledo': 2649, 'Clemson': 228,
  'Louisiana': 309, 'UCF': 2116, 'Mississippi St': 344, 'Michigan St': 127,
  'Miami': 2390, 'Vanderbilt': 238, 'Cincinnati': 2132, 'Cal': 25,
  'Texas St': 326, 'Florida': 57, 'Bowling Green': 189, 'UCLA': 26,
  'Ohio St': 194, 'Duke': 150, 'NC State': 152, 'USF': 58,
  'Memphis': 235, 'Kansas St': 2306, 'Boston College': 103, 'South Carolina': 2579,
  'UTSA': 2638, 'USC': 30, 'LSU': 99, 'Baylor': 239,
  'Liberty': 2335, 'San Jose St': 23, 'Northern Illinois': 2459, 'Virginia Tech': 259,
  'Ole Miss': 145, 'BYU': 252, 'Oklahoma': 201, 'Michigan': 130,
  'Stanford': 24, 'Auburn': 2, 'Wisconsin': 275, 'Colorado': 38,
  'James Madison': 256, 'Jacksonville St': 55, 'Texas A&M': 245, 'Navy': 2426,
  'Minnesota': 135, 'Notre Dame': 87, 'Georgia Tech': 59, 'West Virginia': 277,
  'Georgia': 61, 'Ohio': 195, 'Hawaii': 62, 'Iowa St': 66,
  'Nebraska': 158, 'Florida St': 52, 'Kansas': 2305, 'South Alabama': 6,
  'Houston': 248, 'Iowa': 2294, 'Missouri': 142, 'Arizona St': 9,
  'UTEP': 2638, 'Syracuse': 183, 'Colorado St': 36, 'Arkansas': 8,
  'Texas Tech': 2641, 'Oregon': 2483, 'Tulane': 2116, 'UNLV': 2439,
  'Louisiana Tech': 2348, 'Pitt': 221, 'Tennessee': 2633, 'Buffalo': 2084,
  'Utah': 254, 'Louisville': 97, 'Troy': 2653, 'Fresno St': 278,
  'Penn St': 213, 'Kentucky': 96, 'App St': 2026, 'Marshall': 276,
  'Texas': 251, 'TCU': 2628, 'Washington': 264, 'SMU': 2567,
  'Washington St': 265, 'Arizona': 12, 'Coastal Carolina': 324, 'Oregon St': 204,
  'Alabama': 333, 'Illinois': 356, 'Miami OH': 193, 'Western Kentucky': 98,
  'Georgia Southern': 290, 'Air Force': 2005, 'UNC': 153, 'Oklahoma St': 197,
}

function teamLogoUrl(school) {
  const id = TEAM_ESPN_IDS[school]
  if (!id) return null
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`
}

function TeamLogo({ school, size = 22 }) {
  const url = teamLogoUrl(school)
  return (
    <div style={{
      width: size + 8, height: size + 8,
      borderRadius: 6,
      background: '#f2f2f7',
      border: '0.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden'
    }}>
      {url ? (
        <img src={url} alt={school}
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <span style={{ fontSize: 7, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#c9920e' }}>
          {school?.substring(0, 4).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function TeamRow({ team }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '0.5px solid var(--border)' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 0', cursor: 'pointer'
        }}
      >
        {/* Larger logo box aligned with standings */}
        <TeamLogo school={team.school} size={26} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900,
              color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase'
            }}>
              {team.school}
            </span>
            {team.conference !== 'Independent' && (
              <ConferenceLogo conference={team.conference} size={14} />
            )}
          </div>
          {/* Record and upcoming opponent — shown during season, off-season message otherwise */}
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {team.record
              ? `${team.record}${team.nextOpponent ? ` · Next: ${team.nextOpponent}` : ''}`
              : 'Off-season'
            }
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900,
            color: '#1c1c1e', letterSpacing: '0.02em'
          }}>
            {team.points}
          </span>
          <span style={{
            fontSize: 11, color: 'var(--text-muted)',
            display: 'inline-block', transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>›</span>
        </div>
      </div>

      {open && (
        <div style={{
          background: '#fafafa', borderRadius: 8, padding: '10px 12px',
          marginBottom: 10, border: '0.5px solid var(--border)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Conference</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {team.conference !== 'Independent'
                  ? <ConferenceLogo conference={team.conference} size={16} />
                  : null
                }
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{team.conference}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Points earned</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#1c1c1e' }}>{team.points}</div>
            </div>
            {team.rival_1 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Designated rivals</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[team.rival_1, team.rival_2].map(rival => (
                    <div key={rival} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'white', border: '0.5px solid var(--border)',
                      borderRadius: 6, padding: '4px 8px'
                    }}>
                      {teamLogoUrl(rival) && (
                        <img src={teamLogoUrl(rival)} alt={rival}
                          style={{ width: 16, height: 16, objectFit: 'contain' }}
                          onError={e => { e.target.style.display = 'none' }} />
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{rival}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ManagerRow({ mgr, rank, maxPoints }) {
  const [open, setOpen] = useState(false)
  const isLeader = rank === 1
  const barWidth = Math.round((mgr.totalPoints / maxPoints) * 100)
  const topTeam = mgr.topTeam
  const logoUrl = topTeam ? teamLogoUrl(topTeam.school) : null

  // Count teams projected in CFP top 12 (placeholder — will be live during season)
  const cfpCount = mgr.teams.filter(t => t.cfpProjected).length

  return (
    <div style={{
      background: isLeader ? '#fdf8ef' : 'var(--bg-card)',
      border: `1.5px solid ${isLeader ? '#c9920e' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {isLeader && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c9920e' }} />
      )}

      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', cursor: 'pointer' }}
      >
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: rank <= 3 ? 16 : 14, fontWeight: 900,
          color: isLeader ? '#c9920e' : 'var(--text-muted)', width: 18, textAlign: 'center', flexShrink: 0
        }}>
          {rank <= 3 ? MEDAL[rank - 1] : rank}
        </div>

        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
          background: isLeader ? '#fdf6e3' : '#f2f2f7',
          border: `0.5px solid ${isLeader ? '#e5c96a' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden'
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt={topTeam?.school}
              style={{ width: 26, height: 26, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <span style={{ fontSize: 8, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#c9920e' }}>
              {topTeam?.school?.substring(0, 4).toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900,
            color: 'var(--text-primary)', letterSpacing: '0.06em',
            textTransform: 'uppercase', lineHeight: 1, marginBottom: 4
          }}>
            {mgr.name}
          </div>
          {/* CFP projection dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i < cfpCount ? '#c9920e' : '#e5e5ea',
                flexShrink: 0
              }} />
            ))}
            <span style={{ fontSize: 9, color: 'var(--text-secondary)', marginLeft: 2 }}>
              {cfpCount === 0 ? 'No teams projected CFP' : `${cfpCount} team${cfpCount > 1 ? 's' : ''} projected CFP`}
            </span>
          </div>
          <div style={{ height: 3, background: '#f2f2f7', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 2, background: isLeader ? '#c9920e' : '#e5e5ea' }} />
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900,
            color: '#1c1c1e', lineHeight: 1
          }}>
            {mgr.totalPoints.toLocaleString()}
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>pts</div>
        </div>

        <span style={{
          color: 'var(--text-muted)', fontSize: 12, flexShrink: 0,
          display: 'inline-block', transition: 'transform 0.2s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>›</span>
      </div>

      {open && (
        <div style={{ padding: '0 13px 10px 40px', borderTop: '0.5px solid var(--border)' }}>
          {mgr.teams.map(team => (
            <TeamRow key={team.school} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Standings({ standings, maxPoints, season }) {
  if (standings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
        No data found for the {season} season.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Leader', value: standings[0]?.name, sub: `${standings[0]?.totalPoints?.toLocaleString()} pts` },
          { label: 'Current week', value: 'Off-season', sub: '2025 final standings' },
          { label: 'Top team', value: standings[0]?.topTeam?.school, sub: `${standings[0]?.topTeam?.points} pts` },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#c9920e' }} />
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Standings</span>
        <div style={{ flex: 1, height: 0.5, background: 'var(--border-light)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {standings.map((mgr, i) => (
          <ManagerRow key={mgr.name} mgr={mgr} rank={i + 1} maxPoints={maxPoints} />
        ))}
      </div>

      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
        Tap any manager to expand their full roster
      </div>
    </div>
  )
}
