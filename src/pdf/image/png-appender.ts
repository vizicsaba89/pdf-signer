import PNG from 'png-js'
import zlib from 'zlib'
import { PdfCreator } from '../node-signpdf/pdf-creator'

interface PNGBaseData {
  Type: string
  Subtype: string
  BitsPerComponent: number
  Width: number
  Height: number
  Filter: string
  [key: string]: any
}

export const getPngImage = async (pdf: PdfCreator, data: Buffer) => {
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
    const params = pdf.append({
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
    const palette = pdf.append({
      stream: new Buffer(image.palette),
    })
    pngBaseData['ColorSpace'] = ['Indexed', 'DeviceRGB', image.palette.length / 3 - 1, palette]
  }

  if (image.transparency.grayscale != null) {
    const val = image.transparency.grayscale
    pngBaseData['SMask'] = [val, val]
  } else if (image.transparency.rgb) {
    const { rgb } = image.transparency
    const mask: any[] = []

    for (let x of rgb) {
      mask.push(x, x)
    }
    pngBaseData['SMask'] = mask
  } else if (image.transparency.indexed) {
    const indexedAlphaChannel = await getIndexedAlphaChannel(image)
    image.alphaChannel = indexedAlphaChannel
  } else if (hasAlphaChannel) {
    const { imgData, alphaChannel } = await getSplittedAlphaChannelAndImageData(image)
    image.imgData = imgData
    image.alphaChannel = alphaChannel
    const sMask = getSmask(pdf, image, alphaChannel)
    pngBaseData['SMask'] = sMask
    pngBaseData['Length'] = imgData.length
  }

  const pngImage = pdf.appendStream(pngBaseData, image.imgData)

  return pngImage
}

const getIndexedAlphaChannel = async (image: any) => {
  const transparency = image.transparency.indexed

  const alpaChannelPromise = new Promise((resolve, reject) => {
    image.decodePixels((pixels: any) => {
      const alphaChannel = new Buffer(image.width * image.height)

      let i = 0
      for (let j = 0, end = pixels.length; j < end; j++) {
        alphaChannel[i++] = transparency[pixels[j]]
      }

      resolve(zlib.deflateSync(alphaChannel))
    })
  })

  return alpaChannelPromise
}

const getSplittedAlphaChannelAndImageData = async (
  image: any,
): Promise<{ imgData: Buffer; alphaChannel: Buffer }> => {
  const alpaChannelAndImageDataPromise: Promise<{
    imgData: Buffer
    alphaChannel: Buffer
  }> = new Promise((resolve, reject) => {
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

      resolve({ imgData: zlib.deflateSync(imgData), alphaChannel: zlib.deflateSync(alphaChannel) })
    })
  })

  return alpaChannelAndImageDataPromise
}

const getSmask = (pdf: PdfCreator, image: any, alphaChannel: Buffer) => {
  let sMask
  if (image.hasAlphaChannel) {
    const sMaskData: PNGBaseData = {
      Type: 'XObject',
      Subtype: 'Image',
      BitsPerComponent: 8,
      Width: image.width,
      Height: image.height,
      Length: alphaChannel.length,
      Filter: 'FlateDecode',
      ColorSpace: 'DeviceGray',
    }

    sMask = pdf.appendStream(sMaskData, alphaChannel)
  }

  return sMask
}
