install:
	@npm i

check:
	@npm run check

lint:
	@npm run lint

test:
	@npm test

dev:
	@npm run dev2


.PHONE: install check lint test dev
