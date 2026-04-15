setup: node_modules package.json
	@npm install

.PHONY: build
build:
	@npm run build

.PHONY: typecheck
typecheck:
	@npm run typecheck

.PHONY: lint
lint:
	@npm run lint

.PHONY: check
check: typecheck lint

.PHONY: test
test:
	@npm test

.PHONY: dev
dev:
	@npm run dev
