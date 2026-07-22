import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * Fungsi untuk export data ke file PDF (Landscape)
 */
export function exportToPDF(title, tablesData, metadata = {}) {
  const doc = new jsPDF('landscape');
  const pageHeight = doc.internal.pageSize.height;

  // Fungsi untuk menggambar Kop Surat
  const drawHeader = (doc) => {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PT PLN (Persero)", 14, 15);
    
    doc.setFontSize(13);
    doc.text("LAPORAN PENGELOLAAN SAMPAH", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Unit: ${metadata.unit || 'Semua Unit'} | Periode: ${metadata.periode || '-'}`, 14, 28);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(14, 32, 280, 32); // Garis bawah kop
  };

  // Panggil pertama kali
  drawHeader(doc);

  let startY = 40; // Mulai tabel tepat di bawah kop surat
  
  tablesData.forEach((table, index) => {
    // Tambahkan judul tabel
    doc.setFontSize(11);
    doc.text(table.title, 14, startY);
    
    autoTable(doc, {
      startY: startY + 3,
      head: [table.columns],
      body: table.body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [8, 145, 178] },
      margin: { top: 40 }, // Memberi ruang untuk kop surat di setiap halaman
      didDrawPage: (data) => {
        // Ini memastikan Kop Surat digambar ulang di setiap halaman baru
        // dan TIDAK menimpa konten yang sedang digambar
        if (data.pageNumber > 1) {
          drawHeader(doc);
        }
      }
    });
    
    // Update posisi startY untuk tabel berikutnya
    startY = doc.lastAutoTable.finalY + 10;
    
    // Jika sisa ruang di halaman tipis, pindah halaman baru
    if (startY > pageHeight - 30) {
      doc.addPage();
      startY = 40;
    }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Fungsi untuk export data ke file Excel Multi-Sheet (Cantik & Profesional)
 */
export async function exportToExcelMultiSheet(title, dataBySheet) {
  const workbook = new ExcelJS.Workbook();
  
  for (const sheetName in dataBySheet) {
    if (Object.prototype.hasOwnProperty.call(dataBySheet, sheetName)) {
      const sheetData = dataBySheet[sheetName];
      const worksheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });

      if (sheetData.length === 0) continue;

      // 1. Set Header Kolom
      const headers = Object.keys(sheetData[0]);
      worksheet.columns = headers.map(key => ({ header: key, key: key }));

      // 2. Masukkan Data Baris
      sheetData.forEach(row => { worksheet.addRow(row); });

      // 3. Desain Header Tabel
      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // 4. Desain Baris Data (Zebra & Borders)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 20;
          row.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10 };
            
            // Baris Genap warna Abu-abu tipis
            if (rowNumber % 2 === 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }
            
            // Border sel
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
        }
      });

      // 5. KOSMETIK: AUTO-WIDTH KOLOM
      worksheet.columns.forEach(column => {
        let maxLength = column.header ? column.header.length : 10;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 0;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = maxLength < 12 ? 12 : maxLength + 4; 
      });

      // 6. FILTER OTOMATIS (Dropdown Bulan di Header)
      // Aktif di Detail_Transaksi dan Neraca_Sampah
      // 6. FILTER OTOMATIS (Dropdown aktif di semua sheet tabel)
if (sheetName === "Ringkasan" || sheetName === "Detail_Transaksi" || sheetName === "Neraca_Sampah" || sheetName === "Kinerja_Per_Unit") {
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: sheetData.length + 1, column: headers.length }
  };
}
    }
  }
  
  // 7. PROSES DOWNLOAD
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}