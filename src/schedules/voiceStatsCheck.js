const scheduledTask = require('../../../../main/discord/core/schedule/schedule.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../../../types/heart.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class voiceStatsCheck extends scheduledTask {
	constructor(heart) {
		const voiceStatsConfig = heart.core.discord.core.config.manager.get('voicestats').get();
		const intervalMs = voiceStatsConfig.config.checkIntervalMinutes * 60 * 1000;

		super(heart, 'voicestats_check', { repeat: true, interval: intervalMs });
	}

	async execute() {
		try {
			const handler = this.heart.core.discord.core.handler.manager.get('voicestats');
			const guilds = this.heart.core.discord.guilds.cache;

			for (const guild of guilds.values()) {
				await handler.checkPeriod(guild);
			}
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}
};