import { SignatureOptions } from '../model/signature-options'
import { DEFAULT_SIGNATURE_LENGTH } from './const'
import { PdfCreator } from './pdf-creator'
import { appendAcroform, appendAnnotationApparance, appendFont, appendImage, appendSignature, appendWidget } from './pdf-kit-add-placeholder'
import PDFKitReferenceMock from './pdf-kit-reference-mock'

const plainAddPlaceholder = async (
  pdfBuffer: Buffer,
  signatureOptions: SignatureOptions,
  signatureLength: number = DEFAULT_SIGNATURE_LENGTH,
) => {
  const annotationOnPages =
    signatureOptions.annotationOnPages != null ? signatureOptions.annotationOnPages : [0]

  const pdfAppender = new PdfCreator(pdfBuffer, annotationOnPages)

  const acroFormPosition = pdfAppender.pdf.lastIndexOf('/Type /AcroForm')
  const isAcroFormExists = acroFormPosition !== -1
  let acroFormId
  let fieldIds: PDFKitReferenceMock[] = []

  if (isAcroFormExists) {
    const acroForm = getAcroForm(pdfAppender.pdf, acroFormPosition)
    acroFormId = getAcroFormId(acroForm)
    fieldIds = getFieldIds(acroForm)
  }

  const imageReference = await appendImage(pdfAppender, signatureOptions)
  const signatureReference = appendSignature(pdfAppender, signatureOptions, signatureLength)
  const helveticaFontReference = appendFont(pdfAppender, 'Helvetica')
  const zapfDingbatsFontReference = appendFont(pdfAppender, 'ZapfDingbats')


  const widgetReferenceList = annotationOnPages.map((annotationPage, index) => {
    const annotationReference = appendAnnotationApparance(
      pdfAppender,
      signatureOptions,
      helveticaFontReference,
      imageReference,
    )

    const widgetReference = appendWidget(
      pdfAppender,
      index + 1,
      signatureOptions,
      signatureReference,
      annotationReference,
    )

    return widgetReference
  })

  const formReference = appendAcroform(pdfAppender, fieldIds, widgetReferenceList, [{name: 'Helvetica', ref: helveticaFontReference}, {name: 'ZapfDingbats', ref: zapfDingbatsFontReference}] acroFormId)

  pdfAppender.close(formReference, widgetReferenceList)

  return pdfAppender.pdf
}

const getAcroForm = (pdfBuffer: Buffer, acroFormPosition: number) => {
  const pdfSlice = pdfBuffer.slice(acroFormPosition - 12)
  const acroForm = pdfSlice.slice(0, pdfSlice.indexOf('endobj')).toString()

  return acroForm
}

const getAcroFormId = (acroForm: string) => {
  const acroFormFirsRow = acroForm.split('\n')[0]
  const acroFormId = parseInt(acroFormFirsRow.split(' ')[0])

  return acroFormId
}

const getFieldIds = (acroForm: string) => {
  let fieldIds: PDFKitReferenceMock[] = []
  const acroFormFields = acroForm.slice(acroForm.indexOf('/Fields [') + 9, acroForm.indexOf(']'))
  fieldIds = acroFormFields
    .split(' ')
    .filter((_element, index) => index % 3 === 0)
    .map((fieldId) => new PDFKitReferenceMock(fieldId))

  return fieldIds
}

export default plainAddPlaceholder
