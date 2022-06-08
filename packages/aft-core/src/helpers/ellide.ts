export type EllipsisLocation = 'beginning' | 'middle' | 'end';

export const ellide = function(original: string, finalLength: number, ellipsisLocation: EllipsisLocation = 'end', ellipsis: string = '...'): string {
    if (finalLength >= 5 && original.length > finalLength) {
        switch (ellipsisLocation) {
            case 'beginning':
                let shortenedStr: string = original.substring((original.length - finalLength) + ellipsis.length);
                return `${ellipsis}${shortenedStr}`;
            case 'middle':
                let beginningStr: string = original.substring(0, original.length / 2);
                let endStr: string = original.substring(original.length / 2);
                let shortenedBeginningStr: string = ellide(beginningStr, (finalLength / 2) - (ellipsis.length / 2), 'end', '');
                let shortenedEndStr: string = ellide(endStr, (finalLength / 2) - (ellipsis.length / 2), 'beginning', ''); 
                let removeFromBeginning: boolean = true;
                while (shortenedBeginningStr.length + ellipsis.length + shortenedEndStr.length > finalLength) {
                    if (removeFromBeginning) {
                        shortenedBeginningStr = shortenedBeginningStr.substring(0, shortenedBeginningStr.length - 2);
                        removeFromBeginning = false;
                    } else {
                        shortenedEndStr = shortenedEndStr.substring(1, shortenedEndStr.length - 1);
                        removeFromBeginning = true;
                    }
                }
                let finalStr: string = `${shortenedBeginningStr}${ellipsis}${shortenedEndStr}`;
                return finalStr;
            case 'end':
            default:
                var shortStr = original.substring(0, (finalLength - ellipsis.length));
                return `${shortStr}${ellipsis}`;
        }
    }
    return original; // no need to ellide so return original string
};