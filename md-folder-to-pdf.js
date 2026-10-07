#!/usr/bin/env node

/**
 * Universal MD & PDF Utility Tool
 * 
 * Features:
 * 1. MD to PDF Mode: Converts folder of .md files to single merged PDF or individual PDFs.
 * 2. PDF Merger Mode: Combines a directory of existing .pdf files into a single master PDF using pdf-lib.
 * 
 * Usage:
 *   # Convert MD folder to single PDF
 *   node md-folder-to-pdf.js ./notes ./output/Combined.pdf
 * 
 *   # Generate individual PDFs for each MD file + combined PDF
 *   node md-folder-to-pdf.js ./notes ./output/Combined.pdf --individual ./output/individual_pdfs
 * 
 *   # Combine folder of existing PDF files into single merged PDF
 *   node md-folder-to-pdf.js --merge-pdfs ./pdf_folder ./output/Merged_All_PDFs.pdf
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');
const { chromium } = require('@playwright/test');
const { PDFDocument } = require('pdf-lib');

// Configure marked with highlight.js syntax highlighting
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    try {
      return hljs.highlight(code, { language }).value;
    } catch (err) {
      return code;
    }
  },
  gfm: true,
  breaks: true,
});

// Natural numerical sorting helper (e.g. SECTION_2 before SECTION_10)
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Custom GitHub + Enterprise Stylesheet
const CSS_STYLES = `
  @import url('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css');

  @page {
    size: A4;
    margin: 18mm 15mm 20mm 15mm;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #24292e;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  .cover-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    page-break-after: always;
    break-after: page;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #ffffff;
    padding: 40px;
    box-sizing: border-box;
  }

  .cover-title {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
    color: #38bdf8;
  }

  .cover-subtitle {
    font-size: 18px;
    font-weight: 400;
    color: #94a3b8;
    margin-bottom: 40px;
    max-width: 600px;
  }

  .cover-badge {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 30px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cover-meta {
    font-size: 12px;
    color: #64748b;
    border-top: 1px solid #334155;
    padding-top: 20px;
    width: 80%;
  }

  .section-container {
    page-break-after: always;
    break-after: page;
  }

  .section-container:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  h1 { font-size: 22px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px; }
  h2 { font-size: 17px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px; margin-bottom: 12px; }
  h3 { font-size: 14px; font-weight: 600; color: #334155; margin-top: 16px; margin-bottom: 8px; }
  p, li { font-size: 13px; color: #334155; }

  pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-family: "JetBrains Mono", Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.5;
    margin: 12px 0;
  }

  code {
    font-family: "JetBrains Mono", Consolas, monospace;
    font-size: 11.5px;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
  }

  pre code { background-color: transparent; padding: 0; }

  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  th { background-color: #f1f5f9; font-weight: 600; color: #0f172a; }
  tr:nth-child(even) { background-color: #f8fafc; }

  blockquote {
    border-left: 4px solid #38bdf8;
    background-color: #f0f9ff;
    color: #0369a1;
    margin: 14px 0;
    padding: 10px 16px;
    border-radius: 0 6px 6px 0;
  }

  .toc-container { page-break-after: always; break-after: page; padding: 20px 0; }
  .toc-title { font-size: 22px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 20px; }
  .toc-list { list-style-type: none; padding-left: 0; }
  .toc-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
  .toc-item a { color: #0284c7; text-decoration: none; }
  .toc-file { color: #64748b; font-size: 11px; font-family: monospace; }
`;

/**
 * Merge multiple PDF files into a single output PDF using pdf-lib
 */
