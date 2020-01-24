import getIndexFromRef from './get-index-from-ref'

const findObject = (pdf: Buffer, refTable: any, ref: string) => {
  const index = getIndexFromRef(refTable, ref)

  const offset = refTable.offsets.get(index)
  let slice = pdf.slice(offset)
  slice = slice.slice(0, slice.indexOf('endobj'))

  slice = slice.slice(slice.indexOf('<<') + 2)
  slice = slice.slice(0, slice.lastIndexOf('>>'))

  return slice
}

export default findObject
