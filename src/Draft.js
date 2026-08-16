import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

// ── Draft order — edit names here before the draft ──────────
const DRAFT_ORDER = [
  'Nick', 'Jack', 'Aaron', 'Griffin', 'Jake', 'Zach',
  'Sean', 'Austin', 'Peter', 'Adam', 'Marc', 'Brad'
]

const TOTAL_ROUNDS = 8
const SEASON = 2026

const SLOT_LABELS = ['ACC', 'Big 12', 'Big Ten', 'SEC', 'Flex', 'Flex', 'Flex', 'Flex']

const CONFERENCES = {
  'SEC': [
    { school: 'Alabama', id: 333 }, { school: 'Arkansas', id: 8 },
    { school: 'Auburn', id: 2 }, { school: 'Florida', id: 57 },
    { school: 'Georgia', id: 61 }, { school: 'Kentucky', id: 96 },
    { school: 'LSU', id: 99 }, { school: 'Mississippi St', id: 344 },
    { school: 'Missouri', id: 142 }, { school: 'Ole Miss', id: 145 },
    { school: 'South Carolina', id: 2579 }, { school: 'Tennessee', id: 2633 },
    { school: 'Texas A&M', id: 245 }, { school: 'Vanderbilt', id: 238 },
    { school: 'Oklahoma', id: 201 }, { school: 'Texas', id: 251 },
  ],
  'Big Ten': [
    { school: 'Illinois', id: 356 }, { school: 'Indiana', id: 84 },
    { school: 'Iowa', id: 2294 }, { school: 'Maryland', id: 120 },
    { school: 'Michigan', id: 130 }, { school: 'Michigan St', id: 127 },
    { school: 'Minnesota', id: 135 }, { school: 'Nebraska', id: 158 },
    { school: 'Northwestern', id: 77 }, { school: 'Ohio St', id: 194 },
    { school: 'Oregon', id: 2483 }, { school: 'Penn St', id: 213 },
    { school: 'Purdue', id: 2509 }, { school: 'Rutgers', id: 2440 },
    { school: 'UCLA', id: 26 }, { school: 'USC', id: 30 },
    { school: 'Washington', id: 264 }, { school: 'Wisconsin', id: 275 },
  ],
  'Big 12': [
    { school: 'Arizona', id: 12 }, { school: 'Arizona St', id: 9 },
    { school: 'Baylor', id: 239 }, { school: 'BYU', id: 252 },
    { school: 'Cincinnati', id: 2132 }, { school: 'Colorado', id: 38 },
    { school: 'Houston', id: 248 }, { school: 'Iowa St', id: 66 },
    { school: 'Kansas', id: 2305 }, { school: 'Kansas St', id: 2306 },
    { school: 'Oklahoma St', id: 197 }, { school: 'TCU', id: 2628 },
    { school: 'Texas Tech', id: 2641 }, { school: 'UCF', id: 2116 },
    { school: 'Utah', id: 254 }, { school: 'West Virginia', id: 277 },
  ],
  'ACC': [
    { school: 'Boston College', id: 103 }, { school: 'Cal', id: 25 },
    { school: 'Clemson', id: 228 }, { school: 'Duke', id: 150 },
    { school: 'Florida St', id: 52 }, { school: 'Georgia Tech', id: 59 },
    { school: 'Louisville', id: 97 }, { school: 'Miami', id: 2390 },
    { school: 'NC State', id: 152 }, { school: 'Notre Dame', id: 87 },
    { school: 'Pitt', id: 221 }, { school: 'SMU', id: 2567 },
    { school: 'Stanford', id: 24 }, { school: 'Syracuse', id: 183 },
    { school: 'UNC', id: 153 }, { school: 'Virginia', id: 258 },
    { school: 'Virginia Tech', id: 259 }, { school: 'Wake Forest', id: 2447 },
  ],
  'AAC': [
    { school: 'Army', id: 349 }, { school: 'Charlotte', id: 2429 },
    { school: 'East Carolina', id: 151 }, { school: 'Florida Atlantic', id: 2226 },
    { school: 'Memphis', id: 235 }, { school: 'Navy', id: 2426 },
    { school: 'North Texas', id: 2377 }, { school: 'Rice', id: 242 },
    { school: 'Temple', id: 218 }, { school: 'Tulane', id: 2655 },
    { school: 'Tulsa', id: 202 }, { school: 'UAB', id: 5 },
    { school: 'USF', id: 58 }, { school: 'UTSA', id: 2638 },
  ],
  'Mountain West': [
    { school: 'Air Force', id: 2005 }, { school: 'Hawaii', id: 62 },
    { school: 'Nevada', id: 2440 }, { school: 'New Mexico', id: 2442 },
    { school: 'North Dakota St', id: 2449 }, { school: 'Northern Illinois', id: 2459 },
    { school: 'San Jose St', id: 23 }, { school: 'UNLV', id: 2439 },
    { school: 'UTEP', id: 2472 }, { school: 'Wyoming', id: 2751 },
  ],
  'Sun Belt': [
    { school: 'App St', id: 2026 }, { school: 'Arkansas St', id: 2032 },
    { school: 'Coastal Carolina', id: 324 }, { school: 'Georgia Southern', id: 290 },
    { school: 'Georgia St', id: 2247 }, { school: 'James Madison', id: 256 },
    { school: 'Louisiana', id: 309 }, { school: 'Louisiana Tech', id: 2348 },
    { school: 'Marshall', id: 276 }, { school: 'Old Dominion', id: 2055 },
    { school: 'South Alabama', id: 6 }, { school: 'Southern Miss', id: 2572 },
    { school: 'Troy', id: 2653 }, { school: 'UL Monroe', id: 2433 },
  ],
  'MAC': [
    { school: 'Akron', id: 2006 }, { school: 'Ball St', id: 2050 },
    { school: 'Bowling Green', id: 189 }, { school: 'Buffalo', id: 2084 },
    { school: 'Central Michigan', id: 2117 }, { school: 'Eastern Michigan', id: 2199 },
    { school: 'Kent St', id: 2309 }, { school: 'Massachusetts', id: 113 },
    { school: 'Miami OH', id: 193 }, { school: 'Ohio', id: 195 },
    { school: 'Sacramento St', id: 2534 }, { school: 'Toledo', id: 2649 },
    { school: 'Western Michigan', id: 2711 },
  ],
  'CUSA': [
    { school: 'Delaware', id: 48 }, { school: 'FIU', id: 2229 },
    { school: 'Jacksonville St', id: 55 }, { school: 'Kennesaw St', id: 2908 },
    { school: 'Liberty', id: 2335 }, { school: 'Middle Tennessee', id: 2393 },
    { school: 'Missouri St', id: 2623 }, { school: 'New Mexico St', id: 2443 },
    { school: 'Sam Houston', id: 2534 }, { school: 'Western Kentucky', id: 98 },
  ],
  'Pac-12': [
    { school: 'Boise St', id: 68 }, { school: 'Colorado St', id: 36 },
    { school: 'Fresno St', id: 278 }, { school: 'Oregon St', id: 204 },
    { school: 'San Diego St', id: 21 }, { school: 'Texas St', id: 326 },
    { school: 'Utah St', id: 328 }, { school: 'Washington St', id: 265 },
  ],
  'Independents': [
    { school: 'Connecticut', id: 2117 },
  ],
}

