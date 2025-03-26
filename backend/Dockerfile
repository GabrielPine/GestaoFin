FROM python:3.11

WORKDIR /app

# Instalar o netcat para que o wait-for-it.sh funcione
RUN apt-get update && apt-get install -y netcat-openbsd

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

COPY wait-for-it.sh .
RUN chmod +x wait-for-it.sh

CMD ["./wait-for-it.sh", "python", "app.py"]
