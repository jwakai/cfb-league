module.exports = async function handler(req, res) {
  const results = {}

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com',
  }

  // Test 1: site.web.api.espn.com scoreboard
  try {
    const r = await fetch(
      'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?year=2026&week=1&seasontype=2&limit=5&groups=80',
      { headers }
    )
    results.web_scoreboard_status = r.status
    if (r.ok) {
      const d = await r.json()
      results.web_scoreboard_events = d.events?.length ?? 0
      results.web_scoreboard_sample = d.events?.slice(0,2).map(e => ({
        name: e.name,
        week: e.week?.number,
        completed: e.competitions?.[0]?.status?.type?.completed,
        home: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='home')?.team?.displayName,
        away: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='away')?.team?.displayName,
        homeId: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='home')?.team?.id,
        awayId: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='away')?.team?.id,
        homeScore: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='home')?.score,
        awayScore: e.competitions?.[0]?.competitors?.find(c=>c.homeAway==='away')?.score,
      }))
    } else {
      results.web_scoreboard_error = await r.text()
    }
  } catch(e) {
    results.web_scoreboard_exception = e.message
  }

  // Test 2: site.api.espn.com (original)
  try {
    const r = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?year=2026&week=1&seasontype=2&limit=5',
      { headers }
    )
    results.api_scoreboard_status = r.status
    if (r.ok) {
      const d = await r.json()
      results.api_scoreboard_events = d.events?.length ?? 0
    } else {
      results.api_scoreboard_error = await r.text()
    }
  } catch(e) {
    results.api_scoreboard_exception = e.message
  }

  // Test 3: ESPN summary endpoint for a specific game (Indiana vs North Texas)
  try {
    const r = await fetch(
      'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=401772837',
      { headers }
    )
    results.summary_status = r.status
    if (r.ok) {
      const d = await r.json()
      results.summary_teams = d.boxscore?.teams?.map(t => t.team?.displayName)
    } else {
      results.summary_error = await r.text()
    }
  } catch(e) {
    results.summary_exception = e.message
  }

  // Test 4: Check Supabase env vars
  results.supabase_url_set = !!process.env.REACT_APP_SUPABASE_URL
  results.supabase_key_set = !!process.env.SUPABASE_SERVICE_KEY

  return res.status(200).json(results, null, 2)
}
