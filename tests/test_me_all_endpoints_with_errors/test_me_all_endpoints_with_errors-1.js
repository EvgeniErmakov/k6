import test_me_all_endpoints_with_errors from "./test_me_all_endpoints_with_errors.js";

// Для запуска:
// export LOAD_HOST='localhost:8080'
// export K6_ELASTICSEARCH_URL=http://localhost:9200
// ./k6 run tests/test_me_all_endpoints_with_errors/test_me_all_endpoints_with_errors-1.js -o output-elasticsearch
export const options = {
    scenarios: {
        testMeAllEndpointsWithErrors: {
            executor: 'ramping-vus', //https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/
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
        'checks': ['rate > 0.95'] // how to use thresholds https://grafana.com/docs/k6/next/using-k6/thresholds/
    }
};

export function test_me_all_endpoints_with_errors_load() {
    test_me_all_endpoints_with_errors()
}
