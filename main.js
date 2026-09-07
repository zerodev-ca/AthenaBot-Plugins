const plugin = require('../../main/discord/core/plugins/plugin.js');
const ZDLibraryHandler = require('./src/handler/zdlibrary.js');

module.exports = class ZDLibrary extends plugin {
	constructor(heart) {
		super(heart, {
			name: 'zdlibrary',
			author: 'Zero Development',
			version: '1.1.1.0',
			priority: 25,
			requiredAthenaVersion: '2.5.0',
			dependencies: ['core'],
			softDependencies: [],
			nodeDependencies: [],
			channels: [],
			dashboard: { cannotDisable: true },
		});
	}

	async preLoad() {
		this.heart.core.discord.core.handler.manager.register(
			new ZDLibraryHandler(this.heart),
		);
	}

	async load() {
		this.heart.core.console.log(this.heart.core.console.type.startup, '', this.heart.core.console.color.console.foreground.magenta);
		this.heart.core.discord.core.handler.manager.get('zdlibrary').generateAscii(this.getName()).split('\n').forEach(l => this.heart.core.console.log(this.heart.core.console.type.startup, l, this.heart.core.console.color.console.foreground.yellow));
		this.heart.core.console.log(this.heart.core.console.type.startup, '', this.heart.core.console.color.console.foreground.magenta);
		this.heart.core.console.log(this.heart.core.console.type.startup, 'Discord:    https://discord.gg/zerodev', this.heart.core.console.color.console.foreground.magenta);
		this.heart.core.console.log(this.heart.core.console.type.startup, 'BuiltByBit: https://builtbybit.com/zerodev', this.heart.core.console.color.console.foreground.magenta);
		this.heart.core.console.log(this.heart.core.console.type.startup, 'Zero Shop:  https://zerodev.ca', this.heart.core.console.color.console.foreground.magenta);
		this.heart.core.console.log(this.heart.core.console.type.startup, '', this.heart.core.console.color.console.foreground.magenta);
	}
};
