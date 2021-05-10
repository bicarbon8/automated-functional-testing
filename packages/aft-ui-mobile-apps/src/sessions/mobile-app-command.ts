export interface MobileAppCommand {
    name: string;
    data?: any;
}

export interface MobileAppCommandResponse extends MobileAppCommand {
    error?: string;
}