const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.jsx', 'utf8');

c = c.replace(/import \{ UNIT_LIST \} from '\.\.\/lib\/mockData';/, `import { UNIT_LIST as FALLBACK_UNIT_LIST } from '../lib/mockData';\nimport { db } from '../lib/firebase';\nimport { collection, getDocs, query, orderBy } from 'firebase/firestore';`);

c = c.replace('const [showUnitModal, setShowUnitModal] = useState(false);', `const [showUnitModal, setShowUnitModal] = useState(false);\n  const [unitList, setUnitList] = useState(FALLBACK_UNIT_LIST);`);

const useEffectLogic = `
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const q = query(collection(db, 'master_unit'), orderBy('nama_unit', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const units = snapshot.docs.map(doc => doc.data().nama_unit);
          setUnitList(units);
        }
      } catch (error) {
        console.error('Failed to fetch units from Firebase:', error);
      }
    };
    fetchUnits();
  }, []);
`;

c = c.replace('useEffect(() => {', useEffectLogic + '\n  useEffect(() => {');

c = c.replace(/\{UNIT_LIST\.map/g, '{unitList.map');

fs.writeFileSync('src/app/login/page.jsx', c);
console.log('Patched login to use Firebase for units');
