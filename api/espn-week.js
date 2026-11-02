// api/espn-week.js
// Server-side proxy for ESPN's scoreboard. Browsers (especially iPad/iPhone Safari)
// can block or silently fail direct calls to ESPN, so the site calls this instead.
// ESPN is queried without a week parameter, so it returns whatever week it considers current.

module.exports = async function handler(req, res) {
  const season = Number(req.query?.season) || new Date().getFullYear()

  try {
    const r = await fetch(
      `https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?year=${season}&seasontype=2&limit=300&groups=80`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.espn.com/',
          'Origin': 'https://www.espn.com',
        },
      }
    )
    if (!r.ok) throw new Error(`ESPN ${r.status}`)
    const d = await r.json()

    // Trim to only the fields the site uses, same shape as ESPN's response
    const trimmed = {
      week: { number: d.week?.number ?? null },
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

    // Cache at Vercel's edge for 5 minutes so ESPN isn't hit on every page load
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(trimmed)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
