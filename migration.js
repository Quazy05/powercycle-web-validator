const mysql = require('mysql2/promise');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bank_sampah-new',
  port: 3306
};

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL.');

    // 1. Create programs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS programs (
        id VARCHAR(100) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        fields JSON NOT NULL
      )
    `);
    console.log('Table programs created or already exists.');

    // 2. Add new columns to input_program if they don't exist
    try {
      await connection.execute('ALTER TABLE input_program ADD COLUMN kategori_sampah VARCHAR(100)');
      await connection.execute('ALTER TABLE input_program ADD COLUMN jenis_sampah VARCHAR(100)');
      console.log('Columns kategori_sampah and jenis_sampah added to input_program.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Columns already exist in input_program.');
      } else {
        throw e;
      }
    }

    // 3. Seed programs from Excel
    const filePath = path.join(process.cwd(), 'keperluan', '26 PS Rekapitulasi Program Pengelolaan Sampah PLTA Wonogiri.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    let programsCount = 0;
    
    for (const sheetName of workbook.SheetNames) {
      if (/^\d+\./.test(sheetName)) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let namaProgram = '';
        let deskripsiProgram = '';
        let rumusPerhitungan = '';
        
        data.forEach(row => {
          if (!row || !row.length) return;
          const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
          
          if (rowText.includes('nama program')) {
            const valIndex = row.findIndex(c => String(c).includes(':')) + 1;
            namaProgram = row[valIndex] || row[row.length - 1];
          }
          if (rowText.includes('deskripsi program')) {
            const valIndex = row.findIndex(c => String(c).includes(':')) + 1;
            deskripsiProgram = row[valIndex] || row[row.length - 1];
          }
          if (rowText.includes('rumus perhitungan')) {
            const valIndex = row.findIndex(c => String(c).includes(':')) + 1;
            rumusPerhitungan = row[valIndex] || row[row.length - 1];
          }
        });

        if (!namaProgram || /^202[4-9]\*?$/.test(namaProgram)) {
            namaProgram = sheetName.replace(/^\d+\.\s*/, '').trim();
        }

        const fields = [];
        const rumusLower = String(rumusPerhitungan).toLowerCase();
        
        if (rumusLower.includes('sampah taman')) {
          fields.push({ id: 'sampah_taman', label: 'Sampah Taman (kg)', type: 'number' });
        }
        if (rumusLower.includes('sisa makanan')) {
          fields.push({ id: 'sisa_makanan', label: 'Sampah Sisa Makanan (kg)', type: 'number' });
        }
        if (rumusLower.includes('surat menyurat')) {
          fields.push({ id: 'kertas_surat', label: 'Jumlah Kertas Surat Menyurat (lembar)', type: 'number' });
        }
        if (rumusLower.includes('slip gaji')) {
          fields.push({ id: 'kertas_slip', label: 'Jumlah Kertas Slip Gaji (lembar)', type: 'number' });
        }
        if (rumusLower.includes('digitalisasi dokumen')) {
          fields.push({ id: 'kertas_dokumen', label: 'Jumlah Kertas Digitalisasi Dokumen (lembar)', type: 'number' });
        }
        if (rumusLower.includes('botol kemasan')) {
          fields.push({ id: 'botol_kemasan', label: 'Jumlah Botol Kemasan (pcs)', type: 'number' });
        }
        if (rumusLower.includes('plastik makanan')) {
          fields.push({ id: 'plastik_makanan', label: 'Jumlah Bungkus Makanan Plastik (pcs)', type: 'number' });
        }

        const id = sheetName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        if (namaProgram) {
            await connection.execute(
                'INSERT INTO programs (id, nama, deskripsi, fields) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama = ?, deskripsi = ?, fields = ?',
                [id, namaProgram, deskripsiProgram, JSON.stringify(fields), namaProgram, deskripsiProgram, JSON.stringify(fields)]
            );
            programsCount++;
        }
      }
    }

    console.log(`Successfully migrated ${programsCount} programs to database.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
