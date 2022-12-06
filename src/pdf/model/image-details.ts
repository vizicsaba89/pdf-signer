import { TransformOptions } from './transform-options'

export interface ImageDetails {
  imagePath?: string;
  base64?: string;
  transformOptions: TransformOptions
}
