import fs from 'fs'
import { SignatureOptions } from './pdf/model/signature-options'
import { sign } from './sign'

describe('some tests', () => {
  it('one sign without picture', async () => {
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
      },
    }

    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')
  })

  it('one sign multi page pdf', async () => {
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
      },
    }

    const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, signatureOptions)

    const { signatureHex } = extractSignature(signedPdf)

    expect(typeof signatureHex).toBe('string')
    // fs.writeFileSync('./assets/results/signed-with-image-multi-page.pdf', signedPdf)
  })

  it('sign once -> save -> sign again', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    let pdfBuffer = fs.readFileSync(`./assets/example.pdf`)
    const coppiedPdfBuffer = Buffer.from(pdfBuffer)
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
      },
    }
    const signedPdf = await sign(coppiedPdfBuffer, p12Buffer, certPassword, signatureOptions)

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
      },
    }
    const signedPdfSecondly = await sign(signedPdf, p12Buffer, certPassword, secondSignatureOptions)

    const { signatureHex: secondSignatureHex } = extractSignature(signedPdfSecondly, 2)

    expect(typeof secondSignatureHex).toBe('string')
  })
})

const getSubstringIndex = (str: any, substring: any, n: any) => {
  var times = 0,
    index = null

  while (times < n && index !== -1) {
    index = str.indexOf(substring, index != null ? index + 1 : 1)
    times++
  }

  return index
}

const extractSignature = (pdf: any, signatureCount: number = 1) => {
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
