import {App, PluginSettingTab, Setting} from "obsidian";

import ReadeckPlugin from "./readeckPlugin";

export class ReadeckSettingTab extends PluginSettingTab {
	plugin: ReadeckPlugin;

	constructor(app: App, plugin: ReadeckPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Readeck Integration Settings' });

		new Setting(containerEl)
		.setName('API URL')
		.setDesc('The base URL of your Readeck instance')
		.addText(text => text
		.setPlaceholder('Enter your API URL')
		.setValue(this.plugin.settings.apiUrl)
		.onChange(async (value) => {
			this.plugin.settings.apiUrl = value;
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName('API Token')
		.setDesc('Your Readeck API token')
		.addText(text => text
		.setPlaceholder('Enter your API token')
		.setValue(this.plugin.settings.apiToken)
		.onChange(async (value) => {
			this.plugin.settings.apiToken = value;
			await this.plugin.saveSettings();
		}));
	}
}
