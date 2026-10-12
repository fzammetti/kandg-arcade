/**
 * The base class that every one of the 25 mini-games extends.  It provides everything the mini-games have in
 * common, which the original kept in main.cpp and in the big switch statement of process_next_frame.cpp.
 *
 * Every mini-game is played inside the same surroundings, as if on an arcade machine:
 *
 *   - A frame around a 200x200 pixel play area, with ten little lights on it that blink at random.
 *   - Below that, a console with two hands on it: the left one on a joystick, which leans the way the player is
 *     steering, and the right one over a button, which goes down when ACTION is pressed.
 *   - At the very bottom, a status bar showing the time left and the score.
 *
 * And every mini-game goes through the same stages, which the original called "mini-game states":
 *
 *   mgsInitialDraw  - the frame, console and status bar are drawn, once.
 *   mgsInstructions - three pages of instructions are shown over "fuzz" (television static).  LEFT and RIGHT
 *                     turn the pages and ACTION moves on.
 *   mgsGetReady     - the mini-game's name and the score to beat are shown while "Get Ready", "Get Set" and "Go"
 *                     pulse in turn.
 *   mgsGameRunning  - the mini-game itself.  In a timed game, a 60 second clock counts down.
 *   mgsEnding       - one frame in which the mini-game can stop any sounds it left playing.
 *   mgsGameOver     - "Game Over", with the result, for a moment.  Then the player is taken back to wherever they
 *                     came from.
 *
 * A mini-game supplies these things about itself (see FlightOfDoomScene.js for an example):
 *
 *   current_screen    - its screen constant, for example csFlightOfDoom.
 *   game_name         - its name as shown on the Get Ready screen, quotation marks included.
 *   target_score      - the score to beat in Adventure mode, as a number.
 *   target_score_text - the same, as it is to be shown (the original wrote 2,000 with a comma, for example).
 *   instructions      - its instructions: 30 lines of text, 10 for each of the three pages.
 *   loadMiniGame()    - set the mini-game up.  Must reset ALL of its variables.
 *   destroyMiniGame() - clean the mini-game up.
 *   pnfMiniGame()     - draw one frame of the mini-game, and do one frame's worth of its game logic.
 *   endMiniGame()     - called once when the mini-game ends, to stop any sounds still playing.
 *   kd() and ku()     - a key was pressed or released while the mini-game was running.
 */
class MiniGameScene extends GameScene {


  // The things a mini-game supplies about itself.  See the comment at the top of this file.
  current_screen = 0;
  game_name = ``;
  target_score = 0;
  target_score_text = ``;
  instructions = [ ];

  // The five images of "fuzz" (television static), which are shown one after another to make it flicker.
  fuzz = [ ];


  // ****************************************************************************************************************
  // Loading and unloading.
  // ****************************************************************************************************************


