import { getImage } from '../image/appender'
import { PdfKitMock } from '../model/pdf-kit-mock'
import { UserInformation } from '../model/user-information'
import { DEFAULT_BYTE_RANGE_PLACEHOLDER, DEFAULT_SIGNATURE_LENGTH } from './const'
import PDFKitReferenceMock from './pdf-kit-reference-mock'
import { SignatureOptions } from '../model/signature-options'

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
  byteRangePlaceholder?: string,
  signatureOptions: SignatureOptions,
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
  const IMG = getImage(signatureOptions.annotationAppearanceOptions.imagePath, pdf)

  const AP = getAnnotationApparance(pdf, IMG, APFONT, signatureOptions)
  const SIGNATURE = getSignature(
    pdf,
    byteRangePlaceholder,
    signatureLength,
    signatureOptions.reason,
    signatureOptions,
  )
  const WIDGET = getWidget(pdf, fieldIds, SIGNATURE, AP)

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
) => {
  const signatureBaseName = 'Signature'

  const signatureLeftOffset = fieldIds.length * 125
  const signatureBottomOffset = 5

  return pdf.ref({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: [signatureLeftOffset, 0, signatureLeftOffset + 90, signatureBottomOffset + 60],
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
    getStream(signatureOptions, IMG.index),
  )
}

const getStream = (signatureOptions: SignatureOptions, imgIndex: number) => {
  return getConvertedText(`
    1.0 1.0 1.0 rg
    0.0 0.0 0.0 RG
    q
    q
    200 0 0 50 0 10 cm
    /Img${imgIndex} Do
    Q
    0 0 0 rg
    BT
    0 Tr
    /f1 10.0 Tf
    1.4 0 0 1 20 45.97412 Tm
    (Aláírta: ${signatureOptions}) Tj
    ET
    BT
    0 Tr
    /f1 10.0 Tf
    1.4 0 0 1 20 33.56006 Tm
    (${new Date().toISOString().slice(0, 10)}) Tj
    ET
    Q`)
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
  userInformation: any,
) => {
  return pdf.ref({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: [0, byteRangePlaceholder, byteRangePlaceholder, byteRangePlaceholder],
    Contents: Buffer.from(String.fromCharCode(0).repeat(signatureLength)),
    Reason: new String(reason),
    M: new Date(),
    ContactInfo: new String(`${userInformation.emailAddress}`),
    Name: new String(`${userInformation.commonName}`),
    Location: new String('Hungary, HU'),
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
