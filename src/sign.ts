import plainAddPlaceholder from './pdf/node-signpdf/plain-add-placeholder'
import { addSignatureToPdf, replaceByteRangeInPdf } from './pdf/node-signpdf/sign'
import { getSignature } from './signature/digital-signature.service'
import { SignatureOptions } from './pdf/model/signature-options'

export const sign = (pdf: Buffer, certBuffer: Buffer, certPassword: any, signatureOptions: SignatureOptions) => {
  const pdfWithPlaceholder: Buffer = plainAddPlaceholder(
    pdf,
    signatureOptions,
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
