install:
	@npm i

check:
	@npm run check

lint:
	@npm run lint:fix

test:
	@npm test

dev:
	@npm run dev


.PHONE: install check lint test dev
