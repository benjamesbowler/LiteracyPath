import ExcelJS from "exceljs";

export async function readDownloadWorkbook(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.concat(chunks));
  return workbook;
}

export function worksheetRowsAsObjects(sheet) {
  if (!sheet) throw new Error("The expected workbook sheet is missing.");
  const headers = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    headers[column] = cell.text;
  });
  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const result = {};
    for (let column = 1; column < headers.length; column += 1) {
      if (!headers[column]) continue;
      result[headers[column]] = row.getCell(column).text;
    }
    if (Object.values(result).some(Boolean)) rows.push(result);
  }
  return rows;
}

export function worksheetText(sheet) {
  if (!sheet) throw new Error("The expected workbook sheet is missing.");
  const lines = [];
  for (let rowNumber = 1; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    lines.push(sheet.getRow(rowNumber).values.slice(1).join("\t"));
  }
  return lines.join("\n");
}
