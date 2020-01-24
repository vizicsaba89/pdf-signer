import PNG from 'png-js'
import zlib from 'zlib'
import { PdfKitMock } from '../model/pdf-kit-mock'

interface PNGBaseData {
  Type: string
  Subtype: string
  BitsPerComponent: number
  Width: number
  Height: number
  Filter: string
  [key: string]: any
}

export const getPngImage = (pdf: PdfKitMock, data: Buffer) => {
  const image = new PNG(data)
  const hasAlphaChannel = image.hasAlphaChannel

  const pngBaseData: PNGBaseData = {
    Type: 'XObject',
    Subtype: 'Image',
    BitsPerComponent: hasAlphaChannel ? 8 : image.bits,
    Width: image.width,
    Height: image.height,
    Filter: 'FlateDecode',
  }

  if (!hasAlphaChannel) {
    const params = pdf.ref({
      Predictor: 15,
      Colors: image.colors,
      BitsPerComponent: image.bits,
      Columns: image.width,
    })

    pngBaseData['DecodeParms'] = params
  }

  if (image.palette.length === 0) {
    pngBaseData['ColorSpace'] = image.colorSpace
  } else {
    const palette = pdf.ref({
      stream: new Buffer(image.palette),
    })
    pngBaseData['ColorSpace'] = ['Indexed', 'DeviceRGB', image.palette.length / 3 - 1, palette]
  }

  if (image.transparency.grayscale != null) {
    const val = image.transparency.grayscale
    pngBaseData['Mask'] = [val, val]
  } else if (image.transparency.rgb) {
    const { rgb } = image.transparency
    const mask: any[] = []

    for (let x of rgb) {
      mask.push(x, x)
    }
    pngBaseData['Mask'] = mask
  } else if (image.transparency.indexed) {
    loadIndexedAlphaChannel(image)
  } else if (hasAlphaChannel) {
    splitAlphaChannel(pdf)

    const sMask = getSmask(pdf, image)
    pngBaseData['Mask'] = sMask
  }

  const pngImage = pdf.ref(pngBaseData, undefined, image.imgData)

  return pngImage
}

const loadIndexedAlphaChannel = (image: any) => {
  const transparency = image.transparency.indexed
  return image.decodePixels((pixels: any) => {
    const alphaChannel = new Buffer(image.width * image.height)

    let i = 0
    for (let j = 0, end = pixels.length; j < end; j++) {
      alphaChannel[i++] = transparency[pixels[j]]
    }

    image.alphaChannel = zlib.deflateSync(alphaChannel)
  })
}

const splitAlphaChannel = (image: any) => {
  image.decodePixels((pixels: any) => {
    let a, p
    const colorCount = image.colors
    const pixelCount = image.width * image.height
    const imgData = new Buffer(pixelCount * colorCount)
    const alphaChannel = new Buffer(pixelCount)

    let i = (p = a = 0)
    const len = pixels.length
    const skipByteCount = image.bits === 16 ? 1 : 0
    while (i < len) {
      for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
        imgData[p++] = pixels[i++]
        i += skipByteCount
      }
      alphaChannel[a++] = pixels[i++]
      i += skipByteCount
    }

    image.imgData = zlib.deflateSync(imgData)
    image.alphaChannel = zlib.deflateSync(alphaChannel)
  })
}

const getSmask = (pdf: PdfKitMock, image: any) => {
  let sMask
  if (image.hasAlphaChannel) {
    sMask = pdf.ref({
      Type: 'XObject',
      Subtype: 'Image',
      Height: image.height,
      Width: image.width,
      BitsPerComponent: 8,
      Filter: 'FlateDecode',
      ColorSpace: 'DeviceGray',
      Decode: [0, 1],
      stream: image.alphaChannel,
    })
  }

  return sMask
}
