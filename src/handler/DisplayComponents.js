const {
	ContainerBuilder,
	ButtonBuilder,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
	RoleSelectMenuBuilder,
	ChannelSelectMenuBuilder,
	MentionableSelectMenuBuilder,
} = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');

module.exports = class DisplayComponents {
	constructor(heart) {
		this.heart = heart;
	}

	resolveDisplayComponents(componentConfig, placeholders = {}, guild = null, user = null) {
		const all = this.buildPlaceholders(placeholders, guild, user);
		const components = (componentConfig.ComponentsV2?.Components ?? [])
			.filter(c => String(c?.Type ?? '').toLowerCase().replace(/[\s-]+/g, '_') === 'container')
			.map((c, i) => this.buildContainer(c, i, all).toJSON());
		return { components };
	}

	buildContainerFromConfig(config, placeholders = {}, guild = null, user = null) {
		const all = this.buildPlaceholders(placeholders, guild, user);
		const container = (config.ComponentsV2?.Components ?? [])
			.find(c => String(c?.Type ?? '').toLowerCase().replace(/[\s-]+/g, '_') === 'container');
		return container ? this.buildContainer(container, 0, all) : null;
	}

	buildContainer(config, index, placeholders = {}) {
		const builder = new ContainerBuilder();

		builder.setAccentColor(this.parseColor(this.fill(config.AccentColor, placeholders)));
		if (config.Spoiler) builder.setSpoiler(true);

		for (const component of config.Components ?? []) {
			this.addComponent(builder, component, placeholders);
		}

		return builder;
	}

	addComponent(builder, component, placeholders = {}) {
		const type = String(component?.Type ?? '').toLowerCase().replace(/[\s-]+/g, '_');

		switch (type) {
			case 'section':
				return this.addSection(builder, component, placeholders);
			case 'text_display':
			case 'text':
			case 'textdisplay':
				return this.addTextDisplay(builder, component, placeholders);
			case 'separator':
			case 'divider':
				return this.addSeparator(builder, component);
			case 'file':
				return this.addFile(builder, component, placeholders);
			case 'media_gallery':
			case 'mediagallery':
			case 'gallery':
				return this.addMediaGallery(builder, component, placeholders);
			case 'action_row':
			case 'actionrow':
			case 'buttons':
				return this.addActionRow(builder, component, placeholders);
		}
	}

	addTextDisplay(builder, component, placeholders) {
		const content = this.text(component?.Content, placeholders);
		if (!content) return;
		builder.addTextDisplayComponents(t => t.setContent(content));
	}

	addSection(builder, component, placeholders) {
		const accessory = component.Accessory;

		if (!accessory?.Type) {
			return this.addTextDisplay(builder, { Content: component.Text?.Content }, placeholders);
		}

		builder.addSectionComponents(section => {
			section.addTextDisplayComponents(t => t.setContent(this.text(component.Text?.Content, placeholders)));

			const accessoryType = String(accessory.Type).toLowerCase().replace(/[\s-]+/g, '_');

			if (accessoryType === 'thumbnail') {
				const url = accessory.Media?.URL ?? accessory.Media?.Url;
				if (url) section.setThumbnailAccessory(t => t.setURL(this.text(url, placeholders)));
			} else if (accessoryType === 'button') {
				section.setButtonAccessory(button => this.applyButton(button, accessory, placeholders));
			}

			return section;
		});
	}

	addSeparator(builder, component) {
		builder.addSeparatorComponents(s => {
			s.setDivider(!!component.Divider);
			const spacing = String(component.Spacing).toLowerCase();
			if (spacing === 'small') s.setSpacing(1);
			else if (spacing === 'large') s.setSpacing(2);
			return s;
		});
	}

	addFile(builder, component, placeholders) {
		const url = component.URL ?? component.Url;
		if (!url) return;
		builder.addFileComponents(f => {
			f.setURL(this.text(url, placeholders));
			if (component.Spoiler) f.setSpoiler(true);
			return f;
		});
	}

	addMediaGallery(builder, component, placeholders) {
		const items = (component.Items ?? []).filter(item => item?.URL ?? item?.Url);
		if (!items.length) return;

		builder.addMediaGalleryComponents(gallery => {
			for (const item of items) {
				gallery.addItems(media => {
					media.setURL(this.text(item.URL ?? item.Url, placeholders));
					if (item.Description) media.setDescription(this.text(item.Description, placeholders));
					if (item.Spoiler) media.setSpoiler(true);
					return media;
				});
			}
			return gallery;
		});
	}

	addActionRow(builder, component, placeholders) {
		const children = [];

		for (const child of component.Components ?? []) {
			const type = String(child?.Type ?? '').toLowerCase().replace(/[\s-]+/g, '_');

			if (type === 'button') {
				children.push(this.applyButton(new ButtonBuilder(), child, placeholders));
				continue;
			}

			let select = null;
			if (type === 'string_select' || type === 'stringselect' || type === 'select' || type === 'selectmenu') select = new StringSelectMenuBuilder();
			else if (type === 'user_select' || type === 'userselect') select = new UserSelectMenuBuilder();
			else if (type === 'role_select' || type === 'roleselect') select = new RoleSelectMenuBuilder();
			else if (type === 'channel_select' || type === 'channelselect') select = new ChannelSelectMenuBuilder();
			else if (type === 'mentionable_select' || type === 'mentionableselect') select = new MentionableSelectMenuBuilder();
			if (!select) continue;

			if (child.CustomId) select.setCustomId(this.text(child.CustomId, placeholders));
			if (child.Placeholder) select.setPlaceholder(this.text(child.Placeholder, placeholders));
			if (child.MinValues != null) select.setMinValues(Number(child.MinValues));
			if (child.MaxValues != null) select.setMaxValues(Number(child.MaxValues));
			if (child.Disabled) select.setDisabled(true);

			if (select instanceof StringSelectMenuBuilder) {
				const options = [];
				for (const option of child.Options ?? []) {
					if (option?.Label == null || option?.Value == null) continue;
					const resolved = { label: this.text(option.Label, placeholders), value: String(option.Value) };
					if (option.Description) resolved.description = this.text(option.Description, placeholders);
					if (option.Default) resolved.default = true;
					const emoji = this.resolveComponentEmoji(option.Emoji, placeholders);
					if (emoji) resolved.emoji = emoji;
					options.push(resolved);
				}
				if (options.length) select.addOptions(options);
			}

			children.push(select);
		}

		if (!children.length) return;
		builder.addActionRowComponents(row => row.addComponents(...children));
	}

	applyButton(button, config, placeholders) {
		if (config.Label != null) button.setLabel(this.text(config.Label, placeholders));

		const url = config.URL ?? config.Url;
		if (url) {
			button.setStyle(ButtonStyle.Link).setURL(this.text(url, placeholders));
		} else {
			const style = String(config.Style ?? 'primary').toLowerCase();
			if (style === 'secondary' || style === 'grey' || style === 'gray') this.heart.core.util.discord.convertButtonColor(button, 'gray');
			else if (style === 'success' || style === 'green') this.heart.core.util.discord.convertButtonColor(button, 'green');
			else if (style === 'danger' || style === 'red') this.heart.core.util.discord.convertButtonColor(button, 'red');
			else this.heart.core.util.discord.convertButtonColor(button, 'blue');
			if (config.CustomId) button.setCustomId(this.text(config.CustomId, placeholders));
		}

		if (config.Emoji) {
			const emoji = this.resolveComponentEmoji(config.Emoji, placeholders);
			if (emoji) button.setEmoji(emoji);
		}

		if (config.Disabled) button.setDisabled(true);
		return button;
	}

	buildPlaceholders(custom = {}, guild = null, user = null) {
		const now = new Date();
		const result = { ...custom };

		if (user) {
			Object.assign(result, {
				user: user.username,
				userName: user.username,
				userDisplay: user.displayName,
				userId: user.id,
				userMention: `<@${user.id}>`,
				userAvatar: user.displayAvatarURL({ dynamic: true, size: 256 }),
				userCreated: user.createdAt.toLocaleDateString(),
			});
		}

		if (guild) {
			Object.assign(result, {
				guild: guild.name,
				guildName: guild.name,
				guildId: guild.id,
				guildIcon: guild.iconURL({ dynamic: true, size: 256 }),
				memberCount: guild.memberCount,
				memberCountNumeric: guild.memberCount,
			});
		}

		Object.assign(result, {
			currentDate: now.toLocaleDateString(),
			currentTime: now.toLocaleTimeString(),
			currentDatetime: now.toLocaleString(),
		});

		return result;
	}

	fill(text, placeholders) {
		return this.heart.core.util.discord.resolvePlaceholder(text, placeholders);
	}

	text(value, placeholders) {
		const resolved = this.fill(value, placeholders);
		return resolved == null ? '' : String(resolved);
	}

	parseColor(color) {
		if (!color) return 0;
		const resolved = this.heart.core.util.discord.resolveColors(String(color));
		if (!resolved) return 0;
		const numeric = parseInt(String(resolved).replace('#', ''), 16);
		return Number.isNaN(numeric) ? 0 : numeric;
	}

	parseEmoji(emoji) {
		if (!emoji) return null;
		if (typeof emoji === 'object' && (emoji.id || emoji.name)) return emoji;

		const str = String(emoji);
		const custom = str.match(/<a?:[^:]+:(\d+)>/);
		if (custom) return { id: custom[1] };
		if (/^\d+$/.test(str)) return { id: str };
		if (/\p{Emoji}/u.test(str)) return str;

		return null;
	}

	resolveComponentEmoji(value, placeholders) {
		const emoji = this.parseEmoji(this.fill(value, placeholders));
		if (!emoji) return null;
		return typeof emoji === 'string' ? { name: emoji } : emoji;
	}
};
