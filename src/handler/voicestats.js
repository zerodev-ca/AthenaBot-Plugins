const handler = require('../../../../main/discord/core/handler/handler.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../../../types/heart.js');
	const handlerType = require('../../../../types/discord/core/handler/handler.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class voiceStatsHandler extends handler {
	constructor(heart) {
		super(heart, 'voicestats');
	}

	formatDuration(totalSeconds) {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		if (hours <= 0 && minutes <= 0) return '<1m';
		if (hours <= 0) return `${minutes}m`;
		return `${hours}h ${minutes}m`;
	}

	getModel(name) {
		return this.heart.core.database.getModel(name).getModel();
	}

	getCache() {
		return this.heart.core.discord.core.cache.manager.get('voicestats_sessions');
	}

	sessionKey(guildId, channelId, userId) {
		return `${guildId}:${channelId}:${userId}`;
	}

	trackJoin(guildId, channelId, userId) {
		try {
			this.getCache().set(this.sessionKey(guildId, channelId, userId), Date.now());
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}

	async trackLeave(guildId, channelId, userId) {
		try {
			const cache = this.getCache();
			const key = this.sessionKey(guildId, channelId, userId);
			const joinedAt = cache.get(key);
			if (!joinedAt) return;

			cache.delete(key);
			const elapsedSeconds = Math.floor((Date.now() - joinedAt) / 1000);
			if (elapsedSeconds > 0) {
				await this.addSeconds(guildId, channelId, elapsedSeconds);
			}
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}

	async addSeconds(guildId, channelId, seconds) {
		try {
			const model = this.getModel('voiceChannelStats');
			await model.updateOne(
				{ guildId, channelId },
				{ $inc: { totalSeconds: seconds, periodSeconds: seconds } },
				{ upsert: true },
			);
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}

	async flushActiveSessions(guildId) {
		try {
			const cache = this.getCache();
			const now = Date.now();

			for (const [key, joinedAt] of cache.cache.entries()) {
				const [sessGuildId, channelId] = key.split(':');
				if (sessGuildId !== guildId) continue;

				const elapsedSeconds = Math.floor((now - joinedAt) / 1000);
				if (elapsedSeconds > 0) {
					await this.addSeconds(guildId, channelId, elapsedSeconds);
				}
				cache.set(key, now);
			}
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}

	async getOrCreateMeta(guildId) {
		try {
			const model = this.getModel('voiceStatsMeta');
			let meta = await model.findOne({ guildId });
			if (!meta) {
				meta = await model.create({ guildId, periodStart: new Date(), statsMessageId: null });
			}
			return meta;
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
			return null;
		}
	}

	async checkPeriod(guild) {
		try {
			const config = this.heart.core.discord.core.config.manager.get('voicestats').get().config;
			const periodMs = this.heart.core.util.util.ms(config.period);
			const meta = await this.getOrCreateMeta(guild.id);
			if (!meta) return;

			const periodElapsed = Date.now() - meta.periodStart.getTime() >= periodMs;
			await this.handlePeriodEnd(guild, config, meta, periodElapsed);
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}

	async handlePeriodEnd(guild, config, meta, resetPeriod = true) {
		try {
			await this.flushActiveSessions(guild.id);

			const statsModel = this.getModel('voiceChannelStats');
			const metaModel = this.getModel('voiceStatsMeta');
			const statsDocs = await statsModel.find({ guildId: guild.id });
			const statsMap = new Map(statsDocs.map((doc) => [doc.channelId, { total: doc.totalSeconds, period: doc.periodSeconds }]));

			const trackedChannelIds = config.trackedChannels.length
				? config.trackedChannels
				: [...guild.channels.cache.filter((ch) => ch.isVoiceBased()).keys()];

			const lines = [];
			const channelsMeetingThreshold = [];
			const thresholdSeconds = (config.ghostPing.thresholdMinutes ?? 0) * 60;

			for (const channelId of trackedChannelIds) {
				const channel = guild.channels.cache.get(channelId);
				if (!channel) continue;

				const seconds = statsMap.get(channelId) ?? { total: 0, period: 0 };
				const displaySeconds = config.accumulativeStats ? seconds.total : seconds.period;
				const line = config.lang.statsEmbed.channelLine
					.replace(/%channel%/g, channel.toString())
					.replace(/%duration%/g, this.formatDuration(displaySeconds));
				lines.push(line);

				if (seconds.period >= thresholdSeconds && thresholdSeconds > 0) {
					channelsMeetingThreshold.push(channel);
				}
			}

			const embed = this.heart.core.util.discord.resolveEmbed(
				{
					title: config.lang.statsEmbed.title,
					description: lines.length ? lines.join('\n') : config.lang.statsEmbed.emptyLine,
				},
				{ period: config.period },
				guild,
				null,
			);

			const statsChannelId = this.heart.core.database.config.getChannel('stats_channel');
			const statsChannel = statsChannelId ? guild.channels.cache.get(statsChannelId) : null;

			if (statsChannel) {
				let posted = false;

				if (meta.statsMessageId) {
					try {
						const existing = await statsChannel.messages.fetch(meta.statsMessageId);
						await existing.edit({ embeds: [embed] });
						posted = true;
					}
					catch {
						posted = false;
					}
				}

				if (!posted) {
					const sent = await statsChannel.send({ embeds: [embed] });
					meta.statsMessageId = sent.id;
				}

				if (resetPeriod && config.ghostPing.enabled && config.ghostPing.role) {
					for (const channel of channelsMeetingThreshold) {
						try {
							const ping = await statsChannel.send({ content: `<@&${config.ghostPing.role}> ${channel}` });
							await ping.delete();
						}
						catch (err) {
							new this.heart.core.error.interface(this.heart, err);
						}
					}
				}
			}

			if (resetPeriod) {
				if (config.accumulativeStats) {
					await statsModel.updateMany({ guildId: guild.id }, { $set: { periodSeconds: 0 } });
				}
				else {
					await statsModel.deleteMany({ guildId: guild.id });
				}
				meta.periodStart = new Date();
			}

			await metaModel.updateOne({ guildId: guild.id }, { $set: { periodStart: meta.periodStart, statsMessageId: meta.statsMessageId } });
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
		}
	}
};