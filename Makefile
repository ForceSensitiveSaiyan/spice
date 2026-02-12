.PHONY: api web dev install-api install-web

install-api:
	cd apps/api && pip install -r requirements.txt

install-web:
	cd apps/web && npm install

api:
	cd apps/api && uvicorn spice.main:app --reload --port 5000

web:
	cd apps/web && npm run dev

dev:
	$(MAKE) api & $(MAKE) web & wait
