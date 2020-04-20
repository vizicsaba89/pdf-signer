import { SignatureOptions } from '../model/signature-options'
import { DEFAULT_SIGNATURE_LENGTH } from './const'
import createBufferPageWithAnnotation from './create-buffer-page-with-annotation'
import createBufferRootWithAcroform from './create-buffer-root-with-acrofrom'
import createBufferTrailer from './create-buffer-trailer'
import getIndexFromRef from './get-index-from-ref'
import getPageRef from './get-page-ref'
import pdfkitAddPlaceholder from './pdf-kit-add-placeholder'
import PDFKitReferenceMock from './pdf-kit-reference-mock'
import { PDFObject } from './pdfkit/pdfobject'
import readPdf from './read-pdf'
import removeTrailingNewLine from './remove-trailing-new-line'

const plainAddPlaceholder = async (
  pdfBuffer: Buffer,
  signatureOptions: SignatureOptions,
  signatureLength: number = DEFAULT_SIGNATURE_LENGTH,
) => {
  let pdf = removeTrailingNewLine(pdfBuffer)
  const info = readPdf(pdf)
  const pageRef = getPageRef(pdf, info, signatureOptions.shouldAnnotationAppearOnFirstPage)
  const pageIndex = getIndexFromRef(info.xref, pageRef)
  const addedReferences = new Map()

  const pdfKitMock = {
    ref: (input: any, additionalIndex: number | undefined, stream: any) => {
      info.xref.maxIndex += 1

      const index = additionalIndex != null ? additionalIndex : info.xref.maxIndex

      addedReferences.set(index, pdf.length + 1)

      pdf = getAssembledPdf(pdf, index, input, stream)

      return new PDFKitReferenceMock(info.xref.maxIndex)
    },
    page: {
      dictionary: new PDFKitReferenceMock(pageIndex, {
        data: {
          Annots: [],
        },
      }),
    },
    _root: {
      data: {},
    },
  }

  const { form, widget } = await pdfkitAddPlaceholder({
    pdf: pdfKitMock,
    pdfBuffer,
    signatureLength,
    signatureOptions,
  })

  if (!isContainBufferRootWithAcrofrom(pdfBuffer)) {
    const rootIndex = getIndexFromRef(info.xref, info.rootRef)
    addedReferences.set(rootIndex, pdf.length + 1)
    pdf = Buffer.concat([pdf, Buffer.from('\n'), createBufferRootWithAcroform(info, form)])
  }

  addedReferences.set(pageIndex, pdf.length + 1)
  pdf = Buffer.concat([
    pdf,
    Buffer.from('\n'),
    createBufferPageWithAnnotation(pdf, info, pageRef, widget),
  ])

  pdf = Buffer.concat([pdf, Buffer.from('\n'), createBufferTrailer(pdf, info, addedReferences)])

  return pdf
}

const getAssembledPdf = (pdf: any, index: any, input: any, stream: any): Buffer => {
  let finalPdf = pdf

  finalPdf = Buffer.concat([
    finalPdf,
    Buffer.from('\n'),
    Buffer.from(`${index} 0 obj\n`),
    Buffer.from(PDFObject.convert(input)),
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

const isContainBufferRootWithAcrofrom = (pdf: Buffer) => {
  const bufferRootWithAcroformRefRegex = new RegExp('\\/AcroForm\\s+(\\d+\\s\\d+\\sR)', 'g')
  const match = bufferRootWithAcroformRefRegex.exec(pdf.toString())

  return match != null && match[1] != null && match[1] !== ''
}

export default plainAddPlaceholder
