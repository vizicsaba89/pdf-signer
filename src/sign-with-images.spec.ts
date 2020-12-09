import fs from 'fs'
import { SignatureOptions } from './pdf/model/signature-options'
import plainAddPlaceholder from './pdf/node-signpdf/plain-add-placeholder'
import { replaceByteRangeInPdf } from './pdf/node-signpdf/sign'
import { sign } from './sign'
import { getSignature } from './signature/digital-signature.service'

describe('some tests with images', () => {
  it('one sign with picture', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)
    const certPassword = 'pdfsigner'
    const signatureOptions: SignatureOptions = {
      reason: '2',
      email: 'test@email.com',
      location: 'Location, LO',
      signerName: 'Test User',
      annotationAppearanceOptions: {
        signatureCoordinates: { left: 0, bottom: 700, right: 190, top: 860 },
        signatureDetails: [
          {
            value: 'Signed by: Kiss Béla',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
          },
          {
            value: 'Date: 2019-10-11',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
          },
        ],
        imageDetails: {
          imagePath: './assets/certification.jpg',
          transformOptions: { rotate: 0, space: 200, stretch: 50, tilt: 0, xPos: 0, yPos: 10 },
        },
      },
    }

    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')
  })

  it('one sign with picture multi page pdf', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example2.pdf`)

    const certPassword = 'pdfsigner'
    const signatureOptions: SignatureOptions = {
      reason: '2',
      email: 'test@email.com',
      location: 'Location, LO',
      signerName: 'Test User',
      annotationAppearanceOptions: {
        signatureCoordinates: { left: 0, bottom: 200, right: 190, top: 100 },
        signatureDetails: [
          {
            value: 'Signed by: Kiss Béla',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
          },
          {
            value: 'Date: 2019-10-11',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
          },
        ],
        imageDetails: {
          imagePath: './assets/certification.jpg',
          transformOptions: { rotate: 0, space: 200, stretch: 50, tilt: 0, xPos: 0, yPos: 10 },
        },
      },
    }

    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')
  })

  it('sign once -> save -> sign again', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    let pdfBuffer = fs.readFileSync(`./assets/example.pdf`)
    const certPassword = 'pdfsigner'
    const signatureOptions: SignatureOptions = {
      reason: '2',
      email: 'test@email.com',
      location: 'Location, LO',
      signerName: 'Test User',
      annotationAppearanceOptions: {
        signatureCoordinates: { left: 0, bottom: 700, right: 190, top: 860 },
        signatureDetails: [
          {
            value: 'Signed by: Kiss Béla',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
          },
          {
            value: 'Date: 2019-10-11',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
          },
        ],
        imageDetails: {
          imagePath: './assets/certification.jpg',
          transformOptions: { rotate: 0, space: 200, stretch: 50, tilt: 0, xPos: 0, yPos: 10 },
        },
      },
    }
    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')

    const secondSignatureOptions: SignatureOptions = {
      reason: '2',
      email: 'test@email.com',
      location: 'Location, LO',
      signerName: 'Test User',
      annotationAppearanceOptions: {
        signatureCoordinates: { left: 200, bottom: 700, right: 390, top: 860 },
        signatureDetails: [
          {
            value: 'Signed by: Kiss Béla 2',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
          },
          {
            value: 'Date: 2019-10-13',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
          },
        ],
        imageDetails: {
          imagePath: './assets/certification.jpg',
          transformOptions: { rotate: 0, space: 200, stretch: 50, tilt: 0, xPos: 0, yPos: 10 },
        },
      },
    }
    const signedPdfSecondly = await sign(pdfBuffer, p12Buffer, certPassword, secondSignatureOptions)

    const { signatureHex: secondSignatureHex } = extractSignature(signedPdf)

    expect(typeof secondSignatureHex).toBe('string')
  })

  it('one sign with transparent png', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)
    const certPassword = 'pdfsigner'
    const signatureOptions: SignatureOptions = {
      reason: '2',
      email: 'test@email.com',
      location: 'Location, LO',
      signerName: 'Test User',
      annotationAppearanceOptions: {
        signatureCoordinates: { left: 0, bottom: 700, right: 190, top: 860 },
        signatureDetails: [
          {
            value: 'Signed by: Kiss Béla',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
          },
          {
            value: 'Date: 2019-10-11',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
          },
        ],
        imageDetails: {
          imagePath: './assets/certification-transparent.png',
          transformOptions: { rotate: 0, space: 200, stretch: 50, tilt: 0, xPos: 0, yPos: 10 },
        },
      },
    }
    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')
  })

  it('one sign with interlaced png', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)
    const certPassword = 'pdfsigner'
    const signatureOptions: SignatureOptions = {
      reason: '2',
      email: 'test@email.com',
      location: 'Location, LO',
      signerName: 'Test User',
      annotationAppearanceOptions: {
        signatureCoordinates: { left: 0, bottom: 700, right: 190, top: 860 },
        signatureDetails: [
          {
            value: 'Signed by: Kiss Béla',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
          },
          {
            value: 'Date: 2019-10-11',
            fontSize: 7,
            transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
          },
        ],
        imageDetails: {
          imagePath: './assets/certification-interlaced.png',
          transformOptions: { rotate: 0, space: 200, stretch: 50, tilt: 0, xPos: 0, yPos: 10 },
        },
      },
    }
    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')
  })
})

const getSubstringIndex = (str, substring, n) => {
  var times = 0,
    index = null

  while (times < n && index !== -1) {
    index = str.indexOf(substring, index + 1)
    times++
  }

  return index
}
/**
 * Basic implementation of signature extraction.
 *
 * Really basic. Would work in the simplest of cases where there is only one signature
 * in a document and ByteRange is only used once in it.
 *
 * @param {Buffer} pdf
 * @returns {Object} {ByteRange: Number[], signature: Buffer, signedData: Buffer}
 */

const extractSignature = (pdf, signatureCount = 1) => {
  if (!(pdf instanceof Buffer)) {
    throw new Error('PDF expected as Buffer.')
  } // const byteRangePos = pdf.indexOf('/ByteRange [');

  const byteRangePos = getSubstringIndex(pdf, '/ByteRange [', signatureCount)

  if (byteRangePos === -1) {
    throw new Error('Failed to locate ByteRange.')
  }

  const byteRangeEnd = pdf.indexOf(']', byteRangePos)

  if (byteRangeEnd === -1) {
    throw new Error('Failed to locate the end of the ByteRange.')
  }

  const byteRange = pdf.slice(byteRangePos, byteRangeEnd + 1).toString()
  const matches = /\/ByteRange \[(\d+) +(\d+) +(\d+) +(\d+) *\]/.exec(byteRange)

  if (matches === null) {
    throw new Error('Failed to parse the ByteRange.')
  }

  const ByteRange = matches.slice(1).map(Number)
  const signedData = Buffer.concat([
    pdf.slice(ByteRange[0], ByteRange[0] + ByteRange[1]),
    pdf.slice(ByteRange[2], ByteRange[2] + ByteRange[3]),
  ])
  const signatureHex = pdf
    .slice(ByteRange[0] + ByteRange[1] + 1, ByteRange[2])
    .toString('binary')
    .replace('>', '')
  //.replace(/(?:00|>)+$/, '')
  const signature = Buffer.from(signatureHex, 'hex').toString('binary')
  return {
    ByteRange: matches.slice(1, 5).map(Number),
    signature,
    signedData,
    signatureHex,
  }
}
