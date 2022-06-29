import * as fs from "fs";
import * as path from "path";
import { FileSystemMap, rand } from "../../src";

const filename = 'parallel';
const fm = new FileSystemMap(filename);
const storeValues = () => {
    let key = rand.getString(rand.getInt(10, 20), true, true);
    let val = rand.getString(rand.getInt(15, 30), true, true);

    fm.set(key, val);

    if (fs.existsSync(path.join(process.cwd(), 'FileSystemMap', '.run'))) {
        setTimeout(storeValues, rand.getInt(100, 400));
    }
};

storeValues();