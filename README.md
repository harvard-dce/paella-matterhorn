DCE's Customizations over UPV's Paella Player for Opencast
===========================================================
This is Harvard DCE's Customizations over UPV's' Paella player for Opencast bundle.

DCE Development
===========

Branches and tags
-----------------

- To add a feature or fix a bug, create a branch off of **master**. When it is ready to be reviewed and tested, create a pull request from it to master.
- Tags are used to indicate which version of Paella this project is using. When you update the Paella submodule, tag paella-matterhorn with `paella` + the Paella tag + `-` + an hudce Matterhorn release version. i.e. `paella4.1.18/dceoc1.5.1-1.25.0`.

Building
--------
- Run `mvn clean install`

The OpsWorks runs Maven (`mvn` ), which reads the `pom.xml` which tells it to install node and run `grunt` to build everything. (For local development, you can just install Grunt yourself and  run `grunt` .)  `server.debug` is the default Grunt target because we do not currently minify for production.

Among other things, it:
- installs a local version of node if it is not found globally
- Copies files from the `dce-paella-extensions` module into `node_modules/upv-paella-opencast` and various other places (see the [Gruntfile] for details).
- Copies files from `build/upv-paella-opencast` into `build/dce-paella-opencast`.
- Also copies files from `vendor/...` into `build`.
- Concatenates the .less files together.

*How to read the Makefile*

[Make](https://bost.ocks.org/mike/make/) is a venerable and reliable Unix build tool. The Makefile format lets you specify targets that consist of:

1. Unix commands
2. Dependencies (other targets)

Dependencies
------------

dce-paella-extensions is a dependency that contains DCE-specific Paella changes.
paella-engage-ui (polimediaupv/paella-matterhorn.git#...) is a dependency that contains Polimedia UPV Paella Opencast code.
browserify supports building the DCE app-src extensions from this repository (extra features, such as routing)

Running locally (Development)
---------------
Globally install Grunt and Jshinit:
- Run `npm install -g grunt-cli jshint` or `sudo npm install -g grunt-cli jshint` if you cannot write to your global node_modules directory.

Locally install the project dependencies:
- Run `npm install`

Build the files:
- Run `grunt build`

If you want to run paella-matterhorn locally without deploying it as a jar within matterhorn (and matterhorn.dce.harvard.edu is currently OK):
- vi test-server.js // change the proxy to your locally running dev matterhorn server
- Run `make run-test-server`

This will create a server that will serve local copies of files under `build/` and will serve a canned `episode.json` and `me.json`, but will proxy everything else (like series information) to matterhorn.dce.harvard.edu.

To play a video in the test server, take a URL from production (matterhorn.dce.harvard.edu) and replace the host with `localhost:3000`. Make sure you use the https protocol.

If you want to run it under https instead of http, you can run the test server with `node test-server.js --use-https`.

To avoid having to run `npm publish` and `npm install` in the dce-paella-extensions local repo, just to see if a change worked in the context of paella-matterhorn, you can:

- From your local dce-paella-extensions project directory, Run `npm link` (with sudo if your global node_modules is in a place that requires it).
- Run `npm link dce-paella-extensions` in this directory. Now there will be a symlink-like link to your local dce-paella-extensions project.
- Then, run `grunt build.debug` in this directory to rebuild the project.



Tests
-----

To run parent frame communcation and player router tests, do:

    npm install
    vi test-server.js // to point to your locally running matterhorn server
    make test-chrome
    make test-firefox

This should run the tests in Chrome and Firefox respectively, and in your terminal, you should see the test results.

Much of the code in paella and paella-matterhorn are not covered by tests, so you do need to run locally and poke around to at least make sure you didn't break anything obvious when you make a change.

Non-Paella parts of the project
-------------------------------

In `app-src`, there are modules that get built into `app-index.js` via Browserify. `app-index.js` gets pulled into the web page at [paella-matterhorn/ui/watch.html](https://github.com/harvard-dce/paella-matterhorn/blob/master/paella-matterhorn/ui/watch.html).

These modules are [Node-style modules](https://nodejs.org/docs/latest/api/modules.html#modules_modules) that have these basic characteristics:

- All of the code in a module is wrapped in its own JavaScript scope.
- Modules can import other modules with `require` statements. e.g. In `app-src/index.js` –

    var setUpParentFrameCommunications = require('./set-up-parent-frame-communications');

Imports a function from the `set-up-parent-frame-communications.js` module into the index module.

- Properties assigned to `modules.exports` are available to external modules that `require` the module.

The `app-src/index.js` has a function that immediately executes when it's loaded. It is named `go`.

    ((function go() {
      setUpParentFrameCommunications(document);
      disableAutoHiding();
      clearDoneUrlCookie();
      router.route();
    })());

These are entry points into the four things that the modules in `app-src` currently do:

- It sets up communications with parent frames. When the player is loaded in an iframe, the player can A) respond to play messages from the parent window and B) can send time update messages to a parent window. [Here's an example of that in action.](http://jsbin.com/qomifisaba/edit?html,js,output)

- Disables auto-hiding of the play controls after the player idles. DCE support and Rebecca Nesson do not find this to be a desirable behavior for students actively watching lectures and taking notes and backing up and rewatching segments. However, it is a core feature of Paella that cannot be disabled via config. Hence, we assign a no-op to `paella.player.controls.restartHideTimer`.

- If it exists, it clears a cookie named `done_url` in order to prevent certain authentication problems. I forget specifically which, but Naomi Maekawa will probably remember if you ask her.

- Runs the included `player-router` module in order to process the URL and respond to seek requests that are the result of URL changes from either the user or a parent window.

============================
The following are the original UPV Paella Player README
============================

Paella Player for Opencast
============================
This is the Paella player for opencast bundle.

![Paella Player Logo](doc/images/paella_mh.png)

Paella Player
=============
The Paella (pronounce “paeja”) Player is a HTML5 multistream video player capable of playing multiple audio & video streams synchronously and supporting a number of user plugins. It is specially designed for lecture recordings, like Matterhorn Lectures or Polimedia pills.

By using Paella students can view both the lecture hall and the teacher's screen, get info about the lecture (slides, OCR, series videos, footprints) and interact with the lecture (views, comments). Teachers can also soft edit the lecture to set the start and end point or make breaks in the recording. 

If you want to use Paella player, but does not have a Matterhorn installation, you can use the [standalone](https://github.com/polimediaupv/paella) version of paella.

Main characteristics
====================
- Multi stream video player
- Based in HTML5 and Javascript
- Resize position/size of video windows while playing
- Play/Pause/30 seconds back controls
- Jump anywhere in the video keeping both tracks in sync
- Jump by clicking on the slide list
- High quality slides while seeking
- Can handle progressive download, pseudostreaming and RTMP streaming servers
- Support of .flv and .mp4 files
- Easily change the relative position of presenter and presentation windows
- Native Fullscreen version
- Embeddable
- “Publish to” buttons for Facebook and Twitter
- Captions support
- Comments (experimental)
- Easy skinning
- Easy install
- Soft Editing features: Trimming and breaks
- Support of Chrome, Firefox, Safari and Internet Explorer 9 an 10 browsers
- Compatible with Opencast Matterhorn 1.4


Build and Install
=================

To build Paella Player for Opencast, please read the [documentation](doc/README.md).
