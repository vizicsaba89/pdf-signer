import fs from 'fs'
import { sign } from './sign'

describe('some tests', () => {
  it('one sign without picture', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)

    const signedPdf = await sign(pdfBuffer, p12Buffer, 'pdfsigner', {
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
    })

    fs.writeFileSync('./assets/results/signed.pdf', signedPdf)
  })

  it('one sign with picture', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)

    const signedPdf = await sign(pdfBuffer, p12Buffer, 'pdfsigner', {
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
    })

    fs.writeFileSync('./assets/results/signed-with-image.pdf', signedPdf)
  })

  it('sign once -> save -> sign again', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    let pdfBuffer = fs.readFileSync(`./assets/example.pdf`)

    const signedPdf = await sign(pdfBuffer, p12Buffer, 'pdfsigner', {
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
    })

    fs.writeFileSync('./assets/results/signed-once.pdf', signedPdf)

    pdfBuffer = fs.readFileSync(`./assets/results/signed-once.pdf`)

    const signedPdfSecondly = await sign(pdfBuffer, p12Buffer, 'pdfsigner', {
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
    })

    fs.writeFileSync('./assets/results/signed-twice.pdf', signedPdfSecondly)
  })

  it('one sign with transparent png', async () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)

    const signedPdf = await sign(pdfBuffer, p12Buffer, 'pdfsigner', {
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
    })

    fs.writeFileSync('./assets/results/signed-with-transparent-image.pdf', signedPdf)
  })
})
