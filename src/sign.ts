import plainAddPlaceholder from './pdf/node-signpdf/plain-add-placeholder'
import { addSignatureToPdf, replaceByteRangeInPdf } from './pdf/node-signpdf/sign'
import { getSignature } from './signature/digital-signature.service'

export const sign = (pdf: Buffer, certBuffer: Buffer, certPassword: any) => {
  const additionalInformations: any = { reason: '2', signatureLength: undefined }
  const pdfWithPlaceholder: Buffer = plainAddPlaceholder(
    pdf,
    { commonName: 'c', emailAddress: 'e', imagePath: './assets/certification.jpg', organizationName: 'o' },
    additionalInformations,
  )

  const { pdf: pdfWithActualByteRange, placeholderLength, byteRange } = replaceByteRangeInPdf(
    pdfWithPlaceholder,
  )

  const signature = getSignature(
    pdfWithActualByteRange,
    certBuffer,
    placeholderLength,
    certPassword,
  )

  const signedPdf = addSignatureToPdf(pdfWithActualByteRange, byteRange[1], signature)

  return signedPdf
}
