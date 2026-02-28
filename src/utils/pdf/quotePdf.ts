import { formatPhp } from '@/utils/currency'

type PdfMakeType = {
  vfs?: unknown
  createPdf: (docDefinition: unknown) => {
    getBlob: (cb: (b: Blob) => void) => void
  }
}

let cachedPdfMake: PdfMakeType | null = null

async function getPdfMake(): Promise<PdfMakeType> {
  if (cachedPdfMake) return cachedPdfMake

  const pdfMakeModule = await import('pdfmake/build/pdfmake')
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts')

  const pdfMake = ((pdfMakeModule as unknown as { default?: PdfMakeType }).default ?? pdfMakeModule) as PdfMakeType

  const vfs =
    (pdfFontsModule as unknown as { pdfMake?: { vfs?: unknown } }).pdfMake?.vfs ??
    (pdfFontsModule as unknown as { default?: { pdfMake?: { vfs?: unknown } } }).default?.pdfMake?.vfs

  if (vfs && !pdfMake.vfs) pdfMake.vfs = vfs

  cachedPdfMake = pdfMake
  return pdfMake
}

export type QuotePdfItem = {
  sku: string
  name: string
  notes?: string | null
  imageDataUrl?: string | null
  qty: number
  unitPricePhp: number
  lineTotalPhp: number
}

export type QuotePdfModel = {
  quotationNo: string
  companyName: string
  logoDataUrl?: string | null
  createdAtLabel: string
  quotationDateLabel: string
  validUntilLabel: string
  statusLabel: string
  customerName: string
  items: QuotePdfItem[]
  grandTotalPhp: number
  terms: string
  signedByLabel: string
}

function asLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export async function tryFetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('file read failed'))
      reader.readAsDataURL(blob)
    })
    return dataUrl
  } catch {
    return null
  }
}

export async function buildQuotePdfBlob(model: QuotePdfModel): Promise<Blob> {
  const pdfMake = await getPdfMake()
  const tableBody: any[] = [
    [
      { text: 'PART NUMBER / DESCRIPTION', style: 'th' },
      { text: 'PRODUCT IMAGE', style: 'th', alignment: 'center' },
      { text: 'QTY', style: 'th', alignment: 'center' },
      { text: 'UNIT PRICE', style: 'th', alignment: 'right' },
      { text: 'TOTAL', style: 'th', alignment: 'right' },
    ],
  ]

  for (const it of model.items) {
    tableBody.push([
      {
        stack: [
          { text: it.sku, bold: true, margin: [0, 0, 0, 2] },
          { text: it.name, bold: true, margin: [0, 0, 0, 4] },
          ...(it.notes ? [{ text: it.notes, fontSize: 8, lineHeight: 1.2 }] : []),
        ],
        margin: [0, 4, 0, 4],
      },
      it.imageDataUrl
        ? { image: it.imageDataUrl, width: 60, margin: [0, 6, 0, 6], alignment: 'center' }
        : { text: '', margin: [0, 6, 0, 6] },
      { text: String(it.qty), alignment: 'center', margin: [0, 8, 0, 8] },
      { text: formatPhp(it.unitPricePhp), alignment: 'right', margin: [0, 8, 0, 8] },
      { text: formatPhp(it.lineTotalPhp), alignment: 'right', margin: [0, 8, 0, 8] },
    ])
  }

  tableBody.push([
    { text: '', colSpan: 3, border: [true, true, false, true] },
    {},
    {},
    { text: 'TOTAL', bold: true, alignment: 'right' },
    { text: formatPhp(model.grandTotalPhp), bold: true, alignment: 'right' },
  ])

  const termsLines = asLines(model.terms)

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 30, 40, 30],
    content: [
      ...(model.logoDataUrl
        ? [
            {
              image: model.logoDataUrl,
              width: 220,
              margin: [0, 0, 0, 10],
            },
          ]
        : []),
      {
        columns: [
          { text: `Quotation - ${model.quotationNo}`, fontSize: 9 },
          { text: model.createdAtLabel, fontSize: 9, alignment: 'right' },
        ],
        margin: [0, 0, 0, 16],
      },
      {
        columns: [
          {
            stack: [
              { text: model.companyName, fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
              {
                columns: [
                  {
                    width: '*',
                    stack: [
                      {
                        columns: [
                          { text: 'Date:', bold: true, width: 80 },
                          { text: model.quotationDateLabel, width: '*' },
                        ],
                      },
                      {
                        columns: [
                          { text: 'Quotation #:', bold: true, width: 80 },
                          { text: model.quotationNo, width: '*' },
                        ],
                      },
                      {
                        columns: [
                          { text: 'Valid Until:', bold: true, width: 80 },
                          { text: model.validUntilLabel, width: '*' },
                        ],
                      },
                      {
                        columns: [
                          { text: 'Status:', bold: true, width: 80 },
                          { text: model.statusLabel, width: '*' },
                        ],
                      },
                    ],
                  },
                  {
                    width: 180,
                    stack: [
                      { text: 'To:', bold: true, alignment: 'right' },
                      { text: model.customerName, bold: true, alignment: 'right' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 14],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 80, 40, 80, 80],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#EFEFEF' : null),
          hLineColor: () => '#999999',
          vLineColor: () => '#999999',
        },
        fontSize: 9,
        margin: [0, 0, 0, 14],
      },
      { text: 'TERMS AND CONDITIONS', bold: true, margin: [0, 8, 0, 6] },
      {
        ul: termsLines.length ? termsLines : ['Quoted prices are in Philippine Peso, VAT Inclusive.'],
        fontSize: 9,
        margin: [0, 0, 0, 18],
      },
      { text: 'Sincerely,', margin: [0, 0, 0, 24] },
      { text: model.signedByLabel, bold: true },
    ],
    styles: {
      th: { bold: true, fontSize: 8, color: '#333333' },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  }

  const pdf = pdfMake.createPdf(docDefinition)
  const blob = await new Promise<Blob>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('pdf timeout')), 30000)
    pdf.getBlob((b: Blob) => {
      window.clearTimeout(timeoutId)
      resolve(b)
    })
  })
  return blob
}
