const CONF_LOGOS = {
  'SEC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/SEC_logo.svg/200px-SEC_logo.svg.png',
  'Big Ten': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Big_Ten_Conference_logo.svg/200px-Big_Ten_Conference_logo.svg.png',
  'Big 12': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Big_12_Conference_logo.svg/200px-Big_12_Conference_logo.svg.png',
  'ACC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/ACC_logo.svg/200px-ACC_logo.svg.png',
  'Pac-12': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Pac-12_Conference_Logo.svg/200px-Pac-12_Conference_Logo.svg.png',
  'Mountain West': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Mountain_West_Conference_logo.svg/200px-Mountain_West_Conference_logo.svg.png',
  'Sun Belt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Sun_Belt_Conference_logo.svg/200px-Sun_Belt_Conference_logo.svg.png',
  'MAC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Mid-American_Conference_logo.svg/200px-Mid-American_Conference_logo.svg.png',
  'AAC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/American_Athletic_Conference_logo.svg/200px-American_Athletic_Conference_logo.svg.png',
  'CUSA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Conference_USA_logo.svg/200px-Conference_USA_logo.svg.png',
  'Independent': null,
}

export function ConferenceLogo({ conference, size = 20 }) {
  const url = CONF_LOGOS[conference]

  if (!url) {
    return <span style={{ display: 'inline-block', width: size, height: size }} />
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size + 4,
      height: size,
      flexShrink: 0
    }}>
      <img
        src={url}
        alt={conference}
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
          display: 'block'
        }}
        onError={e => {
          e.target.parentElement.style.display = 'none'
        }}
      />
    </span>
  )
}

export default ConferenceLogo
