/**
 * Render captcha with Math equation in SVG - can be used client-side in browser or server-side in Node.js
 *
 * Usage in browser:
 *     <script src="node_modules/opentype.js/dist/opentype.min.js"></script>
 *     <script src="node_modules/zn-js-captcha/src/index.js"></script>
 *     <script>
 *         (async function () {
 *             // Need to run on web server in order to read the font file
 *             let captchaGenerator = ZnJsCaptcha(opentype, { fontPath: 'http://localhost/assets/Comismsh.ttf' });
 *             let captcha = await captchaGenerator.generate();
 *             console.log('Result: ' + captcha.result);
 *             document.write('<img src="data:image/svg+xml;utf8,' + encodeURIComponent(captcha.data) + '">');
 *         })();
 *     </script>
 *
 * Usage in Node.js:
 *     const OpenType = require('opentype.js');
 *     const ZnJsCaptcha = require('zn-js-captcha');
 *     (async function () {
 *         let captchaGenerator = ZnJsCaptcha(OpenType, { fontPath: __dirname + '/../assets/Comismsh.ttf' });
 *         let captcha = await captchaGenerator.generate();
 *     })();
 *
 * @link Adapted from https://github.com/produck/svg-captcha
 * @link Uses https://github.com/opentypejs/opentype.js
 * @link http://www.captcha.net/
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
                colorBackground: '#ffffff',
                colorForeground: '#000000',

                fontPath: './assets/Comismsh.ttf',
                fontSize: 100,

                // In "2 + 3", 2 is the augend and 3 is the addend
                mathAugendMin: 10,
                mathAugendMax: 99,
                mathAddendMin: 1,
                mathAddendMax: 9,
                mathOperator: '+',

                noiseLines: 10,
                noiseDots: 500,

                outputWidth: 300,
                outputHeight: 100,
            },
        };

        /** @type {OpenType.Font} Loaded font. */
        let font = null;

        /**
         * Generate new CAPTCHA
         *
         * @public
         * @returns {Promise<Object>} Example:
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
            let augend = getRandomInt(self.config.mathAugendMin, self.config.mathAugendMax);
            let addend = getRandomInt(self.config.mathAddendMin, self.config.mathAddendMax);
            let operator = self.config.mathOperator;

            return {
                text: `${augend}${operator}${addend}`, // spaces not added to make it harder for bots to split expr
                result: ('-' === operator) ? (augend - addend) : (augend + addend), // default to "+"
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
