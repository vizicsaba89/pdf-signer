import PDFAbstractReference from './pdfkit/abstract_reference'

class PDFKitReferenceMock extends PDFAbstractReference {
  index: any

  constructor(index: any, additionalData: any = undefined) {
    super()
    this.index = index
    if (typeof additionalData !== 'undefined') {
      Object.assign(this, additionalData)
    }
  }

  toString() {
    return `${this.index} 0 R`
  }
}

export default PDFKitReferenceMock
