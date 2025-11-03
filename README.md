# Система нагрузочного тестирования с k6, Elasticsearch, Grafana и Kibana

## Описание проекта

Проект представляет собой локальное решение для проведения нагрузочного тестирования сервисов с использованием фреймворка k6. Система обеспечивает сбор, хранение и визуализацию метрик в реальном времени через Elasticsearch, Grafana и Kibana.

## Архитектура

```
k6 (нагрузочные тесты) → Elasticsearch (хранилище метрик) → Grafana (визуализация) / Kibana (анализ данных)
```

## Структура проекта

```
.
├── docker-compose.yml          # Конфигурация Docker Compose
├── tests/
│   └── load_test.js            # Пример нагрузочного теста для k6
├── grafana/
│   └── provisioning/
│       ├── datasources/        # Автоматическая настройка источников данных
│       │   └── elasticsearch.yml
│       └── dashboards/         # Автоматическое создание дашбордов
│           ├── dashboards.yml
│           └── k6-dashboard.json
├── elasticsearch/
│   └── config/
│       └── elasticsearch.yml   # Конфигурация Elasticsearch
├── kibana/
│   └── config/
│       └── kibana.yml          # Конфигурация Kibana
├── .env                        # Переменные окружения (создать при необходимости)
└── README.md                   # Документация проекта
```

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

### Параметры теста

В файле `tests/load_test.js` настроена следующая стратегия нагрузки:
- Плавное увеличение до 10 пользователей за 30 секунд
- Удержание 10 пользователей в течение 1 минуты
- Увеличение до 20 пользователей за 30 секунд
- Удержание 20 пользователей в течение 1 минуты
- Снижение до 0 пользователей за 30 секунд

### Кастомизация теста

Вы можете изменить параметры нагрузки в файле `tests/load_test.js`:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Плавное увеличение
    { duration: '1m', target: 10 },   // Удержание
    // Добавьте свои стадии
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% запросов < 500ms
    http_req_failed: ['rate<0.1'],    // < 10% ошибок
  },
};
```

## Настройка Grafana

Grafana автоматически настроена при запуске:
- Источник данных Elasticsearch (читает индекс `k6-metrics*`)
- Дашборд "k6 Load Test Dashboard" с панелями для визуализации метрик

### Проверка подключения

После запуска всех сервисов:

1. Откройте http://localhost:3000
2. Войдите: `admin` / `admin`
3. Перейдите в Configuration → Data Sources
4. Проверьте наличие источника данных "Elasticsearch"
5. Если подключение установлено, увидите зеленую метку "Data source is working"

### Ручная настройка источника данных (опционально)

Если автоматическая настройка не сработала:

1. Откройте Grafana: http://localhost:3000
2. Войдите: `admin` / `admin`
3. Перейдите в **Configuration** → **Data Sources**
4. Нажмите **Add data source**
5. Выберите **Elasticsearch**
6. Заполните поля:
   - **URL**: `http://elasticsearch:9200`
   - **Index name**: `k6-metrics*`
   - **Time field**: `@timestamp`
7. Нажмите **Save & Test**

### Просмотр данных

1. Перейдите в **Dashboards** → **Browse**
2. Откройте дашборд **k6 Load Test Dashboard**
3. Вы увидите следующие панели:
   - **Requests per Second (RPS)**: Количество запросов в секунду
   - **Average Response Time**: Среднее время отклика
   - **Failed Requests**: Количество неуспешных запросов
   - **Active Virtual Users (VUs)**: Количество активных пользователей

## Использование Kibana

### Просмотр данных

1. Откройте Kibana: http://localhost:5601
2. Перейдите в **Discover** (левое меню)
3. Если индекс не обнаружен автоматически:
   - Перейдите в **Management** → **Stack Management** → **Index Patterns**
   - Создайте новый индекс: `k6-metrics*`
   - Укажите поле времени: `@timestamp`
4. Вернитесь в **Discover** для просмотра данных

