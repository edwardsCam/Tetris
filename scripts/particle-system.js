/*jslint browser: true, white: true, plusplus: true */
/*global GAME, Random */
GAME.particleSystem = function(spec) {
    'use strict';
    var that = {},
        nextName = 1, // unique identifier for the next particle
        particles = {}; // Set of all active particles

    //------------------------------------------------------------------
    //
    // This creates one new particle
    //
    //------------------------------------------------------------------
    that.create = function() {
        var p = {
            image: spec.image,
            size: Random.nextGaussian(10, 4),
            center: {
                x: spec.center.x,
                y: spec.center.y
            },
            direction: Random.nextCircleVector(),
            speed: Random.nextGaussian(spec.speed.mean, spec.speed.stdev), // pixels per second
            rotation: 0,
            lifetime: Random.nextGaussian(spec.lifetime.mean, spec.lifetime.stdev), // How long the particle should live, in seconds
            alive: 0 // How long the particle has been alive, in seconds
        };

        //
        // Ensure we have a valid size - gaussian numbers can be negative
        p.size = Math.max(1, p.size);
        //
        // Same thing with lifetime
        p.lifetime = Math.max(0.01, p.lifetime);
        //
        // Assign a unique name to each particle
        particles[nextName++] = p;
    };

    //------------------------------------------------------------------
    //
    // Update the state of all particles.  This includes remove any that 
    // have exceeded their lifetime.
    //
    //------------------------------------------------------------------
    that.update = function(elapsedTime) {
        var removeMe = [],
            value,
            particle;

        for (value in particles) {
            if (particles.hasOwnProperty(value)) {
                particle = particles[value];
                //
                // Update how long it has been alive
                particle.alive += elapsedTime;

                //
                // Update its position
                particle.center.x += (elapsedTime * particle.speed * particle.direction.x);
                particle.center.y += (elapsedTime * particle.speed * particle.direction.y);

                //
                // Rotate proportional to its speed
                particle.rotation += particle.speed / 500;

                //
                // If the lifetime has expired, identify it for removal
                if (particle.alive > particle.lifetime) {
                    removeMe.push(value);
                }
            }
        }
        //
        // Remove all of the expired particles
        for (value = 0; value < removeMe.length; value++) {
            delete particles[removeMe[value]];
        }
        removeMe.length = 0;
    };

    that.setCenter = function(new_spec) {
        spec.center.x = new_spec.x;
        spec.center.y = new_spec.y;
    }

    that.isEmpty = function() {
        for (var value in particles) {
            return false;
        }
        return true;
    }

    //------------------------------------------------------------------
    //
    // Render all particles
    //
    //------------------------------------------------------------------
    that.render = function() {
        var value,
            particle;

        for (value in particles) {
            if (particles.hasOwnProperty(value)) {
                particle = particles[value];
                GAME.graphics.drawImage(particle);
            }
        }
    };

    return that;
};