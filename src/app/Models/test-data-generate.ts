export class TestDataGenerate {
    constructor() {

    }

    /**
     * Generate test data for chart.js test.
     * @param startDate the start time.
     * @param totalDay how many day data want to generate.
     * @param step the time step (min).
     */
    getTestData(startDate: Date = new Date(), totalDay: number = 1, step: number = 1, maximumValue: number = 100) {

        let result = [];

        for (let day = 0; day < totalDay; day++) {
            let tmpDate = new Date(`${startDate.getFullYear()}/${startDate.getMonth()}/${startDate.getDate()}`);
            let stepCount = 0;

            while (stepCount < 86400000) {
                let data = {
                    x: tmpDate.getTime() + stepCount,
                    y: Math.random() * maximumValue
                }
                result.push(data);
                stepCount += step * 60000;
            }
            startDate.setDate(startDate.getDate() - 1);
        }

        return result;
    }
}
