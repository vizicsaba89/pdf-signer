import { SignatureOptions } from '../model/signature-options'
import { convertObject } from '../pdf-object-converter/pdf-object'
import { DEFAULT_SIGNATURE_LENGTH } from './const'
import createBufferPageWithAnnotation from './create-buffer-page-with-annotation'
import createBufferRootWithAcroform from './create-buffer-root-with-acrofrom'
import createBufferTrailer from './create-buffer-trailer'
import getIndexFromRef from './get-index-from-ref'
import getPageRef from './get-page-ref'
import pdfkitAddPlaceholder from './pdf-kit-add-placeholder'
import PDFKitReferenceMock from './pdf-kit-reference-mock'
import readPdf from './read-pdf'
import removeTrailingNewLine from './remove-trailing-new-line'

class PdfCreator {
  pdf: any
  originalPdf: any
  maxIndex: any
  signatureOnPage: any
  addedReferences = new Map()

  constructor(originalPdf: Buffer) {
    this.pdf = removeTrailingNewLine(originalPdf)

    const info = readPdf(this.pdf)
    const pageRef = getPageRef(this.pdf, info, true)
    const pageIndex = getIndexFromRef(info.xref, pageRef)

    this.originalPdf = originalPdf

    this.maxIndex = info.xref.maxIndex
    this.signatureOnPage = new PDFKitReferenceMock(pageIndex, {
      data: {
        Annots: [],
      },
    })
  }

  ref(pdfElement: any, additionalIndex: number | undefined, stream: any) {
    this.maxIndex += 1

    const index = additionalIndex != null ? additionalIndex : this.maxIndex

    this.addedReferences.set(index, this.pdf.length + 1)

    this.pdf = this.getAssembledPdf(this.pdf, index, pdfElement, stream)

    return new PDFKitReferenceMock(this.maxIndex)
  }

  close(form: any, widget: any) {
    const info = readPdf(this.pdf)
    const pageRef = getPageRef(this.pdf, info, true)
    const pageIndex = getIndexFromRef(info.xref, pageRef)

    if (!this.isContainBufferRootWithAcrofrom(this.originalPdf)) {
      const rootIndex = getIndexFromRef(info.xref, info.rootRef)
      this.addedReferences.set(rootIndex, this.pdf.length + 1)
      this.pdf = Buffer.concat([
        this.pdf,
        Buffer.from('\n'),
        createBufferRootWithAcroform(info, form),
      ])
    }

    this.addedReferences.set(pageIndex, this.pdf.length + 1)
    this.pdf = Buffer.concat([
      this.pdf,
      Buffer.from('\n'),
      createBufferPageWithAnnotation(this.pdf, info, pageRef, widget),
    ])

    this.pdf = Buffer.concat([
      this.pdf,
      Buffer.from('\n'),
      createBufferTrailer(this.pdf, info, this.addedReferences),
    ])
  }

  private getAssembledPdf(pdf: any, index: any, input: any, stream: any): Buffer {
    let finalPdf = pdf

    finalPdf = Buffer.concat([
      finalPdf,
      Buffer.from('\n'),
      Buffer.from(`${index} 0 obj\n`),
      Buffer.from(convertObject(input)),
    ])

    if (stream) {
      finalPdf = Buffer.concat([
        finalPdf,
        Buffer.from('\nstream\n'),
        Buffer.from(stream),
        Buffer.from('\nendstream'),
      ])
    }

    finalPdf = Buffer.concat([finalPdf, Buffer.from('\nendobj\n')])

    return finalPdf
  }

  private isContainBufferRootWithAcrofrom(pdf: Buffer) {
    const bufferRootWithAcroformRefRegex = new RegExp('\\/AcroForm\\s+(\\d+\\s\\d+\\sR)', 'g')
    const match = bufferRootWithAcroformRefRegex.exec(pdf.toString())

    return match != null && match[1] != null && match[1] !== ''
  }
}

const plainAddPlaceholder = async (
  pdfBuffer: Buffer,
  signatureOptions: SignatureOptions,
  signatureLength: number = DEFAULT_SIGNATURE_LENGTH,
) => {
  const pdfAppender = new PdfCreator(pdfBuffer)

  const { form, widget } = await pdfkitAddPlaceholder({
    pdf: pdfAppender,
    pdfBuffer,
    signatureLength,
    signatureOptions,
  })

  pdfAppender.close(form, widget)

  return pdfAppender.pdf
}

export default plainAddPlaceholder
