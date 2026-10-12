/**
 * The New Game Type screen, reached from the New Game button on the main menu.  This is where a game is started.
 *
 * The screen is in two halves.  The top half has two icons, Adventure Game and Mini-Game Melee, and LEFT and RIGHT
 * choose between them.  DOWN (or ACTION) moves to the bottom half, which depends on the icon chosen:
 *
 *   - For Adventure Game it describes Adventure mode, and ACTION begins a new adventure.
 *   - For Mini-Game Melee it shows the mini-games one at a time, with LEFT and RIGHT stepping through them.  A
 *     mini-game that has not been unlocked yet (by beating it in Adventure mode) has a padlock drawn over it and
 *     cannot be chosen.  ACTION on an unlocked mini-game asks which way to play it, a timed 60-second game or
 *     "play until I say stop", and ACTION again starts it.
 *
 * UP goes back to the top half.  COMMAND (or a tap on the bottom line) goes back to the main menu.  Everything can
 * be tapped as well.
 *
 * This is the port of new_game_type.cpp, together with the part of StylusDown() in input_handlers.cpp that deals
 * with this screen (which is where the original hid its "unlock every mini-game" code).
 *
 * Like the other screens around the main menu, this one is never loaded or unloaded.  It is reached and left with
 * a fade (see screenFader() in GameScene.js), and the main menu calls ngtReset() just before fading to it.  It is
 * also the screen the player comes back to after playing a mini-game in Mini-Game Melee, in which case it is NOT
 * reset, so that it is still showing the mini-game that was just played.
 */
class NewGameTypeScene extends GameScene {


  // True when the top half of the screen (the two icons) is in control, false when the bottom half is.
  onTop = true;

  // Flags: is the Previous or the Next arrow currently being pressed?
  prev_down = false;
  next_down = false;

  // What the bottom half of the screen is showing: 0 = nothing, 1 = the mini-games to choose from, 2 = the
  // description of Adventure mode, 3 = the choice of how to play the chosen mini-game.
  display_mode = 0;

  // Which mini-game is being shown, from 0 to 24.  This is an index into the mini-game tables in gameState.
  current_screenshot = 0;

  // Which icon is chosen: 0 = Adventure Game, 1 = Mini-Game Melee.
  which_icon = 0;

