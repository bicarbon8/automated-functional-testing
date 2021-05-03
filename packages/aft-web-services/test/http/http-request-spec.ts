import { HttpRequest } from "../../src/http/http-request";

describe('HttpRequest', () => {
    it('can set the url property', () => {
        let request: HttpRequest = {
            url: 'http://127.0.0.1'
        };

        expect(request.url).toEqual('http://127.0.0.1');

        let expectedUrl: string = 'http://some.fake.ie';
        request.url = expectedUrl;

        expect(request.url).toEqual(expectedUrl);
    });
});