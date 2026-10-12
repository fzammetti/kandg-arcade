/**
 * The title sequence.  The word ARCADE is drawn one pen stroke at a time, each stroke fading in; then the words
 * "Krelmac and Gentoo" drop from the top of the screen, crash to a halt just above it and bounce; then Gentoo and
 * Krelmac each have something to say about it.  Any key press or tap of the screen skips it.
 *
 * This is the port of title.cpp.
 *
 * Two things about this screen are worth knowing before reading the code:
 *
 *   1. It never clears the screen while it is running.  It relies on whatever it draws staying put, which is how the
 *      word builds up: each stroke is drawn over and over, a little more solid each time, on top of what is already
 *      there.
 *
 *   2. Its images are the only ones in the whole game where the see-through "color key" is black rather than pink.
 *      The pink ones were all given real transparency ahead of time (by img/convert_images.js), but these still
 *      need black making transparent, which is done when the screen loads, exactly where the original did it.
 */
class TitleSequenceScene extends GameScene {


  // The "Krelmac and Gentoo" image that drops down and bounces.
  kangImg = null;

  // The 18 pen strokes that make up the word ARCADE.  (The original called them letters, so that name is kept.)
  letters = [ ];

  // The sounds.
  sfxBackground = `sfx_title_background`;
  sfxCrash = `sfx_title_crash`;
  sfxKrelmac = `sfx_title_krelmac_ohgeez`;
  sfxGentoo = `sfx_title_gentoo_bhahaha`;

  // Flags: has each of these sounds been started yet?
  background_started = false;
  gentoo_started = false;
  krelmac_started = false;

  // Which stroke is currently fading in, and how far through its fade it is.
  currentLetter = 0;
  currentFadeVal = 0;

  // The opacity each stroke is drawn at on each of the 20 frames it takes to fade in.  Remember that each draw
  // lands on top of the previous ones, so the stroke gets steadily more solid.
  fadeVals = [ 0, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 255 ];

  // How far "Krelmac and Gentoo" moves on each frame of its bounce: up 30, back down 30, up 28, back down 28, and
  // so on, getting smaller each time until it comes to rest.
  bounceVals = [
    -30, 30, -28, 28, -26, 26, -24, 24, -22, 22, -20, 20, -18, 18, -16, 16,
    -14, 14, -12, 12, -10, 10, -8, 8, -6, 6, -4, 4, -2, 2, -1, 1
  ];

  // The vertical position of "Krelmac and Gentoo".  It starts just above the top of the screen.
  kangY = -25;

  // How far through the bounce we are.
  bounce_index = 0;

  // Which step of the sequence we are on: 0 = ARCADE is being drawn, 1 = "Krelmac and Gentoo" is falling, 2 = it is
  // bouncing, 3 = pausing while Gentoo speaks, 4 = pausing while Krelmac speaks, 5 = a final pause.
  title_step = 0;

