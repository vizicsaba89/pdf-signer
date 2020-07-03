import { convertObject } from '../pdf-object-converter/pdf-object'
import createBufferPageWithAnnotation from './create-buffer-page-with-annotation'
import createBufferRootWithAcroform from './create-buffer-root-with-acrofrom'
import createBufferTrailer from './create-buffer-trailer'
import getIndexFromRef from './get-index-from-ref'
import getPageRef from './get-page-ref'
import PDFKitReferenceMock from './pdf-kit-reference-mock'
import readPdf from './read-pdf'
import removeTrailingNewLine from './remove-trailing-new-line'

export class PdfCreator {
  pdf: any
  originalPdf: any
  maxIndex: any
  addedReferences = new Map()

  annotationOnPages: { pageRef: PDFKitReferenceMock; pageIndex: number }[] = []
  widgetCounter: number

  constructor(originalPdf: Buffer, annotationOnPages: number[]) {
    this.pdf = removeTrailingNewLine(originalPdf)
    this.originalPdf = originalPdf
    this.maxIndex = readPdf(this.pdf).xref.maxIndex

    if (annotationOnPages == null) {
      this.initAnnotationInfos(0)
      this.widgetCounter = 0
    } else {
      annotationOnPages.forEach((annotationOnPage) => {
        this.initAnnotationInfos(annotationOnPage)
      })
      this.widgetCounter = annotationOnPages.length - 1
    }
  }

  initAnnotationInfos(annotationOnPage: number) {
    const info = readPdf(this.pdf)
    const pageRef = getPageRef(this.pdf, info, annotationOnPage)
    const pageIndex = getIndexFromRef(info.xref, pageRef)

    this.annotationOnPages = [
      ...this.annotationOnPages,
      {
        pageIndex: annotationOnPage,
        pageRef: new PDFKitReferenceMock(pageIndex, {
          data: {
            Annots: [],
          },
        }),
      },
    ]
  }

  getCurrentWidgetPageReference() {
    const currentPageReference = this.annotationOnPages[this.widgetCounter]
    this.widgetCounter -= 1
    return currentPageReference.pageRef
  }

  append(pdfElement: any, additionalIndex?: number | undefined) {
    this.maxIndex += 1

    const index = additionalIndex != null ? additionalIndex : this.maxIndex

    this.addedReferences.set(index, this.pdf.length + 1)

    this.appendPdfObject(index, pdfElement)

    return new PDFKitReferenceMock(this.maxIndex)
  }

  appendStream(pdfElement: any, stream: any, additionalIndex?: number | undefined) {
    this.maxIndex += 1

    const index = additionalIndex != null ? additionalIndex : this.maxIndex

    this.addedReferences.set(index, this.pdf.length + 1)

    this.appendPdfObjectWithStream(index, pdfElement, stream)

    return new PDFKitReferenceMock(this.maxIndex)
  }

  close(form: any, widgetReferenceList: PDFKitReferenceMock[]) {
    const info = readPdf(this.pdf)

    if (!this.isContainBufferRootWithAcrofrom(this.originalPdf)) {
      const rootIndex = getIndexFromRef(info.xref, info.rootRef)
      this.addedReferences.set(rootIndex, this.pdf.length + 1)
      this.pdf = Buffer.concat([
        this.pdf,
        Buffer.from('\n'),
        createBufferRootWithAcroform(info, form),
      ])
    }

    this.annotationOnPages.forEach((annotationOnPage, index) => {
      const { pageRef } = annotationOnPage

      this.addedReferences.set(pageRef.index, this.pdf.length + 1)

      this.pdf = Buffer.concat([
        this.pdf,
        Buffer.from('\n'),
        createBufferPageWithAnnotation(this.pdf, info, pageRef.toString(), widgetReferenceList[index]),
      ])
    })

    this.pdf = Buffer.concat([
      this.pdf,
      Buffer.from('\n'),
      createBufferTrailer(this.pdf, info, this.addedReferences),
    ])
  }

  private appendPdfObjectWithStream(index: any, pdfObject: any, stream: any): void {
    this.pdf = Buffer.concat([
      this.pdf,
      Buffer.from('\n'),
      Buffer.from(`${index} 0 obj\n`),
      Buffer.from(convertObject(pdfObject)),
      Buffer.from('\nstream\n'),
      Buffer.from(stream),
      Buffer.from('\nendstream'),
      Buffer.from('\nendobj\n'),
    ])
  }

  private appendPdfObject(index: any, pdfObject: any): void {
    this.pdf = Buffer.concat([
      this.pdf,
      Buffer.from('\n'),
      Buffer.from(`${index} 0 obj\n`),
      Buffer.from(convertObject(pdfObject)),
      Buffer.from('\nendobj\n'),
    ])
  }

  private isContainBufferRootWithAcrofrom(pdf: Buffer) {
    const bufferRootWithAcroformRefRegex = new RegExp('\\/AcroForm\\s+(\\d+\\s\\d+\\sR)', 'g')
    const match = bufferRootWithAcroformRefRegex.exec(pdf.toString())

    return match != null && match[1] != null && match[1] !== ''
  }
}
