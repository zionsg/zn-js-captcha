/**
 * Render CAPTCHA with Math equation in SVG - can be used client-side in browser or server-side in Node.js
 *
 * Usage in Node.js:
 *     const OpenType = require('opentype.js');
 *     const ZnJsCaptcha = require('zn-js-captcha');
 *     (async function () {
 *         let captchaGenerator = ZnJsCaptcha(OpenType, { fontPath: __dirname + '/../assets/Comismsh.ttf' });
 *         let captcha = await captchaGenerator.generate();
 *     })();
 *
 * Usage in browser:
 *     <script src="node_modules/opentype.js/dist/opentype.min.js"></script>
 *     <script src="node_modules/zn-js-captcha/src/index.js"></script>
 *     <script>
 *         (async function () {
 *             // Need to run on web server in order to read the font file
 *             let captchaGenerator = ZnJsCaptcha(opentype, { fontPath: 'http://localhost/assets/Comismsh.ttf' });
 *             let captcha = await captchaGenerator.generate();
 *             document.write('<img src="data:image/svg+xml;utf8,' + encodeURIComponent(captcha.data) + '">');
 *             console.log('Result: ' + captcha.result);
 *         })();
 *     </script>
 *
 * @link https://github.com/zionsg/zn-js-captcha
 * @link See https://stackoverflow.com/a/3658673
 *     and https://zeekat.nl/articles/constructors-considered-mildly-confusing.html on the use of the `new` operator,
 *     which does not make a difference if used/unused in the usage examples above, as the `this` keyword is not used
 *     throughout the code.
 * @returns {function(OpenTypeJs, Object): Object} Note that this returns not an
 *     object but a function that needs invoking.
 */
