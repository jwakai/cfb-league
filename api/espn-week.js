// api/espn-week.js
// Server-side proxy for ESPN. Returns the current week's scoreboard (trimmed) plus the
// current rankings (CFP once released, otherwise AP). Browsers can block or fail direct
// calls to ESPN, so the site calls this instead.

const BASE = 'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football'
const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.espn.com/',
  'Origin': 'https://www.espn.com',
}

// Always returns an object so a failure is visible in the response instead of silent.
async function getRankings(season, week) {
  const out = { poll: null, ranks: {}, status: 'not run', pollsSeen: [] }
  try {
    const r = await fetch(`${BASE}/rankings?year=${season}&week=${week}&seasontype=2`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': HEADERS['User-Agent'],
        'Referer': 'https://www.espn.com/',
      },
    })
    if (!r.ok) { out.status = `ESPN http ${r.status}`; return out }
    const d = await r.json()
    const polls = d.rankings || []
    out.pollsSeen = polls.map(p => p.name)

    const nameOf = p => `${p.name || ''} ${p.shortName || ''}`.toLowerCase()
    const isCfp = p => nameOf(p).includes('playoff') || /\bcfp\b/.test(nameOf(p))
    const isAp = p => !isCfp(p) && (nameOf(p).includes('ap top') || /\bap\b/.test(nameOf(p)))
    const cfp = polls.find(isCfp)
    const ap = polls.find(isAp)

    let target = null
    if (cfp && (cfp.ranks || []).length) { out.poll = 'cfp'; target = cfp }
    else if (ap && (ap.ranks || []).length) { out.poll = 'ap'; target = ap }
    if (!target) { out.status = 'no CFP or AP poll with ranks found'; return out }

    // ESPN team id: team.id, else the "t:123" part of team.uid, else the number in a logo URL
    const teamId = t => {
      if (!t) return null
      if (t.id != null && !isNaN(Number(t.id))) return Number(t.id)
      const u = /t:(\d+)/.exec(t.uid || '')
      if (u) return Number(u[1])
      const logo = (t.logos?.[0]?.href || t.logo || '')
      const l = /\/(\d+)\.png/.exec(logo)
      return l ? Number(l[1]) : null
    }

    let skipped = 0
    for (const x of target.ranks || []) {
      const id = teamId(x.team)
      if (id && x.current > 0 && x.current <= 25) out.ranks[id] = x.current
      else skipped++
    }
    out.status = skipped && !Object.keys(out.ranks).length ? 'poll found but no team ids could be read' : 'ok'
    return out
  } catch (e) {
    out.status = `error: ${e.message}`
    return out
  }
}

module.exports = async function handler(req, res) {
  const season = Number(req.query?.season) || new Date().getFullYear()

  try {
    const r = await fetch(
      `${BASE}/scoreboard?year=${season}&seasontype=2&limit=300&groups=80`,
      { headers: HEADERS }
    )
    if (!r.ok) throw new Error(`ESPN ${r.status}`)
    const d = await r.json()

    const rankings = await getRankings(season, d.week?.number ?? 1)

    // Trim to only the fields the site uses, same shape as ESPN's response
    const trimmed = {
      week: { number: d.week?.number ?? null },
      rankings,
      events: (d.events || []).map(e => {
        const comp = e.competitions?.[0]
        return {
          week: { number: e.week?.number ?? null },
          competitions: [{
            date: comp?.date,
            status: { type: { completed: comp?.status?.type?.completed === true } },
            competitors: (comp?.competitors || []).map(c => ({
              homeAway: c.homeAway,
              score: c.score,
              curatedRank: { current: c.curatedRank?.current ?? null },
              team: { id: c.team?.id, displayName: c.team?.displayName },
            })),
          }],
        }
      }),
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(trimmed)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
