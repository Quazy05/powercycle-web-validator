const fs = require('fs');
let lines = fs.readFileSync('src/app/components/LandingPage.jsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<iframe') && lines[i+1].includes('activeMapLoc.embedUrl')) {
    // Found the iframe block
    lines[i] = '              {activeMapLoc ? (';
    lines[i+1] = '                <iframe';
    lines[i+2] = '                  src={activeMapLoc.embedUrl}';
    lines[i+3] = '                  width="100%"';
    lines[i+4] = '                  height="100%"';
    lines[i+5] = '                  style={{ border: 0, borderRadius: "1.5rem" }}';
    lines[i+6] = '                  allowFullScreen=""';
    lines[i+7] = '                  loading="lazy"';
    lines[i+8] = '                  referrerPolicy="no-referrer-when-downgrade"';
    lines[i+9] = '                  title={`Peta Lokasi ${activeMapLoc.name}`}';
    lines[i+10] = '                />';
    lines[i+11] = '              ) : (';
    lines.splice(i+12, 0, '                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ds-text-muted)" }}>Memuat peta...</div>');
    lines.splice(i+13, 0, '              )}');
    break;
  }
}

fs.writeFileSync('src/app/components/LandingPage.jsx', lines.join('\n'));
