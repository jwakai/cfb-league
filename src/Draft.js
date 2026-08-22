import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

// ── Draft order — edit names here before the draft ──────────
const DRAFT_ORDER = [
  'Nick', 'Jack', 'Aaron', 'Griffin', 'Jake', 'Zach',
  'Sean', 'Austin', 'Peter', 'Adam', 'Marc', 'Brad'
]

const TOTAL_ROUNDS = 8
const SEASON = 2026

// Slot labels for the roster grid rows
const SLOT_LABELS = ['ACC', 'Big 12', 'Big Ten', 'SEC', 'Flex', 'Flex', 'Flex', 'Flex']

// Power 4 conferences that have required slots
const REQUIRED_CONF_SLOTS = { 'ACC': 0, 'Big 12': 1, 'Big Ten': 2, 'SEC': 3 }

// ── ESPN ID fixes ────────────────────────────────────────────
const CONFERENCES = {
  'SEC': [
    { school: 'Alabama', id: 333 }, { school: 'Arkansas', id: 8 },
    { school: 'Auburn', id: 2 }, { school: 'Florida', id: 57 },
    { school: 'Georgia', id: 61 }, { school: 'Kentucky', id: 96 },
    { school: 'LSU', id: 99 }, { school: 'Mississippi St', id: 344 },
    { school: 'Missouri', id: 142 }, { school: 'Ole Miss', id: 145 },
    { school: 'Oklahoma', id: 201 }, { school: 'South Carolina', id: 2579 },
    { school: 'Tennessee', id: 2633 }, { school: 'Texas', id: 251 },
    { school: 'Texas A&M', id: 245 }, { school: 'Vanderbilt', id: 238 },
  ],
  'Big Ten': [
    { school: 'Illinois', id: 356 }, { school: 'Indiana', id: 84 },
    { school: 'Iowa', id: 2294 }, { school: 'Maryland', id: 120 },
    { school: 'Michigan', id: 130 }, { school: 'Michigan St', id: 127 },
    { school: 'Minnesota', id: 135 }, { school: 'Nebraska', id: 158 },
    { school: 'Northwestern', id: 77 }, { school: 'Ohio St', id: 194 },
    { school: 'Oregon', id: 2483 }, { school: 'Penn St', id: 213 },
    { school: 'Purdue', id: 2509 }, { school: 'Rutgers', id: 164 },
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
    { school: 'NC State', id: 152 }, { school: 'Pitt', id: 221 },
    { school: 'SMU', id: 2567 }, { school: 'Stanford', id: 24 },
    { school: 'Syracuse', id: 183 }, { school: 'UNC', id: 153 },
    { school: 'Virginia', id: 258 }, { school: 'Virginia Tech', id: 259 },
    { school: 'Wake Forest', id: 154 },
  ],
  'AAC': [
    { school: 'Army', id: 349 }, { school: 'Charlotte', id: 2429 },
    { school: 'East Carolina', id: 151 }, { school: 'Florida Atlantic', id: 2226 },
    { school: 'Memphis', id: 235 }, { school: 'Navy', id: 2426 },
    { school: 'North Texas', id: 249 }, { school: 'Rice', id: 242 },
    { school: 'Temple', id: 218 }, { school: 'Tulane', id: 2655 },
    { school: 'Tulsa', id: 202 }, { school: 'UAB', id: 5 },
    { school: 'USF', id: 58 }, { school: 'UTSA', id: 2636 },
  ],
  'Mountain West': [
    { school: 'Air Force', id: 2005 }, { school: 'Hawaii', id: 62 },
    { school: 'Nevada', id: 2440 }, { school: 'New Mexico', id: 167 },
    { school: 'North Dakota St', id: 2449 }, { school: 'Northern Illinois', id: 2459 },
    { school: 'San Jose St', id: 23 }, { school: 'UNLV', id: 2439 },
    { school: 'UTEP', id: 2638 }, { school: 'Wyoming', id: 2751 },
  ],
  'Sun Belt': [
    { school: 'App St', id: 2026 }, { school: 'Arkansas St', id: 2032 },
    { school: 'Coastal Carolina', id: 324 }, { school: 'Georgia Southern', id: 290 },
    { school: 'Georgia St', id: 2247 }, { school: 'James Madison', id: 256 },
    { school: 'Louisiana', id: 309 }, { school: 'Louisiana Tech', id: 2348 },
    { school: 'Marshall', id: 276 }, { school: 'Old Dominion', id: 295 },
    { school: 'South Alabama', id: 6 }, { school: 'Southern Miss', id: 2572 },
    { school: 'Troy', id: 2653 }, { school: 'UL Monroe', id: 2433 },
  ],
  'MAC': [
    { school: 'Akron', id: 2006 }, { school: 'Ball St', id: 2050 },
    { school: 'Bowling Green', id: 189 }, { school: 'Buffalo', id: 2084 },
    { school: 'Central Michigan', id: 2117 }, { school: 'Eastern Michigan', id: 2199 },
    { school: 'Kent St', id: 2309 }, { school: 'Massachusetts', id: 113 },
    { school: 'Miami OH', id: 193 }, { school: 'Ohio', id: 195 },
    { school: 'Sacramento St', id: 16 }, { school: 'Toledo', id: 2649 },
    { school: 'Western Michigan', id: 2711 },
  ],
  'CUSA': [
    { school: 'Delaware', id: 48 }, { school: 'FIU', id: 2229 },
    { school: 'Jacksonville St', id: 55 }, { school: 'Kennesaw St', id: 338 },
    { school: 'Liberty', id: 2335 }, { school: 'Middle Tennessee', id: 2393 },
    { school: 'Missouri St', id: 2623 }, { school: 'New Mexico St', id: 166 },
    { school: 'Sam Houston', id: 2534 }, { school: 'Western Kentucky', id: 98 },
  ],
  'Pac-12': [
    { school: 'Boise St', id: 68 }, { school: 'Colorado St', id: 36 },
    { school: 'Fresno St', id: 278 }, { school: 'Oregon St', id: 204 },
    { school: 'San Diego St', id: 21 }, { school: 'Texas St', id: 326 },
    { school: 'Utah St', id: 328 }, { school: 'Washington St', id: 265 },
  ],
  'Independents': [
    { school: 'Connecticut', id: 41 }, { school: 'Notre Dame', id: 87 },
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

// Determine which slot a new pick should go into based on conference
function determineSlot(school, conference, existingManagerPicks) {
  const isPower4 = POWER4.has(conference)
  // Fill the required conference slot first if still empty
  if (isPower4) {
    const slotIdx = REQUIRED_CONF_SLOTS[conference]
    const alreadyHasConf = existingManagerPicks.some(p => p.slotIdx === slotIdx)
    if (!alreadyHasConf) {
      return { slotLabel: conference, slotIdx }
    }
  }
  // Find the next available Flex slot (indices 4, 5, 6, 7)
  const filledSlotIndices = new Set(existingManagerPicks.map(p => p.slotIdx))
  for (let i = 4; i <= 7; i++) {
    if (!filledSlotIndices.has(i)) {
      return { slotLabel: 'Flex', slotIdx: i }
    }
  }
  // All slots filled — fallback
  return { slotLabel: 'Flex', slotIdx: 7 }
}

export default function Draft() {
  const viewOnly = new URLSearchParams(window.location.search).get('view') === 'true'
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

  // Build rosters keyed by slot index for correct grid placement
  const rosters = {}
  DRAFT_ORDER.forEach(m => {
    rosters[m] = Array(TOTAL_ROUNDS).fill(null)
  })
  picks.forEach(p => {
    if (rosters[p.manager] && p.slotIdx !== undefined && p.slotIdx !== null) {
      rosters[p.manager][p.slotIdx] = p
    } else if (rosters[p.manager]) {
      // Fallback: place by pick order within manager
      const mgrPicks = picks.filter(x => x.manager === p.manager)
      const idx = mgrPicks.indexOf(p)
      if (idx >= 0 && idx < TOTAL_ROUNDS) rosters[p.manager][idx] = p
    }
  })

  const allTeams = Object.entries(CONFERENCES).flatMap(([conf, teams]) =>
    teams.map(t => ({ ...t, conference: conf }))
  )

  useEffect(() => {
    loadPicks(true)

    // Real-time subscription — updates all viewers instantly when picks are made
    const channel = supabase
      .channel('draft_picks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'draft_picks', filter: `season=eq.${SEASON}` },
        () => { loadPicks(false) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadPicks(showSpinner = false) {
    if (showSpinner) setLoading(true)
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
          slotIdx: d.slot_idx ?? null,
        })))
      }
    } catch (e) { console.error(e) }
    if (showSpinner) setLoading(false)
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
    const team = allTeams.find(t => t.school === school)
    const conf = team?.conference || ''
    const existingManagerPicks = picks.filter(p => p.manager === currentManager)
    const { slotLabel, slotIdx } = determineSlot(school, conf, existingManagerPicks)
    const round = currentPickInfo.round
    const pickInRound = ((currentPickNum - 1) % DRAFT_ORDER.length) + 1

    const newPick = {
      pickNum: currentPickNum,
      manager: currentManager,
      school,
      slotLabel,
      slotIdx,
      round,
      pickInRound,
    }

    setPicks(prev => [...prev, newPick])
    setSearch('')
    setSearchResult(null)
    if (searchRef.current) searchRef.current.focus()

    try {
      await supabase.from('draft_picks').insert({
        season: SEASON,
        pick_number: currentPickNum,
        manager_name: currentManager,
        school,
        slot_label: slotLabel,
        slot_idx: slotIdx,
        team_espn_id: teamId,
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
  const isMobile = window.innerWidth < 768

  // ── Mobile view-only layout ──────────────────────────────────
  if (viewOnly && isMobile) {
    // Group picks by manager for roster view
    const mgrRosters = {}
    DRAFT_ORDER.forEach(m => { mgrRosters[m] = [] })
    picks.forEach(p => { if (mgrRosters[p.manager]) mgrRosters[p.manager].push(p) })

    return (
      <div style={{ fontFamily: "'Barlow', sans-serif", background: '#f2f2f7', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ background: 'white', borderBottom: '2px solid #c9920e', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ ...G, fontSize: 16, fontWeight: 900, color: '#c9920e', letterSpacing: '0.06em' }}>2026 CFB Fantasy Draft</div>
          <div style={{ fontSize: 10, color: '#8e8e93' }}>{picks.length}/{totalPicks} picks</div>
        </div>

        {/* Now picking bar */}
        <div style={{ background: '#1c1c1e', padding: '10px 16px', position: 'sticky', top: 52, zIndex: 99 }}>
          {!isDraftComplete ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8e8e93', marginBottom: 2 }}>Now On The Clock</div>
                <div style={{ ...G, fontSize: 24, fontWeight: 900, color: '#c9920e', textTransform: 'uppercase', lineHeight: 1 }}>
                  {currentManager}
                </div>
                <div style={{ fontSize: 11, color: '#636366', marginTop: 2 }}>
                  Pick #{currentPickNum} · Round {currentPickInfo.round + 1}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: 80, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: '#c9920e', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: '#636366' }}>{progressPct}% complete</div>
              </div>
            </div>
          ) : (
            <div style={{ ...G, fontSize: 20, fontWeight: 900, color: '#2d7a3a', textAlign: 'center' }}>🏆 Draft Complete!</div>
          )}
        </div>

        <div style={{ padding: '12px 16px 40px' }}>

          {/* Last pick made */}
          {picks.length > 0 && (
            <div style={{ background: '#fdf6e3', border: '1px solid #e5c96a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={logoUrl(allTeams.find(t => t.school === picks[picks.length-1].school)?.id)}
                alt={picks[picks.length-1].school}
                width={40} height={40} style={{ objectFit: 'contain', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8e8e93', marginBottom: 2 }}>Last Pick</div>
                <div style={{ ...G, fontSize: 18, fontWeight: 900, color: '#1c1c1e', textTransform: 'uppercase', lineHeight: 1 }}>
                  {picks[picks.length-1].school}
                </div>
                <div style={{ fontSize: 11, color: '#c9920e', fontWeight: 600, marginTop: 2 }}>
                  {picks[picks.length-1].manager} · #{picks[picks.length-1].pickNum}
                </div>
              </div>
            </div>
          )}

          {/* Rosters by manager — accordion style */}
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8e8e93', marginBottom: 8 }}>
            Rosters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {DRAFT_ORDER.map(mgr => {
              const mgrPicks = mgrRosters[mgr]
              const isOnClock = currentManager === mgr && !isDraftComplete
              return (
                <div key={mgr} style={{
                  background: isOnClock ? '#fdf8ef' : 'white',
                  border: `1.5px solid ${isOnClock ? '#c9920e' : '#e5e5ea'}`,
                  borderRadius: 10, overflow: 'hidden'
                }}>
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isOnClock && <span style={{ fontSize: 16 }}>🟡</span>}
                      <div style={{ ...G, fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: isOnClock ? '#c9920e' : '#1c1c1e', letterSpacing: '0.06em' }}>{mgr}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8e8e93' }}>{mgrPicks.length}/{TOTAL_ROUNDS} picks</div>
                  </div>
                  {mgrPicks.length > 0 && (
                    <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '8px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mgrPicks.map(p => {
                        const tid = allTeams.find(t => t.school === p.school)?.id
                        const rnd = Math.floor((p.pickNum-1)/DRAFT_ORDER.length)+1
                        const pin = ((p.pickNum-1)%DRAFT_ORDER.length)+1
                        return (
                          <div key={p.pickNum} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f2f2f7', borderRadius: 6, padding: '4px 8px' }}>
                            <img src={logoUrl(tid)} alt={p.school} width={20} height={20} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                            <div>
                              <div style={{ ...G, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e', lineHeight: 1 }}>{p.school}</div>
                              <div style={{ fontSize: 8, color: '#8e8e93' }}>{rnd}.{pin}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pick log */}
          {picks.length > 0 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8e8e93', marginBottom: 8 }}>
                Pick Log
              </div>
              <div style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 10, padding: '8px 12px' }}>
                {[...picks].reverse().map((p, i) => {
                  const rnd = Math.floor((p.pickNum-1)/DRAFT_ORDER.length)+1
                  const pin = ((p.pickNum-1)%DRAFT_ORDER.length)+1
                  const tid = allTeams.find(t => t.school === p.school)?.id
                  return (
                    <div key={p.pickNum} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < picks.length-1 ? '0.5px solid #f5f5f5' : 'none' }}>
                      <div style={{ fontSize: 10, color: '#8e8e93', width: 28, flexShrink: 0, fontWeight: 600 }}>{rnd}.{pin}</div>
                      <img src={logoUrl(tid)} alt={p.school} width={24} height={24} style={{ objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...G, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e', lineHeight: 1 }}>{p.school}</div>
                        <div style={{ fontSize: 10, color: '#c9920e', fontWeight: 600 }}>{p.manager}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: '#f2f2f7', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '2px solid #c9920e', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...G, fontSize: 18, fontWeight: 900, color: '#c9920e', letterSpacing: '0.08em' }}>2026 CFB Fantasy Draft</div>
          <div style={{ fontSize: 10, color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Road to Glory</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={undoLastPick} disabled={picks.length === 0 || viewOnly}
            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #c9920e', background: 'white', color: '#c9920e', cursor: (picks.length === 0 || viewOnly) ? 'not-allowed' : 'pointer', opacity: (picks.length === 0 || viewOnly) ? 0.4 : 1 }}>
            ↩ Undo last
          </button>
          <button onClick={resetDraft}
            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #c0392b', background: 'white', color: '#c0392b', cursor: 'pointer' }}>
            ↺ Reset draft
          </button>
        </div>
      </div>


      {/* View-only banner */}
      {viewOnly && (
        <div style={{ background: '#1c1c1e', borderBottom: '1px solid #333', padding: '6px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            👁 View Only Mode — Contact the commissioner to submit your pick
          </span>
        </div>
      )}
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

        {!isDraftComplete && !viewOnly && (
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

      {/* Main content + fixed pick log */}
      <div style={{ display: 'flex', position: 'relative' }}>

        {/* Left: board + team grid */}
        <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
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
                        <th key={m} style={{ background: currentManager === m ? '#fdf6e3' : '#1c1c1e', color: currentManager === m ? '#c9920e' : '#c9920e', ...G, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 4px', border: currentManager === m ? '2px solid #c9920e' : '1px solid #333', textAlign: 'center' }}>
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
                          const roundNum = pick ? Math.floor((pick.pickNum - 1) / DRAFT_ORDER.length) + 1 : null
                          const pickInRound = pick ? ((pick.pickNum - 1) % DRAFT_ORDER.length) + 1 : null
                          return (
                            <td key={m} style={{ border: '1px solid #e5e5ea', padding: 4, textAlign: 'center', background: 'white', height: 70, verticalAlign: 'middle' }}>
                              {pick ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                  <img src={logoUrl(tid)} alt={pick.school} width={34} height={34} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                                  <div style={{ ...G, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e', lineHeight: 1, textAlign: 'center' }}>{pick.school}</div>
                                  <div style={{ fontSize: 8, color: '#8e8e93', letterSpacing: '0.04em' }}>{roundNum}.{pickInRound}</div>
                                </div>
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: 4, border: '1px dashed #d1d1d6', margin: '0 auto' }} />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Team board by conference */}
              {Object.entries(CONFERENCES).map(([conf, teams]) => (
                <div key={conf} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ ...G, fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', color: 'white', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', background: POWER4.has(conf) ? '#c9920e' : '#636366' }}>
                      {conf}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 4 }}>
                    {teams.map(team => {
                      const drafted = draftedSchools.has(team.school)
                      const owner = picks.find(p => p.school === team.school)?.manager
                      const isMatch = searchResult?.school === team.school
                      return (
                        <div key={team.school}
                          onClick={() => !drafted && !isDraftComplete && !viewOnly && makePick(team.school, team.id)}
                          style={{
                            background: drafted ? '#f2f2f7' : isMatch ? '#fdf6e3' : 'white',
                            border: `1px solid ${isMatch ? '#c9920e' : '#e5e5ea'}`,
                            borderRadius: 6, padding: '6px 4px',
                            cursor: drafted || isDraftComplete || viewOnly ? 'default' : 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            opacity: drafted ? 0.5 : 1, minHeight: 70, justifyContent: 'center',
                          }}>
                          <img src={logoUrl(team.id)} alt={team.school} width={36} height={36} style={{ objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
                          <div style={{ ...G, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#1c1c1e', textAlign: 'center', lineHeight: 1.1 }}>{team.school}</div>
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

        {/* Right: fixed pick log panel */}
        {picks.length > 0 && (
          <div style={{
            width: 220, flexShrink: 0,
            position: 'sticky', top: 104, height: 'calc(100vh - 104px)',
            overflowY: 'auto', padding: '10px 10px 10px 0',
          }}>
            <div style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 8, padding: '8px 10px', height: '100%', overflowY: 'auto' }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8e8e93', marginBottom: 8 }}>Pick Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {picks.map((p, i) => {
                  const roundNum = Math.floor((p.pickNum - 1) / DRAFT_ORDER.length) + 1
                  const pickInRound = ((p.pickNum - 1) % DRAFT_ORDER.length) + 1
                  const prevRound = i > 0 ? Math.floor((picks[i-1].pickNum - 1) / DRAFT_ORDER.length) + 1 : null
                  const isNewRound = prevRound !== null && roundNum !== prevRound
                  return (
                    <React.Fragment key={p.pickNum}>
                      {isNewRound && (
                        <div style={{ borderTop: '2px solid #1c1c1e', margin: '4px 0 2px', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 4px', fontSize: 8, fontWeight: 700, color: '#1c1c1e', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            Round {roundNum}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize: 10, background: '#f2f2f7', borderRadius: 4, padding: '3px 7px', color: '#3c3c43', lineHeight: 1.4 }}>
                        <span style={{ color: '#c9920e', fontWeight: 600 }}>
                          {roundNum}.{pickInRound} {p.manager}
                        </span>
                        <br />
                        <span style={{ fontSize: 9 }}>{p.school}</span>
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