### Полезные запросы

В строке поиска Kibana можно использовать следующие фильтры:

```
metric_name:"http_reqs"
metric_name:"http_req_duration"
metric_name:"vus"
tags.status:error
```

## Управление сервисами

### Остановка сервисов

```bash
docker-compose stop
```

### Запуск остановленных сервисов

```bash
docker-compose start
```

### Остановка и удаление контейнеров

```bash
docker-compose down
```

**Внимание**: Данная команда остановит контейнеры, но сохранит данные в volumes.

### Полное удаление с данными

```bash
docker-compose down -v
```

**Внимание**: Эта команда удалит все данные из Elasticsearch и Grafana.

## Волюмы (Volumes)

Данные сохраняются в следующих volumes:

| Volume | Описание | Данные |
|--------|----------|--------|
| `performance_elasticsearch_data` | Хранит индексы Elasticsearch | Метрики k6 и данные индексов |
| `performance_grafana_data` | Хранит настройки Grafana | Дашборды, источники данных, пользователи |

Просмотр volumes:
```bash
docker volume ls | grep performance
```

Просмотр содержимого volume:
```bash
docker volume inspect performance_elasticsearch_data
```

## Индексы Elasticsearch

После запуска тестов в Elasticsearch создаются индексы в формате:
- `k6-metrics-YYYY.MM.DD`

Просмотр индексов:
```bash
curl http://localhost:9200/_cat/indices?v
```

## Устранение неполадок

### Проблема: Elasticsearch не запускается

**Причина**: Недостаточно памяти или конфликт портов.

**Решение**:
```bash
# Проверьте логи
docker-compose logs elasticsearch

# Увеличьте лимит памяти Docker
sudo sysctl -w vm.max_map_count=262144
```

### Проблема: Grafana не подключается к Elasticsearch

**Решение**:
1. Проверьте, что Elasticsearch запущен: `curl http://localhost:9200`
2. Убедитесь, что используется правильный URL в настройках источника данных
3. Проверьте логи: `docker-compose logs grafana`

### Проблема: k6 не отправляет данные в Elasticsearch

**Решение**:
1. Проверьте доступность Elasticsearch: `curl http://localhost:9200`
2. Убедитесь, что используете правильный URL в команде:
   ```bash
   k6 run --out elasticsearch=http://localhost:9200/k6-metrics ./tests/load_test.js
   ```
3. Проверьте логи k6 на наличие ошибок

### Просмотр логов

```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs elasticsearch
docker-compose logs grafana
docker-compose logs kibana

# Следить за логами в реальном времени
docker-compose logs -f
```

## Примеры использования

### Пример 1: Быстрый smoke-тест

```bash
export K6_ELASTICSEARCH_URL=http://localhost:9200
./k6 run tests/load_test.js -o output-elasticsearch
```

### Пример 2: Длительный тест с детальными метриками

```bash
export K6_ELASTICSEARCH_URL=http://localhost:9200
./k6 run --duration=10m tests/load_test.js -o output-elasticsearch
```

### Пример 3: Тест с различными параметрами нагрузки

Создайте новый файл `tests/long_test.js` с другими параметрами:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};
```

## Дополнительная информация

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart elasticsearch

# Просмотр использования ресурсов
docker stats

# Очистка неиспользуемых ресурсов
docker system prune -a --volumes
```

### Масштабирование

Для production использования рекомендуется:
- Настроить cluster для Elasticsearch
- Включить security (xpack.security)
- Настроить резервное копирование
- Использовать внешние DNS и SSL сертификаты

## Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs <service>`
2. Убедитесь, что все порты свободны
3. Проверьте доступность Docker daemon: `docker ps`

## Версии

- Elasticsearch: 8.11.0
- Kibana: 8.11.0
- Grafana: 10.2.0
- k6: Latest stable (с плагином xk6-output-elasticsearch)

## Лицензия

Проект для образовательных целей. Используйте свободно.

