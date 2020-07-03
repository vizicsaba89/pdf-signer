import findObject from './find-object'
import getPagesDictionaryRef from './get-pages-dictionary-ref'

const getPageRef = (pdf: Buffer, info: any, annotationOnPage: number = 0) => {
  const pagesRef = getPagesDictionaryRef(info)
  const pagesDictionary = findObject(pdf, info.xref, pagesRef)
  const kidsPosition = pagesDictionary.indexOf('/Kids')
  const kidsStart = pagesDictionary.indexOf('[', kidsPosition) + 1
  const kidsEnd = pagesDictionary.indexOf(']', kidsPosition)
  const pages = pagesDictionary.slice(kidsStart, kidsEnd).toString()
  const pageIndexList = pages.split('0 R').filter((p) => p !== '')

  return `${pageIndexList[annotationOnPage]} 0 R`.trim()
}

export default getPageRef
