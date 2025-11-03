import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Кастомные метрики
const errorRate = new Rate('errors');
const customCounter = new Counter('custom_counter');
const customTrend = new Trend('custom_trend');

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Плавное увеличение до 10 пользователей за 30 секунд
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% запросов должны быть выполнены за 500ms
    http_req_failed: ['rate<0.1'],    // Уровень ошибок должен быть менее 10%
    errors: ['rate<0.1'],
  },
};

export default function () {
  // Тестируем различные API endpoints
  const baseURL = 'https://httpbin.org'; // Публичный тестовый API
  
  // GET запрос
  let res = http.get(`${baseURL}/get?test=load_testing`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body contains test': (r) => r.body.includes('test'),
  }) || errorRate.add(1);

  customTrend.add(res.timings.duration);
  customCounter.add(1);

  sleep(1);

  // POST запрос
  const payload = JSON.stringify({
    name: 'k6 load test',
    timestamp: Date.now(),
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  res = http.post(`${baseURL}/post`, payload, params);
  
  check(res, {
    'post status is 200': (r) => r.status === 200,
    'post response size > 0': (r) => r.body.length > 0,
  }) || errorRate.add(1);

  customCounter.add(1);
  
  sleep(1);
}

