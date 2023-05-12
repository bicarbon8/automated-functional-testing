export class FakeLocator {
    public readonly locType: string;
    public readonly input: string;
    constructor(locType: string, input: string) {
        this.locType = locType;
        this.input = input;
    }
    toString() {
        return `${this.locType}_${this.input}`;
    }
}
export module FakeLocator {
    export var fakeLocType = (input: string) => new FakeLocator('fakeLocType', input);
}