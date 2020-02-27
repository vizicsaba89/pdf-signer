import PDFAbstractReference from './abstract_reference'

const pad = (str: string, length: number) => (Array(length + 1).join('0') + str).slice(-length)

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

export class PDFObject {
  static convert(object: any, encryptFunction: any = null): any {
    if (typeof object === 'string') {
      return `/${object}`
    }

    if (object instanceof String) {
      return PDFObject.getConvertedString(object, encryptFunction)
    }

    if (Buffer.isBuffer(object)) {
      return `<${object.toString('hex')}>`
    }

    if (object instanceof PDFAbstractReference) {
      const convertedObject: any = object
      return convertedObject.toString()
    }

    if (object instanceof Date) {
      return PDFObject.getConvertedDate(object, encryptFunction)
    }

    if (Array.isArray(object)) {
      const items = object.map(e => PDFObject.convert(e, encryptFunction)).join(' ')
      return `[${items}]`
    }

    if ({}.toString.call(object) === '[object Object]') {
      return PDFObject.getConvertedObject(object, encryptFunction)
    }

    if (typeof object === 'number') {
      return String(PDFObject.getConvertedNumber(object))
    }

    return `${object}`
  }

  static getConvertedObject(object: any, encryptFunction: any) {
    const out = ['<<']

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        let val = object[key]
        let checkedValue = ''

        if (val != null && val.toString().indexOf('<<') !== -1) {
          checkedValue = val
        } else {
          checkedValue = PDFObject.convert(val, encryptFunction)
        }
        out.push(`/${key} ${checkedValue}`)
      }
    }
    out.push('>>')

    return out.join('\n')
  }

  static getConvertedDate(object: any, encryptFunction: any) {
    let string = `D:${pad(object.getUTCFullYear(), 4)}${pad(object.getUTCMonth() + 1, 2)}${pad(
      object.getUTCDate(),
      2,
    )}${pad(object.getUTCHours(), 2)}${pad(object.getUTCMinutes(), 2)}${pad(
      object.getUTCSeconds(),
      2,
    )}Z`

    if (encryptFunction) {
      string = encryptFunction(Buffer.from(string, 'ascii')).toString('binary')
      string = string.replace(escapableRe, c => escapable[c])
    }

    return `(${string})`
  }

  static getConvertedString(object: any, encryptFunction: any) {
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
  }

  static getConvertedNumber(n: any) {
    if (n > -1e21 && n < 1e21) {
      return Math.round(n * 1e6) / 1e6
    }
    throw new Error(`unsupported number: ${n}`)
  }
}
