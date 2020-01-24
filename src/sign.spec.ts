import fs from 'fs'
import { sign } from './sign'

describe('some tests', () => {
  it('1', () => {
    const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
    const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)

    const signedPdf = sign(pdfBuffer, p12Buffer, 'pdfsigner')

    fs.writeFileSync('./assets/signed.pdf', signedPdf)
  })
})
