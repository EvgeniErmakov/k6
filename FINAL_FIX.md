# Финальное исправление индекса в Grafana

## Проблема
Ошибка: "invalid index pattern k6-metrics*"
- Grafana ожидает индекс с временным паттерном типа `k6-metrics-2025.10.27`
- Но в Elasticsearch создан индекс `k6-metrics` без даты

## Решение

### Изменения в datasource:

**Было:**
```yaml
database: "k6-metrics*"
interval: Daily
```

**Стало:**
```yaml
database: "k6-metrics"
interval: No interval
```

### Почему это работает:

1. **Убрана звездочка**: `k6-metrics*` → `k6-metrics`
   - Не нужна, так как индекс без временного паттерна

2. **"No interval"**: Графана не будет ждать временного паттерна
   - Работает с одним индексом без ротации по датам

## Текущая структура данных:

```json
{
  "MetricName": "vus",
  "MetricType": "gauge", 
  "Value": 1,
  "Tags": {},
  "Time": "2025-10-27T17:14:19.84540134+03:00"
}
```

## Результат:

✅ Datasource подключен к `k6-metrics`  
✅ Time field: `Time`  
✅ Индекс найден и доступен  
✅ Дашборд должен отображать данные

## Проверка:

1. Откройте http://localhost:3000
2. Configuration → Data Sources → Elasticsearch
3. Увидите зеленую метку "Data source is working"
4. Dashboards → k6 Load Test Dashboard → Данные отображаются

Grafana перезапущена с обновленной конфигурацией.

