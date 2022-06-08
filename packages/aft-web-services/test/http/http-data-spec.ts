import { httpData, HttpResponse } from "../../src";

describe('HttpData', () => {
    it('can deserialise JSON data to Typed JavaScript object', () => {
        let response: HttpResponse = {
            data: '{"bar":"sample", "baz":2}'
        };

        let foo: Foo = httpData.as<Foo>(response);

        expect(foo).toBeDefined();
        expect(foo.bar).toEqual('sample');
        expect(foo.baz).toEqual(2);
    });

    it('can deserialise XML data to Document object', () => {
        let response: HttpResponse = {
            headers: {"content-type": "text/xml"},
            data: '<foo><bar>sample</bar><baz>2</baz></foo>'
        };

        let yop: Yop = httpData.as<Yop>(response);

        expect(yop).toBeDefined();
        expect(yop.foo.bar).toEqual('sample');
        expect(yop.foo.baz).toEqual(2);
    });
});

type Foo = {
    bar: string;
    baz: number;
}

type Yop = {
    foo: Foo;
}