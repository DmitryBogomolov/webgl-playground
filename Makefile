install:
	@npm i

check:
	@npm run tscheck && npm run lint:fix

test:
	@npm test

dev:
	@npm run dev

.PHONE: install check lint test dev build-registry
