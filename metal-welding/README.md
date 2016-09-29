Metal Welding Simulation
======

How to run:
* Start HTTP server (e.g. using `python -m SimpleHTTPServer`)
* Enjoy

Used libraries:
* Three.js (for displaying 3D objects)
* jQuery (controls)

Additional features:
* Implemented 3 particle systems (sparks, smoke and vortices)
* Added vortex force so that there's a random force applied to the smoke particles
* Collision detection between particles and custom objects (loaded from .obj files, in this case, the welder)
* Realistic lighting and texturing
* User interaction: users selects where the particles are generated.
