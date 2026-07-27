import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';


export function exportToPDF(title, tablesData, metadata = {}) {
  const doc = new jsPDF('landscape');
  const pageHeight = doc.internal.pageSize.height;

  
  const drawHeader = (doc) => {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PT PLN (Persero)", 14, 15);
    
    doc.setFontSize(13);
    doc.text("LAPORAN PENGELOLAAN SAMPAH", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Unit: ${metadata.unit || 'Semua Unit'} | Periode: ${metadata.periode || '-'}`, 14, 28);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(14, 32, 280, 32); 
  };

  
  drawHeader(doc);

  let startY = 40; 
  
  tablesData.forEach((table, index) => {
    
    doc.setFontSize(11);
    doc.text(table.title, 14, startY);
    
    autoTable(doc, {
      startY: startY + 3,
      head: [table.columns],
      body: table.body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [8, 145, 178] },
      margin: { top: 40 }, 
      didDrawPage: (data) => {
        
        
        if (data.pageNumber > 1) {
          drawHeader(doc);
        }
      }
    });
    
    
    startY = doc.lastAutoTable.finalY + 10;
    
    
    if (startY > pageHeight - 30) {
      doc.addPage();
      startY = 40;
    }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}


export async function exportToExcelMultiSheet(title, dataBySheet) {
  const workbook = new ExcelJS.Workbook();
  
  for (const sheetName in dataBySheet) {
    if (Object.prototype.hasOwnProperty.call(dataBySheet, sheetName)) {
      const sheetData = dataBySheet[sheetName];
      const worksheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });

      if (sheetData.length === 0) continue;

      
      const headers = Object.keys(sheetData[0]);
      worksheet.columns = headers.map(key => ({ header: key, key: key }));

      
      sheetData.forEach(row => { worksheet.addRow(row); });

      
      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 20;
          row.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10 };
            
            
            if (rowNumber % 2 === 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }
            
            
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
        }
      });

      
      worksheet.columns.forEach(column => {
        let maxLength = column.header ? column.header.length : 10;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 0;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = maxLength < 12 ? 12 : maxLength + 4; 
      });

      
      
      
if (sheetName === "Ringkasan" || sheetName === "Detail_Transaksi" || sheetName === "Neraca_Sampah" || sheetName === "Kinerja_Per_Unit") {
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: sheetData.length + 1, column: headers.length }
  };
}
    }
  }
  
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}