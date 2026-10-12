/**
 * The Preload scene is responsible for loading all the game's images and sounds, and for creating the things that
 * every screen shares (the backbuffer and the fonts).  Since we need a Phaser scene to do most of that work, this
 * is that scene.
 *
 * It also waits for the player to click (or press a key) before the game starts.  That is not just for show:
 * browsers refuse to play any sound on a page until the person using it has interacted with it in some way.  If we
 * went straight into the game, the intro and title screen would play in silence.
 */
class PreloadScene extends Phaser.Scene {


  // The HTML element that covers the game screen while loading is going on.
  loadingOverlay = null;

  // How many files failed to load.
  loadErrorCount = 0;

  // The scene we will start once the player clicks, and a flag saying that we are waiting for that click.
  startingSceneKey = null;
  waitingForPlayer = false;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`PreloadScene.constructor`);

    super({ key: `PreloadScene` });

  } /* End constructor. */


  /**
   * Preload scene assets.  Phaser calls this first, and does not call create() until everything queued up here has
   * finished loading.
   */
  preload() {

    console.log(`PreloadScene.preload()`);

    this.loadingOverlay = document.getElementById(`loadingOverlay`);

    // Keep all asset lookups relative to the public folder so paths stay consistent regardless of host.
    this.load.setBaseURL(`.`);

    // Show how loading is going.  Phaser reports progress as a number from 0 to 1.
    this.load.on(`progress`, function(inProgress) {
      this.loadingOverlay.textContent = `...loading ${Math.floor(inProgress * 100)}%...`;
    }, this);

    // Make a note of anything that fails to load.  A missing file is not fatal: the rest of the game carries on,
    // and a missing sound is simply not played (see sndObj.playSound() in main.js).
    this.load.on(`loaderror`, function(inFile) {
      this.loadErrorCount++;
      console.warn(`PreloadScene: failed to load`, inFile.key, inFile.url);
    }, this);

    // Queue up every image and every sound named in the asset manifest (assets.js).  Each is loaded under its own
    // name, so the image img/gfx_menu_top.png becomes the image named gfx_menu_top.
    for (const imageName of imageAssets) {
      this.load.image(imageName, `img/${imageName}.png`);
    }
    for (const audioName of audioAssets) {
      this.load.audio(audioName, `sfx/${audioName}.mp3`);
    }

    // Queue up the cut scene scripts as well.  These are not text but raw bytes, each of which means something to
    // OASIS (see Oasis.js), so they are loaded as "binary" files.  Asking for a Uint8Array gives us the bytes as a
    // simple list of numbers from 0 to 255, which is what OASIS wants.
    for (const scriptName of scriptAssets) {
      this.load.binary(scriptName, `scripts/${scriptName}.oss`, Uint8Array);
    }

    // And, in the same way, the maps of the ship's five levels and the other data files.
    for (const mapName of mapAssets) {
      this.load.binary(mapName, `maps/${mapName}.map`, Uint8Array);
    }
    for (const dataName of dataAssets) {
      this.load.binary(dataName, `data/${dataName}.dat`, Uint8Array);
    }
    for (const interactionName of interactionAssets) {
      this.load.binary(interactionName, `character_interactions/${interactionName}.cid`, Uint8Array);
    }

  } /* End preload(). */


  /**
   * Create the scene.  By the time Phaser calls this, everything has been loaded.
   */
  create() {

    console.log(`PreloadScene.create()`, `load errors:`, this.loadErrorCount);

    // Create the backbuffer, the surface that every screen draws on.  We ask Phaser for a texture that is backed
    // by an HTML canvas, and then wrap that same canvas in a Surface so that we can draw on it.  From then on,
    // anything drawn on the backbuffer shows up wherever the texture is displayed.
    backbufferTexture = this.textures.createCanvas(`backbuffer`, screenWidth, screenHeight);
    backbuffer = new Surface(screenWidth, screenHeight, backbufferTexture.getCanvas());
    backbuffer.FillRect(null, RGB(0, 0, 0));
    backbufferTexture.refresh();

    // Create the two fonts.
    font1 = new BitmapFont(`font1`);
    font1_green = new BitmapFont(`font1_green`);

    // Make sure the volume matches the saved setting now that the sound system is definitely ready.
    setVolumeLevel();

    // Decide where to go next.
    const startingScene = getStartingScene();
    this.startingSceneKey = startingScene.key;

    // If a particular scene was asked for in the page address, this is a development session, so skip the click
    // and go straight there.  (Sound will start working as soon as the page is clicked or a key is pressed.)
    if (startingScene.requested) {
      this.startGame();
      return;
    }

    // Otherwise, ask the player to click, and wait.  The overlay lets clicks pass through it to the game screen
    // underneath, so we can simply listen for them here.  Any key will do as well.
    //
    // Note that we wait for the mouse button (or key) to be RELEASED, not pressed.  The very first screen of the
    // game is skipped by releasing any button or key, so if we started the game on the press, the release that
    // inevitably follows would land on that first screen and skip it before the player ever saw it.
    this.loadingOverlay.textContent = `Click to start`;
    this.waitingForPlayer = true;
    this.input.once(`pointerup`, this.startGame, this);
    this.input.keyboard.once(`keyup`, this.startGame, this);

  } /* End create(). */


  /**
   * Removes the loading overlay and starts the game.
   */
  startGame() {

    console.log(`PreloadScene.startGame()`, this.startingSceneKey);

    // Both a click and a key press lead here.  If the player somehow manages both at once, only act on the first.
    if (this.loadingOverlay === null) {
      return;
    }
    this.waitingForPlayer = false;

    // Remove the loading overlay now that the heavy startup work is finished.
    this.loadingOverlay.remove();
    this.loadingOverlay = null;

    this.scene.start(this.startingSceneKey);

  } /* End startGame(). */


} /* End class. */
