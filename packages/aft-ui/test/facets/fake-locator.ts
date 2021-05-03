export class FakeLocator {
    readonly using: string;
    readonly value: string;
    constructor(using: string, value: string) {
        this.using = using;
        this.value = value;
    }
    static css(value: string): FakeLocator {
        return new FakeLocator('css', value);
    }
    static id(value: string): FakeLocator {
        return new FakeLocator('id', value);
    }
    static xpath(value: string): FakeLocator {
        return new FakeLocator('xpath', value);
    }
    static magic(value: string): FakeLocator {
        return new FakeLocator('magic', value);
    }
}