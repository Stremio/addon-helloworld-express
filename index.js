var util = require("util");
var express = require("express");
var addon = express();

var respond = function (res, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
};

var MANIFEST = {
  id: "org.stremio.helloworldexpress",
  version: "1.0.0",

  name: "Hello World Express Addon",
  description: "Sample addon made with Express providing a few public domain movies",

  //"icon": "URL to 256x256 monochrome png icon", 
  //"background": "URL to 1024x786 png/jpg background",

  types: ["movie", "series"], // your add-on will be preferred for those content types

  // set what type of resources we will return
  resources: [
    "catalog",
    "stream"
  ],

  // set catalogs, we'll be making 2 catalogs in this case, 1 for movies and 1 for series
  catalogs: [
    { type: "movie", id: "Hello World" },
    { type: "series", id: "Hello World" }
  ],

  // prefix of item IDs (ie: "tt0032138")
  idPrefixes: ["tt"]
};

var METAHUB_URL = 'https://images.metahub.space/poster/medium/%s/img';

var CATALOG = {
  movie: [
    { id: "tt0032138", name: "The Wizard of Oz", genres: ["Adventure", "Family", "Fantasy", "Musical"] },
    { id: "tt0017136", name: "Metropolis", genres: ["Drama", "Sci-Fi"] },
    { id: "tt0051744", name: "House on Haunted Hill", genres: ["Horror", "Mystery"] },
    { id: "tt1254207", name: "Big Buck Bunny", genres: ["Animation", "Short", "Comedy"], },
    { id: "tt0031051", name: "The Arizona Kid", genres: ["Music", "War", "Western"] },
    { id: "tt0137523", name: "Fight Club", genres: ["Drama"] }
  ],
  series: [
    {
      id: "tt1748166",
      name: "Pioneer One",
      genres: ["Drama"],
      videos: [
        { season: 1, episode: 1, id: "tt1748166:1:1", title: "Earthfall", released: "2010-06-16" }
      ]
    }
  ]
};

var STREAMS = {
  "movie": {
    "tt0032138": [
      { title: "Torrent", infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", fileIdx: 0 }
    ],
    "tt0017136": [
      { title: "Torrent", infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", fileIdx: 1 }
    ],
    "tt0051744": [
      { title: "Torrent", infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }
    ],
    "tt1254207": [
      { title: "HTTP URL", url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4" }
    ],
    "tt0031051": [
      { title: "YouTube", ytId: "m3BKVSpP80s" }
    ],
    "tt0137523": [
      { title: "External URL", externalUrl: "https://www.netflix.com/watch/26004747" }
    ]
  },

  "series": {
    "tt1748166:1:1": [
      { title: "Torrent", infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" }
    ]
  }
};

addon.param('type', function (req, res, next, val) {
  if (MANIFEST.types.includes(val)) {
    next();
  } else {
    next("Unsupported type " + val);
  }
});

addon.get('/manifest.json', function (req, res) {
  respond(res, MANIFEST);
});

addon.get('/catalog/:type/:id.json', function (req, res, next) {
  var metas = CATALOG[req.params.type].map(function (item) {
    return {
      id: item.id,
      type: req.params.type,
      name: item.name,
      genres: item.genres,
      poster: util.format(METAHUB_URL, item.id)
    };
  });

  respond(res, { metas: metas });
});

addon.get('/stream/:type/:id.json', function (req, res, next) {
  var streams = STREAMS[req.params.type][req.params.id] || [];

  respond(res, { streams: streams });
});

if (module.parent) {
  module.exports = addon;
} else {
  addon.listen(7000, function () {
    console.log('Add-on Repository URL: http://127.0.0.1:7000/manifest.json');
  });
}

