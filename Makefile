APP_NAME  = ledger
SERVER    = 91.99.190.45
DEPLOY_DIR = /opt/docker/ledger
SRC_DIR   = $(DEPLOY_DIR)/src
DC        = docker compose -f $(DEPLOY_DIR)/docker-compose.yml
SSH       = ssh root@$(SERVER)

.PHONY: deploy logs db-shell migrate seed restart pull build status help

deploy: ## Full deploy: pull + build + restart
	$(SSH) "cd $(SRC_DIR) && git pull && $(DC) build ledger_app && $(DC) up -d --no-deps ledger_app"

pull: ## Pull latest code only
	$(SSH) "cd $(SRC_DIR) && git pull"

build: ## Rebuild app container
	$(SSH) "$(DC) build ledger_app"

restart: ## Restart app container (no rebuild)
	$(SSH) "$(DC) restart ledger_app"

logs: ## Tail app container logs
	$(SSH) "$(DC) logs -f ledger_app"

db-shell: ## Open psql shell in db container
	$(SSH) "$(DC) exec ledger_db psql -U ledger -d ledger"

migrate: ## Run drizzle push via temp container
	$(SSH) "cd $(SRC_DIR) && docker run --rm --network proxy_network -e DATABASE_URL='postgresql://ledger:Qwe123!@@ledger_db:5432/ledger' -v \$$(pwd):/app -w /app node:22-alpine sh -c 'npm ci --silent && npx drizzle-kit push'"

seed: ## Run db seed via temp container
	$(SSH) "cd $(SRC_DIR) && docker run --rm --network proxy_network -e DATABASE_URL='postgresql://ledger:Qwe123!@@ledger_db:5432/ledger' -v \$$(pwd):/app -w /app node:22-alpine sh -c 'npm ci --silent && npx tsx lib/db/seed.ts'"

status: ## Show container status
	$(SSH) "$(DC) ps"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
