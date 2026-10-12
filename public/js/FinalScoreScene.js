/**
 * The Final Score screen, shown after the "Win" cut scene when an Adventure has been played to its end.  Over a
 * picture, and to music of its own, it shows the score the player finished the Adventure with.  COMMAND (or a tap
 * on the bottom line) goes back to the main menu.
 *
 * This is the port of final_score.cpp.
 *
 * Unlike the screens around the main menu, this one is arrived at and left by the full route (see doDestroy() in
 * GameScene.js), not with a fade.
 */
class FinalScoreScene extends GameScene {


  // The picture behind everything, and the music.
  background = `gfx_final_score_background`;
  sfxMusic = `sfx_music_won`;

  // Whether the music has been started, and the playing music itself, so that it can be stopped.
  musicPlaying = false;
  musicChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`FinalScoreScene.constructor`);

    super(`FinalScoreScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.
   */
  loadScreen() {

    console.log(`FinalScoreScene.loadScreen()`);

    this.musicPlaying = false;
    this.musicChannel = null;

  } /* End loadScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Start the music the first time through.  It goes round and round until the screen is left.
    if (!this.musicPlaying) {
      this.musicPlaying = true;
      this.musicChannel = sndObj.playSound(this.sfxMusic, true);
    }

    inBackbuffer.BltFast(0, 0, this.background, null);

    // Text, on a pale panel that the picture shows through.
    inBackbuffer.FillRect(CRect(30, 5, 210, 49), RGB(240, 240, 240), 128);
    inBackbuffer.DrawText(gameState.bbCenterPoint, 7, `Your final score was:`, font1, GDDRAWTEXT_CENTER);
    const fScore = `${gameState.overall_score}`;
    inBackbuffer.DrawText(gameState.bbCenterPoint, 27, fScore, font1, GDDRAWTEXT_CENTER);

    // Back.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 300, `COMMAND/Click for Main Menu`, font1_green, GDDRAWTEXT_CENTER
    );

  } /* End pnf(). */


  /**
   * A key was released.  COMMAND stops the music, saves (there is no longer an Adventure in progress to go back to)
   * and goes back to the main menu.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Back.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.musicChannel)) {
        sndObj.stopSound(this.musicChannel);
      }
      this.musicPlaying = false;
      this.musicChannel = null;
      writeKGAFile(false, false);
      this.doDestroy(getSceneKeyForScreen(csMainMenu));
    }

  } /* End ku(). */


  /**
   * The stylus came up.  A tap on the bottom line of the screen goes back to the main menu.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    if (PtInRect(CRect(0, 300, 240, 320), inPoint)) {
      this.ku(gameState.kCommand);
    }

  } /* End su(). */


} /* End class. */
