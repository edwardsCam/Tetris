var GAME = {
    images: {},
    sounds: {},

    width: 10,
    height: 20,

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
    GAME.audioExt = '';
    //
    // Find out which kind of audio support we have
    if (Modernizr.audio.mp3 === 'probably') {
        console.log('We have MP3 support');
        GAME.audioExt = 'mp3';
    }
    else if (Modernizr.audio.wav === 'probably') {
        console.log('We have WAV support');
        GAME.audioExt = 'wav';
    }

    Modernizr.load([{
        load: [
            'preload!scripts/random.js',
            'preload!scripts/particle-system.js',
            'preload!scripts/renderer.js',
            'preload!img/fire.png',
            'preload!img/smoke.png',
            'preload!audio/theme.' + GAME.audioExt,
            'preload!audio/SFX_GameOver.' + GAME.audioExt,
            'preload!audio/SFX_LevelUp.' + GAME.audioExt,
            'preload!audio/SFX_PieceHardDrop.' + GAME.audioExt,
            'preload!audio/SFX_PieceSoftDrop.' + GAME.audioExt,
            'preload!audio/SFX_PieceRotateLR.' + GAME.audioExt,
            'preload!audio/SFX_SpecialLineClearSingle.' + GAME.audioExt,
            'preload!audio/SFX_SpecialLineClearDouble.' + GAME.audioExt,
            'preload!audio/SFX_SpecialLineClearTriple.' + GAME.audioExt
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

    GAME.status.preloadRequest += 1;
    var isImage = /.+\.(jpg|png|gif)$/i.test(resource.url);
    var isSound = /.+\.(mp3|wav)$/i.test(resource.url);
    resource.noexec = isImage || isSound;
    resource.autoCallback = function(e) {
        if (isImage) {
            var image = new Image();
            image.src = resource.url;
            GAME.images[resource.url] = image;
        } else if (isSound){
            var sound = new Audio(resource.url);
            console.log(resource.url);
            GAME.sounds[resource.url] = sound;
        }
        GAME.status.preloadComplete += 1;

        //
        // When everything has finished preloading, go ahead and start the game
        if (GAME.status.preloadComplete === GAME.status.preloadRequest) {
            console.log('Preloading complete!');
            GAME.initialize();
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