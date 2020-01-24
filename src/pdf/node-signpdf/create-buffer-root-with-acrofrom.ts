import getIndexFromRef from './get-index-from-ref'

const createBufferRootWithAcroform = (info: any, form: any) => {
  const rootIndex = getIndexFromRef(info.xref, info.rootRef)

  return Buffer.concat([
    Buffer.from(`${rootIndex} 0 obj\n`),
    Buffer.from('<<\n'),
    Buffer.from(`${info.root}\n`),
    Buffer.from(`/AcroForm ${form}`),
    Buffer.from('\n>>\nendobj\n'),
  ])
}

export default createBufferRootWithAcroform
