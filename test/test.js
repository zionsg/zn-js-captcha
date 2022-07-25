const OpenType = require('opentype.js');
const ZnJsCaptcha = require('../src/index.js');
const fs = require('fs');

(async function () {
    let startTime = Date.now();
    let captchaGenerator = ZnJsCaptcha(OpenType, {
        fontPath: __dirname + '/../assets/Marius.ttf',
    });

    let captcha = await captchaGenerator.generate();
    fs.writeFileSync('tmp.svg', captcha.data);
    fs.writeFileSync('tmp.html', '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(captcha.data) + '">');
    console.log(
        `Generated Math CAPTCHA with result ${captcha.result} in ` + (Date.now() - startTime) + 'ms.',
        'Saved to tmp.svg and tmp.html.'
    );
})();
