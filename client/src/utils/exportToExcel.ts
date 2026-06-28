import type ExcelJS from 'exceljs';
import type { CategoryDTO, TaskDTO, SubtaskDTO } from '@wedding-planner/shared';

type TFunc = (key: string, variables?: Record<string, string>) => string;

// Palette aligned with the app header (pink/peach gradient).
const COLOR = {
  category: 'FFD97B8A',
  categoryText: 'FFFFFFFF',
  task: 'FFF6DCD5',
  subtotal: 'FFFBEEEA',
  grandTotal: 'FFE8B4A1',
  header: 'FF8A4A57',
  border: 'FFE5D5D0',
};

const PRICE_FMT = '#,##0.00" €"';
const PCT_FMT = '0.0"%"';

const subtaskPrice = (s: SubtaskDTO) => (typeof s.price === 'number' ? s.price : null);

function formatDate(date: SubtaskDTO['date'], locale: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale);
}

/**
 * Draws a simple vertical bar chart on an off-screen canvas and returns the
 * PNG as a base64 string (without the data-URI prefix) for embedding in xlsx.
 */
function renderBarChart(opts: {
  title: string;
  labels: string[];
  values: number[];
  barColor: string;
  valueFormatter: (v: number) => string;
  max?: number;
}): string {
  const { title, labels, values, barColor, valueFormatter } = opts;
  const W = 760;
  const H = 380;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#374151';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(title, 20, 28);

  const padLeft = 70;
  const padRight = 20;
  const padTop = 50;
  const padBottom = 70;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const baselineY = padTop + plotH;
  const niceMax = Math.max(opts.max ?? 0, ...values, 1);

  // Axes.
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, baselineY);
  ctx.lineTo(W - padRight, baselineY);
  ctx.stroke();

  // Gridlines + y-axis labels.
  const steps = 4;
  ctx.font = '11px Arial';
  for (let i = 0; i <= steps; i++) {
    const v = (niceMax / steps) * i;
    const y = baselineY - (plotH * i) / steps;
    ctx.strokeStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(W - padRight, y);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'right';
    ctx.fillText(valueFormatter(v), padLeft - 8, y + 4);
  }

  // Bars.
  const n = Math.max(labels.length, 1);
  const slot = plotW / n;
  const barW = Math.min(64, slot * 0.6);
  for (let i = 0; i < labels.length; i++) {
    const v = values[i] || 0;
    const h = (plotH * v) / niceMax;
    const x = padLeft + slot * i + (slot - barW) / 2;
    const y = baselineY - h;

    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, barW, h);

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(valueFormatter(v), x + barW / 2, y - 6);

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial';
    const label = labels[i].length > 14 ? `${labels[i].slice(0, 13)}…` : labels[i];
    ctx.fillText(label, x + barW / 2, baselineY + 16);
  }

  return canvas.toDataURL('image/png').split(',')[1];
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.header } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 22;
}

function fillRow(row: ExcelJS.Row, argb: string, textArgb?: string, bold = true) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    cell.font = { bold, color: textArgb ? { argb: textArgb } : undefined };
  });
}

