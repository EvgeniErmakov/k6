import test_me_all_endpoints_200 from "./test_me_all_endpoints_200.js";
import {DEFAULT_TRIGGER_TIME} from '../../../../common.js'

export const options = {
    scenarios: {
        testMeAllEndpoints200: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                {duration: "1m", target: 5},
                {duration: "1m", target: 5},
            ],
            exec: 'test_me_all_endpoints_200_load'
        },
    },
    thresholds: {
        'http_req_duration': [`p(95) < ${DEFAULT_TRIGGER_TIME}`], // 95% of requests must complete below 5s
        'checks': ['rate > 0.95']
    }
};

export function test_me_all_endpoints_200_load() {
    test_me_all_endpoints_200()
}
