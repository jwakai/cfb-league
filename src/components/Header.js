import React from 'react'

export default function Header({ season, setSeason }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      marginBottom: 32,
      position: 'sticky',
      top: 0,
      background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 16px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            letterSpacing: '0.04em',
            color: 'var(--accent)',
            lineHeight: 1
          }}>
            CFB League
          </span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Fantasy
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Season</span>
          <select
            value={season}
            onChange={e => setSeason(Number(e.target.value))}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer'
            }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>
    </header>
  )
}
