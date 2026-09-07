const fs = require('fs');
const path = require('path');

module.exports = class AsciiMaker {
	constructor(heart) {
		this.heart = heart;
		this.fontsPath = path.join(__dirname, '../../data/fonts');
		this.defaultFont = 'ANSI Shadow';
		this.loadedFonts = new Map();
	}

	loadFont(fontName) {
		if (this.loadedFonts.has(fontName)) return this.loadedFonts.get(fontName);

		let font = null;
		try {
			font = JSON.parse(fs.readFileSync(path.join(this.fontsPath, `${fontName}.json`), 'utf8'));
		} catch (err) {
			this.heart.core.console.log(this.heart.core.console.type.error, `[zdlibrary] Failed to load ASCII font "${fontName}": ${err.message}`);
		}

		this.loadedFonts.set(fontName, font);
		return font;
	}

	generate(text, fontName = this.defaultFont) {
		const font = this.loadFont(fontName) ?? (fontName !== this.defaultFont ? this.loadFont(this.defaultFont) : null);
		if (!font) return String(text).toUpperCase();

		const lines = Array(font.height).fill('');

		for (const char of String(text).toUpperCase()) {
			const charData = font.characters[char];
			if (!charData) continue;
			for (let i = 0; i < font.height; i++) {
				lines[i] += charData[i] ?? '';
			}
		}

		return lines.join('\n');
	}
};
