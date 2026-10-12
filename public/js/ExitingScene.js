/**
 * The shutdown sequence, shown when the player quits: the screen collapses to a horizontal white line, the line
 * shrinks to a dot in the center, and the dot fades away, like an old television set being switched off.
 *
 * This is the port of the csExiting case of ProcessNextFrame(), in process_next_frame.cpp.
 *
 * In the original, the program then simply ended.  A web page cannot close itself, so here the page is reloaded
 * instead, which puts the player back at the "Click to start" screen.
 *
 * Whoever sends the player here must first set gameState.ExitCounter to 0, gameState.ExitFadeCounter to 255 and
 * gameState.shutdownStep to 1, and start the exit sound playing.  Note that pressing any key or tapping the screen
 * during the sequence moves gameState.shutdownStep on by one (see onKeyDown() and onPointerDown() in
 * GameScene.js), which has the effect of cutting the sequence short.
 */
class ExitingScene extends GameScene {


  /**
   * Constructor.
   */
  constructor() {

    console.log(`ExitingScene.constructor`);

    super(`ExitingScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.  This screen is normally arrived at by the quick route, with everything already set up by
   * the screen the player quit from, in which case this method is not called at all.  It is here so that the
   * screen also works when it is jumped to directly during development.
   */
  loadScreen() {

    console.log(`ExitingScene.loadScreen()`);

    sndObj.stopSounds();
    gameState.ExitCounter = 0;
    gameState.ExitFadeCounter = 255;
    gameState.shutdownStep = 1;
    sndObj.playSound(`sfx_game_exit_sound`);

  } /* End loadScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    switch (gameState.shutdownStep) {

      // The television switching off.
      case 1: {
        inBackbuffer.SetClipper(null);
        inBackbuffer.FillRect(CRect(0, 0, 240, 320), RGB(0, 0, 0));
        if (gameState.ExitCounter < 120) {
          // A white line across the middle of the screen, getting shorter from both ends at once.
          inBackbuffer.DrawLine(
            0 + gameState.ExitCounter, 160, 240 - gameState.ExitCounter, 160, RGB(255, 255, 255)
          );
          gameState.ExitCounter = gameState.ExitCounter + 12;
        } else {
          if (gameState.ExitFadeCounter <= 0) {
            // The dot has faded away completely.  Move on, releasing the main menu's resources on the way (unless
            // the player quit from inside the game, in which case the main menu was not loaded).
            gameState.shutdownStep++;
            if (!gameState.exitFromGame) {
              this.scene.get(`MainMenuScene`).destroyScreen();
            }
          } else {
            // A single dot in the center of the screen, fading from white to black.
            inBackbuffer.FillRect(CRect(0, 0, 240, 320), RGB(0, 0, 0));
            inBackbuffer.SetPixel(
              120, 160, RGB(gameState.ExitFadeCounter, gameState.ExitFadeCounter, gameState.ExitFadeCounter)
            );
            gameState.ExitFadeCounter = gameState.ExitFadeCounter - 15;
          }
        }
      break; }

      // In the trial version of the original, this step and the next showed "please buy the full version"
      // screens.  The full version, which is what this port is, went straight on to shutting down.
      case 2: {
        gameState.shutdownStep = 4;
      break; }

      // Shut down.  The original program ended here.  We reload the page, which returns the player to the "Click
      // to start" screen with everything back in its starting state.
      case 4: {
        // Move the step on first, so that there is no chance of asking for a second reload while the browser is
        // busy carrying out the first.
        gameState.shutdownStep = 5;
        window.location.reload();
      break; }

    }

  } /* End pnf(). */


} /* End class. */
