import * as os from 'os';

/**
 * class providing IP address, username and hostname of the current
 * system
 */
class MachineInfo {
    get ip(): string {
        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        if (addresses.length > 0) {
            return addresses[0];
        } else {
            return '127.0.0.1';
        }
    }

    get hostname(): string {
        return os.hostname();
    }

    get user(): string {
        return os.userInfo()?.username || 'unknown';
    }

    /**
     * returns a `MachineInfoData` object containing the IP, hostname and username
     * of the current system
     */
    get data(): MachineInfoData {
        return {ip: this.ip, hostname: this.hostname, user: this.user};
    }
}

export type MachineInfoData = {
    ip?: string;
    hostname?: string;
    user?: string;
};

export const machineInfo = new MachineInfo();
