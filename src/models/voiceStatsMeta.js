const modelBuilder = require('../../../../main/core/database/modelBuilder.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
    const modelBuilderType = require('../../../../types/database/modelBuilder.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class voiceStatsMeta extends modelBuilder {
    constructor() {
        super('voiceStatsMeta', {
            guildId: { type: String, unique: true },
            periodStart: Date,
            statsMessageId: String,
        });
    }
};