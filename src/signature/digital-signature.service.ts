import forge from 'node-forge'
import * as certUtil from './cert.util'

export const getSignature = (
  pdfWithByteRange: Buffer,
  p12Buffer: Buffer,
  placeholderLength: number,
  certPassword: string,
): string => {
  const p12Data: forge.pkcs12.Pkcs12Pfx = certUtil.getDataFromP12Cert(p12Buffer, certPassword)

  const certBags: forge.pkcs12.Bag[] = certUtil.getCertBags(p12Data)
  const keyBags: forge.pkcs12.Bag[] = getKeyBags(p12Data)
  const privateKey: any = getPrivateKey(keyBags)

  const p7: forge.pkcs7.PkcsSignedData = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(pdfWithByteRange.toString('binary'))

  const certificate: forge.pki.Certificate = getCertificate(p7, certBags, privateKey)
  const signer: any = getSigner(privateKey, certificate)

  p7.addSigner(signer)
  p7.sign({ detached: true })

  const rawSignature: string = getRawSignature(p7, placeholderLength)
  let signature: string = getSignatureFromRawSignature(rawSignature, placeholderLength)

  return signature
}

const getKeyBags = (p12: forge.pkcs12.Pkcs12Pfx): forge.pkcs12.Bag[] => {
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
    forge.pki.oids.pkcs8ShroudedKeyBag
  ]

  if (!keyBags) {
    throw new Error('KeyBags are not exist!')
  }

  return keyBags
}

const getPrivateKey = (keyBags: forge.pkcs12.Bag[]): forge.pki.PrivateKey => {
  const privateKey: any = keyBags[0].key

  if (!privateKey) {
    throw new Error('PrivateKey is not exists!')
  }

  return privateKey
}

const getCertificate = (
  p7: forge.pkcs7.PkcsSignedData,
  certBags: forge.pkcs12.Bag[],
  privateKey: forge.pki.PrivateKey,
): forge.pki.Certificate => {
  let certificate: forge.pki.Certificate | undefined

  Object.keys(certBags).forEach((value: string, index: number, array: string[]) => {
    const publicKey: forge.pki.PublicKey = certBags[index]?.cert?.publicKey as forge.pki.PublicKey
    const rawCertificate: forge.pki.Certificate = certBags[index].cert as forge.pki.Certificate

    p7.addCertificate(rawCertificate)

    certificate = getValidatedCertificate(privateKey, publicKey, rawCertificate)
  })

  if (!certificate) {
    throw new Error('Failed to find a certificate that matches the private key.')
  }

  return certificate
}

const getRawSignature = (p7: forge.pkcs7.PkcsSignedData, placeholderLength: number): string => {
  const rawSignature = forge.asn1.toDer(p7.toAsn1()).getBytes()

  if (rawSignature.length * 2 > placeholderLength) {
    throw new Error(
      `Signature exceeds placeholder length: ${rawSignature.length * 2} > ${placeholderLength}`,
    )
  }

  return rawSignature
}

const getSignatureFromRawSignature = (rawSignature: string, placeholderLength: number): string => {
  let signature = Buffer.from(rawSignature, 'binary').toString('hex')
  signature += Buffer.from(
    String.fromCharCode(0).repeat(placeholderLength / 2 - rawSignature.length),
  ).toString('hex')

  return signature
}

const getSigner = (privateKey: any, certificate: forge.pki.Certificate): any => {
  return {
    key: privateKey,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date().toString(),
      },
    ],
  }
}

const getValidatedCertificate = (
  privateKey: forge.pki.PrivateKey,
  publicKey: forge.pki.PublicKey,
  rawCertificate: forge.pki.Certificate,
): forge.pki.Certificate | undefined => {
  let validatedCertificate: forge.pki.Certificate | undefined = undefined

  const isPrivateKeyModulusSameAsPublicKeyModulus =
    (privateKey as any).n.compareTo((publicKey as any).n) === 0
  const isPrivateKeyExponentSameAsPublicKeyExponent =
    (privateKey as any).e.compareTo((publicKey as any).e) === 0

  if (isPrivateKeyModulusSameAsPublicKeyModulus && isPrivateKeyExponentSameAsPublicKeyExponent) {
    validatedCertificate = rawCertificate
  }

  return validatedCertificate
}
