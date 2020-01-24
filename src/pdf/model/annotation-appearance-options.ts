import { CoordinateData } from "./coordinate-data";
import { SignatureDetails } from "./signature-details";
import { TransformOptions } from "./transform-options";

export interface AnnotationAppearanceOptions {

  signatureDetails: SignatureDetails[],
  signatureCoordinates: CoordinateData,
  imageDetails: { imagePath: string, transformOptions: TransformOptions },

}
