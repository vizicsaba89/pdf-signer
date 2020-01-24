import fs from 'fs'
import { PdfKitMock } from '../model/pdf-kit-mock'
import { getJpgImage } from './jpeg-appender'
import { getPngImage } from './png-appender'

export const getImage = (imagePath: string, pdf: PdfKitMock) => {
  let img
  const data = fs.readFileSync(imagePath)

  if (data[0] === 0xff && data[1] === 0xd8) {
    img = getJpgImage(pdf, data)
  } else if (data[0] === 0x89 && data.toString('ascii', 1, 4) === 'PNG') {
    img = getPngImage(pdf, data)
  } else {
    throw new Error('Unknown image format.')
  }

  return img
}
