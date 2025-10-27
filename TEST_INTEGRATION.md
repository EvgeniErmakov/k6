# Интеграция k6 с Elasticsearch

## Как это работает

### 1. k6 → Elasticsearch

При запуске теста с флагом `-o output-elasticsearch` k6 отправляет метрики в Elasticsearch через плагин xk6-output-elasticsearch:

```bash
export K6_ELASTICSEARCH_URL=http://localhost:9200
./k6 run tests/load_test.js -o output-elasticsearch
```

Метрики сохраняются в индекс: `k6-metrics-YYYY.MM.DD`

### 2. Elasticsearch → Grafana

Grafana настроена на чтение данных из Elasticsearch через provisioning:

**Файл:** `grafana/provisioning/datasources/elasticsearch.yml`
```yaml
- name: Elasticsearch
  type: elasticsearch
  url: http://elasticsearch:9200
  database: "k6-metrics*"  # Читает все индексы k6-metrics*
  timeField: "@timestamp"  # Поле времени для временной фильтрации
```

Grafana автоматически:
- Подключается к Elasticsearch при старте
- Создает источник данных "Elasticsearch"
- Применяет дашборд "k6 Load Test Dashboard"

### 3. Структура данных в Elasticsearch

Каждая метрика из k6 сохраняется в Elasticsearch как документ:

```json
{
  "@timestamp": "2025-10-27T14:00:00.000Z",
  "metric_name": "http_reqs",
  "value": 1,
  "tags": {
    "name": "http://example.com/get",
    "method": "GET",
    "status": "200"
  }
}
```

## Метрики k6 → Графана

Дашборд "k6 Load Test Dashboard" отображает:

1. **Requests per Second (RPS)**
   - Запрос: `metric_name:"http_reqs"`
   - График количества запросов в секунду

2. **Average Response Time**
   - Запрос: `metric_name:"http_req_duration"`
   - Средняя длительность запросов

3. **Failed Requests**
   - Запрос: `metric_name:"http_req_failed"`
   - Количество неуспешных запросов

4. **Active Virtual Users (VUs)**
   - Запрос: `metric_name:"vus"`
   - Количество активных виртуальных пользователей

## Проверка интеграции

### 1. Проверка Elasticsearch

```bash
# Проверка доступности
curl http://localhost:9200

# Список индексов k6
curl "http://localhost:9200/_cat/indices/k6-metrics*?v"

# Последние метрики
curl "http://localhost:9200/k6-metrics*/_search?size=5&sort=@timestamp:desc&pretty"
```

### 2. Проверка Grafana

1. Откройте http://localhost:3000
2. Configuration → Data Sources → Elasticsearch
3. Нажмите "Test" - должно быть "Data source is working"
4. Dashboards → k6 Load Test Dashboard

### 3. Проверка данных

```bash
# После запуска теста проверьте метрики
curl "http://localhost:9200/k6-metrics*/_search?q=metric_name:http_reqs&size=1&pretty" | jq '.hits.hits[]._source'
```

## Отправка данных в Elasticsearch

k6 автоматически отправляет:
- **Встроенные метрики**: http_reqs, http_req_duration, http_req_failed, vus
- **Кастомные метрики**: определенные в `load_test.js`

Плагин xk6-output-elasticsearch автоматически:
- Создает индекс с датой
- Добавляет @timestamp
- Группирует метрики по имени
- Сохраняет все теги

## Формат документов

### HTTP Request
```json
{
  "@timestamp": "2025-10-27T14:00:00.000Z",
  "metric_name": "http_reqs",
  "value": 1,
  "tags": {
    "name": "http://httpbin.org/get",
    "method": "GET",
    "status": "200",
    "group": ""
  }
}
```

### Duration
```json
{
  "@timestamp": "2025-10-27T14:00:00.000Z",
  "metric_name": "http_req_duration",
  "value": 234.5,
  "tags": {
    "name": "http://httpbin.org/get",
    "method": "GET",
    "status": "200",
    "group": ""
  }
}
```

### VUs
```json
{
  "@timestamp": "2025-10-27T14:00:00.000Z",
  "metric_name": "vus",
  "value": 10,
  "tags": {}
}
```

## Troubleshooting

### Проблема: Grafana не видит данные

1. Проверьте, что индекс создан:
   ```bash
   curl "http://localhost:9200/_cat/indices/k6-metrics*?v"
   ```

2. Проверьте подключение Grafana к Elasticsearch:
   - Configuration → Data Sources → Test

3. Проверьте timeField в настройках:
   - Должно быть: `@timestamp`

### Проблема: Данные не отправляются из k6

1. Проверьте URL Elasticsearch:
   ```bash
   echo $K6_ELASTICSEARCH_URL
   ```

2. Проверьте доступность:
   ```bash
   curl $K6_ELASTICSEARCH_URL
   ```

3. Проверьте, что используется правильный output:
   ```bash
   ./k6 run tests/load_test.js -o output-elasticsearch
   ```

### Проблема: Старые данные не видны

Grafana по умолчанию показывает последние 15 минут. Измените временной диапазон:
- Выберите диапазон в правом верхнем углу дашборда

## Расширенная настройка

### Кастомизация дашборда

Дашборд расположен в: `grafana/provisioning/dashboards/k6-dashboard.json`

Вы можете:
- Добавить новые панели
- Изменить запросы к Elasticsearch
- Добавить кастомные метрики

### Добавление новых метрик

В `tests/load_test.js` создайте кастомные метрики:

```javascript
import { Counter } from 'k6/metrics';

const myCustomMetric = new Counter('my_custom_metric');

export default function () {
  myCustomMetric.add(1);
  // ...
}
```

После запуска теста метрика появится в Elasticsearch и Grafana.

