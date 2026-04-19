APP_NAME  = ledger
REMOTE    = hetzner
SERVER    = 91.99.190.45
REPO_DIR  = /opt/ledger
SSH       = ssh root@$(SERVER)

.PHONY: deploy logs db-shell migrate seed restart pull build

deploy: ## Full deploy: pull + build + restart
	$(SSH) "cd $(REPO_DIR) && git pull && docker compose build web && docker compose up -d --no-deps web"

pull: ## Pull latest code only
	$(SSH) "cd $(REPO_DIR) && git pull"

build: ## Rebuild web container
	$(SSH) "cd $(REPO_DIR) && docker compose build web"

restart: ## Restart web container (no rebuild)
	$(SSH) "cd $(REPO_DIR) && docker compose restart web"

logs: ## Tail web container logs
	$(SSH) "cd $(REPO_DIR) && docker compose logs -f web"

db-shell: ## Open psql shell in db container
	$(SSH) "cd $(REPO_DIR) && docker compose exec db psql -U ledger -d ledger"

migrate: ## Run drizzle migrations
	$(SSH) "cd $(REPO_DIR) && docker compose exec web node -e \"const { migrate } = require('drizzle-orm/postgres-js/migrator'); const { drizzle } = require('drizzle-orm/postgres-js'); const postgres = require('postgres'); const client = postgres(process.env.DATABASE_URL); migrate(drizzle(client), { migrationsFolder: 'drizzle' }).then(() => { console.log('done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });\""

seed: ## Run db seed
	$(SSH) "cd $(REPO_DIR) && docker compose exec web node -r tsconfig-paths/register -r ts-node/register lib/db/seed.ts"

status: ## Show container status
	$(SSH) "cd $(REPO_DIR) && docker compose ps"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