async function mergePDFs(pdfPaths, outputPath) {
  console.log(`\n🧩 Merging ${pdfPaths.length} PDF files into single master PDF...`);
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < pdfPaths.length; i++) {
    const pdfPath = pdfPaths[i];
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      console.log(`  [${i + 1}/${pdfPaths.length}] Merged ${path.basename(pdfPath)} (${pdf.getPageCount()} pages)`);
    } catch (err) {
      console.error(`  ❌ Failed to merge ${pdfPath}:`, err.message);
    }
  }

  const mergedPdfBytes = await mergedPdf.save();
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, mergedPdfBytes);
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 MERGE COMPLETE! Output PDF saved to:`);
  console.log(`  - File: ${outputPath}`);
  console.log(`  - Size: ${sizeMB} MB`);
  console.log(`  - Total Pages: ${mergedPdf.getPageCount()}\n`);
}

/**
 * Convert single HTML string to PDF using Playwright Chromium
 */
async function renderHtmlToPdf(htmlContent, outputPath, title, isLandscape = false) {
  const tempHtmlPath = path.join(process.cwd(), `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle' });

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: isLandscape,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size: 8px; font-family: sans-serif; color: #94a3b8; width: 100%; text-align: right; padding-right: 15mm;">${title}</div>`,
    footerTemplate: `<div style="font-size: 8px; font-family: sans-serif; color: #94a3b8; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    margin: { top: '18mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();

  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}

// Main CLI Execution logic
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
📄 MD & PDF Utility CLI Tool

Usage Mode 1: Convert MD folder to single PDF (+ optional individual PDFs)
  node md-folder-to-pdf.js <md_folder> [output_combined_pdf] [options]

Usage Mode 2: Merge directory of existing PDF files into single PDF
  node md-folder-to-pdf.js --merge-pdfs <pdf_folder> [output_merged_pdf]

Options:
  --individual <dir>   Save individual PDFs for each .md file into specified directory
  --merge-pdfs <dir>   Merge all .pdf files in specified directory into single PDF
  --title <title>      Custom title for document cover page
  --subtitle <sub>     Custom subtitle for document cover page
  --landscape          Render PDF in landscape orientation

Examples:
  # Convert MD folder to single PDF
  node md-folder-to-pdf.js ./notes ./Senior_SDET_Notebook.pdf

  # Convert MD folder to individual PDFs + combined PDF
  node md-folder-to-pdf.js ./notes ./Combined.pdf --individual ./notes_pdfs

  # Combine folder of existing PDF files
  node md-folder-to-pdf.js --merge-pdfs ./notes_pdfs ./Combined_From_PDFs.pdf
`);
    process.exit(0);
  }

  // Check if user requested PDF merge mode directly
  const mergeIdx = args.indexOf('--merge-pdfs');
  if (mergeIdx !== -1) {
    const pdfDir = path.resolve(args[mergeIdx + 1]);
    let outPath = args[mergeIdx + 2] && !args[mergeIdx + 2].startsWith('--')
      ? path.resolve(args[mergeIdx + 2])
      : path.join(process.cwd(), 'Combined_Merged_PDFs.pdf');

    if (!fs.existsSync(pdfDir) || !fs.statSync(pdfDir).isDirectory()) {
      console.error(`❌ Error: PDF directory does not exist: ${pdfDir}`);
      process.exit(1);
    }

    const pdfFiles = fs.readdirSync(pdfDir)
      .filter(f => f.endsWith('.pdf'))
      .sort(naturalSort)
      .map(f => path.join(pdfDir, f));

    if (pdfFiles.length === 0) {
      console.error(`❌ Error: No .pdf files found in directory: ${pdfDir}`);
      process.exit(1);
    }

    await mergePDFs(pdfFiles, outPath);
    return;
  }

  // Default: Process Markdown files
  const folderPath = path.resolve(args[0]);
  let outputPath = args[1] && !args[1].startsWith('--')
    ? path.resolve(args[1])
    : path.join(process.cwd(), 'output.pdf');

  let title = 'Enterprise Technical Documentation';
  let subtitle = 'Consolidated Technical Notes & Reference Guide';
  let isLandscape = false;
  let individualDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) title = args[i + 1];
    if (args[i] === '--subtitle' && args[i + 1]) subtitle = args[i + 1];
    if (args[i] === '--landscape') isLandscape = true;
    if (args[i] === '--individual' && args[i + 1]) individualDir = path.resolve(args[i + 1]);
  }

  console.log(`\n🔍 Input MD Directory: ${folderPath}`);

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    console.error(`❌ Error: Directory does not exist: ${folderPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.md'))
    .sort(naturalSort);

  if (files.length === 0) {
    console.error(`❌ Error: No .md files found in directory: ${folderPath}`);
    process.exit(1);
  }

  console.log(`📁 Found ${files.length} Markdown files. Processing...`);

  let totalLines = 0;
  const sections = [];
  const tocEntries = [];
  const generatedIndividualPdfs = [];

  if (individualDir) {
    if (!fs.existsSync(individualDir)) {
      fs.mkdirSync(individualDir, { recursive: true });
    }
    console.log(`📂 Individual PDFs will be saved to: ${individualDir}`);
  }

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(folderPath, fileName);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    totalLines += lines;

    const h1Match = content.match(/^#\s+(.+)$/m);
    const sectionTitle = h1Match ? h1Match[1].replace(/[*_`]/g, '') : fileName.replace('.md', '');

    const htmlContent = marked.parse(content);
    
    sections.push(`
      <div class="section-container" id="section-${i}">
        ${htmlContent}
      </div>
    `);

    tocEntries.push(`
      <li class="toc-item">
        <a href="#section-${i}">${sectionTitle}</a>
        <span class="toc-file">${fileName} (${lines} lines)</span>
      </li>
    `);

    // If individual option enabled, render individual PDF per markdown file
    if (individualDir) {
      const pdfFileName = fileName.replace(/\.md$/, '.pdf');
      const individualPdfPath = path.join(individualDir, pdfFileName);
      const singleHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><style>${CSS_STYLES}</style></head>
        <body><div class="section-container">${htmlContent}</div></body>
        </html>
      `;
      await renderHtmlToPdf(singleHtml, individualPdfPath, sectionTitle, isLandscape);
      generatedIndividualPdfs.push(individualPdfPath);
      console.log(`  [${i + 1}/${files.length}] Rendered individual PDF: ${pdfFileName} (${lines} lines)`);
    } else {
      console.log(`  [${i + 1}/${files.length}] Parsed ${fileName} (${lines} lines)`);
    }
  }

  // Render combined PDF directly from compiled HTML
  console.log(`\n⚙️ Rendering combined master PDF...`);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const tocHtml = `
    <div class="toc-container">
      <div class="toc-title">Table of Contents (${files.length} Sections)</div>
      <ul class="toc-list">${tocEntries.join('')}</ul>
    </div>
  `;

  const coverHtml = `
    <div class="cover-page">
      <div class="cover-badge">Master Technical Collection</div>
      <div class="cover-title">${title}</div>
      <div class="cover-subtitle">${subtitle}</div>
      <div class="cover-meta">
        <div><strong>Total Sections:</strong> ${files.length} Files</div>
        <div><strong>Total Volume:</strong> ${totalLines.toLocaleString()} Lines of Engineering Content</div>
        <div><strong>Generated On:</strong> ${currentDate}</div>
      </div>
    </div>
  `;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>${title}</title><style>${CSS_STYLES}</style></head>
    <body>
      ${coverHtml}
      ${tocHtml}
      ${sections.join('\n')}
    </body>
    </html>
  `;

  await renderHtmlToPdf(fullHtml, outputPath, title, isLandscape);

  const pdfStats = fs.statSync(outputPath);
  const pdfSizeMB = (pdfStats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 SUCCESS! Master PDF generated successfully:`);
  console.log(`  - Output Master PDF: ${outputPath}`);
  console.log(`  - File Size:        ${pdfSizeMB} MB`);
  console.log(`  - Total Sections:   ${files.length} files`);
  console.log(`  - Total Content:    ${totalLines.toLocaleString()} lines\n`);

  // If individual PDFs were generated, also demonstrate merging them via pdf-lib
  if (individualDir && generatedIndividualPdfs.length > 0) {
    const mergedFromIndividualPath = path.join(path.dirname(outputPath), 'Combined_From_Individual_PDFs.pdf');
    await mergePDFs(generatedIndividualPdfs, mergedFromIndividualPath);
  }
}

main().catch(err => {
  console.error('❌ Error in PDF utility:', err);
  process.exit(1);
});
