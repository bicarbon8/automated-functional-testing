import { machineInfo, MachineInfoData } from "../../src";

describe('MachineInfo', () => {
    it('can provide details', () => {
        const info: MachineInfoData = machineInfo.data;

        expect(info).withContext('object should be defined').toBeDefined();
        expect(info.ip).withContext('ip address should be defined').toBeDefined();
        expect(info.ip).withContext('ip address should match').toEqual(machineInfo.ip);
        expect(info.hostname).withContext('machine name should be defined').toBeDefined();
        expect(info.hostname).withContext('machine name should match').toEqual(machineInfo.hostname);
        expect(info.user).withContext('machine user should be defined').toBeDefined();
        expect(info.user).withContext('machine user should match').toEqual(machineInfo.user);
    });
});