#!/bin/sh

echo "⏳ Aguardando o banco de dados iniciar em $DB_HOST:$DB_PORT..."

while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done

echo "✅ Banco de dados está disponível! Iniciando o app..."
exec "$@"