  /**
   * Sets the screen up.  This is the common part of the original's loadXxx() functions, which were the same for
   * every mini-game apart from the mini-game's own images, sounds and variables.
   */
  loadScreen() {

    console.log(`MiniGameScene.loadScreen()`, this.scene.key);

    // Do initialization common to all mini-games.
    this.doCommonInit();

    // Let the mini-game set itself up.
    this.loadMiniGame();

    // Hand the mini-game's instructions over to be shown, starting at the first page.
    gameState.mgInstructions = this.instructions;
    gameState.mgInstructionsPage = 0;
    gameState.mgiPrevTapped = false;
    gameState.mgiNextTapped = false;

    // The original showed a blank, black screen while it was loading.
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End loadScreen(). */


  /**
   * Cleans the screen up.  This is the common part of the original's destroyXxx() functions.
   */
  destroyScreen() {

    console.log(`MiniGameScene.destroyScreen()`, this.scene.key);

    // Do cleanup common to all mini-games.
    this.doCommonCleanup();

    // Let the mini-game clean up after itself.
    this.destroyMiniGame();

    // The original showed a blank, black screen while it was unloading.
    backbuffer.SetClipper(null);
    backbuffer.FillRect(null, RGB(0, 0, 0));

  } /* End destroyScreen(). */


  /**
   * Leaves the mini-game.
   *
   * There is a twist when the mini-game was being played in Mini-Game Melee.  The player must end up back on the
   * New Game Type screen, whatever screen was asked for.  That screen cannot be gone to directly, though, because
   * everything it uses is loaded by the main menu.  So what the original did (in two steps, one in doDestroy() and
   * one at the end of every mini-game's destroyer) was to go to the main menu instead, with a flag set that tells
   * the main menu to hand straight over to the New Game Type screen as soon as it has loaded.
   *
   * @param {string} inSceneKey The name of the scene to go to next.
   */
  doDestroy(inSceneKey) {

    let sceneKey = inSceneKey;
    if (gameState.game_mode === gmMiniGameMelee) {
      sceneKey = `MainMenuScene`;
      gameState.jumpBackToNewGameType = true;
    }

    super.doDestroy(sceneKey);

  } /* End doDestroy(). */


  /**
   * Do initialization common to all mini-games.
   */
  doCommonInit() {

    // Common Get Ready... Get Set... Go! variables.  These are the left and right edges (the x1 and x2 values) of
    // each of the three images, and the top and bottom edges (y1 and y2) that all three share.  They are changed
    // every frame to make the images swell and shrink.  See doGetReady().
    gameState.grgsg = true;
    gameState.grgsg_count = 0;
    gameState.gr_x1 = 34;
    gameState.gr_x2 = 166;
    gameState.gs_x1 = 54;
    gameState.gs_x2 = 145;
    gameState.g_x1 = 82;
    gameState.grgsg_y1 = 30;
    gameState.g_x2 = 118;
    gameState.grgsg_y2 = 54;

    // Common fuzz surfaces.  Each is the size of the play area, with every pixel randomly either dark grey or light
    // grey.  Showing the five of them in quick succession looks like the static on an untuned television.
    this.fuzz = [ ];
    for (let fc = 0; fc < 5; fc++) {
      const surface = new Surface(200, 200);
      for (let fcy = 0; fcy < 200; fcy++) {
        for (let fcx = 0; fcx < 200; fcx++) {
          let fcc = rand() % 2;
          if (fcc === 0) {
            fcc = 100;
          } else {
            fcc = 200;
          }
          surface.SetPixel(fcx, fcy, RGB(fcc, fcc, fcc));
        }
      }
      this.fuzz.push(surface);
    }

    // Common variable inits.
    gameState.lightChangeCounter = 0;
    gameState.jumpBackToNewGameType = false;
    gameState.player_pos.x = 0;
    gameState.player_pos.y = 0;
    gameState.player_dir_north = false;
    gameState.player_dir_south = false;
    gameState.player_dir_east = false;
    gameState.player_dir_west = false;
    gameState.player_button_down = false;
    gameState.player_left_hand_action = lhNothing;
    gameState.player_right_hand_action = rhNothing;
    gameState.game_over_counter = 0;
    gameState.get_ready_counter = 0;
    gameState.mini_game_state = mgsInitialDraw;
    gameState.mini_game_score = 0;
    gameState.mini_game_score_last = 0;
    gameState.player_dir_delay = 0;
    gameState.force_game_over = false;
    gameState.clear_game_surface = true;
    gameState.status_first_time = true;
    gameState.game_over_check_done = false;

  } /* End doCommonInit(). */


  /**
   * Do cleanup common to all mini-games.
   */
  doCommonCleanup() {

    sndObj.stopSounds();
    this.fuzz = [ ];

  } /* End doCommonCleanup(). */


  // ****************************************************************************************************************
  // The frame-by-frame logic.
  // ****************************************************************************************************************


  /**
   * Draws one frame.  This is the port of the block of code that process_next_frame.cpp repeated, almost word for
   * word, for each of the 25 mini-games.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    switch (gameState.mini_game_state) {

      case mgsInitialDraw: {
        this.doInitialDraw(inBackbuffer);
      break; }

      case mgsInstructions: {
        this.doInstructions(inBackbuffer);
        this.updateHands(inBackbuffer);
      break; }

      case mgsGetReady: {
        this.doGetReady(inBackbuffer, this.game_name, this.target_score_text);
      break; }

      case mgsGameOver: {
        if (gameState.game_mode === gmMiniGameMelee) {
          this.doGameOver(inBackbuffer, `NewGameTypeScene`, this.target_score);
        } else {
          this.doGameOver(inBackbuffer, getSceneKeyForScreen(csWalkingAroundTheShip), this.target_score);
        }
      break; }

      case mgsEnding: {
        this.endMiniGame();
        gameState.mini_game_state = mgsGameOver;
      break; }

      case mgsGameRunning: {
        if (!gameState.force_game_over) {
          // Most mini-games redraw everything every frame and so want the play area wiped first.  A few build
          // their picture up over time and switch this off.
          if (gameState.clear_game_surface) {
            inBackbuffer.FillRect(CRect(20, 20, 220, 220), RGB(0, 0, 0));
          }
          this.updateMiniGameFrameLights(inBackbuffer);
          // While the mini-game draws, nothing is allowed to show outside the play area, so that things moving
          // on or off its edges do not spill over onto the frame.
          inBackbuffer.SetClipper(CRect(20, 20, 220, 220));
          this.pnfMiniGame(inBackbuffer);
          inBackbuffer.SetClipper(null);
        }
        this.updateHands(inBackbuffer);
        // The mini-game ends when the clock runs out, or when something asks for it to end early.
        if (this.updateStatusBar(inBackbuffer) || gameState.force_game_over) {
          gameState.game_over_counter = 0;
          gameState.mini_game_state = mgsEnding;
          gameState.processEvents = false;
        }
      break; }

    }

  } /* End pnf(). */


  /**
   * Does the initial static drawings on a mini-game screen.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  doInitialDraw(inBackbuffer) {

    // Clear screen.
    inBackbuffer.FillRect(null, RGB(0, 0, 0));

    // Draw mini-game area frame.
    inBackbuffer.BltFast(0, 0, `gfx_mini_game_frame`, null);

    // Draw console parts and initial hands.
    inBackbuffer.BltFast(0, 240, `gfx_console_left`, null);
    inBackbuffer.BltFast(29, 240, `gfx_left_hand_normal`, null);
    inBackbuffer.BltFast(108, 240, `gfx_console_middle`, null);
    inBackbuffer.BltFast(145, 240, `gfx_right_hand_up`, null);
    inBackbuffer.BltFast(215, 240, `gfx_console_right`, null);

    // Draw status bar.
    inBackbuffer.BltFast(0, 300, `gfx_status_bar`, null);

    // Change state.
    gameState.mini_game_state = mgsInstructions;

  } /* End doInitialDraw(). */


  /**
   * Shows the current page of the mini-game's instructions.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  doInstructions(inBackbuffer) {

    // Flashing lights.
    this.updateMiniGameFrameLights(inBackbuffer);

    // Fuzz.
    inBackbuffer.BltFast(xadj, yadj, this.fuzz[gameState.fuzzIndex], null);
    gameState.fuzzIndex++;
    if (gameState.fuzzIndex > 4) {
      gameState.fuzzIndex = 0;
    }

    // The text: 10 lines per page of instructions.  The first line of a page is its heading and is centered; the
    // rest are drawn from the left.
    const iAdd = gameState.mgInstructionsPage * 10;
    let y = 22;
    let firstLineDone = false;
    for (let i = iAdd; i < iAdd + 10; i++) {
      if (firstLineDone) {
        inBackbuffer.DrawText(22, y, gameState.mgInstructions[i], font1, GDDRAWTEXT_LEFT);
      } else {
        firstLineDone = true;
        inBackbuffer.DrawText(gameState.bbCenterPoint, y, gameState.mgInstructions[i], font1, GDDRAWTEXT_CENTER);
      }
      y = y + 16;
    }

    // The page-turning arrows, and between them the reminder of how to move on.
    if (gameState.mgiPrevTapped) {
      inBackbuffer.BltFast(20, 194, `gfx_ins_prev_1`, null);
    } else {
      inBackbuffer.BltFast(20, 194, `gfx_ins_prev_0`, null);
    }
    inBackbuffer.DrawText(gameState.bbCenterPoint, 196, `ACTION/Click begins`, font1, GDDRAWTEXT_CENTER);
    if (gameState.mgiNextTapped) {
      inBackbuffer.BltFast(196, 194, `gfx_ins_next_1`, null);
    } else {
      inBackbuffer.BltFast(196, 194, `gfx_ins_next_0`, null);
    }

  } /* End doInstructions(). */


  /**
   * Does the Get Ready... Get Set... Go sequence to start a mini-game.
   *
   * @param {Surface} inBackbuffer  The surface to draw on.
   * @param {string}  inGameName    The name of the mini-game, as it is to be shown.
   * @param {string}  inTargetScore The score to beat in Adventure mode, as it is to be shown.
   */
  doGetReady(inBackbuffer, inGameName, inTargetScore) {

    gameState.processEvents = false;
    gameState.player_dir_west = false;
    gameState.player_dir_east = false;
    gameState.player_button_down = false;
    this.updateHands(inBackbuffer);

    // Flashing lights.
    this.updateMiniGameFrameLights(inBackbuffer);

    // Fuzz.
    inBackbuffer.BltFast(xadj, yadj, this.fuzz[gameState.fuzzIndex], null);
    gameState.fuzzIndex++;
    if (gameState.fuzzIndex > 4) {
      gameState.fuzzIndex = 0;
    }

    // Game name.
    inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 90, inGameName, font1, GDDRAWTEXT_CENTER);

    // If in Adventure Mode, show Target Score.
    if (gameState.game_mode === gmAdventureGame) {
      const szOut = `Target Score: ${inTargetScore}`;
      inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 140, szOut, font1, GDDRAWTEXT_CENTER);
    }

