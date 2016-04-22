var express = require('express');
var oauth = require('oauth').OAuth2;
var request = require('request');
var bodyParser = require('body-parser');
var compression = require('compression');
var instadate = require('instadate');

function toResponse(obj) {
  return JSON.stringify(obj);
}

var config = {
  "consumerKey": "44l6rQDTX2Lbo8RaBjflsjNZ9",
  "consumerSecret": "UKeVnq1k6BMAidGWCenDrsAFsOhqi0r9s3WwXWpFHsIkZ4wRVZ",
  "accessToken": "14771000-74677cKyqnWWPRCHvxQFC0AN3H0huTSH6RJ8f9tbI",
  "accessTokenSecret": "fZF4TjepJiPmhHnLwzEukDvNG12U3yRiw6LNbjpsA36F3"
};

//TWITTER AUTHENICATION
var token = null;
var oauth2 = new oauth(config.consumerKey, config.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);
oauth2.getOAuthAccessToken('', {
  'grant_type': 'client_credentials'
}, function (e, access_token) {
  console.log("authenticated!");
  token = access_token;
});


var app = express();
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));

var port = process.env.PORT || 3000;

var server = app.listen(port, function() {
  console.log('Example app listening at http://%s:%s', 'localhost', port);
});

app.get('/api/:user', function(req, res) {
  
  var user = req.params.user;

  var today = new Date();
  var tomorrow = instadate.addDays(today, 1);
  var todayLastYear = instadate.addYears(today, -1);
  var tomorrowLastYear = instadate.addYears(tomorrow, -1);

  var options = {
    url: 'https://api.twitter.com/1.1/search/tweets.json?q=from:' + user + ' since:' + instadate.isoDateString(todayLastYear) + ' until:' + instadate.isoDateString(tomorrowLastYear),
    method: 'get',
    auth: {
      bearer: token
    }
  }
  
  res.header('Content-Type', 'application/json');

  var dataset = [];

  request(options, function(error, response, body) {
    var results = JSON.parse(body);
    if (results.statuses.length > 0) {
      results.statuses.forEach(function(status){
        dataset.push({
          id: status.id_str,
          tweet: status.text
        })
      });
      res.send(toResponse(dataset));

    } else {
      res.status(404);
      res.send(toResponse({
        messsage: 'No tweets today a year ago.'
      }));
    }
  });
});

app.get('/api/:user/tweet/:tweet', function(req, res) {
  
  var user = req.params.user;
  var tweet = req.params.tweet;

  var options = {
    url: 'https://api.twitter.com/1.1/statuses/show.json',
    method: 'get',
    qs: {
      id: tweet
    },
    auth: {
      bearer: token
    }
  }

  request(options, function(error, response, body) {
    var result = JSON.parse(body);

    res.header('Content-Type', 'application/json');
    res.send(toResponse({
      user:user,
      tweet: result.text
    }));
  });
});

app.get('/*', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

