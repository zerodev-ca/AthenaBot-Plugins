const handler = require('../../../../main/discord/core/handler/handler.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../../../types/heart.js');
	const handlerType = require('../../../../types/discord/core/handler/handler.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class guildHandler extends handler {
	constructor(heart) {
		super(heart, 'guildlocker');
	}

	async lockdown(guild, action) {
		try {
			let log;
			const invitesActive = guild.incidentsData?.invitesDisabledUntil && guild.incidentsData.invitesDisabledUntil > Date.now();
			const dmsActive = guild.incidentsData?.dmsDisabledUntil && guild.incidentsData.dmsDisabledUntil > Date.now();

			switch (action) {
				case "invites":
					if (invitesActive) {
						await guild.setIncidentActions({
							invitesDisabledUntil: null,
							dmsDisabledUntil: guild.incidentsData?.dmsDisabledUntil ?? null,
						});
						log = "off";
					} else {
						await guild.setIncidentActions({
							invitesDisabledUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
							dmsDisabledUntil: guild.incidentsData?.dmsDisabledUntil ?? null,
						});
						log = "on";
					}
					break;

				case "dms":
					if (dmsActive) {
						await guild.setIncidentActions({
							invitesDisabledUntil: guild.incidentsData?.invitesDisabledUntil ?? null,
							dmsDisabledUntil: null,
						});
						log = "off";
					} else {
						await guild.setIncidentActions({
							invitesDisabledUntil: guild.incidentsData?.invitesDisabledUntil ?? null,
							dmsDisabledUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
						});
						log = "on";
					}
					break;

				case "both":
					if (invitesActive || dmsActive) {
						await guild.setIncidentActions({
							invitesDisabledUntil: null,
							dmsDisabledUntil: null,
						});
						log = "off";
					} else {
						await guild.setIncidentActions({
							invitesDisabledUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
							dmsDisabledUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
						});
						log = "on";
					}
					break;

				default:
					throw new Error(`Unknown lockdown action: ${action}`);
			}

			return log;
		}
		catch (err) {
			new this.heart.core.error.interface(this.heart, err);
			throw err;
		}
	}
};