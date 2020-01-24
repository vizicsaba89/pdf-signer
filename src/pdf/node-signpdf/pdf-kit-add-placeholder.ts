import { getImage } from '../image/appender'
import { AnnotationAppearanceOptions } from '../model/annotation-appearance-options'
import { CoordinateData } from '../model/coordinate-data'
import { ImageDetails } from '../model/image-details'
import { PdfKitMock } from '../model/pdf-kit-mock'
import { SignatureDetails } from '../model/signature-details'
import { SignatureOptions } from '../model/signature-options'
import { XObject } from '../model/x-object'
import { DEFAULT_BYTE_RANGE_PLACEHOLDER, DEFAULT_SIGNATURE_LENGTH } from './const'
import PDFKitReferenceMock from './pdf-kit-reference-mock'

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

  const hasImg = signatureOptions.annotationAppearanceOptions?.imageDetails?.imagePath

  const IMG = hasImg
    ? getImage((signatureOptions.annotationAppearanceOptions as any).imageDetails.imagePath, pdf)
    : undefined

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
  IMG: any | undefined,
  APFONT: PDFKitReferenceMock,
  signatureOptions: SignatureOptions,
) => {
  let xObject: XObject = {
    CropBox: [0, 0, 197, 70],
    Type: 'XObject',
    FormType: 1,
    BBox: [-10, 10, 197.0, 70.0],
    MediaBox: [0, 0, 197, 70],
    Subtype: 'Form',
  }

  if (IMG != null) {
    xObject = {
      ...xObject,
      Resources: `<</XObject <<\n/Img${IMG.index} ${IMG.index} 0 R\n>>\n/Font <<\n/f1 ${APFONT.index} 0 R\n>>\n>>`,
    }
  }

  return pdf.ref(
    xObject,
    undefined,
    getStream(signatureOptions.annotationAppearanceOptions, IMG != null ? IMG.index : undefined),
  )
}

const getStream = (
  annotationAppearanceOptions: AnnotationAppearanceOptions,
  imgIndex: number | undefined,
) => {
  const generatedContent = generateSignatureContents(annotationAppearanceOptions.signatureDetails)

  let generatedImage = ''

  if (imgIndex != null) {
    generatedImage = generateImage((annotationAppearanceOptions as any).imageDetails, imgIndex)
  }

  return getConvertedText(`
    1.0 1.0 1.0 rg
    0.0 0.0 0.0 RG
    q
    ${generatedImage}
    0 0 0 rg
    ${generatedContent}
    Q`)
}

const generateImage = (imageDetails: ImageDetails, imgIndex: number) => {
  const { rotate, space, stretch, tilt, xPos, yPos } = imageDetails.transformOptions

  return `
    q
    ${space} ${rotate} ${tilt} ${stretch} ${xPos} ${yPos} cm
    /Img${imgIndex} Do
    Q
  `
}

const generateSignatureContents = (details: SignatureDetails[]) => {
  const detailsAsPdfContent = details.map((detail, index) => {
    const detailAsPdfContent = generateSignatureContent(detail)
    return detailAsPdfContent
  })

  return detailsAsPdfContent.join('')
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
