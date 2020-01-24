import forge from 'node-forge'

export const getDataFromP12Cert = (
  p12Buffer: Buffer,
  certPassword: string,
): forge.pkcs12.Pkcs12Pfx => {
  const forgeCert: forge.util.ByteStringBuffer = forge.util.createBuffer(
    p12Buffer.toString('binary'),
  )
  const p12Asn1: forge.asn1.Asn1 = forge.asn1.fromDer(forgeCert)
  const p12data: forge.pkcs12.Pkcs12Pfx = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certPassword)

  return p12data
}

export const getCertBags = (p12: forge.pkcs12.Pkcs12Pfx): forge.pkcs12.Bag[] => {
  const certBags: forge.pkcs12.Bag[] | undefined = p12.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ]

  if (!certBags) {
    throw new Error('CertBags are not exist!')
  }

  return certBags
}
