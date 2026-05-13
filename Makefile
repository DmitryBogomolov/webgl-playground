setup: node_modules package.json package-lock.json
	@npm install

.PHONY: clean
clean:
	@rm -rf ./dist ./build

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
	@npm test -- $(FILTER)

.PHONY: dev
dev:
	@npm run dev

.PHONY: build-static
build-static:
	@npm run build-static

.PHONY: serve-static
serve-static: PORT = 10001
serve-static:
	@cd ./build && python3 -m http.server $(PORT)
