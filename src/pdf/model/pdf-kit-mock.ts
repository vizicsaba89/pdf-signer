import PDFKitReferenceMock from "../node-signpdf/pdf-kit-reference-mock";

export interface PdfKitMock {
  ref: (input: any, additionalIndex?: number, stream?: any) => PDFKitReferenceMock
  page: {
    dictionary: PDFKitReferenceMock
  }
  _root: {
    data: any
  }
}
