const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const command = require('../../../../main/discord/core/commands/command.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
	const heartType = require('../../../../types/heart.js');
	const commandType = require('../../../../types/discord/core/commands/commands.js');
	const { CommandInteraction } = require('discord.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class test extends command {
	constructor(heart, cmdConfig) {
		super(heart, {
			name: 'guildlocker',
			data: new SlashCommandBuilder()
				.setName('guildlocker')
				.setDescription('Lockdown your guild')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('toggle')
						.setDescription('Toggle guild lockdown')
						.addStringOption((option) => option.setName('target').setDescription('Which lockdown options?').setRequired(true).addChoices(
							{ name: 'DMs', value: 'dms' },
							{ name: 'Invites', value: 'invites' },
							{ name: 'Both', value: 'both' },
						)),
				),
			contextMenu: false,
			global: true,
			category: 'general',
			bypass: true,
			permissionLevel: heart.core.discord.core.config.manager.get('guildlocker').get().config.permissions.guildlocker,
		});
	}

	async execute(interaction, langConfig) {
		try {
			let log;
			const target = interaction.options.getString('target');

			switch (interaction.options.getSubcommand()) {
				case 'toggle': {
					log = await this.heart.core.discord.core.handler.manager.get('guildlocker').lockdown(interaction.guild, target);
					break;
				}
			}

			const placeholders = {
				'action': target,
				'final': log,
			}
			const embed = this.heart.core.util.discord.resolveEmbed(this.heart.core.discord.core.config.manager.get('guildlocker').get().config.lang.successful_toggle, placeholders, interaction.guild, interaction.user);
			interaction.reply({ embeds: [embed] });
		}
		catch (err) {
			this.heart.core.console.log(this.heart.core.console.type.error, `An issue occured while executing command ${this.getName()}`);
			new this.heart.core.error.interface(this.heart, err);
			interaction.reply({ embeds: [this.heart.core.util.discord.generateErrorEmbed(langConfig.lang.unexpected_command_error.replace(/%command%/g, `/${interaction.commandName}`))], flags: MessageFlags.Ephemeral });
		}
	}
};