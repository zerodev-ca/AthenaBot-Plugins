const plugin = require('../../main/discord/core/plugins/plugin.js');

module.exports = class qrCodes extends plugin {
	constructor(heart) {
		super(heart, {
			name: 'qrcodes',
			author: 'Zero Development',
			version: '1.0.0',
			priority: 0,
			dependencies: ['core'],
			softDependencies: [],
			nodeDependencies: ['qrcode', 'canvas'],
			channels: []
		});
	}

	async preLoad() {
		this.heart.core.console.log(this.heart.core.console.type.startup, `${this.getName()} plugin is pre-loading...`);
		const qrConfig = new this.heart.core.discord.core.config.interface(
			this.heart,
			{ name: 'qrCodes', plugin: this.getName() },
			{
				config: {
					permissions: {
						qrcode_command: undefined,
					},
					qrOptions: {
						margin: undefined,
						scale: undefined,
						roundedDots: undefined,
						color: {
							dark: undefined,
							light: undefined,
						},
						errorCorrectionLevel: undefined,
					},
					lang: {
						errorInvalidData: undefined,
						successEmbed: undefined
					}
				}
			},
		);
		const loadConfig = await this.heart.core.discord.core.config.manager.load(qrConfig);
		if (!loadConfig) {
			this.setDisabled();
			this.heart.core.console.log(this.heart.core.console.type.error, `Disabling plugin ${this.getName()}...`);
		}
	}

	async load() {
		this.heart.core.console.log(this.heart.core.console.type.startup, 'The QR Codes plugin is loading...');
	}
};