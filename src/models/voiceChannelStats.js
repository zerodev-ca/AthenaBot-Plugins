const modelBuilder = require('../../../../main/core/database/modelBuilder.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const modelBuilderType = require('../../../../types/database/modelBuilder.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class voiceChannelStats extends modelBuilder {
	constructor() {
		super('voiceChannelStats', {
			guildId: String,
			channelId: String,
			totalSeconds: { type: Number, default: 0 },
			periodSeconds: { type: Number, default: 0 },
		});
	}
};