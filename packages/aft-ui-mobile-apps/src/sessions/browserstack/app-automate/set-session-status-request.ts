export interface SetSessionStatusRequest {
    sessionId: string;
    status: 'passed' | 'failed';
    message?: string;
}