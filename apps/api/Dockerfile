FROM python:3.12-slim

# Create non-root user
RUN useradd --create-home --shell /bin/bash spice

WORKDIR /app
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api/ .
COPY packages/ /packages

# Create data directory for SQLite (writable by non-root user)
RUN mkdir -p /app/spice/data && chown spice:spice /app/spice/data

# Switch to non-root user
USER spice

ENV PYTHONPATH="/app:/packages"
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

CMD ["uvicorn", "spice.main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]
