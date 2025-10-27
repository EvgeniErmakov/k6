# Статус Elasticsearch

## Текущая ситуация

Elasticsearch работает корректно, но в логах отображаются предупреждения:

### Проблема: Disk watermark exceeded

```
"WARN": "flood stage disk watermark [95%] exceeded on [elasticsearch][/usr/share/elasticsearch/data] free: 832mb[1.7%], all indices on this node will be marked read-only"
```

**Причина:** На хост-системе мало свободного места (< 5% от диска).

**Решение:** Настроены повышенные пороги для Docker volume:
- low: 90% (вместо дефолтных 85%)
- high: 95% (вместо дефолтных 90%)
- flood_stage: 98% (вместо дефолтных 95%)

**Команда для проверки:**
```bash
curl "http://localhost:9200/_cluster/settings?include_defaults=true" | jq '.defaults.cluster.routing.allocation.disk'
```

## Статус кластера

### Health Check
```bash
curl "http://localhost:9200/_cluster/health?pretty"
```

**Ожидаемое состояние:**
- `status: "yellow"` или `"green"` - нормально
- `status: "red"` - проблемные индексы (при наличии старых данных)

### Проверка доступности
```bash
curl http://localhost:9200
```

## Работа с индексами

### Список индексов
```bash
curl "http://localhost:9200/_cat/indices?v"
```

### Освобождение места (если нужно)

Если есть старые индексы и место критично:

```bash
# Просмотр индексов
curl "http://localhost:9200/_cat/indices?v"

# Удаление конкретного индекса (например, старый k6-metrics)
curl -X DELETE "http://localhost:9200/k6-metrics-2024.10.27"

# Удаление всех индексов (осторожно!)
curl -X DELETE "http://localhost:9200/_all"
```

### Сброс read-only режима

Если индексы в read-only из-за watermark:

```bash
# Для всех индексов
curl -X PUT "localhost:9200/_all/_settings" -H 'Content-Type: application/json' -d'
{
  "index.blocks.read_only_allow_delete": null
}'

# Для конкретного индекса
curl -X PUT "localhost:9200/k6-metrics*/_settings" -H 'Content-Type: application/json' -d'
{
  "index.blocks.read_only_allow_delete": null
}'
```

## Рекомендации

### 1. Мониторинг дискового пространства

Проверяйте доступное место на хосте:
```bash
df -h /var/lib/docker
```

Для Docker volume Elasticsearch:
```bash
docker volume inspect performance_elasticsearch_data
```

### 2. Очистка старых данных

Настройте ротацию индексов k6 (в `.k6/script.js` или через ILM):

```javascript
// Добавьте в test script настройки retention
export const options = {
  // ...
  // ILM для автоматической ротации индексов
};
```

### 3. Увеличьте место на диске

Elasticsearch использует Docker volume. Для увеличения места:

```bash
# Проверьте размер volume
docker system df -v

# Очистите неиспользуемые volumes
docker volume prune

# Удалите старые данные
docker-compose down -v
```

## После запуска k6

Индексы создаются автоматически при первой отправке данных:

```bash
# Запуск теста
export K6_ELASTICSEARCH_URL=http://localhost:9200
./k6 run tests/load_test.js -o output-elasticsearch

# Проверка созданных индексов
curl "http://localhost:9200/_cat/indices/k6-metrics*?v"

# Просмотр данных
curl "http://localhost:9200/k6-metrics*/_search?size=5&pretty"
```

## Troubleshooting

### Elasticsearch не запускается

Проверьте логи:
```bash
docker-compose logs elasticsearch
```

Возможные проблемы:
1. **Memory lock** - добавьте в `/etc/fstab`:
   ```
   tmpfs /dev/shm tmpfs defaults,size=2G 0 0
   ```

2. **Недостаточно памяти** - уменьшите ES_JAVA_OPTS в docker-compose.yml

3. **Недостаточно места** - очистите диски

### Индексы не создаются

Проверьте:
```bash
# Статус кластера
curl "http://localhost:9200/_cluster/health"

# Логи ошибок
docker-compose logs elasticsearch | grep -i error

# Проверьте k6 output
./k6 run tests/load_test.js -o output-elasticsearch --verbose
```

## Конфигурация watermark (текущая)

```json
{
  "cluster": {
    "routing": {
      "allocation": {
        "disk": {
          "watermark": {
            "low": "90%",
            "high": "95%",
            "flood_stage": "98%"
          }
        }
      }
    }
  }
}
```

Эти настройки применяются автоматически при запуске через исправленный docker-compose.yml.

