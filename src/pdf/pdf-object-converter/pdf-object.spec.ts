import PDFKitReferenceMock from '../node-signpdf/pdf-kit-reference-mock'
import { convertObject } from './pdf-object'

describe('some tests', () => {
  it('string convert', async () => {
    const testObject = 'Test String'

    const converted = convertObject(testObject)
    expect(converted).toBe(`/${testObject}`)
  })

  it('String object convert', async () => {
    const testObject = new String('Test String')

    const converted = convertObject(testObject)
    expect(converted).toBe(`(${testObject})`)
  })

  it('Buffer convert', async () => {
    const testObject = Buffer.from('Test 123')

    const converted = convertObject(testObject)
    expect(converted).toBe(`<${testObject.toString('hex')}>`)
  })

  it('PDFAbstractReference convert', async () => {
    const testObject = new PDFKitReferenceMock(1)

    const converted = convertObject(testObject)
    expect(converted).toBe(`1 0 R`)
  })

  it('Date convert', async () => {
    const testObject = new Date(Date.UTC(2020, 4, 20, 0, 0, 0, 0))

    const converted = convertObject(testObject)
    // TODO will fail on CI/CD
    expect(converted).toBe(`(D:20200520000000Z)`)
  })

  it('Array convert', async () => {
    const testObject = [1, 2, 3]

    const converted = convertObject(testObject)
    expect(converted).toBe(`[1 2 3]`)
  })

  it('[object Object] convert', async () => {
    const testObject = { a: 1, b: 2 }

    const converted = convertObject(testObject)

    expect(converted).toBe(`<<
/a 1
/b 2
>>`)
  })

  it('number convert', async () => {
    const testObject = 3

    const converted = convertObject(testObject)
    expect(converted).toBe(`3`)
  })
})
