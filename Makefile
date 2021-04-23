install:
	@npm i

lint:
	@npm run lint

test:
	@npm test

dev:
	@npm run dev


.PHONE: install lint test dev
