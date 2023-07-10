import { JsonObject } from "aft-core";
import { ICanHaveKeyValue } from "./ican-have-key-value";
import { XmlDocument, XmlNode, XmlCDataNode, XmlElement, XmlTextNode } from "xmldoc";

export module XML {
    function parseText(sValue: any) {
        if (/^\s*$/.test(sValue)) { return null; }
        if (/^(?:true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
        if (isFinite(sValue)) { return parseFloat(sValue); }
        if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
        return sValue;
    }
      
    export function toObject<T extends JsonObject>(oXMLParent: Document | Element | DocumentFragment): T {
        const vResult: ICanHaveKeyValue = {};
        let nLength: number = 0;
        let sCollectedTxt: string = "";
        let oXMLParentElement: Element = oXMLParent as Element;
        if (oXMLParentElement?.hasAttributes && oXMLParentElement?.attributes && oXMLParentElement?.hasAttributes()) {
            for (nLength; nLength < oXMLParentElement.attributes.length; nLength++) {
                let oAttrib = oXMLParentElement.attributes.item(nLength);
                vResult["@" + oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
            }
        }
        if (oXMLParent.hasChildNodes()) {
            for (let oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
                oNode = oXMLParent.childNodes.item(nItem);
                if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is "CDATASection" (4) */
                else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is "Text" (3) */
                else if (oNode.nodeType === 1 && !oNode.prefix) { /* nodeType is "Element" (1) */
                    sProp = oNode.nodeName.toLowerCase();
                    vContent = toObject(oNode);
                    if (vResult.hasOwnProperty(sProp)) {
                        if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
                        vResult[sProp].push(vContent);
                    } else { vResult[sProp] = vContent; nLength++; }
                }
            }
        }
        if (sCollectedTxt) { vResult.keyValue = parseText(sCollectedTxt); }
        
        return vResult as T;
    }

    export function fromString<T extends JsonObject>(xml: string): T {
        const xmlDoc = new XmlDocument(xml);
        const obj = {};
        fromXmlNode(xmlDoc, obj);
        return obj as T;
    }

    function fromXmlNode(xml: XmlNode, current: JsonObject): void {
        switch (xml.type) {
            case 'element':
                fromElement(xml, current);
                break;
            case 'cdata':
                current['keyValue'] = parseText((xml as XmlCDataNode).cdata);
                break;
            case 'text':
                current['keyValue'] = parseText((xml as XmlTextNode).text);
                break;
            case 'comment':
            default:
                /* ignore */
                break;
        }
    }

    function fromElement(element: XmlElement, parent: JsonObject): void {
        if (element.name) {
            const n = element.name;
            parent[n] = {};
            if (element.attr) {
                const attributeKeys = Object.keys(element.attr)
                if (attributeKeys.length) {
                    for (let aKey of attributeKeys) {
                        parent[n][`@${aKey}`] = parseText(element.attr[aKey].trim());
                    }
                }
            }
            if (element.val) {
                const v = element.val;
                parent[n]['keyValue'] = parseText(v);
            }
            if (element.children?.length) {
                for (let child of element.children) {
                    fromXmlNode(child, parent[n]);
                }
            }
        }
    }
}