import jsPDF from 'jspdf'
import { ReadingLevel, Language, READING_LEVEL_LABELS, LANGUAGE_LABELS } from './types'

interface PDFData {
  urgentItems: string[]
  translation: string
  summaryLine: string
  readingLevel: ReadingLevel
  language: Language
  generatedAt?: string
}

export async function generateTranslationPDF(data: PDFData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const addText = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' | 'italic',
    color: [number, number, number],
    maxWidth?: number
  ): number => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, maxWidth ?? contentWidth)
    const lineHeight = fontSize * 0.4
    if (y + lines.length * lineHeight > pageHeight - margin - 20) {
      doc.addPage()
      y = margin
    }
    doc.text(lines, margin, y)
    return lines.length * lineHeight
  }

  const addRule = (color: [number, number, number] = [228, 224, 216]): void => {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  // Header bar
  doc.setFillColor(15, 61, 52)
  doc.rect(0, 0, pageWidth, 18, 'F')
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(245, 240, 232)
  doc.text('HealthLiteracy AI', margin, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(93, 202, 165)
  doc.text('Your medical records, in your language.', pageWidth - margin, 12, { align: 'right' })

  y = 26

  // Meta line
  const date =
    data.generatedAt ??
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const meta = `${READING_LEVEL_LABELS[data.readingLevel]} · ${LANGUAGE_LABELS[data.language]} · ${date}`
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(158, 152, 144)
  doc.text(meta, margin, y)
  y += 8

  addRule()

  // Summary line
  y += 2
  y += addText(data.summaryLine, 11, 'bold', [26, 77, 70]) + 6

  // Urgent items
  if (data.urgentItems.length > 0) {
    // Urgent header
    doc.setFillColor(253, 244, 240)
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 58, 26)
    doc.text('IMPORTANT — DO THESE THINGS', margin + 4, y + 5.5)
    y += 12

    data.urgentItems.forEach((item) => {
      // Item background
      const lines = doc.splitTextToSize('• ' + item, contentWidth - 8)
      const boxHeight = lines.length * 4.5 + 6
      if (y + boxHeight > pageHeight - margin - 20) {
        doc.addPage()
        y = margin
      }
      doc.setFillColor(253, 244, 240)
      doc.setDrawColor(245, 197, 168)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(139, 58, 26)
      doc.text(lines, margin + 4, y + 5)
      y += boxHeight + 3
    })

    y += 4
    addRule()
    y += 4
  }

  // Translation heading
  y += addText('Plain Language Translation', 11, 'bold', [26, 22, 20]) + 5

  // Translation body — split on double newlines for paragraphs
  const paragraphs = data.translation.split(/\n\n+/).filter(Boolean)
  paragraphs.forEach((para) => {
    y += addText(para.trim(), 10, 'normal', [26, 22, 20]) + 5
  })

  // Disclaimer footer on last page
  const disclaimerY = pageHeight - 22
  doc.setFillColor(240, 236, 230)
  doc.rect(0, disclaimerY - 2, pageWidth, 24, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(92, 86, 80)
  const disclaimer =
    'HealthLiteracy AI is for patient education only. It does not provide medical advice. Always follow the instructions of your care team. If you are having a medical emergency, call 911 immediately.'
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth)
  doc.text(disclaimerLines, margin, disclaimerY + 4)

  doc.save('HealthLiteracy-Translation.pdf')
}
