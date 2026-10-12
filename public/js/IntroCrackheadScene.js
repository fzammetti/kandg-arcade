/**
 * The second of the two logo intros: the Crackhead Creations logo (that is the name given in the game's credits)
 * fades in, holds for a couple of seconds, and fades out again.  Any key press or tap of the screen skips it.
 *
 * This is the port of intro_crackhead.cpp, which was a copy of intro_omnytex.cpp with a different picture, and so
 * this file is likewise a copy of IntroOmnytexScene.js with a different picture.
 */
class IntroCrackheadScene extends GameScene {


  // The logo image.
  logo_crackhead = `gfx_logo_crackhead`;

  // How solid the logo is currently being drawn, from 0 (invisible) to 255 (fully solid).
  fadeVal = 0;

  // What the logo is currently doing: 1 = fading in, 2 = pausing while fully visible, 3 = fading out.
  fadeDir = 1;

  // Counts the frames that have gone by while pausing.
  fadeDelay = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`IntroCrackheadScene.constructor`);

    super(`IntroCrackheadScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.
   */
  loadScreen() {

    console.log(`IntroCrackheadScene.loadScreen()`);

    // Start from the beginning: invisible, and about to fade in.
    this.fadeVal = 0;
    this.fadeDir = 1;
    this.fadeDelay = 0;

    // The original showed a blank, black screen while it was loading.
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End loadScreen(). */


  /**
   * Cleans the screen up.
   */
  destroyScreen() {

    console.log(`IntroCrackheadScene.destroyScreen()`);

    // The original showed a blank, black screen while it was unloading too.
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End destroyScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Clear the screen to black.
    inBackbuffer.FillRect(CRect(0, 0, 240, 320), RGB(0, 0, 0));

    // Draw the logo in the center of the screen at its current opacity.  (Math.trunc() throws away any remainder
    // from the division, which is what the whole-number arithmetic of the original did.)
    inBackbuffer.BltFast(
      Math.trunc((240 - Surface.GetImageWidth(this.logo_crackhead)) / 2),
      Math.trunc((320 - Surface.GetImageHeight(this.logo_crackhead)) / 2),
      this.logo_crackhead, null, this.fadeVal
    );

    // Note that the three steps below are deliberately separate "if"s rather than an if/else chain, just as they
    // were in the original.  It means that on the frame where one step finishes, the next step has already begun.

    // Fade in.
    if (this.fadeDir === 1) {
      this.fadeVal = this.fadeVal + 10;
      if (this.fadeVal === 250) {
        this.fadeVal = 255;
        this.fadeDir = 2;
      }
    }

    // Pause.
    if (this.fadeDir === 2) {
      this.fadeDelay++;
      if (this.fadeDelay === 48) {
        this.fadeVal = 250;
        this.fadeDir = 3;
      }
    }

    // Fade out.
    if (this.fadeDir === 3) {
      this.fadeVal = this.fadeVal - 10;
      if (this.fadeVal === 0) {
        this.doDestroy(`TitleSequenceScene`);
      }
    }

  } /* End pnf(). */


  /**
   * A key was released.  Any key at all skips the intro.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    this.doDestroy(`TitleSequenceScene`);

  } /* End ku(). */


  /**
   * The stylus came up.  A tap anywhere on the screen skips the intro.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    this.ku(null);

  } /* End su(). */


} /* End class. */
