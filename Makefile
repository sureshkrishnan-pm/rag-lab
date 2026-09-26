.PHONY: build dev test

build:
	python -m venv build/.venv && build/.venv/bin/pip install -r build/requirements.txt
	python build/chunk.py
	python build/embed.py
	python build/project.py

dev:
	npm run dev

test:
	npm test
