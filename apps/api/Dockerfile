FROM python:3.12-slim

WORKDIR /app
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api/ .
COPY packages/ /packages

ENV PYTHONPATH="/app:/packages"
EXPOSE 5000

CMD ["uvicorn", "spice.main:app", "--host", "0.0.0.0", "--port", "5000"]
