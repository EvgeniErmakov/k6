import test_me_all_endpoints_with_errors from "./test_me_all_endpoints_with_errors.js";

export const options = {
    scenarios: {
        testMeAllEndpointsWithErrors: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                {duration: "1m", target: 15},
                {duration: "1m", target: 15},
            ],
            exec: 'test_me_all_endpoints_with_errors_load'
        },
    },
    thresholds: {
        'http_req_duration': [`p(95) < 5000`], // 95% of requests must complete below 5s
        'checks': ['rate > 0.95']
    }
};

export function test_me_all_endpoints_with_errors_load() {
    test_me_all_endpoints_with_errors()
}
