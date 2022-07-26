# Zion's JavaScript CAPTCHA

![Sample](docs/README/sample.svg)

Generate Math [CAPTCHA](http://www.captcha.net/) offline in SVG, either client-side in the browser
or server-side in Node.js. Uses [OpenType.js](https://github.com/opentypejs/opentype.js).

This is adapted from the [svg-captcha](https://github.com/produck/svg-captcha) NPM package
(which is using an outdated version of OpenType.js & has not been maintained since 2019) and
[ZnZend MathQuestionService](https://github.com/zionsg/ZnZend/blob/master/src/Captcha/Service/MathQuestionService.php)
which I coded in PHP some years back.

Paths mentioned in all documentation, even those in subfolders, are relative to the root of the
repository. Shell commands, if any, are run from the root of the repository.

## Sections
- [Changelog](#changelog)
- [Difficulty Level](#difficulty-level)
- [Font](#font)
- [Usage](#usage)
- [Installation](#installation)

## Changelog
- See `CHANGELOG.md`. Note that changes are only documented from v1.0.0 onwards.

## Difficulty Level
- The difficulty level for solving the generated CAPTCHA is akin to a Level 3:
    + Level 1: Generate random text. User sees the shown text and keys in the
      shown text. Machine learning can easily be used to crack this.
    + Level 2: Generate random Math equation using numbers. User sees the shown
      text, solves the equation and keys in the result.
    + Level 3: Generate random Math equation and spell out the numbers in
      English. User sees the shown text, converts the words back to numbers,
      solves the equation and keys in the result.

## Font
- The primary font bundled with this project in `assets/Marius1.ttf` is the
  [Marius1](https://fontlibrary.org/en/font/marius1) font. It was chosen
  for its [CC0](https://creativecommons.org/publicdomain/zero/1.0/) license
  and irregular glyphs.

## Usage
- See docblocks in `src/index.js` for detailed documentation.
- Node.js
    + Run `npm install zn-js-captcha` to install the package.
    + Sample code (assumes code is running at same directory level
      as `node_modules`):

            const OpenType = require('opentype.js');
            const ZnJsCaptcha = require('zn-js-captcha');
            (async function () {
                let captchaGenerator = ZnJsCaptcha(OpenType, {
                    fontPath: __dirname + '/node_modules/zn-js-captcha/assets/Marius1.ttf'
                });
                let captcha = await captchaGenerator.generate();
            })();

- In the browser
    + Download this repository into your project directory either by cloning it
      into a subfolder or using NPM to install it into `node_modules` subfolder.
    + Sample code (assumes webpage is running same directory level as
      subfolder):

            <script src="node_modules/opentype.js/dist/opentype.min.js"></script>
            <script src="node_modules/zn-js-captcha/src/index.js"></script>
            <script>
                (async function () {
                    // Need to run on web server in order to read the font file
                    let captchaGenerator = ZnJsCaptcha(opentype, {
                        fontPath: 'node_modules/zn-js-captcha/assets/Marius1.ttf'
                    });
                    let captcha = await captchaGenerator.generate();

                    document.write(
                        '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(captcha.data) + '">'
                    );
                    console.log('Result: ' + captcha.result);
                })();
            </script>

- Constructor: `ZnJsCaptcha(OpenTypeJs, config)`
    + `OpenTypeJs`: Object returned by OpenType.js library.
    + `config`: Configuration object used for generating CAPTCHA.

            {
                // Colors
                colorBackground: '#ffffff',
                colorForeground: '#000000',

                // Font
                fontPath: '../assets/Marius1.ttf',
                fontSize: 50,

                // In "2 + 3", 2 is the augend and 3 is the addend
                mathAugendMin: 10,
                mathAugendMax: 99,
                mathAddendMin: 1,
                mathAddendMax: 9,
                mathOperator: '+',

                // No. of lines/dots to add to output SVG as noise
                noiseLines: 10,
                noiseDots: 1000,

                // Dimensions of output SVG
                outputWidth: 480,
                outputHeight: 120,
            }

- Public methods:
    + `generate()`: Async function that returns an object when the Promise is
      resolved (`data` is the SVG output and `result` is the answer to the
      Math equation):

            {
                data: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="10" viewBox="0,0,30,10"></svg>',
                result: 28,
            }

## Installation
- This section is meant for developers.
- Clone this repository.
- Run `npm install` to install dependencies.
- Other NPM scripts:
    + `npm run lint`: Linting checks.
    + `npm run release`: Prepare for release.
- To publish to NPM registry as a public package:
    + Update the project version:
        * Update `version` key in `package.json`.
        * Run `npm run release`.
    + This part only needs to be done once.
        * Login to https://www.npmjs.com
            - Go to "Access Tokens".
            - Click "Generate New Token".
            - Select "Publish".
            - Copy the token - it will not be displayed again.
        * Create a `.npmrc` file in the root of the cloned repository and add
          the line `//registry.npmjs.org/:_authToken=YOUR-ACCESS-TOKEN`,
          replacing the last part with your token.
        * Run `npm login` to login to your account on the local machine.
        * Remove `"private": true` from `package.json` if it exists.
    + Run `npm publish --access public`.
    + View the published package at https://www.npmjs.com/package/zn-js-captcha
      and ensure that the package is public.
- Tests:
    + Node.js: Run `node test/test.js`. 2 files will be created in the root
      of the repository, `tmp.svg` and `tmp.html`, both of which will not be
      committed to the repository.
    + Browser: Open `test/test.html` in the browser. A localhost web server
      needs to be run in the root of the repository due to the reading of the
      font file, else there will be the error "Access to XMLHttpRequest at url
      from origin 'null' has been blocked by CORS policy: No
      'Access-Control-Allow-Origin' header is present on the requested
      resource.".
