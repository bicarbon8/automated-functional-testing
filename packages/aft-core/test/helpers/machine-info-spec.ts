import { MachineInfo, MachineInfoData } from "../../src";

describe('MachineInfo', () => {
    it('can provide details', async () => {
        const info: MachineInfoData = await MachineInfo.get();

        expect(info).withContext('object should be defined').toBeDefined();
        expect(info.ip).withContext('ip address should be defined').toBeDefined();
        expect(info.name).withContext('machine name should be defined').toBeDefined();
        expect(info.user).withContext('machine user should be defined').toBeDefined();
    });
});