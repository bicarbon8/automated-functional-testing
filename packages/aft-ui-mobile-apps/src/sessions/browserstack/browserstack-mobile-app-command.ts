import { MobileAppCommand } from "../mobile-app-command";

export interface BrowserStackMobileAppCommand extends MobileAppCommand {
    name: 'upload' | 'networkProfile';
    data?: string | BrowserStackMobileAppUploadData | BrowserStackMobileAppNetworkData;
}

export interface BrowserStackMobileAppUploadData {
    file: string;
    customId?: string;
}

export interface BrowserStackMobileAppNetworkData {
    profile: string;
    sessionId: string;
}