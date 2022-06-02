import fs from 'fs'
import { PdfCreator } from '../node-signpdf/pdf-creator'
import { getJpgImage } from './jpeg-appender'
import { getPngImage } from './png-appender'

export const getImage = async (imagePath: string, pdf: PdfCreator) => {
  const data = fs.readFileSync(imagePath)
  return _getImage(data, pdf);
}

export const getImageFromBase64 = async (base64Image: string, pdf: PdfCreator) => {
  const data = Buffer.from(base64Image, "base64");
  return _getImage(data, pdf);
}

const _getImage = async (data: Buffer, pdf: PdfCreator) => {
  let img
  if (data[0] === 0xff && data[1] === 0xd8) {
    img = getJpgImage(pdf, data)
  } else if (data[0] === 0x89 && data.toString('ascii', 1, 4) === 'PNG') {
    img = await getPngImage(pdf, data)
  } else {
    throw new Error('Unknown image format.')
  }

  return img
}
