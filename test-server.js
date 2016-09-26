var express = require('express');
var httpProxy = require('http-proxy');
var https = require('https');
var http = require('http');
var fs = require('fs');
var jsonfile = require('jsonfile');

var useHTTPS = true;
var verbose = true;

if (process.argv.length > 2 && process.argv[2] === '--use-http') {
  useHTTPS = false;
}

var matterhornProxyURL = 'https://matterhorn.dce.harvard.edu/';
var proxyOpts = {
  target: matterhornProxyURL
};

var mostRecentWatchReqUrl;

var cannedEpisode = jsonfile.readFileSync(
  // __dirname + '/fixtures/example-episode.json'
  // __dirname + '/fixtures/example-live-episode.json'
  __dirname + '/fixtures/example-captions-episode.json'
);

var cannedSeries = jsonfile.readFileSync(
  __dirname + '/fixtures/example-search-series.json'
);

var cannedMe = jsonfile.readFileSync(
  __dirname + '/fixtures/example-me.json'
);

var cannedCaptions = fs.readFileSync(
  __dirname + '/fixtures/captions.dfxp'
);

var cannedAnnotations = fs.readFileSync(
  __dirname + '/fixtures/example-paella-annotations.json'
);

var cannedVisualAnnotations = fs.readFileSync(
  __dirname + '/fixtures/example-paella-annotations-visual.json'
);

var cannedTimedComments = fs.readFileSync(
  __dirname + '/fixtures/example-dce-timedcomment.json'
);

var cannedComments = fs.readFileSync(
  __dirname + '/fixtures/example-paella-annotations-comments.json'
);

var cannedHeartbeatFootprints = fs.readFileSync(
  __dirname + '/fixtures/example-paella-footprint.json'
);

var proxy = httpProxy.createProxyServer({
  secure: false
});

var app = express();

var router = express.Router();

// Handle login.html requests with a redirect.
router.get('/login.html*', skipToContent);
router.get('/info/me.json*', me);

// Serve a canned episode for episode requests.
router.get('/search/episode.json*', episode);

// Serve a canned series for series requests.
router.get('/search/series.json*', series);

router.get('/captions.dfxp', captions);

// Serve a canned episode for episode requests.
router.get('/annotation/annotations.json*', annotations);

// Serve a canned episode after an annotation new comment update/write 
router.put('/annotation/', annotations);

// Serve a canned canAnnotate response
router.get('/annotation/canAnnotate*', canannotate);

// Serve a canned episode after an annotation reply update/write 
router.put('/annotation/[0-9]*', annotations);

// Serve a canned footprint for footprint requests.
router.get('/usertracking/footprint.json*', footprint);

// // Quitely consume the usertracking puts
router.get('/usertracking/*', swallow);

// // Quitely consume the footprint puts
router.get('/footprint/*', swallow);

// Handle everything else with the proxy back to the Matterhorn server.
router.get('/*', passToProxy);

// Serve /engage/player/* requests from the local build folder.
app.use('/engage/player', express.static('build/dce-paella-opencast'));
app.use('/engage/player', express.static('build/dce-paella-opencast/resources'));
app.use('/', router);


function skipToContent(req, res, next) {
  log('Skipping to', mostRecentWatchReqUrl);
  if (mostRecentWatchReqUrl) {
    res.redirect(mostRecentWatchReqUrl);
  }
  next();
}

function swallow(req, res, next) {
  log('Swallowing ' + req.url);
  res.end();
}

function episode(req, res) {
  log('Serving episode.');
  res.json(cannedEpisode);
}

function me(req, res) {
  log('Serving me.json.');
  res.json(cannedMe);
}

function series(req, res) {
  log('Serving search-series.');
  res.json(cannedSeries);
}

function captions(req, res) {
  log('Serving captions.');
  res.header('Content-Type', 'text/xml');
  res.end(cannedCaptions);
}

function footprint(req, res) {
   log('Serving footprints.');
  res.header('Content-Type', 'application/json');
  res.end(cannedHeartbeatFootprints);
}

function canannotate(req, res) {
  log('Serving canned yes for canAnnotate.');
  res.header('Content-Type', 'text/plain');
  res.end("true");
}

function annotations(req, res) {
  log('Serving annotations, type: ' + req.query.type);
  res.header('Content-Type', 'text/json');
  if (req.query.type == 'paella/visualAnnotations') {
    res.end(cannedVisualAnnotations);
  } else if (req.query.type == 'paella/comments') {
    res.end(cannedComments);
  } else if (req.query.type == 'paella/timedComments') {
    res.end(cannedTimedComments);
  } else {
    // 'paella/annotations' and default all other annotation types
    res.end(cannedAnnotations);
  }

}

function passToProxy(req, res) {
  log('Proxying:', req.url);

  if (req.url.indexOf('/engage/player/watch.html') === 0) {
    mostRecentWatchReqUrl = req.url;
  }

  proxy.web(req, res, proxyOpts);
}

var httpsOpts = {
  key: fs.readFileSync(__dirname + '/fixtures/test.key'),
  cert: fs.readFileSync(__dirname + '/fixtures/test.crt')
};

var server;
if (useHTTPS) {
  server = https.createServer(httpsOpts, app);
}
else {
  server = http.createServer(app);
}

server.listen(3000);

function log() {
  if (verbose) {
    console.log.apply(console, arguments);
  }
}

log('Listening on port 3000.');

// Needed by test targets in Makefile.
console.log(process.pid);

