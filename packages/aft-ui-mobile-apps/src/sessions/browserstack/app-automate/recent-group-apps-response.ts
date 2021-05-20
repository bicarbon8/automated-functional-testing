export interface RecentGroupAppsResponse {
    apps: BrowserStackMobileApp[];
}

export interface BrowserStackMobileApp {
    app_name?: string;
    app_version?: string;
    app_url?: string;
    app_id?: string;
    uploaded_at?: string;
    custom_id?: string;
    shareable_id?: string;
}