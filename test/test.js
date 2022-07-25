const OpenType = require('opentype.js');
const ZnJsCaptcha = require('../src/index.js');
const fs = require('fs');

(async function () {
    let startTime = Date.now();
    let captchaGenerator = ZnJsCaptcha(OpenType, {
        fontPath: __dirname + '/../assets/Comismsh.ttf',
    });

    let captcha = await captchaGenerator.generate();
    fs.writeFileSync('tmp.html', '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(captcha.data) + '">');
    console.log(captcha.result, (Date.now() - startTime) + 'ms');
})();
