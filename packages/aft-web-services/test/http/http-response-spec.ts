import { HttpResponse } from "../../src";

describe('HttpResponse', () => {
    it('can deserialise JSON data to Typed JavaScript object', () => {
        let response: HttpResponse = new HttpResponse({
            data: '{"bar":"sample", "baz":2}'
        });

        let foo: Foo = response.dataAs<Foo>();

        expect(foo).toBeDefined();
        expect(foo.bar).toEqual('sample');
        expect(foo.baz).toEqual(2);
    });

    it('can deserialise XML data to Document object', () => {
        let response: HttpResponse = new HttpResponse({
            headers: {"content-type": "text/xml"},
            data: '<foo><bar>sample</bar><baz>2</baz></foo>'
        });

        let yop: Yop = response.dataAs<Yop>();

        expect(yop).toBeDefined();
        expect(yop.foo.bar).toEqual('sample');
        expect(yop.foo.baz).toEqual(2);
    });
});

class Foo {
    bar: string;
    baz: number;
}

class Yop {
    foo: Foo;
}