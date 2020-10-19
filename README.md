# PDF signer

A JavaScript PDF signer for node. 

This package is based on [vbuch](https://www.npmjs.com/~vbuch) work: [node-signpdf](https://www.npmjs.com/package/node-signpdf).

## PDF versions
Pdf-signer cant handle pdf stream in the moment. It only can works with pdf which built on XREF tables. 

For more information look at the  NoahCardoza's [issue](https://github.com/vizicsaba89/pdf-signer/issues/16)

## Installation

Installation uses the npm package manager. Just type the following command after installing npm.

```bash
npm install pdf-signer
```

## Usage

single signing example:
```javascript
import { sign } from 'pdf-signer'

const p12Buffer = fs.readFileSync(`./assets/pdf-signer.p12`)
const pdfBuffer = fs.readFileSync(`./assets/example.pdf`)

const signedPdf = sign(pdfBuffer, p12Buffer, 'pdfsigner', {
  reason: '2',
  email: 'test@email.com',
  location: 'Location, LO',
  signerName: 'Test User',
  annotationAppearanceOptions: {
    signatureCoordinates: { left: 0, bottom: 700, right: 190, top: 860 },
    signatureDetails: [
      {
        value: 'Signed by: Kiss Béla',
        fontSize: 7,
        transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
      },
      {
        value: 'Date: 2019-10-11',
        fontSize: 7,
        transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
      },
    ],
  },
})

fs.writeFileSync('./assets/results/signed.pdf', signedPdf)
```
More examples can be found in spec file [spec](https://github.com/vizicsaba89/pdf-signer/blob/master/src/sign.spec.ts).

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
