import ExcelJS from 'exceljs';
import * as transaccionRepo from '../repositories/transaccionRepo.js';
import * as usuarioRepo from '../repositories/usuarioRepo.js';

/**
 * Genera un buffer Excel con las transacciones del usuario en el rango.
 */
export async function generarExcel(id_usuario, filtros = {}) {
  const transacciones = await transaccionRepo.listByUsuario(id_usuario, filtros);
  const usuario = await usuarioRepo.findById(id_usuario);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinPredict';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Transacciones');

  // Título
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Reporte de Transacciones - FinPredict';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F3864' } };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:G2');
  const subCell = sheet.getCell('A2');
  subCell.value = `Usuario: ${usuario?.nombre || ''} (${usuario?.email || ''}) — Generado: ${new Date().toLocaleString('es-CL')}`;
  subCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } };
  subCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Encabezados
  const headerRow = sheet.addRow(['Fecha', 'Cuenta', 'Categoría', 'Tipo', 'Monto', 'Glosa', 'Registrado']);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Filas
  let totalIngresos = 0;
  let totalGastos = 0;
  for (const t of transacciones) {
    const row = sheet.addRow([
      t.fecha,
      t.cuenta_alias,
      t.categoria_nombre,
      t.tipo === 'I' ? 'Ingreso' : 'Gasto',
      parseFloat(t.monto),
      t.glosa || '',
      t.creado_en
    ]);
    if (t.tipo === 'I') totalIngresos += parseFloat(t.monto);
    else totalGastos += parseFloat(t.monto);
    // Color de la columna de monto
    const montoCell = row.getCell(5);
    montoCell.font = { color: { argb: t.tipo === 'I' ? 'FF16A34A' : 'FFDC2626' }, bold: true };
    montoCell.numFmt = '$#,##0';
  }

  // Totales
  sheet.addRow([]);
  const totalRow = sheet.addRow(['', '', '', 'INGRESOS', totalIngresos, '', '']);
  totalRow.getCell(4).font = { bold: true };
  totalRow.getCell(5).font = { bold: true, color: { argb: 'FF16A34A' } };
  totalRow.getCell(5).numFmt = '$#,##0';
  const gastosRow = sheet.addRow(['', '', '', 'GASTOS', totalGastos, '', '']);
  gastosRow.getCell(4).font = { bold: true };
  gastosRow.getCell(5).font = { bold: true, color: { argb: 'FFDC2626' } };
  gastosRow.getCell(5).numFmt = '$#,##0';
  const balanceRow = sheet.addRow(['', '', '', 'BALANCE', totalIngresos - totalGastos, '', '']);
  balanceRow.getCell(4).font = { bold: true };
  balanceRow.getCell(5).font = { bold: true, size: 12 };
  balanceRow.getCell(5).numFmt = '$#,##0';

  // Anchos de columna
  sheet.columns = [
    { width: 12 }, { width: 22 }, { width: 22 }, { width: 12 },
    { width: 14 }, { width: 30 }, { width: 22 }
  ];

  return await workbook.xlsx.writeBuffer();
}
