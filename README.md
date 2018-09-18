# Hello world add-on for Stremio with Express
### Adds a few public domain movies to Stremio

This example shows how to make a Stremio Add-on with Node.js and [Express](https://www.npmjs.com/package/express).

Alternatively, you can also see how to make a Stremio Add-on with Stremio's [Add-on SDK](https://github.com/Stremio/stremio-addon-sdk) at [Stremio Add-on Hello World](https://github.com/Stremio/addon-helloworld).


## Quick Start

```bash
npm install
npm start
```

Then run Stremio, click the add-on button (puzzle piece icon) on the top right, and write `http://127.0.0.1:7000/manifest.json` in the "Addon Repository Url" field on the top left.


## Basic tutorial on how to re-create this add-on step by step

Step 1: init a npm project
=========================

**Pre-requisites: Node.js, Git**

This is the first, boilerplate step of creating an add-on for Stremio. Create a node.js project and add the [stremio-addons](http://github.com/Stremio/stremio-addons) module as dependency.

```bash
mkdir stremio-hello-world
cd stremio-hello-world
npm init
npm install stremio-addons --save
git add *
git commit -a -m "initial commit"
```

**NOTE:** to test this add-on, you need to complete Step 3 (init an add-on server). Start the add-on with `node index.js` and add the add-on to stremio by going to the *Addons* page (top right icon) and typing `http://127.0.0.1:7000/manifest.json` in the text field in the top left and pressing enter. 

Step 2: Create index.js, fill manifest
===========================

In this step, we define the add-on name, description and purpose.

Create an `index.js` file:
```javascript
var express = require("express")
var addon = express()

var manifest = { 
    "id": "org.stremio.helloworldexpress",
    "version": "1.0.0",

    "name": "Hello World Express Addon",
    "description": "Sample addon made with Express providing a few public domain movies",

//    "icon": "URL to 256x256 monochrome png icon", 
//    "background": "URL to 1024x786 png/jpg background",

    // set what type of resources we will return
    "resources": [
        "catalog",
        "stream"
    ],

    "types": ["movie", "series"], // your add-on will be preferred for those content types

    // set catalogs, we'll be making 2 catalogs in this case, 1 for movies and 1 for series
    "catalogs": [
        {
            type: 'movie',
            id: 'helloworldmovies'
        },
        {
            type: 'series',
            id: 'helloworldseries'
        }
    ],

    // prefix of item IDs (ie: "tt0032138")
    "idPrefixes": [ "tt" ]

};

var respond = function(res, data) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Content-Type', 'application/json')
    res.send(data)
}

addon.get('/manifest.json', function (req, res) {
    respond(res, manifest)
})

```

Step 3: basic streaming
==============================

To implement basic streaming, we will set-up a dummy dataset with a few public domain movies. 

```javascript
var dataset = {
    // Some examples of streams we can serve back to Stremio ; see https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/stream.md
    "tt0051744": { name: "House on Haunted Hill", type: "movie", infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }, // torrent
    "tt1254207": { name: "Big Buck Bunny", type: "movie", url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // HTTP stream
    "tt0031051": { name: "The Arizone Kid", type: "movie", yt_id: "m3BKVSpP80s", availability: 3 }, // YouTube stream
    "tt0137523": { name: "Fight Club", type: "movie", externalUrl: "https://www.netflix.com/watch/26004747" }, // redirects to Netflix
    "tt1748166:1:1": { name: "Pioneer One", type: "series", infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" }, // torrent for season 1, episode 1
};
```

And then implement ``/stream/`` as follows:

```javascript
addon.get('/stream/:type/:id.json', function(req, res) {

    if (!req.params.id)
        return respond(res, { streams: [] })


    if (dataset[req.params.id]) {
        respond(res, { streams: [dataset[req.params.id]] });
    } else
        respond(res, { streams: [] })

})
```

**As you can see, this is an add-on that allows Stremio to stream 4 public domain movies and 1 series episode - in very few lines of code.**

Depending on your source, you can implement streaming (`/stream/`) or catalogs (`/catalog/`) of ``movie``, ``series``, ``channel`` or ``tv`` content types.

To load that add-on in the desktop Stremio, click the add-on button (puzzle piece icon) on the top right, and write `http://127.0.0.1:7000/manifest.json` in the "Addon Repository Url" field on the top left.

Step 4: implement catalog
==============================

We have 2 types of resources serving meta: 

- ``/catalog/`` serves basic metadata (id, type, name, poster) and handles loading of both the catalog feed and searching;

- ``/meta/`` serves [advanced metadata](https://github.com/Stremio/stremio-addon-sdk/blob/docs/docs/api/responses/meta.md) for individual items, for imdb ids though (what we're using in this example add-on), we do not need to handle this method at all as it is handled automatically by Stremio's Cinemeta

**For now, we have the simple goal of loading the movies we provide on the top of Discover.**

Append to index.js:

```javascript
var METAHUB_URL = 'https://images.metahub.space'

var basicMeta = function(data, index) {
    // To provide basic meta for our movies for the catalog
    // we'll fetch the poster from Stremio's MetaHub
    var imdbId = index.split(':')[0]
    return {
        id: imdbId,
        type: data.type,
        name: data.name,
        poster: METAHUB_URL+'/poster/medium/'+imdbId+'/img',
    }
}

addon.get('/catalog/:type/:id.json', function(req, res) {

    var metas = []

    // iterate dataset object and only add movies or series
    // depending on the requested type
    for (var key in dataset) {
        if (req.params.type == dataset[key].type) {
            metas.push(basicMeta(dataset[key], key))
        }
    }

    respond(res, { metas: metas })
})
```

Step 5: run addon
===================

It's time to run our add-on!

Append to index.js:
```javascript
addon.listen(7000, function() {
    console.log('Add-on Repository URL: http://127.0.0.1:7000/manifest.json')
})
```

Run the add-on with `npm start` and add `http://127.0.0.1:7000/manifest.json` as the Repository URL in Stremio.

Step 7: result
===================

![addlink](https://user-images.githubusercontent.com/1777923/43146711-65a33ccc-8f6a-11e8-978e-4c69640e63e3.png)
![discover](screenshots/stremio-addons-discover.png)
![board](screenshots/stremio-addons-board.png)
![streaming from add-on](screenshots/streaming.png)
