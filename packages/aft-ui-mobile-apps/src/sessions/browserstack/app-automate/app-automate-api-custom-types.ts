export type RecentGroupAppsResponse = {
    apps: BrowserStackMobileApp[];
};

export type BrowserStackMobileApp = {
    app_name?: string;
    app_version?: string;
    app_url?: string;
    app_id?: string;
    uploaded_at?: string;
    custom_id?: string;
    shareable_id?: string;
};

export type SetSessionStatusRequest = {
    sessionId: string;
    status: 'passed' | 'failed';
    message?: string;
};

export type UploadRequest = {
    file?: string;
    custom_id?: string;
};

export type UploadResponse = {
    app_url: string;
    custom_id: string;
    shareable_id: string;
};