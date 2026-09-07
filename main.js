const plugin = require('../../main/discord/core/plugins/plugin.js');
const guildHandler = require('./src/handler/guildlocker.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../types/heart.js');
	const pluginType = require('../../types/discord/core/plugins/plugin.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

/**
 * A class representing the guildlocker plugin.
 * @class
 * @extends pluginType
 */
module.exports = class guildlocker extends plugin {
	/**
	 * Creates an instance of this plugin.
	 * @param {heartType} heart - The heart of the bot.
	 */
	constructor(heart) {
		super(heart, { name: 'guildlocker', author: 'Zero Development', version: '1.0.0.0', requiredAthenaVersion: '2.6.0', priority: 0, dependencies: ['core'], softDependencies: [], nodeDependencies: [], channels: [], dashboard: { cannotDisable: false } });
	}

	async preLoad() {
		try {
			this.heart.core.console.log(this.heart.core.console.type.startup, 'The plugin is pre-loading now...');
			const guildConfig = new this.heart.core.discord.core.config.interface(
				this.heart,
				{ name: 'guildlocker', plugin: this.getName(), dashboardConfigurable: true },
				{
					config: {
						lang: {
							successful_toggle: undefined
						},
						permissions: {
							guildlocker: undefined
						}
					}
				},
			);
			const loadGuildConfig = await this.heart.core.discord.core.config.manager.load(guildConfig);
			if (!loadGuildConfig) {
				this.setDisabled();
				this.heart.core.console.log(this.heart.core.console.type.error, `Disabling plugin ${this.getName()}...`);
			}
		}
		catch (err) {
			this.heart.core.console.log(this.heart.core.console.type.error, `An issue occured while pre-loading plugin ${this.getName()}`);
			new this.heart.core.error.interface(this.heart, err);
			this.setDisabled();
		}
	}

	async load() {
		try {
			this.heart.core.console.log(this.heart.core.console.type.startup, 'The plugin is loading now...');
			this.heart.core.discord.core.handler.manager.register(new guildHandler(this.heart));
		}
		catch (err) {
			this.heart.core.console.log(this.heart.core.console.type.error, `An issue occured while loading plugin ${this.getName()}`);
			new this.heart.core.error.interface(this.heart, err);
			this.setDisabled();
		}
	}
};