import { HtmlTestResult } from "./html-test-result";

export type HtmlResult = {
    description: string;
    tests: HtmlTestResult[];
};