    // If in Melee Mode, show the high score for either Timed Mode or PUISS Mode.
    if (gameState.game_mode === gmMiniGameMelee) {
      let szHS = ``;
      if (gameState.game_submode === gsmTimed) {
        szHS = `${gameState.miniGameHighsTimed[gameState.current_mini_game]}`;
      } else {
        szHS = `${gameState.miniGameHighsPUISS[gameState.current_mini_game]}`;
      }
      const szOut = `High Score: ${szHS}`;
      inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 140, szOut, font1, GDDRAWTEXT_CENTER);
    }

    // Draw the appropriate text.  The sequence lasts 72 frames (three seconds), a third of it for each image.  Each
    // image is stretched to fit a rectangle whose edges are being moved in and out, which makes it pulse.
    if (gameState.get_ready_counter > 0 && gameState.get_ready_counter < 24) {
      inBackbuffer.Blt(
        CRect(xadj + gameState.gr_x1, yadj + gameState.grgsg_y1, xadj + gameState.gr_x2, yadj + gameState.grgsg_y2),
        `gfx_get_ready`, null
      );
    }
    if (gameState.get_ready_counter > 24 && gameState.get_ready_counter < 48) {
      inBackbuffer.Blt(
        CRect(xadj + gameState.gs_x1, yadj + gameState.grgsg_y1, xadj + gameState.gs_x2, yadj + gameState.grgsg_y2),
        `gfx_get_set`, null
      );
    }
    if (gameState.get_ready_counter > 48 && gameState.get_ready_counter < 72) {
      inBackbuffer.Blt(
        CRect(xadj + gameState.g_x1, yadj + gameState.grgsg_y1, xadj + gameState.g_x2, yadj + gameState.grgsg_y2),
        `gfx_go`, null
      );
    }

    // Move the edges of the rectangles: outwards by two pixels a frame for five frames, then inwards for five
    // frames, and so on.
    if (gameState.grgsg) {
      gameState.gr_x1 = gameState.gr_x1 - 2;
      gameState.gr_x2 = gameState.gr_x2 + 2;
      gameState.gs_x1 = gameState.gs_x1 - 2;
      gameState.gs_x2 = gameState.gs_x2 + 2;
      gameState.g_x1 = gameState.g_x1 - 2;
      gameState.grgsg_y1 = gameState.grgsg_y1 - 2;
      gameState.g_x2 = gameState.g_x2 + 2;
      gameState.grgsg_y2 = gameState.grgsg_y2 + 2;
    } else {
      gameState.gr_x1 = gameState.gr_x1 + 2;
      gameState.gr_x2 = gameState.gr_x2 - 2;
      gameState.gs_x1 = gameState.gs_x1 + 2;
      gameState.gs_x2 = gameState.gs_x2 - 2;
      gameState.g_x1 = gameState.g_x1 + 2;
      gameState.grgsg_y1 = gameState.grgsg_y1 + 2;
      gameState.g_x2 = gameState.g_x2 - 2;
      gameState.grgsg_y2 = gameState.grgsg_y2 - 2;
    }
    gameState.grgsg_count++;
    if (gameState.grgsg_count > 4) {
      gameState.grgsg = !gameState.grgsg;
      gameState.grgsg_count = 0;
    }

    if (gameState.get_ready_counter > 72) {
      gameState.processEvents = true;
      // Change state to start game.
      gameState.mini_game_state = mgsGameRunning;
      this.countdownStartClock(); // Start the countdown clock
    }

    gameState.get_ready_counter++;

  } /* End doGetReady(). */


  /**
   * Displays the Game Over when a mini-game finishes, and deals with the result.
   *
   * @param {Surface} inBackbuffer  The surface to draw on.
   * @param {string}  inNextScreen  The name of the scene to go to afterwards.
   * @param {number}  inTargetScore The score that had to be reached in Adventure mode.
   */
  doGameOver(inBackbuffer, inNextScreen, inTargetScore) {

    gameState.processEvents = false;

    if (gameState.game_over_counter < 40) {

      // Final checks, only done once.
      if (!gameState.game_over_check_done) {
        gameState.new_high_score = false; // By default, assume NOT melee mode and high score was NOT beat
        gameState.game_over_check_done = true;
        // If playing adventure mode and the score was >= the target score, unlock the mini-game.
        if (gameState.game_mode === gmAdventureGame && gameState.mini_game_score >= inTargetScore) {
          gameState.overall_score = gameState.overall_score + gameState.mini_game_score;
          gameState.games_done[gameState.whichGameBeingPlayed] = true;
          for (let i = 0; i < 25; i++) {
            if (gameState.melee_selection[i] === this.current_screen) {
              gameState.game_unlocked[i] = true;
            }
          }
        }
        // If in melee mode and the score was > the current high score (depending on submode), record it.
        if (gameState.game_mode === gmMiniGameMelee) {
          if (gameState.game_submode === gsmTimed &&
            gameState.mini_game_score > gameState.miniGameHighsTimed[gameState.current_mini_game]
          ) {
            gameState.miniGameHighsTimed[gameState.current_mini_game] = gameState.mini_game_score;
            gameState.new_high_score = true;
          }
          if (gameState.game_submode === gsmAlaCarte &&
            gameState.mini_game_score > gameState.miniGameHighsPUISS[gameState.current_mini_game]
          ) {
            gameState.miniGameHighsPUISS[gameState.current_mini_game] = gameState.mini_game_score;
            gameState.new_high_score = true;
          }
        }
        // Write out the KGA file regardless of what we did above.
        writeKGAFile(gameState.gameRestarted, false);
      }

      // Flashing lights.
      this.updateMiniGameFrameLights(inBackbuffer);

      // Fuzz.
      inBackbuffer.BltFast(xadj, yadj, this.fuzz[gameState.fuzzIndex], null);
      gameState.fuzzIndex++;
      if (gameState.fuzzIndex > 4) {
        gameState.fuzzIndex = 0;
      }

      // Draw the appropriate text.
      inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 40, `Game Over`, font1, GDDRAWTEXT_CENTER);
      // If in Adventure Mode, display mission status.
      if (gameState.game_mode === gmAdventureGame) {
        if (gameState.mini_game_score >= inTargetScore) {
          inBackbuffer.DrawText(
            gameState.bbCenterPoint, yadj + 100, `Mission accomplished!`, font1, GDDRAWTEXT_CENTER
          );
        } else {
          inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 100, `Mission failed!`, font1, GDDRAWTEXT_CENTER);
        }
      } else { // Must be in Melee mode, so display the appropriate high score message
        if (gameState.new_high_score) {
          inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 100, `A NEW HIGH SCORE!`, font1, GDDRAWTEXT_CENTER);
        } else {
          inBackbuffer.DrawText(
            gameState.bbCenterPoint, yadj + 100, `High Score Still Stands`, font1, GDDRAWTEXT_CENTER
          );
        }
      }

      // Continue.
      gameState.game_over_counter++;

      // Draw status bar and score.
      inBackbuffer.BltFast(0, 300, `gfx_status_bar`, null);
      const sOutStr = `Score: ${gameState.mini_game_score}`;
      inBackbuffer.DrawText(gameState.bbCenterPoint, 301, sOutStr, font1, GDDRAWTEXT_CENTER);

    } else {
      // Exit game, go to the next screen.
      this.doDestroy(inNextScreen);
    }

  } /* End doGameOver(). */


  // ****************************************************************************************************************
  // The clock, the score, the lights and the hands.
  // ****************************************************************************************************************


  /**
   * Called to begin mini-game time countdown.
   */
  countdownStartClock() {

    // This method is called when a mini-game begins to start the countdown to completion.
    gameState.countdown_seconds = 60;
    gameState.countdown_ticks = GetTickCount();

  } /* End countdownStartClock(). */


  /**
   * Called with every frame drawn of a mini-game to display remaining time and current score on the status bar.
   * To save work, the original only redrew each half of the status bar when the number on it had changed.
   *
   * @param  {Surface} inBackbuffer The surface to draw on.
   * @return {boolean}              False if time has not elapsed, true if it has.
   */
  updateStatusBar(inBackbuffer) {

    // Has a second gone by?  If so, and this is a timed game, take a second off the clock.
    let timeChanged = false;
    if ((GetTickCount() - gameState.countdown_ticks) >= 1000) {
      if (!gameState.doPopup && gameState.game_submode === gsmTimed) {
        timeChanged = true;
        gameState.countdown_seconds--;
        gameState.countdown_ticks = GetTickCount();
        if (gameState.countdown_seconds === 0) {
          return true;
        }
      }
    }

    // Draw time and score status bar.
    if (!gameState.doPopup) {
      if ((gameState.game_submode === gsmTimed && timeChanged) ||
        (gameState.game_submode === gsmTimed && gameState.status_first_time)
      ) {
        inBackbuffer.BltFast(0, 300, `gfx_status_bar`, CRect(0, 0, 120, 20));
        const tOutStr = `Time: ${gameState.countdown_seconds}`;
        inBackbuffer.DrawText(2, 300, tOutStr, font1, GDDRAWTEXT_LEFT);
      }
      if (gameState.mini_game_score !== gameState.mini_game_score_last || gameState.status_first_time) {
        inBackbuffer.BltFast(120, 301, `gfx_status_bar`, CRect(120, 0, 240, 20));
        const sOutStr = `Score: ${gameState.mini_game_score}`;
        inBackbuffer.DrawText(238, 301, sOutStr, font1, GDDRAWTEXT_RIGHT);
      }
    }

    gameState.status_first_time = false;
    gameState.mini_game_score_last = gameState.mini_game_score;

    return false;

  } /* End updateStatusBar(). */


  /**
   * Adds to the current mini-game score.
   *
   * @param {number} inValue How much to add.
   */
  addToScore(inValue) {

    gameState.mini_game_score = gameState.mini_game_score + inValue;

  } /* End addToScore(). */


  /**
   * Subtracts from the current mini-game score.  The score never goes below zero.
   *
   * @param {number} inValue How much to subtract.
   */
  subtractFromScore(inValue) {

    if (gameState.mini_game_score <= inValue) {
      gameState.mini_game_score = 0;
      return;
    }
    gameState.mini_game_score = gameState.mini_game_score - inValue;

  } /* End subtractFromScore(). */


  /**
   * Called to do the lights on the mini-game frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  updateMiniGameFrameLights(inBackbuffer) {

    // Every half a second we are going to light some lights and restore others.
    gameState.lightChangeCounter++;
    if (gameState.lightChangeCounter > 12) {
      gameState.lightChangeCounter = 0;
      // Decide at random, for each of the five lights down the left side and the five down the right, whether it
      // is to be lit (1) or not (0).
      const l1 = rand() % 2;
      const l2 = rand() % 2;
      const l3 = rand() % 2;
      const l4 = rand() % 2;
      const l5 = rand() % 2;
      const r1 = rand() % 2;
      const r2 = rand() % 2;
      const r3 = rand() % 2;
      const r4 = rand() % 2;
      const r5 = rand() % 2;
      // Draw mini-game area frame (in which all the lights are dark), then the lit version of each chosen light on
      // top of it.
      inBackbuffer.BltFast(0, 0, `gfx_mini_game_frame`, null);
      if (l1 === 1) {
        inBackbuffer.BltFast(0, 22, `gfx_mini_game_frame_l1`, null);
      }
      if (l2 === 1) {
        inBackbuffer.BltFast(0, 64, `gfx_mini_game_frame_l2`, null);
      }
      if (l3 === 1) {
        inBackbuffer.BltFast(0, 107, `gfx_mini_game_frame_l3`, null);
      }
      if (l4 === 1) {
        inBackbuffer.BltFast(0, 150, `gfx_mini_game_frame_l4`, null);
      }
      if (l5 === 1) {
        inBackbuffer.BltFast(0, 193, `gfx_mini_game_frame_l5`, null);
      }
      if (r1 === 1) {
        inBackbuffer.BltFast(220, 20, `gfx_mini_game_frame_r1`, null);
      }
      if (r2 === 1) {
        inBackbuffer.BltFast(220, 62, `gfx_mini_game_frame_r2`, null);
      }
      if (r3 === 1) {
        inBackbuffer.BltFast(220, 107, `gfx_mini_game_frame_r3`, null);
      }
      if (r4 === 1) {
        inBackbuffer.BltFast(220, 150, `gfx_mini_game_frame_r4`, null);
      }
      if (r5 === 1) {
        inBackbuffer.BltFast(220, 193, `gfx_mini_game_frame_r5`, null);
      }
    }

  } /* End updateMiniGameFrameLights(). */


  /**
   * Called to update the hands as appropriate.  Each hand is only redrawn when what it is doing has changed since
   * the last frame.
   *
   * @param  {Surface} inBackbuffer The surface to draw on.
   * @return {boolean}              Always false.
   */
  updateHands(inBackbuffer) {

    const north = gameState.player_dir_north;
    const south = gameState.player_dir_south;
    const east = gameState.player_dir_east;
    const west = gameState.player_dir_west;

    // Draw left hand, IF it's something different than last frame.
    if (gameState.player_left_hand_action !== lhNorth && north && !east && !south && !west) { // North
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_up`, null);
      gameState.player_left_hand_action = lhNorth;
    } else if (gameState.player_left_hand_action !== lhEast && !north && east && !south && !west) { // East
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_right`, null);
      gameState.player_left_hand_action = lhEast;
    } else if (gameState.player_left_hand_action !== lhSouth && !north && !east && south && !west) { // South
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_down`, null);
      gameState.player_left_hand_action = lhSouth;
    } else if (gameState.player_left_hand_action !== lhWest && !north && !east && !south && west) { // West
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_left`, null);
      gameState.player_left_hand_action = lhWest;
    } else if (gameState.player_left_hand_action !== lhNorthEast && north && east && !south && !west) { // NorthEast
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_ur`, null);
      gameState.player_left_hand_action = lhNorthEast;
    } else if (gameState.player_left_hand_action !== lhNorthWest && north && !east && !south && west) { // NorthWest
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_ul`, null);
      gameState.player_left_hand_action = lhNorthWest;
    } else if (gameState.player_left_hand_action !== lhSouthEast && !north && east && south && !west) { // SouthEast
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_dr`, null);
      gameState.player_left_hand_action = lhSouthEast;
    } else if (gameState.player_left_hand_action !== lhSouthWest && !north && !east && south && west) { // SouthWest
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_dl`, null);
      gameState.player_left_hand_action = lhSouthWest;
    } else if (gameState.player_left_hand_action !== lhNothing && !north && !east && !south && !west) { // Nothing
      inBackbuffer.BltFast(29, 240, `gfx_left_hand_normal`, null);
      gameState.player_left_hand_action = lhNothing;
    }

    // Draw right hand, IF it's something other than last frame.
    if (gameState.player_right_hand_action !== rhDown && gameState.player_button_down) {
      inBackbuffer.BltFast(145, 240, `gfx_right_hand_down`, null);
      gameState.player_right_hand_action = rhDown;
    } else if (gameState.player_right_hand_action !== rhNothing && !gameState.player_button_down) {
      inBackbuffer.BltFast(145, 240, `gfx_right_hand_up`, null);
      gameState.player_right_hand_action = rhNothing;
    }

    return false;

  } /* End updateHands(). */


  // ****************************************************************************************************************
  // Input.
  // ****************************************************************************************************************


  /**
   * Handles a key being pressed.  While the instructions are showing they get the key, ahead of everything else,
   * as they did in the original's KeyDown().  Otherwise this carries on as for any other screen.
   *
   * @param {KeyboardEvent} inEvent The browser's keyboard event.
   */
  onKeyDown(inEvent) {

    if (gameState.mini_game_state === mgsInstructions) {
      this.preventBrowserDefault(inEvent);
      if (!inEvent.repeat) {
        this.keyWentDown(inEvent.code);
        this.kdMGInstructions(inEvent.code);
      }
      return;
    }

    super.onKeyDown(inEvent);

  } /* End onKeyDown(). */


  /**
   * Handles a key being released.  See onKeyDown().
   *
   * @param {KeyboardEvent} inEvent The browser's keyboard event.
   */
  onKeyUp(inEvent) {

    if (gameState.mini_game_state === mgsInstructions) {
      this.preventBrowserDefault(inEvent);
      // A key that was already down when the mini-game was arrived at (ACTION, pressed at a console on the ship):
      // letting go of it does nothing.  See keyCameUp() in GameScene.js.
      if (this.keyCameUp(inEvent.code)) {
        return;
      }
      this.kuMGInstructions(inEvent.code);
      return;
    }

    super.onKeyUp(inEvent);

  } /* End onKeyUp(). */


  /**
   * Handles the stylus going down.  See onKeyDown().
   *
   * @param {Phaser.Input.Pointer} inPointer Phaser's object describing the mouse or finger.
   */
  onPointerDown(inPointer) {

    if (gameState.mini_game_state === mgsInstructions) {
      this.sdMGInstructions({ x: Math.floor(inPointer.x), y: Math.floor(inPointer.y) });
      return;
    }

    super.onPointerDown(inPointer);

  } /* End onPointerDown(). */


  /**
   * Handles the stylus coming up.  See onKeyDown().
   *
   * @param {Phaser.Input.Pointer} inPointer Phaser's object describing the mouse or finger.
   */
  onPointerUp(inPointer) {

    if (gameState.mini_game_state === mgsInstructions) {
      this.suMGInstructions({ x: Math.floor(inPointer.x), y: Math.floor(inPointer.y) });
      return;
    }

    super.onPointerUp(inPointer);

  } /* End onPointerUp(). */


  /**
   * KeyDown handler for mini-game instructions.
   *
   * @param {string} inKey The code of the key.
   */
  kdMGInstructions(inKey) {

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.mgiPrevTapped = true;
      gameState.player_dir_west = true;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.mgiNextTapped = true;
      gameState.player_dir_east = true;
    }

    // Handle keypress.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
    }

  } /* End kdMGInstructions(). */


  /**
   * KeyUp handler for mini-game instructions.  LEFT and RIGHT turn the pages (there are three, and they wrap
   * around); ACTION moves on to Get Ready.
   *
   * @param {string} inKey The code of the key.
   */
  kuMGInstructions(inKey) {

    gameState.player_dir_west = false;
    gameState.player_dir_east = false;
    gameState.player_button_down = false;

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      sndObj.playSound(`sfx_ins_arrow`);
      gameState.mgiPrevTapped = false;
      gameState.mgInstructionsPage--;
      if (gameState.mgInstructionsPage < 0) {
        gameState.mgInstructionsPage = 2;
      }
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      sndObj.playSound(`sfx_ins_arrow`);
      gameState.mgiNextTapped = false;
      gameState.mgInstructionsPage++;
      if (gameState.mgInstructionsPage > 2) {
        gameState.mgInstructionsPage = 0;
      }
    }

    // Handle keypress.
    if (inKey === gameState.kAction) {
      sndObj.playSound(`sfx_misc_2`);
      gameState.mini_game_state = mgsGetReady;
    }

  } /* End kuMGInstructions(). */


  /**
   * StylusDown handler for mini-game instructions screen.
   *
   * @param {object} inPoint Where on the screen the stylus went down, with x and y properties.
   */
  sdMGInstructions(inPoint) {

    if (PtInRect(CRect(20, 194, 44, 218), inPoint)) { // Previous
      this.kdMGInstructions(gameState.kLeft);
      return;
    }

    if (PtInRect(CRect(196, 194, 220, 218), inPoint)) { // Next
      this.kdMGInstructions(gameState.kRight);
      return;
    }

    if (PtInRect(CRect(48, 196, 192, 216), inPoint)) { // Select
      this.kdMGInstructions(gameState.kAction);
      return;
    }

  } /* End sdMGInstructions(). */


  /**
   * StylusUp handler for mini-game instructions screen.
   *
   * @param {object} inPoint Where on the screen the stylus came up, with x and y properties.
   */
  suMGInstructions(inPoint) {

    if (gameState.mgiPrevTapped && PtInRect(CRect(20, 194, 44, 218), inPoint)) { // Previous
      this.kuMGInstructions(gameState.kLeft);
      return;
    }

    if (gameState.mgiNextTapped && PtInRect(CRect(196, 194, 220, 218), inPoint)) { // Next
      this.kuMGInstructions(gameState.kRight);
      return;
    }

    if (gameState.player_button_down && PtInRect(CRect(48, 196, 192, 216), inPoint)) { // Select
      this.kuMGInstructions(gameState.kAction);
      return;
    }

    gameState.player_dir_east = false;
    gameState.player_dir_west = false;
    gameState.mgiPrevTapped = false;
    gameState.mgiNextTapped = false;
    gameState.player_button_down = false;

  } /* End suMGInstructions(). */


  // ****************************************************************************************************************
  // The "Continue Game / Quit Game" popup.
  // ****************************************************************************************************************


  /**
   * Called when the command button is clicked during a mini-game.  Brings up a popup asking whether to carry on
   * or quit.
   */
  miniGameCommandButtonHandler() {

    gameState.player_button_down = false;
    // Do a popup...
    // Popup callback.
    this.popupCallback = this.popupCallbackMiniGame;
    // Popup options.
    gameState.gpOptionsCount = 2;
    gameState.gpOptions[0] = `Continue Game`;
    gameState.gpOptions[1] = `Quit Game`;
    // Start popup.
    this.startPopup(`What would you`, `like to do?`);

  } /* End miniGameCommandButtonHandler(). */


  /**
   * Called when a popup is dismissed during a mini-game.
   *
   * @param {number} inOption The number of the option that was picked: 0 = Continue Game, 1 = Quit Game.
   */
  popupCallbackMiniGame(inOption) {

    switch (inOption) {
      case 1: { // Quit
        gameState.force_game_over = true;
      break; }
    }

  } /* End popupCallbackMiniGame(). */


  /**
   * Draws the popup.  Over a mini-game, the original also kept the hands on the console up to date while the popup
   * was showing, so that the joystick hand and the button hand follow the player working the popup.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfPopup(inBackbuffer) {

    super.pnfPopup(inBackbuffer);
    this.updateHands(inBackbuffer);

  } /* End pnfPopup(). */


  // ****************************************************************************************************************
  // The methods that mini-games override.
  // ****************************************************************************************************************


  /**
   * Sets the mini-game up.  Mini-games override this.  Remember that it must reset ALL of the mini-game's variables.
   */
  loadMiniGame() {
  } /* End loadMiniGame(). */


  /**
   * Cleans the mini-game up.  Mini-games override this if they have anything to clean up.
   */
  destroyMiniGame() {
  } /* End destroyMiniGame(). */


  /**
   * Draws one frame of the mini-game.  Mini-games override this.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {
  } /* End pnfMiniGame(). */


  /**
   * Called once when the mini-game ends.  Mini-games override this if they have sounds to stop.
   */
  endMiniGame() {
  } /* End endMiniGame(). */


} /* End class. */
