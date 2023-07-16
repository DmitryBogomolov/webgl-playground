install:
	@npm i

check:
	@npm run tscheck && npm run lint:fix

test:
	@npm test

dev:
	@npm run dev

build-registry:
	@npm run build-registry

.PHONE: install check lint test dev build-registry
