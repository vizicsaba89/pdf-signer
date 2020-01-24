const getIndexFromRef = (refTable: any, ref: string) => {
  const [rawIndex] = ref.split(' ')
  const index = parseInt(rawIndex)

  if (!refTable.offsets.has(index)) {
    throw new Error(`Failed to locate object "${ref}".`)
  }

  return index
}

export default getIndexFromRef
