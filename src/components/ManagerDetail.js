import React, { useState } from 'react'
import { ConferenceLogo } from './conferenceLogo'

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

function getRankSuffix(n) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

function TeamRow({ team }) {
  const [open, setOpen] = useState(false)
  const logoUrl = teamLogoUrl(team.school)

  return (
    <div style={{ borderBottom: '0.5px solid var(--border)' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 0',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: 32, height: 32,
          borderRadius: 6,
          background: '#f2f2f7',
          border: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden'
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={team.school}
              style={{ width: 24, height: 24, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <span style={{ fontSize: 7, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#c9920e' }}>
              {team.school?.substring(0, 4).toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {team.school}
            </span>
            <ConferenceLogo conference={team.conference} size={16} />
          </div>
          {team.rival_1 && (
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              Rivals: {team.rival_1} · {team.rival_2}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 900,
            color: '#c9920e',
            letterSpacing: '0.02em'
          }}>
            {team.points}
          </span>
          <span style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>›</span>
        </div>
      </div>

      {open && (
        <div style={{
          background: '#fafafa',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 10,
          border: '0.5px solid var(--border)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Conference</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ConferenceLogo conference={team.conference} size={18} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{team.conference}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Points earned</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#c9920e' }}>{team.points}</div>
            </div>
            {team.rival_1 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Designated rivals</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[team.rival_1, team.rival_2].map(rival => (
                    <div key={rival} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'white', border: '0.5px solid var(--border)',
                      borderRadius: 6, padding: '4px 8px'
                    }}>
                      {teamLogoUrl(rival) && (
                        <img
                          src={teamLogoUrl(rival)}
                          alt={rival}
                          style={{ width: 18, height: 18, objectFit: 'contain' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
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

export default function ManagerDetail({ manager, rank, totalManagers, onBack, season }) {
  const totalPoints = manager.totalPoints

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 14px',
          fontSize: 12,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        ← All managers
      </button>

      <div style={{
        background: 'var(--bg-card)',
        border: '1.5px solid #c9920e',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: '#c9920e'
        }} />
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 900,
            color: 'var(--text-primary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1
          }}>
            {manager.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5 }}>
            {rank}{getRankSuffix(rank)} place of {totalManagers} managers · {season} season
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 44,
            fontWeight: 900,
            color: rank === 1 ? '#c9920e' : 'var(--text-primary)',
            letterSpacing: '0.02em',
            lineHeight: 1
          }}>
            {totalPoints.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            total points
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0 16px',
        marginBottom: 12
      }}>
        <div style={{
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600
        }}>
          Team breakdown — tap to expand
        </div>
        {manager.teams.map((team) => (
          <TeamRow key={team.school} team={team} />
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600
        }}>
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
            <div key={i} style={{
              padding: '9px 16px',
              borderBottom: i < 10 ? '0.5px solid var(--border)' : 'none',
              borderRight: i % 2 === 0 ? '0.5px solid var(--border)' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: item.pts >= 50 ? '#c9920e' : 'var(--text-primary)'
              }}>
                {item.pts}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
