var express = require('express');
var httpProxy = require('http-proxy');
var https = require('https');
var fs = require('fs');
var jsonfile = require('jsonfile');

var matterhornProxyURL = 'https://matterhorn.dce.harvard.edu/';
var proxyOpts = {
  target: matterhornProxyURL
};

var mostRecentWatchReqUrl;

var cannedEpisode = jsonfile.readFileSync(
  // __dirname + '/fixtures/example-episode.json'
  __dirname + '/fixtures/example-live-episode.json'
);

var cannedMe = jsonfile.readFileSync(
  __dirname + '/fixtures/example-me.json'
);

var proxy = httpProxy.createProxyServer({
  secure: false
});

var app = express();

var router = express.Router();

// // Handle login.html requests with a redirect.
router.get('/login.html*', skipToContent);
router.get('/info/me.json*', me);

// // Serve a canned episode for episode requests.
router.get('/search/episode.json*', episode);

// Handle everything else with the proxy back to the Matterhorn server.
router.get('/*', passToProxy);


// Serve /engage/player/* requests from the local build folder.
app.use('/engage/player', express.static('build'));
app.use('/engage/player', express.static('build/resources'));
app.use('/', router);


function skipToContent(req, res, next) {
  console.log('Skipping to', mostRecentWatchReqUrl);
  if (mostRecentWatchReqUrl) {
    res.redirect(mostRecentWatchReqUrl);
  }
  next();
}

function episode(req, res) {
  console.log('Serving episode.');
  res.json(cannedEpisode);
}

function me(req, res) {
  console.log('Serving me.json.');
  res.json(cannedMe);
}

function passToProxy(req, res) {
  console.log('Proxying:', req.url);

  if (req.url.indexOf('/player/watch.html') === 0) {
    mostRecentWatchReqUrl = req.url;
  }

  proxy.web(req, res, proxyOpts);
}

var httpsOpts = {
  key: fs.readFileSync(__dirname + '/fixtures/test.key'),
  cert: fs.readFileSync(__dirname + '/fixtures/test.crt')
};

var server = https.createServer(httpsOpts, app);
server.listen(3000);

console.log('Listening on port 3000.');
