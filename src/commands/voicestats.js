const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const command = require('../../../../main/discord/core/commands/command.js');

/* eslint-disable no-unused-vars, no-constant-condition */
if (null) {
    const heartType = require('../../../../types/heart.js');
    const commandType = require('../../../../types/discord/core/commands/commands.js');
    const { CommandInteraction } = require('discord.js');
}
/* eslint-enable no-unused-vars, no-constant-condition  */

module.exports = class voicestats extends command {
    constructor(heart) {
        const voiceStatsConfig = heart.core.discord.core.config.manager.get('voicestats').get();

        super(heart, {
            name: 'voicestats',
            data: new SlashCommandBuilder()
                .setName('voicestats')
                .setDescription('Voice channel stats')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('forceupdate')
                        .setDescription('End the current period now, post final stats, and reset'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('preview')
                        .setDescription('Preview current period stats without resetting anything'),
                ),
            contextMenu: false,
            global: true,
            category: 'general',
            bypass: true,
            permissionLevel: voiceStatsConfig.config.permissions.voicestats_command,
        });
    }

    async execute(interaction, langConfig) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const handler = this.heart.core.discord.core.handler.manager.get('voicestats');
            const config = this.heart.core.discord.core.config.manager.get('voicestats').get().config;

            switch (interaction.options.getSubcommand()) {
                case 'forceupdate': {
                    const meta = await handler.getOrCreateMeta(interaction.guild.id);
                    if (meta) {
                        await handler.handlePeriodEnd(interaction.guild, config, meta, true);
                    }
                    const embed = this.heart.core.util.discord.resolveEmbed(config.lang.commandReplies.periodEnded, null, interaction.guild, interaction.user);
                    await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    break;
                }
                case 'preview': {
                    const meta = await handler.getOrCreateMeta(interaction.guild.id);
                    if (meta) {
                        await handler.handlePeriodEnd(interaction.guild, config, meta, false);
                    }
                    const embed = this.heart.core.util.discord.resolveEmbed(config.lang.commandReplies.previewPosted, null, interaction.guild, interaction.user);
                    await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    break;
                }
            }
        }
        catch (err) {
            this.heart.core.console.log(this.heart.core.console.type.error, `An issue occured while executing command ${this.getName()}`);
            new this.heart.core.error.interface(this.heart, err);
            interaction.editReply({ embeds: [this.heart.core.util.discord.generateErrorEmbed(langConfig.lang.unexpected_command_error.replace(/%command%/g, `/${interaction.commandName}`))], flags: MessageFlags.Ephemeral });
        }
    }
};