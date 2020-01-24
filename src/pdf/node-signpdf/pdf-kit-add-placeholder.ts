import { getImage } from '../image/appender'
import { PdfKitMock } from '../model/pdf-kit-mock'
import { SignatureOptions } from '../model/signature-options'
import { DEFAULT_BYTE_RANGE_PLACEHOLDER, DEFAULT_SIGNATURE_LENGTH } from './const'
import PDFKitReferenceMock from './pdf-kit-reference-mock'
import { CoordinateData } from '../model/coordinate-data'
import { SignatureDetails } from '../model/signature-details'
import { AnnotationAppearanceOptions } from '../model/annotation-appearance-options'

const specialCharacters = [
  'á',
  'Á',
  'é',
  'É',
  'í',
  'Í',
  'ó',
  'Ó',
  'ö',
  'Ö',
  'ő',
  'Ő',
  'ú',
  'Ú',
  'ű',
  'Ű',
]

const pdfkitAddPlaceholder = ({
  pdf,
  pdfBuffer,
  signatureLength = DEFAULT_SIGNATURE_LENGTH,
  byteRangePlaceholder = DEFAULT_BYTE_RANGE_PLACEHOLDER,
  signatureOptions,
}: {
  pdf: PdfKitMock
  pdfBuffer: Buffer
  signatureLength?: number
  byteRangePlaceholder?: string
  signatureOptions: SignatureOptions
}) => {
  const acroFormPosition = pdfBuffer.lastIndexOf('/Type /AcroForm')
  const isAcroFormExists = acroFormPosition !== -1
  let acroFormId
  let fieldIds: PDFKitReferenceMock[] = []

  if (isAcroFormExists) {
    const acroForm = getAcroForm(pdfBuffer, acroFormPosition)
    acroFormId = getAcroFormId(acroForm)
    fieldIds = getFieldIds(acroForm)
  }

  const FONT = getFont(pdf, 'Helvetica')
  const ZAF = getFont(pdf, 'ZapfDingbats')
  const APFONT = getFont(pdf, 'Helvetica')
  const IMG = getImage(signatureOptions.annotationAppearanceOptions.imageDetails.imagePath, pdf)

  const AP = getAnnotationApparance(pdf, IMG, APFONT, signatureOptions)
  const SIGNATURE = getSignature(
    pdf,
    byteRangePlaceholder,
    signatureLength,
    signatureOptions.reason,
    signatureOptions,
  )
  const WIDGET = getWidget(
    pdf,
    fieldIds,
    SIGNATURE,
    AP,
    signatureOptions.annotationAppearanceOptions.signatureCoordinates,
  )

  const ACROFORM = getAcroform(pdf, fieldIds, WIDGET, FONT, ZAF, acroFormId)

  return {
    signature: SIGNATURE,
    form: ACROFORM,
    widget: WIDGET,
  }
}

const getAcroform = (
  pdf: PdfKitMock,
  fieldIds: PDFKitReferenceMock[],
  WIDGET: PDFKitReferenceMock,
  FONT: PDFKitReferenceMock,
  ZAF: PDFKitReferenceMock,
  acroFormId: number | undefined,
) => {
  return pdf.ref(
    {
      Type: 'AcroForm',
      SigFlags: 3,
      Fields: [...fieldIds, WIDGET],
      DR: `<</Font\n<</Helvetica ${FONT.index} 0 R/ZapfDingbats ${ZAF.index} 0 R>>\n>>`,
    },
    acroFormId,
  )
}

const getWidget = (
  pdf: PdfKitMock,
  fieldIds: PDFKitReferenceMock[],
  signature: PDFKitReferenceMock,
  AP: PDFKitReferenceMock,
  signatureCoordinates: CoordinateData,
) => {
  const signatureBaseName = 'Signature'

  return pdf.ref({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: [
      signatureCoordinates.left,
      signatureCoordinates.bottom,
      signatureCoordinates.right,
      signatureCoordinates.top,
    ],
    V: signature,
    T: new String(signatureBaseName + (fieldIds.length + 1)), // eslint-disable-line no-new-wrappers
    F: 4,
    AP: `<</N ${AP.index} 0 R>>`,
    P: pdf.page.dictionary, // eslint-disable-line no-underscore-dangle
    DA: new String('/Helvetica 0 Tf 0 g'), // eslint-disable-line no-new-wrappers
  })
}

