# Быстрый старт

## 1. Запуск инфраструктуры

```bash
docker-compose up -d
```

Проверьте статус:
```bash
docker-compose ps
```

Должны быть запущены:
- Elasticsearch на http://localhost:9200
- Grafana на http://localhost:3000 (admin/admin)
- Kibana на http://localhost:5601

## 2. Подготовка k6

### Требования
- Go 1.21 или выше
- Docker (для Elasticsearch)

### Сборка k6 с поддержкой Elasticsearch

```bash
# Установите xk6
go install go.k6.io/xk6/cmd/xk6@latest

# Соберите k6 с плагином
xk6 build --with github.com/elastic/xk6-output-elasticsearch
```

Или используйте готовый скрипт:
```bash
chmod +x scripts/build_k6.sh
./scripts/build_k6.sh
```

Бинарный файл `k6` будет создан в текущей директории.

## 3. Запуск теста

```bash
# Установите URL Elasticsearch
export K6_ELASTICSEARCH_URL=http://localhost:9200

# Запустите тест
./k6 run tests/load_test.js -o output-elasticsearch
```

## 4. Просмотр результатов

### В Grafana
1. Откройте http://localhost:3000
2. Войдите: admin / admin
3. Перейдите в Dashboards → Browse
4. Откройте "k6 Load Test Dashboard"

### В Kibana
1. Откройте http://localhost:5601
2. Перейдите в Discover
3. Создайте индексный паттерн: `k6-metrics*`
4. Просматривайте метрики

## 5. Проверка данных в Elasticsearch

```bash
# Список индексов
curl "http://localhost:9200/_cat/indices/k6-metrics*?v"

# Последние метрики
curl "http://localhost:9200/k6-metrics*/_search?size=5&sort=@timestamp:desc&pretty" | jq '.'
```

## Структура данных

k6 отправляет метрики в следующих форматах:
- `http_reqs` - количество HTTP запросов
- `http_req_duration` - время выполнения запросов
- `http_req_failed` - количество неуспешных запросов
- `vus` - количество виртуальных пользователей
- Кастомные метрики (если определены в тесте)

Все метрики имеют поле `@timestamp` для временной привязки.

## Остановка

```bash
docker-compose stop
```

Полная очистка (включая данные):
```bash
docker-compose down -v
```

