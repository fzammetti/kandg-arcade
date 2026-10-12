/**
 * The base class for the game's three cut scenes: "The Adventure Begins", "Player Died" and "Win".  A cut scene is
 * a short animated film with voices, which the player watches (or skips by pressing any button or tapping the
 * screen).
 *
 * The cut scenes are played by OASIS (see Oasis.js), which reads a script file that says, frame by frame, which
 * pictures to show where and which sounds to play.  The script files are the original ones, unaltered.  A cut
 * scene's own class (NewAdventureScene.js, for example) only has to list the pictures and sounds its script uses,
 * and say which screen comes next; everything else is here.
 *
 * In the original each cut scene was a file of its own in the scenes folder (scenes/new_adventure.cpp and so on),
 * all three alike apart from those lists, and the OASIS functions were part of main.cpp.
 *
 * HOW A CUT SCENE IS DRAWN.  This is the one kind of screen in the game that is not drawn onto the backbuffer.
 * Oasis.js, which came from the conversion of Invasion: Trivia!, shows its pictures as ordinary Phaser images, and
 * it is used here exactly as it is.  So that the frame rate display (see GameScene.update()) can still be seen on
 * top of the film, as it could in the original, the backbuffer is kept see-through for as long as a cut scene is
 * playing and is moved in front of OASIS's pictures.
 */
class CutScene extends GameScene {


  // ----- What a cut scene says about itself.  Each cut scene's own class sets these four.

  // The name of the OASIS script to play.  See scriptAssets in assets.js.
  script_name = ``;

  // The names of the pictures the script uses.  OASIS calls these "actors", and the script refers to each one by
  // its position in this list, so the order matters: it must be the order the original loaded them in.
  image_actors = [ ];

  // The names of the sounds the script uses ("audio actors"), likewise in the original's order.
  audio_actors = [ ];

  // The screen to go to when the film ends or is skipped: one of the cs constants in main.js.
  screen_after = 0;

  // ----- Used while the cut scene is playing.

  // Our OASIS instance.  A new one is made each time the cut scene is shown.
  oasis = null;


  /**
   * Constructor.
   *
   * @param {string} inSceneKey The name Phaser knows the scene by.
   */
  constructor(inSceneKey) {

    super(inSceneKey);

  } /* End constructor. */


  /**
   * Sets the cut scene up and starts the film.  This is the port of the loader that each cut scene had in the
   * original (loadNewAdventure() and so on).
   */
  loadScreen() {

    console.log(`CutScene.loadScreen()`, this.scene.key);

    // The film is shown against black.  (The script itself asks for the screen to be cleared to black at one
    // point, when the picture shakes and its edges show.)
    this.cameras.main.setBackgroundColor(`#000000`);

    // Make the backbuffer see-through and put it in front of everything else, as explained at the top of this
    // file.  The pictures OASIS adds are all at depth 0, which is behind anything at depth 1.
    backbuffer.ClearToTransparent();
    this.backbufferImage.setDepth(1);

    // OASIS plays a sound by calling play() on its audio actor.  Give it one small stand-in object per sound.
    const audioActors = [ ];
    for (const soundName of this.audio_actors) {
      audioActors.push(this.makeAudioActor(soundName));
    }

    // Start the scene.  The script was loaded, with everything else, by PreloadScene.
    this.oasis = new Oasis();
    this.oasis.OASIS_StartScene(this.cache.binary.get(this.script_name), this.image_actors, audioActors);

  } /* End loadScreen(). */


  /**
   * Makes the object that stands for one sound in OASIS's list of audio actors.
   *
   * Oasis.js expects each audio actor to be something it can call play() on to start the sound, and destroy() on
   * when the scene is over.  In Invasion: Trivia! those were Phaser sound objects.  Here it is a small object of
   * our own that plays the sound through sndObj, like every other sound in this game, so that stopSounds() can
   * silence it when the film is skipped.
   *
   * NOTE on volume: every one of this game's scripts begins with OASIS's "restore default volume" command, which in
   * the original set each of the scene's sounds to volume 32, on a scale where 64 is full.  Oasis.js does not act
   * on that command (Invasion: Trivia! did not need it), so the volume is applied here instead.  See
   * oasisDefaultVolume in main.js.
   *
   * @param  {string} inSoundName The name of the sound.  See assets.js.
   * @return {object}             The stand-in, with play() and destroy() methods.
   */
  makeAudioActor(inSoundName) {

    return {

      /**
       * Starts the sound.
       *
       * @param {object} inConfig What OASIS asks for: loop (true to repeat the sound) and volume (which is ignored,
       *                          see above).
       */
      play: function(inConfig) {
        sndObj.playSound(inSoundName, inConfig.loop, oasisDefaultVolume);
      },

      /**
       * Called by OASIS when the scene ends.  There is nothing to do: sndObj tidies sounds away by itself.
       */
      destroy: function() {
      }

    };

  } /* End makeAudioActor(). */


  /**
   * Shows the next frame of the film.  This is the port of pnfNewAdventure() and its two companions.
   *
   * @param {Surface} inBackbuffer The backbuffer.  Nothing is drawn on it here; it is only kept clear.
   */
  pnf(inBackbuffer) {

    // Keep the backbuffer see-through.  It has to be cleared every frame, because the frame rate display is drawn
    // on it after this method returns, and would otherwise stay there if it were switched off.
    inBackbuffer.ClearToTransparent();

    // Let OASIS do one frame's worth of the script.  It answers 1 when the script has come to its end.
    if (this.oasis.OASIS_DoScene(this) === 1) {
      this.doDestroy(getSceneKeyForScreen(this.screen_after));
    }

  } /* End pnf(). */


  /**
   * A key was released.  Any key at all skips the rest of the film.  (Pressing a key down does nothing; like the
   * original, a cut scene only reacts to keys being let go.)
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    this.doDestroy(getSceneKeyForScreen(this.screen_after));

  } /* End ku(). */


  /**
   * The stylus was lifted.  A tap anywhere skips the rest of the film too.
   *
   * @param {object} inPoint Where the stylus was lifted.
   */
  su(inPoint) {

    this.ku(``);

  } /* End su(). */


  /**
   * Tidies up when the cut scene is over, whether it ran to the end or was skipped.  This is the port of the
   * destroyer that each cut scene had in the original, and of oasisEndScene().
   */
  destroyScreen() {

    console.log(`CutScene.destroyScreen()`, this.scene.key);

    // Let OASIS remove its pictures, and silence any voice that is still speaking.
    this.oasis.OASIS_EndScene();
    this.oasis = null;
    sndObj.stopSounds();

    // Leave the backbuffer as every other screen expects to find it: solid, and black.
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End destroyScreen(). */


} /* End class. */
