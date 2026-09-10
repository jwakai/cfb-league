module.exports = async function handler(req, res) {
  const results = {}

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com',
  }

  const ESPN = 'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football'

  // Test Week 1 completion status
  try {
    const r = await fetch(`${ESPN}/scoreboard?year=2026&week=1&seasontype=2&limit=300&groups=80`, { headers })
    const d = await r.json()
    const events = d.events || []
    const completed = events.filter(e => e.competitions?.[0]?.status?.type?.completed)
    const incomplete = events.filter(e => !e.competitions?.[0]?.status?.type?.completed)
    results.week1_total = events.length
    results.week1_completed = completed.length
    results.week1_incomplete = incomplete.length
    results.week1_incomplete_games = incomplete.slice(0,5).map(e => ({
      name: e.name,
      status: e.competitions?.[0]?.status?.type?.description
    }))
  } catch(e) { results.week1_error = e.message }

  // Test Week 2
  try {
    const r = await fetch(`${ESPN}/scoreboard?year=2026&week=2&seasontype=2&limit=300&groups=80`, { headers })
    const d = await r.json()
    const events = d.events || []
    const completed = events.filter(e => e.competitions?.[0]?.status?.type?.completed)
    results.week2_total = events.length
    results.week2_completed = completed.length
    results.week2_sample = events.slice(0,3).map(e => ({
      name: e.name,
      week: e.week?.number,
      completed: e.competitions?.[0]?.status?.type?.completed,
      status: e.competitions?.[0]?.status?.type?.description,
      homeScore: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='home')?.score,
      awayScore: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='away')?.score,
    }))
  } catch(e) { results.week2_error = e.message }

  // Check what week ESPN calendar thinks we're in
  try {
    const r = await fetch(`${ESPN}/scoreboard?year=2026&seasontype=2&limit=5&groups=80`, { headers })
    const d = await r.json()
    results.current_espn_week = d.week?.number
    results.calendar_sample = d.calendar?.slice(0,3)
  } catch(e) { results.calendar_error = e.message }

  return res.status(200).json(results)
}
