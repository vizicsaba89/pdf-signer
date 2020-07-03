import { getImage } from '../image/appender'
import { AnnotationAppearanceOptions } from '../model/annotation-appearance-options'
import { CoordinateData } from '../model/coordinate-data'
import { ImageDetails } from '../model/image-details'
import { SignatureDetails } from '../model/signature-details'
import { SignatureOptions } from '../model/signature-options'
import { XObject } from '../model/x-object'
import { DEFAULT_BYTE_RANGE_PLACEHOLDER, DEFAULT_SIGNATURE_LENGTH } from './const'
import { PdfCreator } from './pdf-creator'
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

export const appendFont = (pdf: PdfCreator, fontName: string) => {
  const fontObject = getFont(fontName)
  const fontReference = pdf.append(fontObject)

  return fontReference
}

export const appendAcroform = (
  pdf: PdfCreator,
  fieldIds: PDFKitReferenceMock[],
  widgetReferenceList: PDFKitReferenceMock[],
  fonts: { name: string; ref: PDFKitReferenceMock }[],
  acroFormId?: any,
) => {
  /*
  const fontObject = getFont('Helvetica')
  const fontReference = pdf.append(fontObject)

  const zafObject = getFont('ZapfDingbats')
  const zafReference = pdf.append(zafObject)
*/

  const acroformObject = getAcroform(fieldIds, widgetReferenceList, fonts)
  const acroformReference = pdf.append(acroformObject, acroFormId)

  return acroformReference
}

export const appendImage = async (pdf: PdfCreator, signatureOptions: SignatureOptions) => {
  const hasImg = signatureOptions.annotationAppearanceOptions?.imageDetails?.imagePath

  const IMG = hasImg
    ? await getImage(
        (signatureOptions.annotationAppearanceOptions as any).imageDetails.imagePath,
        pdf,
      )
    : undefined

  return IMG
}

export const appendAnnotationApparance = (
  pdf: PdfCreator,
  signatureOptions: SignatureOptions,
  apFontReference: PDFKitReferenceMock,
  image?: PDFKitReferenceMock,
) => {
  const apObject = getAnnotationApparance(image, apFontReference)
  const apReference = pdf.appendStream(
    apObject,
    getStream(
      signatureOptions.annotationAppearanceOptions,
      image != null ? image.index : undefined,
    ),
  )

  return apReference
}

export const appendWidget = (
  pdf: PdfCreator,
  widgetIndex: number,
  signatureOptions: SignatureOptions,
  signatureReference: PDFKitReferenceMock,
  apReference: PDFKitReferenceMock,
) => {
  const widgetObject = getWidget(
    widgetIndex,
    signatureReference,
    apReference,
    signatureOptions.annotationAppearanceOptions.signatureCoordinates,
    pdf,
  )
  const widgetReference = pdf.append(widgetObject)

  return widgetReference
}

export const appendSignature = (
  pdf: PdfCreator,
  signatureOptions: SignatureOptions,
  signatureLength = DEFAULT_SIGNATURE_LENGTH,
  byteRangePlaceholder = DEFAULT_BYTE_RANGE_PLACEHOLDER,
) => {
  const signatureObject = getSignature(
    byteRangePlaceholder,
    signatureLength,
    signatureOptions.reason,
    signatureOptions,
  )
  const signatureReference = pdf.append(signatureObject)

  return signatureReference
}

const getAcroform = (
  fieldIds: PDFKitReferenceMock[],
  WIDGET: PDFKitReferenceMock[],
  fonts: { name: string; ref: PDFKitReferenceMock }[],
) => {
  const mergedFonts = fonts.reduce(
    (prev, curr) => prev + `/${curr.name} ${curr.ref.toString()} `,
    '',
  )

  return {
    Type: 'AcroForm',
    SigFlags: 3,
    Fields: [...fieldIds, new Object(WIDGET.join(','))],
    DR: `<</Font\n<<${mergedFonts.trim()}>>\n>>`,
  }
}

const getWidget = (
  widgetIndex: number,
  signature: PDFKitReferenceMock,
  AP: PDFKitReferenceMock,
  signatureCoordinates: CoordinateData,
  pdf: PdfCreator,
) => {
  const signatureBaseName = 'Signature'

  return {
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
    T: new String(signatureBaseName + widgetIndex), // eslint-disable-line no-new-wrappers
    F: 4,
    AP: `<</N ${AP.index} 0 R>>`,
    P: pdf.getCurrentWidgetPageReference(), // eslint-disable-line no-underscore-dangle // TODO REPLACE
    DA: new String('/Helvetica 0 Tf 0 g'), // eslint-disable-line no-new-wrappers
  }
}

const getAnnotationApparance = (IMG: any | undefined, APFONT: PDFKitReferenceMock) => {
  let resources = `<</Font <<\n/f1 ${APFONT.index} 0 R\n>>>>`

  if (IMG != null) {
    resources = `<</XObject <<\n/Img${IMG.index} ${IMG.index} 0 R\n>>\n/Font <<\n/f1 ${APFONT.index} 0 R\n>>\n>>`
  }

  let xObject: XObject = {
    CropBox: [0, 0, 197, 70],
    Type: 'XObject',
    FormType: 1,
    BBox: [-10, 10, 197.0, 70.0],
    MediaBox: [0, 0, 197, 70],
    Subtype: 'Form',
    Resources: resources,
  }

  return xObject
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

const getFont = (baseFont: string) => {
  return {
    Type: 'Font',
    BaseFont: baseFont,
    Encoding: 'WinAnsiEncoding',
    Subtype: 'Type1',
  }
}

const getSignature = (
  byteRangePlaceholder: string,
  signatureLength: number,
  reason: string,
  signatureDetails: SignatureOptions,
) => {
  return {
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
  }
}

const getConvertedText = (text: string) => {
  return text
    .split('')
    .map((character) => {
      return specialCharacters.includes(character)
        ? getOctalCodeFromCharacter(character)
        : character
    })
    .join('')
}

const getOctalCodeFromCharacter = (character: string) => {
  return '\\' + character.charCodeAt(0).toString(8)
}
