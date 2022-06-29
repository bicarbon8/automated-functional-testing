import { DefectStatus, Defect, DefectPlugin, rand, DefectPluginOptions } from "../../../src";

export class MockDefectPlugin extends DefectPlugin<DefectPluginOptions> {
    override async getDefect(defectId: string): Promise<Defect> {
        return {
            id: defectId, 
            title: rand.getString(17),
            description: rand.getString(150),
            status: rand.getFrom<DefectStatus>('open', 'closed')
        } as Defect;
    }
    override async findDefects(searchTerm: string): Promise<Defect[]> {
        switch (searchTerm) {
            case 'C1234':
                let d1: Defect = await this.getDefect('AUTO-123');
                d1.status = 'open';
                return [d1];
            case 'C2345':
                let d2: Defect = await this.getDefect('AUTO-234');
                d2.status = 'closed';
                return [d2];
            default: 
                let defects: Defect[] = [];
                let randomCount: number = rand.getInt(1, 5);
                for (var i=0; i<randomCount; i++) {
                    let defect: Defect = {
                        id: rand.getString(5),
                        title: rand.getString(17),
                        description: rand.getString(150),
                        status: rand.getFrom<DefectStatus>('open', 'closed')
                    } as Defect;
                    defects.push(defect);
                }
                return defects;
        }
    }
}