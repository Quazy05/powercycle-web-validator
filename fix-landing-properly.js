const fs = require('fs');
let content = fs.readFileSync('src/app/components/LandingPage.jsx', 'utf8');

content = content.replace('const isActive = activeMapLoc.id === loc.id;', 'const isActive = activeMapLoc?.id === loc.id;');
content = content.replace('src={activeMapLoc.embedUrl}', 'src={activeMapLoc?.embedUrl || ""}');
content = content.replace('title={`Peta Lokasi ${activeMapLoc.name}`}', 'title={`Peta Lokasi ${activeMapLoc?.name || ""}`}');

fs.writeFileSync('src/app/components/LandingPage.jsx', content);
