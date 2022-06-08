import { fileio } from "../../src";

describe('fileio', () => {
    describe('readAs<T extends JsonObject>', () => {
        it('can parse a json file', () => {
            let packageJson: PackageJson = fileio.readAs<PackageJson>('package.json');
    
            expect(packageJson.name).toMatch(/(aft-)[a-z\-]+/);
        });

        it('returns a meaningful error if file is not found', () => {
            const log = console.log;
            console.log = () => { /* do nothing */ }
            const notExist: string = 'doesnotexist.json';
            try {
                const obj = fileio.readAs<object>(notExist);
                expect(obj).toBeUndefined();
            } catch(e) {
                expect(e).not.toBeNull();
                expect(e.message).toContain(`ENOENT: no such file or directory, stat '${notExist}'`);
                expect(e.message).toContain(notExist);
            } finally {
                console.log = log;
            }
        });

        it('returns a meaningful error if file is not valid JSON', () => {
            const notJson: string = 'LICENSE';
            try {
                const obj = fileio.readAs<object>(notJson);
                expect(obj).toBeUndefined();
            } catch(e) {
                expect(e).not.toBeNull();
                expect(e.message).toContain('Unexpected identifier');
            }
        });
    });
});

class PackageJson {
    name: string;
    version: string;
    description: string;
}