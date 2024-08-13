import {Notice, Plugin, requestUrl, TFile} from "obsidian";
import {DEFAULT_SETTINGS, ReadeckPluginSettings} from "./interfaces";
import {ReadeckSettingTab} from "./readeckSettingTab";

export default class ReadeckPlugin extends Plugin {
	settings: ReadeckPluginSettings;

	async onload() {
		console.log('Loading Readeck Plugin');

		await this.loadSettings();

		this.addSettingTab(new ReadeckSettingTab(this.app, this));

		// Add a command to fetch and create notes
		this.addCommand({
			id: 'fetch-readeck-data',
			name: 'Fetch Readeck Data',
			callback: () => this.fetchReadeckData(),
		});
	}

	async fetchReadeckData() {
		const response = await requestUrl({
			url: `${this.settings.apiUrl}/api/bookmarks`,
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${this.settings.apiToken}`
			}
		});
		const bookmarks = await response.json;

		const bookmarksWithAnnotations = [];
		for (const bookmark of bookmarks) {
			const annotationResponse = await requestUrl({
				url: `${this.settings.apiUrl}/api/bookmarks/${bookmark.id}/annotations`,
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${this.settings.apiToken}`
				}
			});
			const annotations = await annotationResponse.json;
			if (annotations.length > 0) {
				bookmarksWithAnnotations.push({
					...bookmark,
					annotations
				});
			}
		}

		// Process and create notes from the fetched data
		await this.createOrMergeNotesFromBookmarks(bookmarksWithAnnotations);
	}

	async createOrMergeNotesFromBookmarks(data: any[]) {
		// check if the Readeck folder exists
		const readeckFolder = this.app.vault.getAbstractFileByPath('Readeck');
		if (!readeckFolder) {
			await this.app.vault.createFolder('Readeck');
		}

		for (const bookmark of data) {
			const sanitizedFileName = sanitizeFileName(bookmark.title);
			const notePath = `Readeck/${sanitizedFileName}.md`;

			const existingFile = this.app.vault.getAbstractFileByPath(notePath);
			let existingContent = '';

			if (existingFile && existingFile instanceof TFile) {
				existingContent = await this.app.vault.read(existingFile);
			}

			const existingAnnotations = extractAnnotationsFromContent(existingContent);

			const newAnnotations = bookmark.annotations.filter((ann: any) =>
				!existingAnnotations.includes(ann.text)
			);

			if (newAnnotations.length > 0) {
				// Append new annotations to the content
				const annotationsContent = newAnnotations.map((ann: any) => `> ${ann.text}`).join('\n\n');
				const updatedContent = `${existingContent}\n\n## New Annotations\n${annotationsContent}`;

				if (existingFile && existingFile instanceof TFile) {
					await this.app.vault.modify(existingFile, updatedContent);
					new Notice(`Updated note: ${bookmark.title}`);
				} else {
					await this.app.vault.create(notePath, updatedContent);
					new Notice(`Created note: ${bookmark.title}`);
				}
			} else {
				new Notice(`No new annotations for: ${bookmark.title}`);
			}
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function sanitizeFileName(fileName: string): string {
	// Replace illegal characters with an underscore or a safe character
	return fileName
	.replace(/[<>:"/\\|?*]/g, '_')  // Replace illegal characters on Windows
	.replace(/[\x00-\x1F\x80-\x9F]/g, '')  // Remove control characters
	.replace(/^\.+$/, '')  // Avoid names like "." or ".."
	.replace(/^\s+|\s+$/g, '')  // Trim leading/trailing spaces
	.replace(/[\s.]+$/, '')  // Remove trailing spaces or periods
	.substring(0, 255);  // Limit filename length
}

function extractAnnotationsFromContent(content: string): string[] {
	const annotationLines = content.match(/^> .+/gm);
	return annotationLines ? annotationLines.map(line => line.substring(2).trim()) : [];
}
