import { JsonObject } from "aft-core";
import { ICanHaveKeyValue } from "./ican-have-key-value";
import { XmlDocument, XmlNode, XmlCDataNode, XmlElement, XmlTextNode } from "xmldoc";

export class XML {
    /**
     * converts a passed in XML object into a Javascript object
     * 
     * XML to object deserialisation will use the following rules:
     * - element names become property names
     * - attributes become properties preceeded by an `@` symbol inside the element object
     * - element text content is rendered in a special property named `keyValue`
     * 
     * *Ex:*
     * ```xml
     * <html>
     *     <image src="./foo/bar/baz.jpg" />
     *     <hr />
     *     <span style="color:#808080" class="hidden rounded">
     *         This is coloured
     *     </span>
     * </html>
     * ```
     * will become:
     * ```json
     * {
     *     "html": {
     *         "image": {
     *             "@src": "./foo/bar/baz.jpg",
     *         },
     *         "hr": {},
     *         "span": {
     *             "@style": "color:#808080",
     *             "@class": "hidden rounded",
     *             "keyValue": "This is coloured"
     *         }
     *     }
     * }
     * ```
     * @param oXMLParent an XML Document, Element or DocumentFragment to be converted
     * into a Javascript Object
     * @returns a Javascript Object representation of the passed in XML object
     */
    static toObject<T extends JsonObject>(oXMLParent: Document | Element | DocumentFragment): T {
        const vResult: ICanHaveKeyValue = {};
        let nLength: number = 0;
        let sCollectedTxt: string = "";
        let oXMLParentElement: Element = oXMLParent as Element;
        if (oXMLParentElement?.hasAttributes && oXMLParentElement?.attributes && oXMLParentElement?.hasAttributes()) {
            for (nLength; nLength < oXMLParentElement.attributes.length; nLength++) {
                const oAttrib = oXMLParentElement.attributes.item(nLength);
                vResult["@" + oAttrib.name.toLowerCase()] = XML._parseText(oAttrib.value.trim());
            }
        }
        if (oXMLParent.hasChildNodes()) {
            for (let oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
                oNode = oXMLParent.childNodes.item(nItem);
                if (oNode.nodeType === 4) { /* nodeType is "CDATASection" (4) */
                    sCollectedTxt += oNode.nodeValue;
                }
                else if (oNode.nodeType === 3) {  /* nodeType is "Text" (3) */
                    sCollectedTxt += oNode.nodeValue.trim();
                }
                else if (oNode.nodeType === 1 && !oNode.prefix) { /* nodeType is "Element" (1) */
                    sProp = oNode.nodeName.toLowerCase();
                    vContent = XML.toObject(oNode);
                    if (vResult.hasOwnProperty(sProp)) {
                        if (vResult[sProp].constructor !== Array) {
                            vResult[sProp] = [vResult[sProp]];
                        }
                        vResult[sProp].push(vContent);
                    } else {
                        vResult[sProp] = vContent;
                        nLength++;
                    }
                }
            }
        }
        if (sCollectedTxt) {
            vResult.keyValue = XML._parseText(sCollectedTxt);
        }
        
        return vResult as T;
    }

    /**
     * converts the passed in XML string into a Javascript object
     * 
     * XML to object deserialisation will use the following rules:
     * - element names become property names
     * - attributes become properties preceeded by an `@` symbol inside the element object
     * - element text content is rendered in a special property named `keyValue`
     * 
     * *Ex:*
     * ```xml
     * <html>
     *     <image src="./foo/bar/baz.jpg" />
     *     <hr />
     *     <span style="color:#808080" class="hidden rounded">
     *         This is coloured
     *     </span>
     * </html>
     * ```
     * will become:
     * ```json
     * {
     *     "html": {
     *         "image": {
     *             "@src": "./foo/bar/baz.jpg",
     *         },
     *         "hr": {},
     *         "span": {
     *             "@style": "color:#808080",
     *             "@class": "hidden rounded",
     *             "keyValue": "This is coloured"
     *         }
     *     }
     * }
     * ```
     * @param xml an XML string to be converted into a Javascript object
     * @returns a Javascript object representing the passed in XML string
     */
    static fromString<T extends JsonObject>(xml: string): T {
        const xmlDoc = new XmlDocument(xml);
        const obj = {};
        XML._fromXmlNode(xmlDoc, obj);
        return obj as T;
    }

    private static _parseText(sValue: any) {
        if (/^\s*$/.test(sValue)) {
            return null;
        }
        if (/^(?:true|false)$/i.test(sValue)) {
            return sValue.toLowerCase() === "true";
        }
        if (isFinite(sValue)) {
            return parseFloat(sValue);
        }
        if (isFinite(Date.parse(sValue))) {
            return new Date(sValue);
        }
        return sValue;
    }

    private static _fromXmlNode(xml: XmlNode, current: JsonObject): void {
        switch (xml.type) {
            case 'element':
                XML._fromElement(xml, current);
                break;
            case 'cdata':
                current['keyValue'] = XML._parseText((xml as XmlCDataNode).cdata);
                break;
            case 'text':
                current['keyValue'] = XML._parseText((xml as XmlTextNode).text);
                break;
            case 'comment':
            default:
                /* ignore */
                break;
        }
    }

    private static _fromElement(element: XmlElement, parent: JsonObject): void {
        if (element.name) {
            const n = element.name;
            parent[n] = {};
            if (element.attr) {
                const attributeKeys = Object.keys(element.attr)
                if (attributeKeys.length) {
                    for (const aKey of attributeKeys) {
                        parent[n][`@${aKey}`] = XML._parseText(element.attr[aKey].trim());
                    }
                }
            }
            if (element.val) {
                const v = element.val;
                parent[n]['keyValue'] = XML._parseText(v);
            }
            if (element.children?.length) {
                for (const child of element.children) {
                    XML._fromXmlNode(child, parent[n]);
                }
            }
        }
    }
}