const POWER4 = new Set(['SEC', 'Big Ten', 'Big 12', 'ACC'])

function logoUrl(id) {
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`
}

function getPickInfo(pickNum) {
  const totalManagers = DRAFT_ORDER.length
  const round = Math.floor((pickNum - 1) / totalManagers)
  const posInRound = (pickNum - 1) % totalManagers
  const isEvenRound = round % 2 === 1
  const managerIdx = isEvenRound ? (totalManagers - 1 - posInRound) : posInRound
  return { manager: DRAFT_ORDER[managerIdx], round, managerIdx }
}

export default function Draft() {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const searchRef = useRef(null)

  const totalPicks = DRAFT_ORDER.length * TOTAL_ROUNDS
  const currentPickNum = picks.length + 1
  const isDraftComplete = currentPickNum > totalPicks
  const currentPickInfo = isDraftComplete ? null : getPickInfo(currentPickNum)
  const currentManager = currentPickInfo?.manager

  const draftedSchools = new Set(picks.map(p => p.school))

  const rosters = {}
  DRAFT_ORDER.forEach(m => { rosters[m] = [] })
  picks.forEach(p => { rosters[p.manager].push(p) })

  const allTeams = Object.entries(CONFERENCES).flatMap(([conf, teams]) =>
    teams.map(t => ({ ...t, conference: conf }))
  )

  useEffect(() => { loadPicks() }, [])

  async function loadPicks() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('draft_picks')
        .select('*')
        .eq('season', SEASON)
        .order('pick_number', { ascending: true })
      if (data) {
        setPicks(data.map(d => ({
          pickNum: d.pick_number,
          manager: d.manager_name,
          school: d.school,
          slotLabel: d.slot_label,
        })))
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    if (!search.trim()) { setSearchResult(null); return }
    const q = search.trim().toLowerCase()
    const match = allTeams.find(t =>
      t.school.toLowerCase().startsWith(q) && !draftedSchools.has(t.school)
    ) || allTeams.find(t =>
      t.school.toLowerCase().includes(q) && !draftedSchools.has(t.school)
    )
    setSearchResult(match || null)
  }, [search, picks])

  async function makePick(school, teamId) {
    if (!currentManager || draftedSchools.has(school)) return
    const round = currentPickInfo.round
    const slotLabel = SLOT_LABELS[round] || 'Flex'
    const newPick = { pickNum: currentPickNum, manager: currentManager, school, slotLabel }

    setPicks(prev => [...prev, newPick])
    setSearch('')
    setSearchResult(null)
    if (searchRef.current) searchRef.current.focus()

    try {
      await supabase.from('draft_picks').insert({
        season: SEASON, pick_number: currentPickNum,
        manager_name: currentManager, school,
        slot_label: slotLabel, team_espn_id: teamId,
      })
      const { data: teamData } = await supabase.from('Teams').select('id').eq('school', school).single()
      const { data: mgrData } = await supabase.from('Managers').select('id').eq('name', currentManager).single()
      if (teamData && mgrData) {
        await supabase.from('Managers_Teams').insert({
          season: SEASON, manager_id: mgrData.id, team_id: teamData.id,
        })
      }
    } catch (e) { console.error('Write error:', e) }
  }

  async function undoLastPick() {
    if (picks.length === 0) return
    const last = picks[picks.length - 1]
    setPicks(prev => prev.slice(0, -1))
    try {
      await supabase.from('draft_picks').delete().eq('season', SEASON).eq('pick_number', last.pickNum)
      const { data: teamData } = await supabase.from('Teams').select('id').eq('school', last.school).single()
      const { data: mgrData } = await supabase.from('Managers').select('id').eq('name', last.manager).single()
      if (teamData && mgrData) {
        await supabase.from('Managers_Teams').delete()
          .eq('season', SEASON).eq('manager_id', mgrData.id).eq('team_id', teamData.id)
      }
    } catch (e) { console.error(e) }
  }

  async function resetDraft() {
    if (!window.confirm('Reset the entire draft? This cannot be undone.')) return
    setPicks([])
    try {
      await supabase.from('draft_picks').delete().eq('season', SEASON)
      await supabase.from('Managers_Teams').delete().eq('season', SEASON)
    } catch (e) { console.error(e) }
  }

  const progressPct = Math.round((picks.length / totalPicks) * 100)
  const G = { fontFamily: "'Barlow Condensed', sans-serif" }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: '#f2f2f7', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '2px solid #c9920e', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...G, fontSize: 18, fontWeight: 900, color: '#c9920e', letterSpacing: '0.08em' }}>2026 CFB Fantasy Draft</div>
          <div style={{ fontSize: 10, color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Road to Glory</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={undoLastPick} disabled={picks.length === 0}
            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #c9920e', background: 'white', color: '#c9920e', cursor: picks.length === 0 ? 'not-allowed' : 'pointer', opacity: picks.length === 0 ? 0.4 : 1 }}>
            ↩ Undo last
          </button>
          <button onClick={resetDraft}
            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #c0392b', background: 'white', color: '#c0392b', cursor: 'pointer' }}>
            ↺ Reset draft
          </button>
        </div>
      </div>

      {/* Pick bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5ea', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 52, zIndex: 99, flexWrap: 'wrap' }}>
        {!isDraftComplete ? (
          <div style={{ background: '#fdf6e3', border: '1px solid #e5c96a', borderRadius: 8, padding: '5px 14px', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c9920e' }}>Now picking</div>
            <div style={{ ...G, fontSize: 20, fontWeight: 900, color: '#1c1c1e', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
              {currentManager} <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400 }}>· Pick #{currentPickNum} · Round {currentPickInfo.round + 1}</span>
            </div>
          </div>
        ) : (
          <div style={{ background: '#eaf5ec', border: '1px solid #2d7a3a', borderRadius: 8, padding: '5px 14px' }}>
            <div style={{ ...G, fontSize: 18, fontWeight: 900, color: '#2d7a3a' }}>Draft Complete!</div>
          </div>
        )}

        {!isDraftComplete && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Type to search for ${currentManager || ''}'s pick...`}
              autoFocus
              style={{ flex: 1, height: 36, border: '1px solid #c9920e', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none' }}
            />
            {searchResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fdf6e3', border: '1px solid #e5c96a', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                <img src={logoUrl(searchResult.id)} alt={searchResult.school} width={24} height={24} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                <span style={{ ...G, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e' }}>{searchResult.school}</span>
                <span style={{ fontSize: 10, color: '#8e8e93' }}>{searchResult.conference}</span>
                <button
                  onClick={() => makePick(searchResult.school, searchResult.id)}
                  style={{ background: '#c9920e', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', ...G, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Draft Team
                </button>
              </div>
            )}
            {search.trim() && !searchResult && (
              <div style={{ fontSize: 11, color: '#c0392b' }}>No available teams match</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 100, height: 4, background: '#f2f2f7', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: '#c9920e', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, color: '#8e8e93', whiteSpace: 'nowrap' }}>{picks.length}/{totalPicks}</div>
        </div>
      </div>

      <div style={{ padding: '10px 12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>Loading draft...</div>
        ) : (
          <>
            {/* Roster grid */}
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 900, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 60, background: '#1c1c1e', color: '#c9920e', ...G, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 4px', border: '1px solid #333', textAlign: 'center' }}></th>
                    {DRAFT_ORDER.map(m => (
                      <th key={m} style={{ background: currentManager === m ? '#fdf6e3' : '#1c1c1e', color: '#c9920e', ...G, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 4px', border: currentManager === m ? '2px solid #c9920e' : '1px solid #333', textAlign: 'center' }}>
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLOT_LABELS.map((slot, rowIdx) => (
                    <tr key={rowIdx}>
                      <td style={{ background: '#f2f2f7', fontSize: 9, fontWeight: 600, color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 4, border: '1px solid #e5e5ea', textAlign: 'center' }}>
                        {slot}
                      </td>
                      {DRAFT_ORDER.map(m => {
                        const pick = rosters[m][rowIdx]
                        const tid = allTeams.find(t => t.school === pick?.school)?.id
                        return (
                          <td key={m} style={{ border: '1px solid #e5e5ea', padding: 3, textAlign: 'center', background: 'white', height: 38, verticalAlign: 'middle' }}>
                            {pick ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                <img src={logoUrl(tid)} alt={pick.school} width={20} height={20} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                                <div style={{ ...G, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e', lineHeight: 1 }}>{pick.school}</div>
                              </div>
                            ) : (
                              <div style={{ width: 24, height: 24, borderRadius: 4, border: '1px dashed #d1d1d6', margin: '0 auto' }} />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pick log */}
            {picks.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8e8e93', marginBottom: 6 }}>Pick log</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {picks.map(p => (
                    <div key={p.pickNum} style={{ fontSize: 10, background: '#f2f2f7', borderRadius: 4, padding: '2px 7px', color: '#3c3c43' }}>
                      <span style={{ color: '#c9920e', fontWeight: 600 }}>#{p.pickNum} {p.manager}</span> — {p.school}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team board by conference */}
            {Object.entries(CONFERENCES).map(([conf, teams]) => (
              <div key={conf} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ ...G, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', color: 'white', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', background: POWER4.has(conf) ? '#c9920e' : '#636366' }}>
                    {conf}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 4 }}>
                  {teams.map(team => {
                    const drafted = draftedSchools.has(team.school)
                    const owner = picks.find(p => p.school === team.school)?.manager
                    const isMatch = searchResult?.school === team.school
                    return (
                      <div key={team.school}
                        onClick={() => !drafted && !isDraftComplete && makePick(team.school, team.id)}
                        style={{
                          background: drafted ? '#f2f2f7' : isMatch ? '#fdf6e3' : 'white',
                          border: `1px solid ${isMatch ? '#c9920e' : '#e5e5ea'}`,
                          borderRadius: 6, padding: '5px 4px',
                          cursor: drafted || isDraftComplete ? 'default' : 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                          opacity: drafted ? 0.5 : 1, minHeight: 56, justifyContent: 'center',
                        }}>
                        <img src={logoUrl(team.id)} alt={team.school} width={28} height={28} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                        <div style={{ ...G, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e', textAlign: 'center', lineHeight: 1.1 }}>{team.school}</div>
                        {owner && <div style={{ fontSize: 8, color: '#c9920e', fontWeight: 600 }}>{owner}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
