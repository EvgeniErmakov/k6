# Система нагрузочного тестирования с k6, Elasticsearch, Grafana и Kibana

## Описание проекта

Проект представляет собой локальное решение для проведения нагрузочного тестирования сервисов с использованием фреймворка k6. Система обеспечивает сбор, хранение и визуализацию метрик в реальном времени через Elasticsearch, Grafana и Kibana.

## Требования

- Docker (версия 20.10 или выше)
- Docker Compose (версия 2.0 или выше)
- k6 (для запуска нагрузочных тестов)

## Установка и запуск

### 1. Клонирование и подготовка

Убедитесь, что у вас установлены Docker и Docker Compose:

```bash
docker --version
docker-compose --version
```

### 2. Запуск сервисов

Запустите все сервисы одной командой:

```bash
docker-compose up -d
```

Эта команда запустит:
- **Elasticsearch** на порту 9200
- **Grafana** на порту 3000
- **Kibana** на порту 5601

### 3. Проверка статуса

Проверьте статус запущенных контейнеров:

```bash
docker-compose ps
```

Ожидаемый вывод:
```
NAME                         IMAGE                                    STATUS
performance_elasticsearch    docker.elastic.co/elasticsearch/elasticsearch:8.12.0   Up
performance_grafana         grafana/grafana:latest                    Up
performance_kibana         docker.elastic.co/kibana/kibana:8.12.0    Up
```

### 4. Проверка доступности сервисов

Проверьте, что все сервисы доступны:

```bash
# Проверка Elasticsearch
curl http://localhost:9200

# Проверка Health Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Ожидаемый результат: {"status":"green"}
```

## Доступ к сервисам

После запуска сервисы доступны по следующим адресам:

| Сервис | URL | Учетные данные |
|--------|-----|----------------|
| Elasticsearch | http://localhost:9200 | - |
| Grafana | http://localhost:3000 | admin / admin |
| Kibana | http://localhost:5601 | - |

## Запуск нагрузочного теста

### Установка и сборка k6 с поддержкой Elasticsearch

Для отправки метрик в Elasticsearch требуется сборка k6 с плагином xk6-output-elasticsearch.

**Требования:**
- Go версии 1.21 или выше

**Установка:**

1. Установите xk6:
```bash
go install go.k6.io/xk6/cmd/xk6@latest
```

2. Соберите k6 с плагином:
```bash
xk6 build --with github.com/elastic/xk6-output-elasticsearch
```

Или используйте готовый скрипт:
```bash
chmod +x scripts/build_k6.sh
./scripts/build_k6.sh
```

Бинарный файл `k6` будет создан в текущей директории.

### Запуск теста

**Важно**: Перед запуском теста убедитесь, что Elasticsearch запущен:
```bash
docker-compose up -d elasticsearch
```

Запустите нагрузочный тест с отправкой метрик в Elasticsearch:

```bash
# Установите URL Elasticsearch
export K6_ELASTICSEARCH_URL=http://localhost:9200

# Задать URL тестируемого сервиса
export LOAD_HOST='localhost:8080'

# Запустите тест
./k6 run tests/load_test.js -o output-elasticsearch
```

## Volumes

Данные сохраняются в следующих volumes:

| Volume | Описание | Данные |
|--------|----------|--------|
| `performance_elasticsearch_data` | Хранит индексы Elasticsearch | Метрики k6 и данные индексов |
| `performance_grafana_data` | Хранит настройки Grafana | Дашборды, источники данных, пользователи |

## Версии

- Elasticsearch: 8.11.0
- Kibana: 8.11.0
- Grafana: 10.2.0
- k6: Latest stable (с плагином xk6-output-elasticsearch)

## Лицензия

Проект для образовательных целей. Используйте свободно.