const getAnnotationApparance = (
  pdf: PdfKitMock,
  IMG: any,
  APFONT: PDFKitReferenceMock,
  signatureOptions: SignatureOptions,
) => {
  return pdf.ref(
    {
      CropBox: [0, 0, 197, 70],
      Type: 'XObject',
      FormType: 1,
      BBox: [-10, 10, 197.0, 70.0],
      Resources: `<</XObject <<\n/Img${IMG.index} ${IMG.index} 0 R\n>>\n/Font <<\n/f1 ${APFONT.index} 0 R\n>>\n>>`,
      MediaBox: [0, 0, 197, 70],
      Subtype: 'Form',
    },
    undefined,
    getStream(signatureOptions.annotationAppearanceOptions, IMG.index),
  )
}

const getStream = (annotationAppearanceOptions: AnnotationAppearanceOptions, imgIndex: number) => {
  const generatedContent = generateSignatureContents(
    annotationAppearanceOptions.signatureDetails,
  )
  const { rotate, space, stretch, tilt, xPos, yPos } = annotationAppearanceOptions.imageDetails.transformOptions;

  return getConvertedText(`
    1.0 1.0 1.0 rg
    0.0 0.0 0.0 RG
    q
    q
    ${space} ${rotate} ${tilt} ${stretch} ${xPos} ${yPos} cm
    /Img${imgIndex} Do
    Q
    0 0 0 rg
    ${generatedContent}
    Q`)
}

const generateSignatureContents = (details: SignatureDetails[]) => {
  const detailsAsPdfContent = details.map((detail, index) => {
    const detailAsPdfContent = generateSignatureContent(detail)
    return detailAsPdfContent
  })

  return detailsAsPdfContent.join()
}

const generateSignatureContent = (detail: SignatureDetails) => {
  const { rotate, space, tilt, xPos, yPos } = detail.transformOptions

  return `
    BT
    0 Tr
    /f1 ${detail.fontSize} Tf
    ${space} ${rotate} ${tilt} 1 ${xPos} ${yPos} Tm
    (${detail.value}) Tj
    ET
  `
}

const getFieldIds = (acroForm: string) => {
  let fieldIds: PDFKitReferenceMock[] = []
  const acroFormFields = acroForm.slice(acroForm.indexOf('/Fields [') + 9, acroForm.indexOf(']'))
  fieldIds = acroFormFields
    .split(' ')
    .filter((_element, index) => index % 3 === 0)
    .map(fieldId => new PDFKitReferenceMock(fieldId))

  return fieldIds
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

const getFont = (pdf: PdfKitMock, baseFont: string) => {
  return pdf.ref({
    Type: 'Font',
    BaseFont: baseFont,
    Encoding: 'WinAnsiEncoding',
    Subtype: 'Type1',
  })
}

const getSignature = (
  pdf: PdfKitMock,
  byteRangePlaceholder: string,
  signatureLength: number,
  reason: string,
  signatureDetails: SignatureOptions,
) => {
  return pdf.ref({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: [0, byteRangePlaceholder, byteRangePlaceholder, byteRangePlaceholder],
    Contents: Buffer.from(String.fromCharCode(0).repeat(signatureLength)),
    Reason: new String(reason),
    M: new Date(),
    ContactInfo: new String(`${signatureDetails.email}`),
    Name: new String(`${signatureDetails.signerName}`),
    Location: new String(`${signatureDetails.location}`),
  })
}

const getConvertedText = (text: string) => {
  return text
    .split('')
    .map(character => {
      return specialCharacters.includes(character)
        ? getOctalCodeFromCharacter(character)
        : character
    })
    .join('')
}

const getOctalCodeFromCharacter = (character: string) => {
  return '\\' + character.charCodeAt(0).toString(8)
}

export default pdfkitAddPlaceholder
