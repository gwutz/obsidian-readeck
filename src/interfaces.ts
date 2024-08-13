export interface ReadeckPluginSettings {
	apiUrl: string;
	apiToken: string;
}

export const DEFAULT_SETTINGS: ReadeckPluginSettings = {
	apiUrl: "https://your-readeck-url.com",
	apiToken: ""
}
