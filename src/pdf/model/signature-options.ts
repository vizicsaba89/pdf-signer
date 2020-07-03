import { AnnotationAppearanceOptions } from "./annotation-appearance-options";

export interface SignatureOptions {

  reason: string,
  signerName?: string,
  email?: string,
  location?: string,
  annotationOnPage?: number,
  annotationAppearanceOptions: AnnotationAppearanceOptions,

}
