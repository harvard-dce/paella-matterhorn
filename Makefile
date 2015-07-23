PAELLADIR = submodules/paella
EXTDIR = node_modules/dce-paella-extensions

copy-extensions-to-paella: \
	copy-vendor-extensions-to-paella \
	copy-resources-to-paella \
	copy-test-repository-to-paella \
	copy-config-to-paella

copy-vendor-extensions-to-paella:
	mkdir -p $(PAELLADIR)/vendor && \
	cp -r $(EXTDIR)/vendor/* $(PAELLADIR)/vendor

copy-resources-to-paella:
	mkdir -p $(PAELLADIR)/resources && \
	cp -r $(EXTDIR)/resources/* $(PAELLADIR)/resources

copy-test-repository-to-paella:
	mkdir -p $(PAELLADIR)/repository_test/repository && \
	cp -r $(EXTDIR)/repository_test/repository/* $(PAELLADIR)/repository_test/repository

copy-config-to-paella:
	mkdir -p $(PAELLADIR)/config/profiles && \
	cp $(EXTDIR)/config/profiles/profiles.json $(PAELLADIR)/config/profiles
