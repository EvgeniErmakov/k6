#!/bin/bash

# Скрипт для установки и сборки k6 с плагином для Elasticsearch
# Использование: ./scripts/build_k6.sh

set -e

echo "=== Установка xk6 ==="
go install go.k6.io/xk6/cmd/xk6@latest

echo ""
echo "=== Сборка k6 с плагином xk6-output-elasticsearch ==="
xk6 build --with github.com/elastic/xk6-output-elasticsearch

echo ""
echo "✓ Сборка завершена!"
echo ""
echo "Запустите тест командой:"
echo "  export K6_ELASTICSEARCH_URL=http://localhost:9200"
echo "  ./k6 run tests/load_test.js -o output-elasticsearch"

