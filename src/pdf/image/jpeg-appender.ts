import { PdfCreator } from '../node-signpdf/pdf-creator'

const MARKERS = [
  0xffc0,
  0xffc1,
  0xffc2,
  0xffc3,
  0xffc5,
  0xffc6,
  0xffc7,
  0xffc8,
  0xffc9,
  0xffca,
  0xffcb,
  0xffcc,
  0xffcd,
  0xffce,
  0xffcf,
]

const COLOR_SPACE_MAP: { [key: number]: string } = {
  1: 'DeviceGray',
  3: 'DeviceRGB',
  4: 'DeviceCMYK',
}

interface JPEGData {
  Type: string
  Subtype: string
  BitsPerComponent: number
  Width: number
  Height: number
  ColorSpace: string
  Filter: string
  [key: string]: any
}

export const getJpgImage = (pdf: PdfCreator, data: any) => {
  if (data.readUInt16BE(0) !== 0xffd8) {
    throw 'SOI not found in JPEG'
  }

  let pos = 2
  let marker
  while (pos < data.length) {
    marker = data.readUInt16BE(pos)
    pos += 2
    if (MARKERS.includes(marker)) {
      break
    }
    pos += data.readUInt16BE(pos)
  }

  if (!MARKERS.includes(marker)) {
    throw 'Invalid JPEG.'
  }
  pos += 2

  const bits = data[pos++]
  const height = data.readUInt16BE(pos)
  pos += 2

  const width = data.readUInt16BE(pos)
  pos += 2

  const channels: number = data[pos++]
  const colorSpace = COLOR_SPACE_MAP[channels]

  const baseJpgData: JPEGData = {
    Type: 'XObject',
    Subtype: 'Image',
    BitsPerComponent: bits,
    Width: width,
    Height: height,
    ColorSpace: colorSpace,
    Filter: 'DCTDecode',
  }

  if (colorSpace === 'DeviceCMYK') {
    baseJpgData['Decode'] = [1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0]
  }
  const image = pdf.appendStream(baseJpgData, data)

  return image
}
