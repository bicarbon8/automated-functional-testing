import { RetryBackOffType } from "aft-core";

export type UiElementOptions = {
    locator: unknown;
    maxWaitMs?: number;
    retryDelayMs?: number;
    retryDelayBackOff?: RetryBackOffType;
};