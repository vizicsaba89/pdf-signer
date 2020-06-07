import findObject from './find-object'
import getPagesDictionaryRef from './get-pages-dictionary-ref'

const getPageRef = (pdf: Buffer, info: any, shouldAnnotationAppearOnFirstPage: boolean = false) => {
  const pagesRef = getPagesDictionaryRef(info)
  const pagesDictionary = findObject(pdf, info.xref, pagesRef)
  const kidsPosition = pagesDictionary.indexOf('/Kids')
  const kidsStart = pagesDictionary.indexOf('[', kidsPosition) + 1
  const kidsEnd = pagesDictionary.indexOf(']', kidsPosition)
  const pages = pagesDictionary.slice(kidsStart, kidsEnd).toString().trim()
  const split = shouldAnnotationAppearOnFirstPage ? `${pages.split('R ')[0]} R` : `${pages.split('R ')[pages.split('R ').length - 1]}`

  return split
}

export default getPageRef