  // Which way of playing a mini-game is chosen: 0 = a timed 60-second game, 1 = play until I say stop.
  sub_mode = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`NewGameTypeScene.constructor`);

    super(`NewGameTypeScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.  This screen is normally arrived at by a fade from the main menu, which calls ngtReset()
   * itself, in which case this method is not called at all.  It is here so that the screen also works when it is
   * jumped to directly during development.
   */
  loadScreen() {

    console.log(`NewGameTypeScene.loadScreen()`);

    this.ngtReset();

  } /* End loadScreen(). */


  /**
   * Cleans the screen up.  This is called when a game is started from here.
   *
   * In the original, this screen and the main menu were really one and the same thing as far as loading and
   * unloading went: everything this screen uses was loaded by the main menu.  So when a game was started from
   * here, the original pretended that the main menu was the current screen (its own comment says it needed to
   * "fool" the program), so that it would be the main menu that got unloaded.  Here we simply ask the main menu
   * to do its cleaning up, which among other things stops the theme music.
   */
  destroyScreen() {

    console.log(`NewGameTypeScene.destroyScreen()`);

    this.scene.get(`MainMenuScene`).destroyScreen();

  } /* End destroyScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Start the theme music, if it is not already playing.  (It will not be if we have just come back from
    // playing a mini-game.)
    if (!gameState.themePlaying) {
      gameState.themePlaying = true;
      sndObj.playSound(`sfx_music_theme`, true);
    }

    // Unlock all games if unlock cheat has been done.  Must be done here to override KGA file read.
    if (gameState.unlockCornerUL === 3 && gameState.unlockCornerUR === 3) {
      for (let i = 0; i < 25; i++) {
        gameState.game_unlocked[i] = true;
      }
    }

    // Set up for fading.
    const fade_value = gameState.fade_value;

    // Scrolling background.
    this.scrollingBackground(inBackbuffer);

    inBackbuffer.DrawText(gameState.bbCenterPoint, 0, `Start A New Game`, font1_green, GDDRAWTEXT_CENTER, fade_value);

    // Icons.  The chosen icon is drawn fully solid and the other one half see-through.  Two opacities are worked
    // out for that.  The first is for the icon that is NOT chosen: when not fading, it's a 50% blend; when fading
    // in or out, use fade_value when it is less than that.
    let opacity1 = 128;
    if (gameState.fade_function !== 0) {
      if (fade_value < 128) {
        opacity1 = fade_value;
      }
    }
    // The second is for the chosen icon: when not fading, it's a 100% blend; when fading in or out just use
    // fade_value.
    let opacity2 = 255;
    if (gameState.fade_function !== 0) {
      opacity2 = fade_value;
    }
    if (this.which_icon === 0) {
      inBackbuffer.BltFast(29, 24, `gfx_icon_adventure_game`, null, opacity2);
      inBackbuffer.BltFast(147, 24, `gfx_icon_mini_game_melee`, null, opacity1);
    } else {
      inBackbuffer.BltFast(29, 24, `gfx_icon_adventure_game`, null, opacity1);
      inBackbuffer.BltFast(147, 24, `gfx_icon_mini_game_melee`, null, opacity2);
    }

    // Display mode 1: Mini-game melee.  A picture of the current mini-game (with a padlock over it if it is still
    // locked), an arrow either side, and below it the mini-game's name and its two-line description.
    if (this.display_mode === 1) {
      inBackbuffer.BltFast(69, 112, gameState.screenshots[this.current_screenshot], null, fade_value);
      if (!gameState.game_unlocked[this.current_screenshot]) {
        inBackbuffer.BltFast(86, 124, `gfx_lock`, null, fade_value);
      }
      if (this.prev_down) {
        inBackbuffer.BltFast(20, 156, `gfx_ins_prev_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(20, 156, `gfx_ins_prev_0`, null, fade_value);
      }
      if (this.next_down) {
        inBackbuffer.BltFast(196, 156, `gfx_ins_next_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(196, 156, `gfx_ins_next_0`, null, fade_value);
      }
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 216, gameState.mini_game_info[this.current_screenshot][0],
        font1, GDDRAWTEXT_CENTER, fade_value
      );
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 244, gameState.mini_game_info[this.current_screenshot][1],
        font1, GDDRAWTEXT_CENTER, fade_value
      );
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 262, gameState.mini_game_info[this.current_screenshot][2],
        font1, GDDRAWTEXT_CENTER, fade_value
      );
    }

    // Display mode 2: Adventure game.
    if (this.display_mode === 2) {
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 110, `Adventure mode is the`, font1, GDDRAWTEXT_CENTER, fade_value
      );
      // NOTE: the original text here read "story-driven driven mode of", with the word doubled.  Corrected at
      // Frank's request.
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 128, `story-driven mode of`, font1, GDDRAWTEXT_CENTER, fade_value
      );
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 146, `K&G Arcade, but it is also`, font1, GDDRAWTEXT_CENTER, fade_value
      );
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 164, `the way you unlock mini-games`, font1, GDDRAWTEXT_CENTER, fade_value
      );
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 182, `to play in Mini-Game Melee.`, font1, GDDRAWTEXT_CENTER, fade_value
      );
      // Begin A New Adventure selector: a pale box with the invitation to begin written on it.  When not fading,
      // it's a 50% blend; when fading in or out, use fade_value when it is less than that.
      let boxOpacity = 128;
      if (gameState.fade_function !== 0) {
        if (fade_value < 128) {
          boxOpacity = fade_value;
        }
      }
      inBackbuffer.FillRect(CRect(0, 236, 240, 257), RGB(240, 240, 240), boxOpacity);
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 236, `ACTION/Click to begin game`, font1, GDDRAWTEXT_CENTER, fade_value
      );
    }

    // Display mode 3: Select mini-game sub-mode.
    if (this.display_mode === 3) {
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 110, gameState.mini_game_info[this.current_screenshot][0],
        font1, GDDRAWTEXT_CENTER, fade_value
      );
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, 170, `What Mini-Game Mode?`, font1, GDDRAWTEXT_CENTER, fade_value
      );
      if (this.prev_down) {
        inBackbuffer.BltFast(2, 200, `gfx_ins_prev_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(2, 200, `gfx_ins_prev_0`, null, fade_value);
      }
      if (this.next_down) {
        inBackbuffer.BltFast(214, 200, `gfx_ins_next_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(214, 200, `gfx_ins_next_0`, null, fade_value);
      }
      if (this.sub_mode === 0) {
        inBackbuffer.DrawText(
          gameState.bbCenterPoint, 202, `Timed 60-Second Game`, font1, GDDRAWTEXT_CENTER, fade_value
        );
      } else {
        inBackbuffer.DrawText(
          gameState.bbCenterPoint, 202, `Play Until I Say Stop`, font1, GDDRAWTEXT_CENTER, fade_value
        );
      }
    }

    // Back.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 300, `COMMAND/Click for Main Menu`, font1_green, GDDRAWTEXT_CENTER, fade_value
    );

    // Fading.
    this.screenFader();

  } /* End pnf(). */


  /**
   * A key was pressed.  LEFT and RIGHT press the Previous and Next arrows, when there are arrows showing.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Left.
    if (inKey === gameState.kLeft) {
      if (this.display_mode === 1 || this.display_mode === 3) {
        this.prev_down = true;
      }
    }

    // Right.
    if (inKey === gameState.kRight) {
      if (this.display_mode === 1 || this.display_mode === 3) {
        this.next_down = true;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.
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

    // Left.
    if (inKey === gameState.kLeft) {
      if (this.onTop) { // We're selecting between Mini-Game Melee and Adventure Mode
        sndObj.playSound(`sfx_misc_3`);
        if (this.which_icon === 1) {
          this.which_icon = 0;
        } else {
          this.which_icon = 1;
        }
      } else { // On bottom...
        this.prev_down = false;
        if (this.display_mode === 1) { // Mini-game selection
          sndObj.playSound(`sfx_misc_2`);
          this.current_screenshot--;
          if (this.current_screenshot < 0) {
            this.current_screenshot = 24;
          }
        }
        if (this.display_mode === 3) { // Sub-mode selection
          sndObj.playSound(`sfx_misc_2`);
          if (this.sub_mode === 0) {
            this.sub_mode = 1;
          } else {
            this.sub_mode = 0;
          }
        }
      }
    }

    // Right.
    if (inKey === gameState.kRight) {
      if (this.onTop) { // We're selecting between Mini-Game Melee and Adventure Mode
        sndObj.playSound(`sfx_misc_3`);
        if (this.which_icon === 1) {
          this.which_icon = 0;
        } else {
          this.which_icon = 1;
        }
      } else { // On bottom...
        this.next_down = false;
        if (this.display_mode === 1) { // Mini-game selection
          sndObj.playSound(`sfx_misc_2`);
          this.current_screenshot++;
          if (this.current_screenshot > 24) {
            this.current_screenshot = 0;
          }
        }
        if (this.display_mode === 3) { // Sub-mode selection
          sndObj.playSound(`sfx_misc_2`);
          if (this.sub_mode === 0) {
            this.sub_mode = 1;
          } else {
            this.sub_mode = 0;
          }
        }
      }
    }

    // Action.
    if (inKey === gameState.kAction) {
      if (!this.onTop) {

        // A mini-game has been chosen (it must be an unlocked one).  Go on to ask how it is to be played.
        if (this.display_mode === 1 && gameState.game_unlocked[this.current_screenshot]) {
          sndObj.playSound(`sfx_misc_1`);
          this.display_mode = 3;
          this.sub_mode = 0;
          return;
        }

        // Begin adventure.
        if (this.display_mode === 2) {
          sndObj.playSound(`sfx_misc_1`);
          if (gameState.gameRestarted) {
            // There is a saved game, which starting a new one would wipe out, so check first.  Do a popup...
            // Popup callback.
            this.popupCallback = this.popupCallbackVerifyNewGame;
            // Popup options.
            gameState.gpOptionsCount = 2;
            gameState.gpOptions[0] = `Yes`;
            gameState.gpOptions[1] = `No`;
            // Start popup.
            this.startPopup(`Existing saved game`, `will be lost. Continue?`);
          } else {
            gameState.gameRestarted = false;
            gameState.startingNewGame = true;
            gameState.processEvents = false;
            gameState.jumpBackToNewGameType = false;
            gameState.game_mode = -1; // To avoid going back to the screen we're on right away
            setupForNewGame();
            this.doDestroy(getSceneKeyForScreen(csNewAdventure));
          }
        }

        // Begin mini-game.
        if (this.display_mode === 3) {
          sndObj.playSound(`sfx_misc_1`);
          gameState.processEvents = false;
          // Go back to showing the mini-games, so that is what the player sees on returning here afterwards.
          this.display_mode = 1;
          if (this.sub_mode === 0) {
            gameState.jumpBackToNewGameType = false;
            gameState.game_mode = -1; // To avoid going back to the screen we're on right away
            this.doDestroy(getSceneKeyForScreen(gameState.melee_selection[this.current_screenshot]));
            gameState.current_mini_game = this.current_screenshot;
            gameState.game_submode = gsmTimed;
            gameState.game_mode = gmMiniGameMelee;
          } else {
            gameState.processEvents = false;
            gameState.jumpBackToNewGameType = false;
            gameState.game_mode = -1; // To avoid going back to the screen we're on right away
            this.doDestroy(getSceneKeyForScreen(gameState.melee_selection[this.current_screenshot]));
            gameState.current_mini_game = this.current_screenshot;
            gameState.game_submode = gsmAlaCarte;
            gameState.game_mode = gmMiniGameMelee;
          }
        }

      } else { // We're on top, do the same as clicking down
        sndObj.playSound(`sfx_misc_1`);
        this.onTop = false;
        if (this.which_icon === 0) {
          this.display_mode = 2;
        } else {
          this.display_mode = 1;
        }
      }
    }

    // Up.
    if (inKey === gameState.kUp) {
      if (!this.onTop) { // Up only has meaning when we're on the bottom
        sndObj.playSound(`sfx_misc_3`);
        this.onTop = true;
        this.display_mode = 0;
      }
    }

    // Down.
    if (inKey === gameState.kDown) {
      if (this.onTop) { // Down only has meaning when we're on the top
        sndObj.playSound(`sfx_misc_1`);
        this.onTop = false;
        if (this.which_icon === 0) {
          this.display_mode = 2;
        } else {
          this.display_mode = 1;
        }
      }
    }

  } /* End ku(). */


  /**
   * The stylus went down.
   *
   * In the original, the check for the hidden "unlock every mini-game" code was made in the central StylusDown()
   * function, just before it passed the tap on to this screen.  It lives here in the port, since this is the only
   * screen it applies to.  The code is this: tap the top-left corner of the screen three times and the top-right
   * corner three times (in any order).  A chime plays and every mini-game is unlocked.
   *
   * @param {object} inPoint Where on the screen it went down, with x and y properties.
   */
  sd(inPoint) {

    let wasACorner = false;

    // Once the code has been entered the corners stop being special.
    if (!(gameState.unlockCornerUL === 3 && gameState.unlockCornerUR === 3)) {
      if (PtInRect(CRect(0, 0, 20, 20), inPoint)) {
        gameState.unlockCornerUL++;
        wasACorner = true;
        if (gameState.unlockCornerUL > 3) {
          gameState.unlockCornerUL = 3;
        }
      }
      if (PtInRect(CRect(220, 0, 240, 20), inPoint)) {
        gameState.unlockCornerUR++;
        wasACorner = true;
        if (gameState.unlockCornerUR > 3) {
          gameState.unlockCornerUR = 3;
        }
      }
      if (wasACorner) {
        if (gameState.unlockCornerUL === 3 && gameState.unlockCornerUR === 3) {
          sndObj.playSound(`sfx_unlockcode`);
          for (let i = 0; i < 25; i++) {
            gameState.game_unlocked[i] = true;
          }
        }
      }
    }

    if (!wasACorner) {
      this.sdNewGameType(inPoint);
    }

  } /* End sd(). */


  /**
   * StylusDown handler (the original's sdNewGameType()).  Touching an arrow is treated exactly like pressing LEFT
   * or RIGHT.
   *
   * @param {object} inPoint Where on the screen the stylus went down, with x and y properties.
   */
  sdNewGameType(inPoint) {

    if (this.display_mode === 1 && PtInRect(CRect(20, 156, 44, 180), inPoint)) { // Previous while in melee mode
      this.kd(gameState.kLeft);
      return;
    }

    if (this.display_mode === 1 && PtInRect(CRect(196, 156, 220, 180), inPoint)) { // Next while in melee mode
      this.kd(gameState.kRight);
      return;
    }

    if (this.display_mode === 3 && PtInRect(CRect(2, 200, 26, 224), inPoint)) { // Previous while in sub-mode select
      this.kd(gameState.kLeft);
      return;
    }

    // NOTE: the original's rectangle here was CRect(214, 200, 228, 224), only 14 pixels wide, so the right-hand part
    // of the arrow (which is 24 pixels wide, like all the others) did not respond.  Widened to cover the whole
    // arrow at Frank's request.  The same goes for the matching check in su().
    if (this.display_mode === 3 && PtInRect(CRect(214, 200, 238, 224), inPoint)) { // Next while in sub-mode select
      this.kd(gameState.kRight);
      return;
    }

  } /* End sdNewGameType(). */


  /**
   * The stylus came up.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    // Menu.
    if (!this.prev_down && !this.next_down && PtInRect(CRect(0, 300, 240, 320), inPoint)) {
      this.ku(gameState.kCommand);
      return;
    }

    // Adventure mode.  (The icon is chosen by setting the OTHER icon and then pretending LEFT was pressed, which
    // swaps them over and plays the sound; pretending DOWN was pressed then moves to the bottom half.)
    if (!this.prev_down && !this.next_down && PtInRect(CRect(29, 24, 94, 90), inPoint)) {
      this.onTop = true;
      this.which_icon = 1;
      this.ku(gameState.kLeft);
      this.ku(gameState.kDown);
      return;
    }

    // Melee mode.
    if (!this.prev_down && !this.next_down && PtInRect(CRect(147, 24, 213, 90), inPoint)) {
      this.onTop = true;
      this.which_icon = 0;
      this.ku(gameState.kLeft);
      this.ku(gameState.kDown);
      return;
    }

    // Start new game.
    //
    // NOTE: the original did not check the display mode here, so a tap in this band of the screen acted as ACTION
    // whatever was showing, and not only when the Adventure invitation was drawn there.  While browsing the
    // mini-games, for example, tapping the first line of the description chose the mini-game.  Limited to the
    // Adventure display at Frank's request.
    if (!this.prev_down && !this.next_down && this.display_mode === 2 &&
      PtInRect(CRect(0, 236, 240, 257), inPoint)
    ) {
      this.ku(gameState.kAction);
      return;
    }

    // Previous while in melee mode.
    if (this.prev_down && this.display_mode === 1 && PtInRect(CRect(20, 156, 44, 180), inPoint)) {
      this.ku(gameState.kLeft);
      return;
    }

    // Next while in melee mode.
    if (this.next_down && this.display_mode === 1 && PtInRect(CRect(196, 156, 220, 180), inPoint)) {
      this.ku(gameState.kRight);
      return;
    }

    // Previous while in sub-mode select.
    if (this.prev_down && this.display_mode === 3 && PtInRect(CRect(2, 200, 26, 224), inPoint)) {
      this.ku(gameState.kLeft);
      return;
    }

    // Next while in sub-mode select.  (See the NOTE in sdNewGameType() about the width of this rectangle.)
    if (this.next_down && this.display_mode === 3 && PtInRect(CRect(214, 200, 238, 224), inPoint)) {
      this.ku(gameState.kRight);
      return;
    }

    // Select sub-mode.
    if (!this.prev_down && !this.next_down && this.display_mode === 3 &&
      PtInRect(CRect(30, 200, 210, 220), inPoint)
    ) {
      this.ku(gameState.kAction);
      return;
    }

    // Select mini-game while in melee mode.
    if (!this.prev_down && !this.next_down && this.display_mode === 1 &&
      PtInRect(CRect(69, 112, 171, 214), inPoint)
    ) {
      this.ku(gameState.kAction);
      return;
    }

    this.prev_down = false;
    this.next_down = false;

  } /* End su(). */


  /**
   * Puts the screen back to its starting state: the top half in control with Adventure Game chosen, and nothing
   * showing in the bottom half.  The main menu calls this just before it fades to this screen.
   */
  ngtReset() {

    this.display_mode = 0;
    this.current_screenshot = 0;
    this.which_icon = 0;
    this.onTop = true;
    this.sub_mode = 0;
    this.prev_down = false;
    this.next_down = false;

  } /* End ngtReset(). */


  /**
   * Popup Callback Handler for when New Game clicked and there is a saved game.
   *
   * @param {number} inOption The number of the option that was picked: 0 = Yes, 1 = No.
   */
  popupCallbackVerifyNewGame(inOption) {

    if (inOption === 0) { // Go ahead and start a new game, overwriting existing game
      gameState.gameRestarted = false;
      gameState.startingNewGame = true;
      gameState.processEvents = false;
      gameState.jumpBackToNewGameType = false;
      gameState.game_mode = -1; // To avoid going back to the screen we're on right away
      setupForNewGame();
      this.doDestroy(getSceneKeyForScreen(csNewAdventure));
    } // Otherwise we'll just abort

  } /* End popupCallbackVerifyNewGame(). */


} /* End class. */
