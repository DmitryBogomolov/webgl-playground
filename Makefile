setup: node_modules package.json
	@npm install

.PHONY: check
check:
	@npm run tscheck && npm run lint

.PHONY: test
test:
	@npm test

.PHONY: dev
dev:
	@npm run dev
