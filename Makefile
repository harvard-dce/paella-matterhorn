# DCE Makefile tests
# Do grunt build before running these tests.

PAELLADIR = submodules/paella
EXTDIR = node_modules/dce-paella-extensions
UIDIR = paella-matterhorn/ui

BROWSERIFYCMD = node_modules/.bin/browserify

SMOKECHROME = node_modules/.bin/tap-closer | \
	node_modules/.bin/smokestack -b chrome

SMOKEFIREFOX = node_modules/.bin/tap-closer | \
	node_modules/.bin/smokestack -b firefox

run-test-server:
	node test-server.js

run-test-server-plain-http:
	node test-server.js --use-http > tests/fixtures/server-pid.txt &

run-chrome-test: 
	$(BROWSERIFYCMD) -d tests/parent-appriser-tests.js | $(SMOKECHROME)
	$(BROWSERIFYCMD) -d tests/player-router-tests.js | $(SMOKECHROME)

run-firefox-test:
	$(BROWSERIFYCMD) -d tests/parent-appriser-tests.js | $(SMOKEFIREFOX)
	$(BROWSERIFYCMD) -d tests/player-router-tests.js | $(SMOKEFIREFOX)

test-chrome: run-test-server-plain-http run-chrome-test kill-web-server

test-firefox: run-test-server-plain-http run-firefox-test kill-web-server

kill-web-server:
	kill $(shell cat tests/fixtures/server-pid.txt)
	rm -f tests/fixtures/server-pid.txt

