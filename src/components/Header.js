import React from 'react'
import { CFP_LOGO } from '../cfpLogo'

export default function Header({ season, setSeason }) {
  return (
    <header style={{
      background: 'white',
      borderBottom: '0.5px solid #e5e5ea',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 16px',
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: CFP logo + divider + league name, all vertically centered */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={CFP_LOGO}
            alt="College Football Playoff"
            style={{ height: 40, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ width: 1, height: 28, background: '#e5e5ea', flexShrink: 0 }} />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: '#c9920e',
            lineHeight: 1
          }}>
            DABOYZ          ROAD TO GLORY
          </div>
        </div>

        {/* Right: Season selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#8e8e93' }}>Season</span>
          <select
            value={season}
            onChange={e => setSeason(Number(e.target.value))}
            style={{
              background: 'white',
              border: '1.5px solid #c9920e',
              color: '#c9920e',
              borderRadius: 5,
              padding: '3px 9px',
              fontSize: 12,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer'
            }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>
      <div style={{ height: 2, background: '#c9920e' }} />
    </header>
  )
}
