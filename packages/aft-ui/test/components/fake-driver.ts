import { FakeElement } from "./fake-element";
import { FakeLocator } from "./fake-locator";

export class FakeDriver {
    findFakeElement(locator: FakeLocator): Promise<FakeElement> {
        return null;
    }
}