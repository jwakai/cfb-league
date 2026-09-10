module.exports = async function handler(req, res) {
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.espn.com/',
  }
  const ESPN = 'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football'

  // Fetch Cincinnati schedule (id=2132) to see exact data structure
  const r = await fetch(`${ESPN}/teams/2132/schedule?season=2026`, { headers })
  const d = await r.json()
  const firstEvent = d.events?.[0]
  const comp = firstEvent?.competitions?.[0]

  return Response.json({
    event_keys: firstEvent ? Object.keys(firstEvent) : [],
    week: firstEvent?.week,
    comp_keys: comp ? Object.keys(comp) : [],
    status: comp?.status?.type,
    competitors: comp?.competitors?.map(c => ({
      homeAway: c.homeAway,
      team_id: c.team?.id,
      team_name: c.team?.displayName,
      score: c.score,
      score_keys: c ? Object.keys(c) : [],
      winner: c.winner,
    }))
  })
}
