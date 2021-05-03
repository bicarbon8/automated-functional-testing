import { XML } from "../../src";
import { DOMParser } from 'xmldom';

describe('XML', () => {
    it('can parse XML string to JSON object', () => {
        let xmlStr: string = '<xml><image src="./foo/bar">fake photo</image><hr /><span style="colour:#ff6060">Do Work</span></xml>';
        let document: Document = new DOMParser().parseFromString(xmlStr, 'text/xml');
        
        let jsonObj: Sample = XML.toObject<Sample>(document);

        expect(jsonObj).toBeDefined();
        expect(jsonObj.xml).toBeDefined();
        expect(jsonObj.xml.image).toBeDefined();
        expect(jsonObj.xml.image["@src"]).toBe('./foo/bar');
        expect(jsonObj.xml.image.keyValue).toBe('fake photo');
        expect(jsonObj.xml.hr).toBeDefined();
        expect(jsonObj.xml.span).toBeDefined();
        expect(jsonObj.xml.span["@style"]).toBe('colour:#ff6060');
        expect(jsonObj.xml.span.keyValue).toBe('Do Work');
    });
});

interface Sample {
    xml: SampleXml;
}

interface SampleXml {
    image: SampleXmlImage;
    hr: SampleXmlHr;
    span: SampleXmlSpan;
}

interface SampleXmlImage {
    '@src': string;
    keyValue: string;
}

interface SampleXmlHr {

}

interface SampleXmlSpan {
    "@style": string;
    keyValue: string;
}