  // Frame counters for the three pauses.
  end_delay = 0;
  gentoo_delay = 42;
  krelmac_delay = 48;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`TitleSequenceScene.constructor`);

    super(`TitleSequenceScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.
   */
  loadScreen() {

    console.log(`TitleSequenceScene.loadScreen()`);

    // Load the 18 strokes, gfx_title_01 to gfx_title_18, making black transparent in each.
    this.letters = [ ];
    for (let i = 1; i <= 18; i++) {
      let number = `${i}`;
      if (i < 10) {
        number = `0${i}`;
      }
      this.letters.push(Surface.CreateColorKeyed(`gfx_title_${number}`, 0, 0, 0));
    }

    // And "Krelmac and Gentoo", likewise.
    this.kangImg = Surface.CreateColorKeyed(`gfx_title_kang`, 0, 0, 0);

    // Start the sequence from the very beginning.
    this.background_started = false;
    this.gentoo_started = false;
    this.krelmac_started = false;
    this.currentLetter = 0;
    this.currentFadeVal = 0;
    this.kangY = -25;
    this.bounce_index = 0;
    this.title_step = 0;
    this.end_delay = 0;
    this.gentoo_delay = 42;
    this.krelmac_delay = 48;

    // The original showed a blank, black screen while it was loading.  This matters more than usual here, because
    // the sequence never clears the screen itself.
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End loadScreen(). */


  /**
   * Cleans the screen up.
   */
  destroyScreen() {

    console.log(`TitleSequenceScene.destroyScreen()`);

    // Silence everything.  If the sequence was skipped, the background sound and voices will still be playing.
    sndObj.stopSounds();

    // Let go of the images we made.
    this.letters = [ ];
    this.kangImg = null;

    // The original cleared the screen here and showed the words "... One Moment Please ..." while the main menu
    // loaded, which took a noticeable moment on a PocketPC.  Here the menu is ready instantly, so the message
    // would only flash up for a split second and look like a glitch.  We just clear the screen.  (The same goes
    // for every other screen in the port: the message is never shown.)
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End destroyScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Start background SFX if not started yet.
    if (!this.background_started) {
      this.background_started = true;
      sndObj.playSound(this.sfxBackground);
    }

    // Note that the steps below are deliberately separate "if"s rather than an if/else chain, just as they were in
    // the original.  It means that on the frame where one step finishes, the next step has already begun.

    // Letters fading in.
    if (this.title_step === 0) {
      inBackbuffer.BltFast(0, 140, this.letters[this.currentLetter], null, this.fadeVals[this.currentFadeVal]);
      this.currentFadeVal++;
      if (this.currentFadeVal > 19) {
        this.currentFadeVal = 0;
        this.currentLetter++;
        if (this.currentLetter > 17) {
          this.title_step = 1;
        }
      }
    }

    // Krelmac & Gentoo falling down.
    if (this.title_step === 1) {
      inBackbuffer.FillRect(CRect(0, this.kangY, 240, this.kangY + 25), RGB(0, 0, 0));
      inBackbuffer.BltFast(0, this.kangY, this.kangImg, null);
      this.kangY = this.kangY + 4;
      if (this.kangY > 110) {
        sndObj.playSound(this.sfxCrash);
        this.title_step = 2;
      }
    }

    // Krelmac & Gentoo bouncing.
    if (this.title_step === 2) {
      inBackbuffer.FillRect(CRect(0, this.kangY, 240, this.kangY + 25), RGB(0, 0, 0));
      this.kangY = this.kangY + this.bounceVals[this.bounce_index];
      inBackbuffer.BltFast(0, this.kangY, this.kangImg, null);
      this.bounce_index++;
      if (this.bounce_index > 31) {
        this.title_step = 3;
      }
    }

    // Pausing while Gentoo's sound goes.
    if (this.title_step === 3) {
      if (!this.gentoo_started) {
        this.gentoo_started = true;
        sndObj.playSound(this.sfxGentoo);
      }
      this.gentoo_delay--;
      if (this.gentoo_delay < 0) {
        this.title_step = 4;
      }
    }

    // Pausing while Krelmac's sound goes.
    if (this.title_step === 4) {
      if (!this.krelmac_started) {
        this.krelmac_started = true;
        sndObj.playSound(this.sfxKrelmac);
      }
      this.krelmac_delay--;
      if (this.krelmac_delay < 0) {
        this.title_step = 5;
      }
    }

    // Ending delay.
    if (this.title_step === 5) {
      this.end_delay++;
      if (this.end_delay > 48) {
        this.doDestroy(`MainMenuScene`);
      }
    }

  } /* End pnf(). */


  /**
   * A key was released.  Any key at all skips the title sequence.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    this.doDestroy(`MainMenuScene`);

  } /* End ku(). */


  /**
   * The stylus came up.  A tap anywhere on the screen skips the title sequence.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    this.ku(null);

  } /* End su(). */


} /* End class. */
