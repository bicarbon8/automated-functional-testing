import { XML } from "../../src";

describe('XML', () => {
    it('can parse XML string to JSON object', () => {
        let xmlStr: string = '<xml><image src="./foo/bar">fake photo</image><hr /><span style="colour:#ff6060" class="hidden rounded">Do Work</span></xml>';
        let jsonObj: Sample = XML.fromString<Sample>(xmlStr);

        expect(jsonObj).toBeDefined();
        expect(jsonObj.xml).toBeDefined();
        expect(jsonObj.xml.image).toBeDefined();
        expect(jsonObj.xml.image["@src"]).toBe('./foo/bar');
        expect(jsonObj.xml.image.keyValue).toBe('fake photo');
        expect(jsonObj.xml.hr).toBeDefined();
        expect(jsonObj.xml.span).toBeDefined();
        expect(jsonObj.xml.span["@style"]).toBe('colour:#ff6060');
        expect(jsonObj.xml.span["@class"]).toBe('hidden rounded');
        expect(jsonObj.xml.span.keyValue).toBe('Do Work');
    });
});

type Sample = {
    xml: SampleXml;
};

type SampleXml = {
    image: SampleXmlImage;
    hr: SampleXmlHr;
    span: SampleXmlSpan;
};

type SampleXmlImage = {
    '@src': string;
    keyValue: string;
};

type SampleXmlHr = {

};

type SampleXmlSpan = {
    "@style": string;
    keyValue: string;
};