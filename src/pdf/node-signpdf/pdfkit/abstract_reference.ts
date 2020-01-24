class PDFAbstractReference {
  toString(): void | string {
    throw new Error('Must be implemented by subclasses')
  }
}

export default PDFAbstractReference
