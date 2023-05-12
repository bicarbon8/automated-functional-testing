export class TestDataHelper {
    private readonly _data: Map<string, any>;

    constructor() {
        this._data = new Map<string, any>();
    }

    set(key: string, val: any) {
        this._data.set(key, val);
    }

    get<T>(key: string): T {
        return this._data.get(key) as T;
    }

    reset(): void {
        this._data.clear();
    }
}

export const testdata = new TestDataHelper();