const getPagesDictionaryRef = (info: any) => {
  const isNotContainCatalogPositionWithSpace = info.root.toString().indexOf('/Type /Catalog') === -1
  const isNotContainCatalogPositionWithoutSpace = info.root.toString().indexOf('/Type/Catalog') === -1

  if (isNotContainCatalogPositionWithSpace && isNotContainCatalogPositionWithoutSpace) {
    throw new Error('Failed to find the pages descriptor. This is probably a problem in node-signpdf.')
  }

  const pagesRefRegex = new RegExp('\\/Pages\\s+(\\d+\\s\\d+\\sR)', 'g')
  const match = pagesRefRegex.exec(info.root)

  if (match == null) {
    throw new Error('Cant find a value for this regexp pattern.')
  }

  return match[1]
}

export default getPagesDictionaryRef
