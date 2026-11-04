// api/debug-rankings.js — read-only diagnostic. Shows which polls ESPN has for weeks 9-11
// and which poll ESPN's own per-game rank (the one scoring uses first) currently follows.
module.exports = async function handler(req, res) {
  const season = Number(req.query?.season) || 2026
  const BASE = 'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football'
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.espn.com/',
  }
  const out = { polls_by_week: {} }

  for (const w of [9, 10, 11]) {
    try {
      const d = await (await fetch(`${BASE}/rankings?year=${season}&week=${w}&seasontype=2`, { headers })).json()
      out.polls_by_week[w] = (d.rankings || []).map(p => ({
        name: p.name,
        shortName: p.shortName,
        top25: (p.ranks || []).slice(0, 25).map(r => `${r.current} ${r.team?.location || r.team?.name || r.team?.id}`),
      }))
    } catch (e) { out.polls_by_week[w] = { error: e.message } }
  }

  try {
    const d = await (await fetch(`${BASE}/scoreboard?year=${season}&seasontype=2&limit=300&groups=80`, { headers })).json()
    const seen = {}
    for (const e of d.events || []) {
      for (const c of e.competitions?.[0]?.competitors || []) {
        const r = c.curatedRank?.current
        if (r > 0 && r <= 25) seen[c.team?.location || c.team?.displayName] = r
      }
    }
    out.scoreboard_week = d.week?.number
    out.scoreboard_rank_used_by_scoring = Object.entries(seen).sort((a, b) => a[1] - b[1]).map(([n, r]) => `${r} ${n}`)
  } catch (e) { out.scoreboard_error = e.message }

  return res.status(200).json(out)
}
