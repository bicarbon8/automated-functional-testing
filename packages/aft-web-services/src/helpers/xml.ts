import { ICanHaveKeyValue } from "./ican-have-key-value";

export module XML {
    function parseText(sValue: any) {
        if (/^\s*$/.test(sValue)) { return null; }
        if (/^(?:true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
        if (isFinite(sValue)) { return parseFloat(sValue); }
        if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
        return sValue;
    }
      
    export function toObject<T>(oXMLParent: Document | Element | DocumentFragment): T {
        var vResult: ICanHaveKeyValue = {}, nLength: number = 0, sCollectedTxt: string = "";
        let oXMLParentElement: Element = oXMLParent as Element;
        if (oXMLParentElement?.hasAttributes && oXMLParentElement?.attributes && oXMLParentElement?.hasAttributes()) {
            vResult = {};
            for (nLength; nLength < oXMLParentElement.attributes.length; nLength++) {
                let oAttrib = oXMLParentElement.attributes.item(nLength);
                vResult["@" + oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
            }
        }
        if (oXMLParent.hasChildNodes()) {
            for (var oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
                oNode = oXMLParent.childNodes.item(nItem);
                if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is "CDATASection" (4) */
                else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is "Text" (3) */
                else if (oNode.nodeType === 1 && !oNode.prefix) { /* nodeType is "Element" (1) */
                    if (nLength === 0) { vResult = {}; }
                    sProp = oNode.nodeName.toLowerCase();
                    vContent = toObject(oNode);
                    if (vResult.hasOwnProperty(sProp)) {
                        if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
                        vResult[sProp].push(vContent);
                    } else { vResult[sProp] = vContent; nLength++; }
                }
            }
        }
        if (sCollectedTxt) { nLength > 0 ? vResult.keyValue = parseText(sCollectedTxt) : vResult = parseText(sCollectedTxt); }
        
        return vResult as T;
    }
}