import { CoordinateData } from './coordinate-data'
import { ImageDetails } from './image-details'
import { SignatureDetails } from './signature-details'

export interface AnnotationAppearanceOptions {
  signatureDetails: SignatureDetails[]
  signatureCoordinates: CoordinateData
  imageDetails?: ImageDetails
}
