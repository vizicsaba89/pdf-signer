import PDFAbstractReference from '../node-signpdf/pdfkit/abstract_reference'

interface PdfObjectConverter {
  typeName: string
  convert: (object: any, encryptFunction: any) => string
  isMyType: (object: any) => string | undefined
}

const primitiveStringHandler: PdfObjectConverter = {
  typeName: 'string',
  convert(object: any) {
    return `/${object}`
  },
  isMyType(object: any) {
    return typeof object === 'string' ? this.typeName : undefined
  },
}

const stringHandler: PdfObjectConverter = {
  typeName: 'String',

  convert(object: any, encryptFunction: any) {
    const escapable: { [key: string]: string } = {
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\b': '\\b',
      '\f': '\\f',
      '\\': '\\\\',
      '(': '\\(',
      ')': '\\)',
    }

    const swapBytes = (buff: any) => {
      const bufferLength = buff.length

      if (bufferLength & 0x01) {
        throw new Error('Buffer length must be even')
      } else {
        for (let i = 0, end = bufferLength - 1; i < end; i += 2) {
          const a = buff[i]
          buff[i] = buff[i + 1]
          buff[i + 1] = a
        }
      }

      return buff
    }

    let string: any = object
    let isUnicode = false

    for (let i = 0, end = string.length; i < end; i += 1) {
      if (string.charCodeAt(i) > 0x7f) {
        isUnicode = true
        break
      }
    }

    let stringBuffer

    if (isUnicode) {
      stringBuffer = swapBytes(Buffer.from(`\ufeff${string}`, 'utf16le'))
    } else {
      stringBuffer = Buffer.from(string, 'ascii')
    }

    if (encryptFunction) {
      string = encryptFunction(stringBuffer).toString('binary')
    } else {
      string = stringBuffer.toString('binary')
    }
    string = string.replace((escapableRe: any, c: string) => escapable[c])

    return `(${string})`
  },
  isMyType(object: any) {
    return object instanceof String ? this.typeName : undefined
  },
}

const bufferHandler: PdfObjectConverter = {
  typeName: 'buffer',
  convert(object: any) {
    return `<${object.toString('hex')}>`
  },
  isMyType(object: any) {
    return Buffer.isBuffer(object) ? this.typeName : undefined
  },
}

const PDFAbstrastReferenceHandler: PdfObjectConverter = {
  typeName: 'PDFAbstractReference',
  convert(object: any) {
    return (object as any).toString()
  },
  isMyType(object: any) {
    return object instanceof PDFAbstractReference ? this.typeName : undefined
  },
}

const dateHandler: PdfObjectConverter = {
  typeName: 'Date',
  convert(object: any, encryptFunction: any) {
    const escapableRe = /[\n\r\t\b\f\(\)\\]/g
    const escapable: { [key: string]: string } = {
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\b': '\\b',
      '\f': '\\f',
      '\\': '\\\\',
      '(': '\\(',
      ')': '\\)',
    }

    const pad = (str: string, length: number) => (Array(length + 1).join('0') + str).slice(-length)

    let string = `D:${pad(object.getUTCFullYear(), 4)}${pad(object.getUTCMonth() + 1, 2)}${pad(
      object.getUTCDate(),
      2,
    )}${pad(object.getUTCHours(), 2)}${pad(object.getUTCMinutes(), 2)}${pad(
      object.getUTCSeconds(),
      2,
    )}Z`

    if (encryptFunction) {
      string = encryptFunction(Buffer.from(string, 'ascii')).toString('binary')
      string = string.replace(escapableRe, (c) => escapable[c])
    }

    return `(${string})`
  },
  isMyType(object: any) {
    return object instanceof Date ? this.typeName : undefined
  },
}

const arrayHandler: PdfObjectConverter = {
  typeName: 'Array',
  convert(object: any, encryptFunction: any) {
    const items = object.map((e: any) => convertObject(e, encryptFunction)).join(' ')
    return `[${items}]`
  },
  isMyType(object: any) {
    return Array.isArray(object) ? this.typeName : undefined
  },
}

const objectHandler: PdfObjectConverter = {
  typeName: 'Object',
  convert(object: any, encryptFunction: any) {
    const out = ['<<']

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        let val = object[key]
        let checkedValue = ''

        if (val != null && val.toString().indexOf('<<') !== -1) {
          checkedValue = val
        } else {
          checkedValue = convertObject(val, encryptFunction)
        }
        out.push(`/${key} ${checkedValue}`)
      }
    }
    out.push('>>')

    return out.join('\n')
  },
  isMyType(object: any) {
    return {}.toString.call(object) === '[object Object]' ? this.typeName : undefined
  },
}

const numberHandler: PdfObjectConverter = {
  typeName: 'number',
  convert(object: any) {
    let result

    if (object > -1e21 && object < 1e21) {
      result = Math.round(object * 1e6) / 1e6
    } else {
      throw new Error(`unsupported number: ${object}`)
    }

    return String(result)
  },
  isMyType(object: any) {
    return typeof object === 'number' ? this.typeName : undefined
  },
}

const defaultHandler: PdfObjectConverter = {
  typeName: 'default',
  convert(object: any) {
    return `${object}`
  },
  isMyType(object: any) {
    throw new Error(`Default handle doesnt have isMyType method`)
  },
}

const converters = [
  primitiveStringHandler,
  stringHandler,
  bufferHandler,
  PDFAbstrastReferenceHandler,
  dateHandler,
  arrayHandler,
  numberHandler,
  objectHandler,
]

export const convertObject = (object: any, encryptFunction: any = null) => {
  const selectedConverter = converters.find((converter) => converter.isMyType(object) != null)
  const converter = selectedConverter != null ? selectedConverter.convert : defaultHandler.convert

  return converter(object, encryptFunction)
}
