import findObject from './find-object'
import getPagesDictionaryRef from './get-pages-dictionary-ref'

const getPageRef = (pdf: Buffer, info: any) => {
  const pagesRef = getPagesDictionaryRef(info)
  const pagesDictionary = findObject(pdf, info.xref, pagesRef)
  const kidsPosition = pagesDictionary.indexOf('/Kids')
  const kidsStart = pagesDictionary.indexOf('[', kidsPosition) + 1
  const kidsEnd = pagesDictionary.indexOf(']', kidsPosition)
  const pages = pagesDictionary.slice(kidsStart, kidsEnd).toString()
  const split = pages.trim().split(' ', 3)

  return `${split[0]} ${split[1]} ${split[2]}`
}

export default getPageRef
