import { MobileAppCommand } from "../mobile-app-command";

export interface BrowserStackMobileAppCommand extends MobileAppCommand {
    name: 'upload' | 'networkProfile';
    data?: string;
    customId?: string;
}