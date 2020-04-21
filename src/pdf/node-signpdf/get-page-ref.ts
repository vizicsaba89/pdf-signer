import findObject from './find-object'
import getPagesDictionaryRef from './get-pages-dictionary-ref'

const getPageRef = (pdf: Buffer, info: any, shouldAnnotationAppearOnFirstPage: boolean = false) => {
  const pagesRef = getPagesDictionaryRef(info)
  const pagesDictionary = findObject(pdf, info.xref, pagesRef)
  const kidsPosition = pagesDictionary.indexOf('/Kids')
  const kidsStart = pagesDictionary.indexOf('[', kidsPosition) + 1
  const kidsEnd = pagesDictionary.indexOf(']', kidsPosition)
  const pages = pagesDictionary.slice(kidsStart, kidsEnd).toString()
  const split = shouldAnnotationAppearOnFirstPage ? pages.trim().substring(0, 5) : pages.trim().substring(pages.length - 7, pages.length)

  return `${split[0]} ${split[1]} ${split[2]}`
}

export default getPageRef