(function () {
    /**
     * Constructor function
     *
     * @public
     * @param {OpenType} OpenTypeJs - Library for loading font, see https://github.com/opentypejs/opentype.js for info,
     *     needs v1.3.1 and above.
     * @param {Object} config - Configuration for captcha.
     * @returns {Object} See `self` for public properties/methods.
     */
    const constructorFunction = (function (OpenTypeJs, config) {
        /**
         * Self-reference - all public properties/methods are stored here & returned as public interface
         *
         * @public
         * @type {Object}
         * @property {Object} config - Configuration for generating CAPTCHAs.
         * @property {string} config.colorBackground="#ffffff" - HTML color code to use for background.
         * @property {string} config.colorForeground="#000000" - HTML color code to use for foreground.
         * @property {string} config.fontPath="./assets/Comismsh.ttf" - Path to font file used for CAPTCHA.
         * @property {int} config.fontSize=100 - Font size.
         * @property {int} config.mathAugendMin=10 - Minimum number when generating augend for Math equation.
         *     In "2 + 3", 2 is the augend and 3 is the addend.
         * @property {int} config.mathAugendMax=99 - Maximum number when generating augend for Math equation.
         *     In "2 + 3", 2 is the augend and 3 is the addend.
         * @property {int} config.mathAddndMin=1 - Minimum number when generating addend for Math equation.
         *     In "2 + 3", 2 is the augend and 3 is the addend.
         * @property {int} config.mathAddendMax=99 - Maximum number when generating addend for Math equation.
         *     In "2 + 3", 2 is the augend and 3 is the addend.
         * @property {string="+","-"} config.mathOperator="+" - Operator to use for Math equation.
         * @property {int} config.noiseLines=10 - No. of lines to add to CAPTCHA as noise.
         * @property {int} config.noiseDots=500 - No. of dots to add to CAPTCHA as noise.
         * @property {int} config.outputWidth=300 - Width of output SVG in pixels.
         * @property {int} config.outputHeight=100 - Height of output SVG in pixels.
         */
        const self = {
            config: {
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
            },
        };

        /** @type {OpenType.Font} Loaded font. */
        let font = null;

        /**
         * Generate new CAPTCHA
         *
         * @public
         * @returns {Promise<Object>} E.g. (`data` is the SVG output and `result` is the answer to the Math equation):
         *     {
         *         data: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="10" viewBox="0,0,30,10"></svg>',
         *         result: 28,
         *     }
         */
        self.generate = async function () {
            if (!font) {
                font = await OpenTypeJs.load(self.config.fontPath);
            }

            let width = self.config.outputWidth;
            let height = self.config.outputHeight;
            let xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `
                + `viewBox="0,0,${width},${height}">`
                + `<rect width="100%" height="100%" fill="${self.config.colorBackground}"/>`;

            let equation = generateMathEquation();
            let paths = []
                .concat(renderDots())
                .concat(renderLines())
                .concat(renderText(equation.text))
                .sort(() => Math.random() - 0.5); // randomize sequence of paths for lines/dots/text

            xml += paths.join('') + '</svg>';

            return {
                data: xml,
                result: equation.result,
            };
        };

        /**
         * Generate Math equation
         *
         * @private
         * @returns {Object} Example:
         *     {
         *         text: '23 + 5',
         *         result: 28,
         *     }
         */
        function generateMathEquation() {
            // Operator defaults to "+" if invalid operator is specified
            let augend = getRandomInt(self.config.mathAugendMin, self.config.mathAugendMax);
            let addend = getRandomInt(self.config.mathAddendMin, self.config.mathAddendMax);
            let operator = self.config.mathOperator;
            let text = spellNumber(augend) + ('-' === operator ? ' minus ' : ' plus ') + spellNumber(addend);

            return {
                text: text,
                result: ('-' === operator) ? (augend - addend) : (augend + addend),
            };
        }

        /**
         * Get random gray color
         *
         * @private
         * @returns {string} E.g.: #888.
         */
        function getRandomGray() {
            let hex = getRandomInt(1, 8).toString(16); // #111 to #888, should not yield light gray

            return `#${hex}${hex}${hex}`;
        }

        /**
         * Get random integer
         *
         * @private
         * @param {int} min
         * @param {int} max
         * @returns {int} Integer between min and max, inclusive.
         */
        function getRandomInt(min, max) {
            return Math.round(min + (Math.random() * (max - min)));
        }

        /**
         * Render dots for noise as SVG paths
         *
         * @private
         * @returns {string[]} E.g.: ['<path fill="#000000" d="M48.52 77.40L48.52 77.40L48.52/>'].
         */
        function renderDots() {
            let paths = [];
            let dotCnt = self.config.noiseDots;
            let width = self.config.outputWidth;
            let height = self.config.outputHeight;

            let i = 0;
            let x = 0;
            let y = 0;
            let color = '';
            while (i < dotCnt) {
                x = getRandomInt(1, width);
                y = getRandomInt(1, height);
                color = getRandomGray();

                paths.push(`<circle cx="${x}" cy="${y}" r="1" fill="${color}"/>`);
                i++;
            }

            return paths;
        }

        /**
         * Render lines for noise as SVG paths
         *
         * @private
         * @returns {string[]} E.g.: ['<path fill="#000000" d="M48.52 77.40L48.52 77.40L48.52/>'].
         */
        function renderLines() {
            let paths = [];
            let lineCnt = self.config.noiseLines;
            let width = self.config.outputWidth;
            let height = self.config.outputHeight;
            let buffer = 20;

            let i = 0;
            let start = 0;
            let end = 0;
            let mid1 = 0;
            let mid2 = 0;
            let color = '';
            while (i < lineCnt) {
                start = `${getRandomInt(1, buffer)} ${getRandomInt(1, height)}`;
                end = `${getRandomInt(width - buffer, width)} ${getRandomInt(1, height)}`;
                mid1 = `${getRandomInt((width / 2) - buffer, (width / 2) + buffer)} ${getRandomInt(1, height)}`;
                mid2 = `${getRandomInt((width / 2) - buffer, (width / 2) + buffer)} ${getRandomInt(1, height)}`;
                color = getRandomGray();

                paths.push(`<path d="M${start} C${mid1},${mid2},${end}" stroke="${color}" fill="none"/>`);
                i++;
            }

            return paths;
        }

        /**
         * Render text as SVG paths
         *
         * @private
         * @param {string} text
         * @returns {string[]} E.g.: ['<path fill="#000000" d="M48.52 77.40L48.52 77.40L48.52/>'].
         */
        function renderText(text) {
            let paths = [];

            let len = text.length;
            let width = self.config.outputWidth;
            let height = self.config.outputHeight;
            let spacing = (width - 2) / (len + 1);
            let color = self.config.colorForeground;
            let fontSize = self.config.fontSize;
            let fontScale = fontSize / font.unitsPerEm;

            let i = 0;
            let x = 0;
            let y = 0;
            let glyph = null;
            let glyphWidth = 0;
            let glyphHeight = 0;
            let left = 0;
            let top = 0;
            let path = null;
            let pathData = '';
            while (i < len) {
                glyph = font.charToGlyph(text[i]);

                glyphWidth = glyph.advanceWidth ? (fontScale * glyph.advanceWidth) : 0;
                x = (i + 1) * spacing;
                left = x - (glyphWidth / 2);

                glyphHeight = fontScale * (font.ascender + font.descender);
                y = height / 2;
                top = y + (glyphHeight / 2);

                path = glyph.getPath(left, top, fontSize);
                pathData = path.toPathData();

                paths.push(`<path fill="${color}" d="${pathData}"/>`);
                i++;
            }

            return paths;
        }

        /**
         * Spell number in English
         *
         * Caters for 0 to 999,999,999.
         *
         * @private
         * @link Adapted from https://github.com/zionsg/ZnZend/blob/master/src/Captcha/Service/MathQuestionService.php
         * @param {int} number
         * @returns {string} E.g.: 264073458 returns "two hundred and sixty-four million,
         *     seventy-three thousand, four hundred and fifty-eight".
         */
        function spellNumber(number) {
            let num = parseInt(number || 0).toString();

            // Special case
            if (0 === num) {
                return 'zero';
            }

            // Index 0 not used. Non-empty place suffixes have ' ' in front to facilitate concatenation
            let placeSuffix = [
                '', '', '', ' hundred', ' thousand', ' thousand', ' thousand', ' million', ' million', ' million',
            ];
            let onesPrefix  = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
            let teensPrefix = [
                'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
                'sixteen', 'seventeen', 'eighteen', 'nineteen',
            ];
            let tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

            let ans = '';
            let partAns = '';
            let digit = 0;
            let place = 0;
            let prefix = '';
            let nextDigit = '';
            let nextTwoDigits = '';
            while (num.length > 0) {
                digit = parseInt(num.substr(0, 1));
                place = num.length;
                prefix = '';

                // Parse number according to pronunciation types
                if ([6, 9].includes(place)) { // 100 thousand, 100 million
                    prefix = onesPrefix[digit] + ' hundred';
                    nextTwoDigits = spellNumber(parseInt(num.substr(1, 2))); // process the next 2 digits
                    if (nextTwoDigits !== 'zero') {
                        prefix += ' and ' + nextTwoDigits;
                    }

                    partAns = prefix + placeSuffix[place];
                    num = num.substr(3); // cut off the 3 leftmost digits
                } else if ([2, 5, 8].includes(place)) { // 10, 10 thousand, 10 million
                    nextDigit = parseInt(num.substr(1, 1));

                    if (1 === digit) { // 10 to 19
                        prefix = teensPrefix[nextDigit];
                    } else if (digit > 1) {
                        prefix = tens[digit];
                        if (nextDigit !== 0) {
                            prefix = tens[digit] + '-' + onesPrefix[nextDigit];
                        }
                    } else {
                        prefix = '';
                    }

                    partAns = prefix + placeSuffix[place];
                    num = num.substr(2); // cut off the 2 leftmost digits
                } else if ([1, 3, 4, 7].includes(place)) { // 1, 1 hundred, 1 thousand, 1 million
                    prefix = onesPrefix[digit];
                    partAns = prefix + placeSuffix[place];
                    num = num.substr(1); // cut off the leftmost digit
                }

                // Eliminate the redundant zeroes in front
                if (num !== '') {
                    while ('0' === num.substr(0, 1)) {
                        num = num.substr(1); // cut off leftmost digit which is a zero
                    }
                }

                // Concatenate the new part to the whole answer
                if ('' === ans) {
                    ans += partAns;
                } else if (num.length > 0) {
                    ans += ', ' + partAns;
                } else {
                    ans += ' and ' + partAns;
                }
            } // end while

            return ans;
        }

        // Initialization
        (function () {
            self.config = Object.assign({}, self.config, config || {});
        })();

        // Return public interface
        return self;
    }); // end constructorFunction

    // Return public interface of IIFE for use in browser or server
    // https://blog.intzone.com/javascript-code-that-can-be-used-client-side-in-the-browser-and-server-side-in-node-js
    if ('undefined' === typeof exports) {
        this['ZnJsCaptcha'] = constructorFunction; // for client-side use in browser
    } else {
        module.exports = constructorFunction; // for server-side use in Node.js
    }
})();
