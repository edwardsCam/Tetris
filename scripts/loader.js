var MYGAME = {
    images: {},

    width : 10,
    height : 20,

    status: {
        preloadRequest: 0,
        preloadComplete: 0
    }
};

//------------------------------------------------------------------
//
// Wait until the browser 'onload' is called before starting to load
// any external resources.  This is needed because a lot of JS code
// will want to refer to the HTML document.
//
//------------------------------------------------------------------
window.addEventListener('load', function() {
    console.log('Loading resources...');
    Modernizr.load([{
        load: [
            'preload!scripts/renderer.js',
        ],
        complete: function() {
            console.log('All files requested for loading...');
        }
    }]);
}, false);

//
// Extend yepnope with our own 'preload' prefix that...
// * Tracks how many have been requested to load
// * Tracks how many have been loaded
// * Places images into the 'images' object
yepnope.addPrefix('preload', function(resource) {
    console.log('preloading: ' + resource.url);

    MYGAME.status.preloadRequest += 1;
    var isImage = /.+\.(jpg|png|gif)$/i.test(resource.url);
    resource.noexec = isImage;
    resource.autoCallback = function(e) {
        if (isImage) {
            var image = new Image();
            image.src = resource.url;
            MYGAME.images[resource.url] = image;
        }
        MYGAME.status.preloadComplete += 1;

        //
        // When everything has finished preloading, go ahead and start the game
        if (MYGAME.status.preloadComplete === MYGAME.status.preloadRequest) {
            console.log('Preloading complete!');
            MYGAME.initialize();
        }
    };

    return resource;
});

//
// Extend yepnope with a 'preload-noexec' prefix that loads a script, but does not execute it.  This
// is expected to only be used for loading .js files.
yepnope.addPrefix('preload-noexec', function(resource) {
    console.log('preloading-noexec: ' + resource.url);
    resource.noexec = true;
    return resource;
});