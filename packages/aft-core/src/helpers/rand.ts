import * as uuid from 'uuid';

class Rand {
    readonly ALPHAS: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    readonly NUMERICS: string = "0123456789";
    readonly SPECIALS: string = "!£$%^&*()_+=-[];'#,./{}:@~<>?";
    readonly EXTENDED: string = "ÀÁÂÃÄÅĀƁƂÇĈĊĎĐÈÉÊËƑĜĞĠĤĦÌÍÎÏĴĶĹĿŁÑŃÒÓÔÕÖƤɊŔŖŚŜŢŤŦÙÚÛÜŴŶŽ";

    /**
     * generates a string of the specified length containing randomely choosen characters
     * from the enabled types.
     * 
     * NOTE: only Alphabetical characters are enabled by default.
     * @param length the length of the string to generate
     * @param alphas set to `true` to include all capitol letters of the alphabet in the pool of characters to randomly choose from (defaults to `true`)
     * @param numerics set to `true` to include all numbers in the pool of characters to randomly choose from (defaults to `false`)
     * @param specials set to `true` to include special characters in the pool of characters to randomly choose from (defaults to `false`)
     * @param extended set to `true` to include extended characters in the pool of characters to randomly choose from (defaults to `false`)
     * @returns a string of the specified length consisting of randomly choosen characters from the enabled types
     */
    getString(length?: number, alphas: boolean = true, numerics: boolean = false, specials: boolean = false, extended: boolean = false): string {
        let choices: string = '';
        if (alphas) { choices += this.ALPHAS; }
        if (numerics) { choices += this.NUMERICS; }
        if (specials) { choices += this.SPECIALS; }
        if (extended) { choices += this.EXTENDED; }

        return this.getStringFrom(length, choices);
    }

    /**
     * generates a random integer number between the specified values
     * @param min the minimum value (inclusive) for the randomly generated number
     * @param max the maximum value (exclusive) for the randomly generated number
     * @returns a random integer number between the specified `min` (inclusive)
     * and `max` (exclusive)
     */
    getInt(min: number, max: number): number {
        return Math.floor(this.getFloat(min, max));
    }

    /**
     * generates a random number between the specified values
     * @param min the minimum value for the randomly generated number
     * @param max the maximum value for the randomly generated number
     * @returns a random number between the specified `min` and `max` inclusive
     */
    getFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * generates a string of randomly choosen characters from the specified set of `selectionCharacters`
     * 
     * NOTE: `selectionCharacters` defaults to all Alphabetical, Numeric, Special and Extended characters
     * @param length the length of the string to generate
     * @param selectionCharacters the set of characters to randomly choose from in generating the string
     * @returns a string of the specified length containing characters randomly choosen from the set of
     * `selectionCharacters`
     */
    getStringFrom(length?: number, selectionCharacters: string = `${this.ALPHAS}${this.NUMERICS}${this.SPECIALS}${this.EXTENDED}`): string {
        if (length === undefined) {
            length = this.getInt(1, 101);
        }
        let characters: string = '';

        for (let i = 0; i < length; i++) {
            let ch: string;
            if (selectionCharacters) {
                ch = selectionCharacters[this.getInt(0, selectionCharacters.length)];
            } else {
                ch = ' '; // use empty string if no characters supplied
            }
            characters += ch;
        }

        return characters;
    }

    /**
     * chooses one value of a passed in enum to return
     * @param anEnum the input enum object to choose from
     * @returns a randomly choosen enum value
     */
    getEnum<T>(anEnum: T): T[keyof T] {
        const enumValues: T[keyof T][] = Object.keys(anEnum)
          .map(n => Number.parseInt(n))
          .filter(n => !Number.isNaN(n)) as any as T[keyof T][];
        const randomIndex: number = Math.floor(Math.random() * enumValues.length);
        const randomEnumValue: T[keyof T] = enumValues[randomIndex];
        return randomEnumValue;
    }

    /**
     * picks from a passed in list of values and returns one
     * @param values an array of values to pick from
     * @returns one of the passed in values picked at random
     */
    getFrom<T>(...values: T[]): T {
        return values[this.getInt(0, values.length)];
    }

    /**
     * uses the `uuid.v4()` function to generate a
     * GUID
     */
    get guid(): string {
        return uuid.v4();
    }

    /**
     * returns a randomly choosen `true` or `false` value
     */
    get boolean(): boolean {
        const i: number = this.getInt(0, 100);
        return i < 50;
    }
}

/**
 * helper class used for generating random test data and value
 */
export const rand = new Rand();
