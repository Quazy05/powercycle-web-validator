const fs = require('fs');
let lines = fs.readFileSync('src/app/components/LandingPage.jsx', 'utf8').split('\n');

// Delete UNIT_LIST import (line 14 inside imports)
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('UNIT_LIST, formatWeight, formatWeightTon')) {
    lines[i] = lines[i].replace('UNIT_LIST, ', '');
  }
}

// Remove MAP_LOCATIONS
let mapLocationsStart = -1;
let mapLocationsEnd = -1;
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const MAP_LOCATIONS = [')) mapLocationsStart = i;
  if (mapLocationsStart !== -1 && lines[i].includes('];')) {
    mapLocationsEnd = i;
    break;
  }
}
if (mapLocationsStart !== -1 && mapLocationsEnd !== -1) {
  lines.splice(mapLocationsStart, mapLocationsEnd - mapLocationsStart + 1);
}

// Update state declaration
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [activeMapLoc, setActiveMapLoc] = useState(MAP_LOCATIONS[0]);')) {
    lines[i] = `  const [activeMapLoc, setActiveMapLoc] = useState(null);
  const [masterUnits, setMasterUnits] = useState([]);
  const [mapLocations, setMapLocations] = useState([]);`;
  }
}

// Update fetchStats
let foundFetchStats = false;
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setFirebaseUnitStats(data.unitStats || null);')) {
    lines[i] = `          setFirebaseUnitStats(data.unitStats || null);
          if (data.masterUnits) {
            setMasterUnits(data.masterUnits);
            const mapped = data.masterUnits.map(u => ({ id: u.nama_unit, name: u.nama_unit, embedUrl: u.map_url || '' }));
            setMapLocations(mapped);
            if (mapped.length > 0) setActiveMapLoc(mapped[0]);
          }`;
    break;
  }
}

// Replace UNIT_LIST with masterUnits
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{UNIT_LIST.length}')) {
    lines[i] = lines[i].replace('{UNIT_LIST.length}', '{masterUnits.length}');
  }
  
  if (lines[i].includes('{UNIT_LIST.map(unit => (')) {
    lines[i] = `            {masterUnits.map(mu => (
              <button
                key={mu.nama_unit}
                className={\`filter-btn \${activeUnit === mu.nama_unit ? 'active' : ''}\`}
                onClick={() => setActiveUnit(mu.nama_unit)}
              >
                {mu.nama_unit}
              </button>
            ))}`;
    // delete the next 8 lines which belong to the old map
    lines.splice(i + 1, 8);
  }
}

// Update unitStats calculation
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return UNIT_LIST.map(unit => {')) {
    lines[i] = `    return masterUnits.map(mu => {
      const unit = mu.nama_unit;`;
  }
  if (lines[i].includes('[firebaseDeposits, firebaseUnitStats]')) {
    lines[i] = lines[i].replace('[firebaseDeposits, firebaseUnitStats]', '[firebaseDeposits, firebaseUnitStats, masterUnits]');
  }
}

// Replace MAP_LOCATIONS map
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{MAP_LOCATIONS.map((loc) => {')) {
    lines[i] = lines[i].replace('{MAP_LOCATIONS.map((loc) => {', '{mapLocations.map((loc) => {');
  }
}

fs.writeFileSync('src/app/components/LandingPage.jsx', lines.join('\n'));
