import path from 'path';
import ExcelJS from 'exceljs';

export type DefectRow = {
  defectId: string;
  defectNumber?: number;
  linkedTestCaseId?: string;
  reportVersion: 1 | 2 | 3 | 4;
  isDerived: boolean;
  summary: string;
  testEnvironment: string;
  severity: 'H' | 'M' | 'L';
  frequency: 'A' | 'I';
  qualityCharacteristic: string;
  accessPath: string;
  stepsToReproduce?: string[];
  description: string;
  ttaComment?: string;
  status: '신규' | '확인' | '수정' | '보류' | '종료';
  reportedBy: string;
  reportedAt: unknown;
};

export type ExportDefectsInput = {
  testNumber: string;
  reportVersion: 1 | 2 | 3 | 4;
  reportDate: string;
  environment: string;
  defects: DefectRow[];
};

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'templates',
  'defect_report_template_fix.xlsx'
);

const replacePlaceholders = (value: string, mapping: Record<string, string>) => {
  let next = value;
  Object.entries(mapping).forEach(([key, replacement]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    next = next.replace(pattern, replacement);
  });
  return next.replace(/<[^>]+>/g, '');
};

const findTemplateRow = (worksheet: ExcelJS.Worksheet) => {
  let templateRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      if (typeof cell.value === 'string' && cell.value.includes('{결함 요약}')) {
        templateRow = rowNumber;
      }
    });
  });
  return templateRow;
};

const copyRowStyle = (source: ExcelJS.Row, target: ExcelJS.Row) => {
  source.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const targetCell = target.getCell(colNumber);
    targetCell.style = JSON.parse(JSON.stringify(cell.style));
    targetCell.numFmt = cell.numFmt;
  });
  target.height = source.height;
};

export const generateDefectReport = async ({
  testNumber,
  reportVersion,
  reportDate,
  environment,
  defects
}: ExportDefectsInput) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('엑셀 템플릿을 불러올 수 없습니다.');
  }

  const headerCell = worksheet.getCell('A2');
  const headerValue = typeof headerCell.value === 'string' ? headerCell.value : String(headerCell.value ?? '');
  headerCell.value = replacePlaceholders(headerValue, {
    시험번호: testNumber,
    차수: `${reportVersion}차`,
    보고일자: reportDate
  });

  const envCell = worksheet.getCell('D2');
  const envValue = typeof envCell.value === 'string' ? envCell.value : String(envCell.value ?? '');
  envCell.value = replacePlaceholders(envValue, {
    운영환경: environment
  });

  const templateRowNumber = findTemplateRow(worksheet);
  if (!templateRowNumber) {
    throw new Error('템플릿 행을 찾을 수 없습니다.');
  }

  const templateRow = worksheet.getRow(templateRowNumber);
  const insertStart = templateRowNumber;

  defects.forEach((defect, index) => {
    const rowIndex = insertStart + index;
    worksheet.insertRow(rowIndex, []);
    const row = worksheet.getRow(rowIndex);
    copyRowStyle(templateRow, row);

    row.getCell(1).value = index + 1;
    row.getCell(2).value = defect.summary;
    row.getCell(3).value = defect.description;
    row.getCell(4).value = defect.severity;
    row.getCell(5).value = defect.frequency;
    row.getCell(6).value = defect.qualityCharacteristic;
    row.getCell(7).value = defect.testEnvironment || environment;

    [2, 3, 6].forEach((col) => {
      const cell = row.getCell(col);
      cell.alignment = { ...(cell.alignment || {}), wrapText: true, vertical: 'top' };
    });
  });

  // 데이터 유효성 검사 (결함 정도 / 발생 빈도)
  const lastRowIndex = insertStart + defects.length - 1;
  const severityRange = `D${insertStart}:D${Math.max(insertStart, lastRowIndex)}`;
  const frequencyRange = `E${insertStart}:E${Math.max(insertStart, lastRowIndex)}`;

  const dataValidations = (worksheet as unknown as { dataValidations?: { add: Function } }).dataValidations;
  if (dataValidations) {
    dataValidations.add(severityRange, {
      type: 'list',
      allowBlank: false,
      formulae: ['"H,M,L"']
    });
    dataValidations.add(frequencyRange, {
      type: 'list',
      allowBlank: false,
      formulae: ['"A,I"']
    });
  }

  // 템플릿 예시 행 삭제
  worksheet.spliceRows(templateRowNumber + defects.length, 1);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
