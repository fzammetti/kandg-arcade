/**
 * The High Scores screen.  It shows the high scores of each of the 25 mini-games in turn: a picture of the
 * mini-game slides in from the right, stops in the middle while its name and its two high scores are shown (one for
 * Timed mode and one for Play Until I Say Stop mode), and then slides out to the left to make way for the next.
 * After the last mini-game it starts again with the first.  COMMAND (or a tap on the bottom line) goes back to the
 * main menu.
 *
 * This is the port of high_scores.cpp.
 *
 * Like the other screens around the main menu, this one is never loaded or unloaded.  It is reached and left with
 * a fade (see screenFader() in GameScene.js), and the main menu calls hisReset() just before fading to it.
 */
class HighScoresScene extends GameScene {


  // Which mini-game is being shown, from 0 to 24.  This is an index into the mini-game tables in gameState.
  current_screenshot = 0;

  // What the picture is currently doing: 0 = sliding in, 1 = paused, 2 = sliding out, 3 = initial delay.
  current_action = 0;

  // Counts frames during the pause, and during the initial delay.
  pause_delay = 0;

  // Where the picture currently is.  (Only its x value is ever used.)
  screenshot_pos = { x: 0, y: 0 };


  /**
   * Constructor.
   */
  constructor() {

    console.log(`HighScoresScene.constructor`);

    super(`HighScoresScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.  This screen is normally arrived at by a fade from the main menu, which calls hisReset()
   * itself, in which case this method is not called at all.  It is here so that the screen also works when it is
   * jumped to directly during development.
   */
  loadScreen() {

    console.log(`HighScoresScene.loadScreen()`);

    this.hisReset();

  } /* End loadScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // The vertical position of the picture.  Everything below it is positioned relative to this.
    const y = 54;

    // Set up for fading.
    const fade_value = gameState.fade_value;

    // Scrolling background.
    this.scrollingBackground(inBackbuffer);

    // Title.
    inBackbuffer.DrawText(gameState.bbCenterPoint, 10, `High Scores`, font1_green, GDDRAWTEXT_CENTER, fade_value);

    // Lines.
    inBackbuffer.BltFast(0, 40, `gfx_divider_00`, null, fade_value);
    inBackbuffer.BltFast(0, 290, `gfx_divider_00`, null, fade_value);

    // Back.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 300, `COMMAND/Click for Main Menu`, font1_green, GDDRAWTEXT_CENTER, fade_value
    );

    switch (this.current_action) {

      // Slide in.  The picture moves 15 pixels to the left each frame until it reaches the middle of the screen.
      case 0: {
        inBackbuffer.BltFast(
          this.screenshot_pos.x, y, gameState.screenshots[this.current_screenshot], null, fade_value
        );
        this.screenshot_pos.x = this.screenshot_pos.x - 15;
        if (this.screenshot_pos.x === 69) {
          this.current_action = 1;
          this.pause_delay = 0;
        }
      break; }

      // Pause.  The picture sits still, and the mini-game's name and high scores are shown below it.
      case 1: {
        inBackbuffer.BltFast(
          this.screenshot_pos.x, y, gameState.screenshots[this.current_screenshot], null, fade_value
        );
        inBackbuffer.DrawText(
          gameState.bbCenterPoint, y + 106, gameState.mini_game_info[this.current_screenshot][0],
          font1, GDDRAWTEXT_CENTER, fade_value
        );
        const szHS1 = `${gameState.miniGameHighsTimed[this.current_screenshot]}`;
        const szHS2 = `${gameState.miniGameHighsPUISS[this.current_screenshot]}`;
        inBackbuffer.DrawText(gameState.bbCenterPoint, y + 144, `Timed Mode:`, font1, GDDRAWTEXT_CENTER, fade_value);
        inBackbuffer.DrawText(gameState.bbCenterPoint, y + 144 + 18, szHS1, font1, GDDRAWTEXT_CENTER, fade_value);
        inBackbuffer.DrawText(
          gameState.bbCenterPoint, y + 144 + 46, `Play Until I Say Stop Mode:`, font1, GDDRAWTEXT_CENTER, fade_value
        );
        inBackbuffer.DrawText(gameState.bbCenterPoint, y + 144 + 64, szHS2, font1, GDDRAWTEXT_CENTER, fade_value);
        this.pause_delay++;
        if (this.pause_delay > 75) {
          this.current_action = 2;
        }
      break; }

      // Slide out.  The picture carries on to the left until it is off the screen, and then the next mini-game's
      // picture is lined up off the right-hand edge, ready to slide in.
      case 2: {
        inBackbuffer.BltFast(
          this.screenshot_pos.x, y, gameState.screenshots[this.current_screenshot], null, fade_value
        );
        this.screenshot_pos.x = this.screenshot_pos.x - 15;
        if (this.screenshot_pos.x === -111) {
          this.current_action = 0;
          this.screenshot_pos.x = 264;
          this.current_screenshot++;
          if (this.current_screenshot > 24) {
            this.current_screenshot = 0;
          }
        }
      break; }

      // Initial delay.  A short wait, with nothing shown, when the screen first appears.
      case 3: {
        this.pause_delay++;
        if (this.pause_delay > 20) {
          this.current_action = 0;
        }
      break; }

    }

    // Fading.
    this.screenFader();

  } /* End pnf(). */


  /**
   * A key was released.  COMMAND goes back to the main menu.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Back.
    if (inKey === gameState.kCommand) {
      sndObj.playSound(`sfx_misc_4`);
      gameState.fade_function = 1;
      gameState.next_screen = `MainMenuScene`;
    }

  } /* End ku(). */


  /**
   * The stylus came up.  A tap on the bottom line of the screen goes back to the main menu.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    // Exit.
    if (PtInRect(CRect(0, 300, 240, 320), inPoint)) {
      this.ku(gameState.kCommand);
      return;
    }

  } /* End su(). */


  /**
   * Puts the screen back to its starting state: about to show the first mini-game, after a short delay.  The main
   * menu calls this just before it fades to this screen.
   */
  hisReset() {

    this.pause_delay = 0;
    this.current_screenshot = 0;
    this.current_action = 3;
    this.screenshot_pos.x = 264;

  } /* End hisReset(). */


} /* End class. */