/** Builds the workbook and triggers a browser download. */
export async function exportToExcel(
  categories: CategoryDTO[],
  t: TFunc,
  language: 'en' | 'fr'
): Promise<void> {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  // Loaded on demand so the heavy ExcelJS library is not in the initial bundle.
  const { default: ExcelJSModule } = await import('exceljs');
  const workbook = new ExcelJSModule.Workbook();
  workbook.creator = 'Wedding Planner';
  workbook.created = new Date();

  // ---- Detail sheet -------------------------------------------------------
  const detail = workbook.addWorksheet(t('export.detailSheet'));
  // Place the +/- outline buttons on the parent row (above its children) so
  // collapsing a category/task folds the rows beneath it.
  detail.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
  // Secondary columns get an outline level so the whole set can be hidden with
  // a single click of the column +/- button (element/progress/price/include stay).
  detail.columns = [
    { header: t('export.col.element'), key: 'element', width: 40 },
    { header: t('export.col.comment'), key: 'comment', width: 32, outlineLevel: 1 },
    { header: t('export.col.deadline'), key: 'deadline', width: 14, outlineLevel: 1 },
    { header: t('export.col.assignee'), key: 'assignee', width: 18, outlineLevel: 1 },
    { header: t('export.col.progress'), key: 'progress', width: 12 },
    { header: t('export.col.weight'), key: 'weight', width: 9, outlineLevel: 1 },
    { header: t('export.col.price'), key: 'price', width: 15 },
    { header: t('export.col.include'), key: 'include', width: 10 },
    { header: t('export.col.link'), key: 'link', width: 34, outlineLevel: 1 },
  ];
  detail.getColumn('progress').numFmt = PCT_FMT;
  detail.getColumn('price').numFmt = PRICE_FMT;
  detail.getColumn('weight').numFmt = '0';
  detail.getColumn('include').alignment = { horizontal: 'center' };
  styleHeaderRow(detail.getRow(1));
  detail.views = [{ state: 'frozen', ySplit: 1 }];
  detail.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 9 } };
  detail.getRow(1).getCell('include').note = t('export.includeHint');

  const INCLUDE_YES = '✓';
  const INCLUDE_NO = '✗';
  const priceCol = detail.getColumn('price').letter;
  const includeCol = detail.getColumn('include').letter;
  const sumIncluded = (first: number, last: number) =>
    `SUMIF(${includeCol}${first}:${includeCol}${last},"${INCLUDE_YES}",${priceCol}${first}:${priceCol}${last})`;

  // Track subtask row spans so totals can be live SUMIF formulas that react to
  // the include toggles instead of static numbers.
  let firstSubRow = 0;
  let lastSubRow = 0;
  const categoryTotalRows: number[] = [];

  for (const category of categories) {
    const catRow = detail.addRow({
      element: category.name,
      progress: category.averageProgress,
    });
    catRow.outlineLevel = 0;
    fillRow(catRow, COLOR.category, COLOR.categoryText);

    let catFirstSub = 0;
    let catLastSub = 0;

    for (const task of category.tasks ?? ([] as TaskDTO[])) {
      const taskRow = detail.addRow({
        element: `    ${task.title}`,
        comment: task.comment,
        progress: task.averageProgress,
      });
      taskRow.outlineLevel = 1;
      fillRow(taskRow, COLOR.task);

      let taskFirstSub = 0;
      let taskLastSub = 0;

      for (const sub of task.subtasks ?? ([] as SubtaskDTO[])) {
        const subRow = detail.addRow({
          element: `        ${sub.title}`,
          comment: sub.comment,
          deadline: formatDate(sub.date, locale),
          assignee: sub.createdBy,
          progress: sub.progressPercentage,
          weight: sub.weight,
          price: subtaskPrice(sub),
          include: INCLUDE_YES,
          link: sub.link ?? '',
        });
        subRow.outlineLevel = 2;
        const incCell = subRow.getCell('include');
        incCell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${INCLUDE_YES},${INCLUDE_NO}"`],
          showErrorMessage: true,
        };
        incCell.alignment = { horizontal: 'center' };

        const r = subRow.number;
        if (!taskFirstSub) taskFirstSub = r;
        taskLastSub = r;
        if (!catFirstSub) catFirstSub = r;
        catLastSub = r;
        if (!firstSubRow) firstSubRow = r;
        lastSubRow = r;
      }

      // Subtotal per task = "by subcategory", summing only included subtasks.
      const subtotalRow = detail.addRow({
        element: `    ${t('export.subtotal', { name: task.title })}`,
        progress: task.averageProgress,
      });
      subtotalRow.outlineLevel = 1;
      subtotalRow.getCell('price').value = taskFirstSub
        ? { formula: sumIncluded(taskFirstSub, taskLastSub) }
        : 0;
      subtotalRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.subtotal } };
        cell.font = { italic: true };
      });
    }

    // Total per category. The SUMIF spans the whole category block; only the
    // subtask rows carry an include flag, so subtotal rows are never counted.
    const catTotalRow = detail.addRow({
      element: t('export.categoryTotal', { name: category.name }),
      progress: category.averageProgress,
    });
    catTotalRow.outlineLevel = 0;
    catTotalRow.getCell('price').value = catFirstSub
      ? { formula: sumIncluded(catFirstSub, catLastSub) }
      : 0;
    fillRow(catTotalRow, COLOR.grandTotal);
    categoryTotalRows.push(catTotalRow.number);

    const blankRow = detail.addRow({});
    blankRow.outlineLevel = 0;
  }

  const grandRow = detail.addRow({ element: t('export.grandTotal') });
  grandRow.outlineLevel = 0;
  grandRow.getCell('price').value = firstSubRow ? { formula: sumIncluded(firstSubRow, lastSubRow) } : 0;
  grandRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.category } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  });
  grandRow.height = 24;
  const grandTotalRowNumber = grandRow.number;
  const detailRef = `'${t('export.detailSheet').replace(/'/g, "''")}'`;

  // ---- Summary sheet ------------------------------------------------------
  const summary = workbook.addWorksheet(t('export.summarySheet'));
  summary.columns = [
    { header: t('export.col.category'), key: 'category', width: 32 },
    { header: t('export.tasksCount'), key: 'tasks', width: 14 },
    { header: t('export.subtasksCount'), key: 'subtasks', width: 14 },
    { header: t('export.avgProgress'), key: 'progress', width: 16 },
    { header: t('export.totalPrice'), key: 'price', width: 16 },
  ];
  summary.getColumn('progress').numFmt = PCT_FMT;
  summary.getColumn('price').numFmt = PRICE_FMT;
  styleHeaderRow(summary.getRow(1));

  categories.forEach((category, i) => {
    const tasks = category.tasks ?? [];
    const subtaskCount = tasks.reduce((sum, task) => sum + (task.subtasks?.length ?? 0), 0);
    const row = summary.addRow({
      category: category.name,
      tasks: tasks.length,
      subtasks: subtaskCount,
      progress: category.averageProgress,
    });
    // Mirror the Detail category total so the include toggles flow through here too.
    row.getCell('price').value = { formula: `${detailRef}!${priceCol}${categoryTotalRows[i]}` };
  });

  // Overall weighted-average progress across every subtask (matches the app).
  const allSubtasks = categories.flatMap((c) => (c.tasks ?? []).flatMap((task) => task.subtasks ?? []));
  const totalWeight = allSubtasks.reduce((sum, s) => sum + s.weight, 0);
  const overallProgress =
    totalWeight === 0
      ? 0
      : Math.round((allSubtasks.reduce((sum, s) => sum + s.progressPercentage * s.weight, 0) / totalWeight) * 100) / 100;
  const totalTasks = categories.reduce((sum, c) => sum + (c.tasks?.length ?? 0), 0);

  const summaryTotalRow = summary.addRow({
    category: t('export.grandTotal'),
    tasks: totalTasks,
    subtasks: allSubtasks.length,
    progress: overallProgress,
  });
  summaryTotalRow.getCell('price').value = { formula: `${detailRef}!${priceCol}${grandTotalRowNumber}` };
  fillRow(summaryTotalRow, COLOR.grandTotal);

  // ---- Charts (embedded as images) ----------------------------------------
  const currencyFmt = (v: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(v));
  const pctFmt = (v: number) => `${Math.round(v)}%`;
  const labels = categories.map((c) => c.name);

  if (categories.length > 0) {
    const budgetChart = renderBarChart({
      title: t('export.chartBudget'),
      labels,
      values: categories.map((c) => c.totalPrice),
      barColor: '#D97B8A',
      valueFormatter: currencyFmt,
    });
    const progressChart = renderBarChart({
      title: t('export.chartProgress'),
      labels,
      values: categories.map((c) => c.averageProgress),
      barColor: '#5B8A72',
      valueFormatter: pctFmt,
      max: 100,
    });

    const anchorRow = categories.length + 3;
    const budgetId = workbook.addImage({ base64: budgetChart, extension: 'png' });
    summary.addImage(budgetId, {
      tl: { col: 0, row: anchorRow },
      ext: { width: 760, height: 380 },
    });
    const progressId = workbook.addImage({ base64: progressChart, extension: 'png' });
    summary.addImage(progressId, {
      tl: { col: 0, row: anchorRow + 21 },
      ext: { width: 760, height: 380 },
    });
  }

  // ---- Download -----------------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${t('export.fileName')}-${today}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
