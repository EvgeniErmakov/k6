# Исправление дашборда Grafana для k6

## Проблема
Дашборд не отображал данные из-за несоответствия имен полей.

## Что было исправлено

### Старая структура (в дашборде):
- `@timestamp` → **НЕ используется в данных k6**
- `metric_name` → **Должен быть MetricName**
- `value` → **Должен быть Value**

### Новая структура (в данных k6):
- `Time` - временная метка
- `MetricName` - имя метрики (http_reqs, vus, и т.д.)
- `Value` - значение метрики  
- `Tags` - теги

### Изменения в дашборде:

1. **Поле времени**: `@timestamp` → `Time`
2. **Имя метрики**: `metric_name` → `MetricName`
3. **Значение**: `value` → `Value`
4. **Запросы**: обновлены для использования корректных полей

### Примеры запросов в дашборде:
- `MetricName:http_reqs` - HTTP запросы
- `MetricName:vus` - виртуальные пользователи
- `MetricName:http_req_duration` - длительность
- `MetricName:http_req_failed` - ошибки

## Проверка

После перезапуска Grafana:
1. Откройте http://localhost:3000
2. Dashboards → k6 Load Test Dashboard
3. Данные должны отображаться корректно

## Структура данных в Elasticsearch

```json
{
  "MetricName": "http_reqs",
  "MetricType": "counter",
  "Value": 1,
  "Tags": {
    "name": "https://httpbin.org/get",
    "method": "GET",
    "status": "200"
  },
  "Time": "2025-10-27T17:14:19.845Z"
}
```

Все панели дашборда теперь используют правильные поля для чтения данных из Elasticsearch.

