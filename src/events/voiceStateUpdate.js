const event = require('../../../../main/discord/core/events/event.js');
const { Events } = require('discord.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../../../types/heart.js');
	const eventType = require('../../../../types/discord/core/events/event.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class voiceStateUpdate extends event {
	constructor(heart) {
		super(heart, { name: 'voicestats_voiceStateUpdate', event: { discord: Events.VoiceStateUpdate, bypassManager: false, dm: false, bypassRestrictions: true, permissionLevel: null } });
	}

	async execute(oldState, newState) {
		try {
			if (newState.member?.user?.bot) return;

			const oldChannelId = oldState.channelId;
			const newChannelId = newState.channelId;
			if (oldChannelId === newChannelId) return;

			const handler = this.heart.core.discord.core.handler.manager.get('voicestats');
			const guildId = newState.guild.id;
			const userId = newState.id;

			if (oldChannelId) await handler.trackLeave(guildId, oldChannelId, userId);
			if (newChannelId) handler.trackJoin(guildId, newChannelId, userId);
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}
};