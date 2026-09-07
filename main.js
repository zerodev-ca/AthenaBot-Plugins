const plugin = require('../../main/discord/core/plugins/plugin.js');
const voiceStatsHandler = require('./src/handler/voicestats.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../types/heart.js');
	const pluginType = require('../../types/discord/core/plugins/plugin.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

/**
 * A class representing the voicestats plugin.
 * @class
 * @extends pluginType
 */
module.exports = class voicestats extends plugin {
	/**
	 * Creates an instance of this plugin.
	 * @param {heartType} heart - The heart of the bot.
	 */
	constructor(heart) {
		super(heart, { name: 'voicestats', author: 'Zero Development', version: '1.0.0.0', requiredAthenaVersion: '2.6.0', priority: 0, dependencies: ['core'], softDependencies: [], nodeDependencies: [], channels: [{ name: 'stats_channel', description: 'Where the recurring voice stats embed is posted/updated' }], dashboard: { cannotDisable: false } });
	}

	async preLoad() {
		try {
			this.heart.core.console.log(this.heart.core.console.type.startup, 'The plugin is pre-loading now...');
			const voiceStatsConfig = new this.heart.core.discord.core.config.interface(
				this.heart,
				{ name: 'voicestats', plugin: this.getName(), dashboardConfigurable: true },
				{
					config: {
						permissions: {
							voicestats_command: undefined
						},
						period: undefined,
						trackedChannels: undefined,
						checkIntervalMinutes: undefined,
						accumulativeStats: undefined,
						ghostPing: {
							enabled: undefined,
							role: undefined,
							thresholdMinutes: undefined
						},
						lang: {
							statsEmbed: {
								title: undefined,
								channelLine: undefined,
								emptyLine: undefined
							},
							commandReplies: {
								periodEnded: {
									description: undefined
								},
								previewPosted: {
									description: undefined
								}
							}
						}
					}
				},
			);
			const loadVoiceStatsConfig = await this.heart.core.discord.core.config.manager.load(voiceStatsConfig);
			if (!loadVoiceStatsConfig) {
				this.setDisabled();
				this.heart.core.console.log(this.heart.core.console.type.error, `Disabling plugin ${this.getName()}...`);
				return;
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
			this.heart.core.discord.core.cache.manager.register(new this.heart.core.discord.core.cache.interface(this.heart, 'voicestats_sessions'));
			this.heart.core.discord.core.handler.manager.register(new voiceStatsHandler(this.heart));
		}
		catch (err) {
			this.heart.core.console.log(this.heart.core.console.type.error, `An issue occured while loading plugin ${this.getName()}`);
			new this.heart.core.error.interface(this.heart, err);
			this.setDisabled();
		}
	}
};