/**
 * The main menu: the game's title above a stack of seven buttons (New Game, Continue Game, High Scores,
 * Instructions, Options, Credits and Quit), over a scrolling background, with the theme music playing.  UP and DOWN
 * move the highlight and ACTION picks the highlighted button; or a button can simply be tapped.
 *
 * This is the port of main_menu.cpp.
 *
 * The menu is the hub for a group of screens (New Game Type, High Scores, Instructions, Options and Credits) that
 * the original treated as one family: they share the scrolling background and the music, and moving between them is
 * done with a quick fade rather than by unloading one and loading the next.  See switchScreen() and screenFader()
 * in GameScene.js.
 */
class MainMenuScene extends GameScene {


  // The position (x, y) and size (w, h) of each part of the menu.  The menu is drawn as a stack of separate
  // images: a top cap, the seven buttons, and a bottom cap.  These are all worked out in loadScreen().
  x_top = 0;
  y_top = 0;
  w_top = 0;
  h_top = 0;
  x_new_game = 0;
  y_new_game = 0;
  w_new_game = 0;
  h_new_game = 0;
  x_high_scores = 0;
  y_high_scores = 0;
  w_high_scores = 0;
  h_high_scores = 0;
  x_continue_game = 0;
  y_continue_game = 0;
  w_continue_game = 0;
  h_continue_game = 0;
  x_instructions = 0;
  y_instructions = 0;
  w_instructions = 0;
  h_instructions = 0;
  x_options = 0;
  y_options = 0;
  w_options = 0;
  h_options = 0;
  x_credits = 0;
  y_credits = 0;
  w_credits = 0;
  h_credits = 0;
  x_quit = 0;
  y_quit = 0;
  w_quit = 0;
  h_quit = 0;
  x_bottom = 0;
  y_bottom = 0;
  w_bottom = 0;
  h_bottom = 0;

  // The horizontal position of the title image.
  x_title = 0;

  // Which button is highlighted: 1 = New Game, 2 = Continue Game, 3 = High Scores, 4 = Instructions, 5 = Options,
  // 6 = Credits, 7 = Quit.
  active_item = 1;

  // The vertical position of the title image, and of the top of the menu.
  title_y = 1;
  menu_start_y = 53;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`MainMenuScene.constructor`);

    super(`MainMenuScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.
   */
  loadScreen() {

    console.log(`MainMenuScene.loadScreen()`);

    gameState.themePlaying = false;
    this.active_item = 1;

    // Get the size of each part of the menu from its image.  (Each button has two images, a normal one ending in
    // _0 and a highlighted one ending in _1, which are the same size.)
    this.w_top = Surface.GetImageWidth(`gfx_menu_top`);
    this.w_new_game = Surface.GetImageWidth(`gfx_menu_new_game_0`);
    this.w_high_scores = Surface.GetImageWidth(`gfx_menu_high_scores_0`);
    this.w_continue_game = Surface.GetImageWidth(`gfx_menu_continue_game_0`);
    this.w_instructions = Surface.GetImageWidth(`gfx_menu_instructions_0`);
    this.w_options = Surface.GetImageWidth(`gfx_menu_options_0`);
    this.w_credits = Surface.GetImageWidth(`gfx_menu_credits_0`);
    this.w_quit = Surface.GetImageWidth(`gfx_menu_quit_0`);
    this.w_bottom = Surface.GetImageWidth(`gfx_menu_bottom`);
    this.h_top = Surface.GetImageHeight(`gfx_menu_top`);
    this.h_new_game = Surface.GetImageHeight(`gfx_menu_new_game_0`);
    this.h_high_scores = Surface.GetImageHeight(`gfx_menu_high_scores_0`);
    this.h_continue_game = Surface.GetImageHeight(`gfx_menu_continue_game_0`);
    this.h_instructions = Surface.GetImageHeight(`gfx_menu_instructions_0`);
    this.h_options = Surface.GetImageHeight(`gfx_menu_options_0`);
    this.h_credits = Surface.GetImageHeight(`gfx_menu_credits_0`);
    this.h_quit = Surface.GetImageHeight(`gfx_menu_quit_0`);

    // Center everything horizontally.  The original did these sums with whole numbers, where dividing throws away
    // any remainder (so a 127 pixel wide button lands at 56, not 56.5).  Math.trunc() does the same thing here.
    this.x_title = Math.trunc((240 - Surface.GetImageWidth(`gfx_main_menu_title`)) / 2);
    this.x_top = Math.trunc((240 - this.w_top) / 2);
    this.x_new_game = Math.trunc((240 - this.w_new_game) / 2);
    this.x_high_scores = Math.trunc((240 - this.w_high_scores) / 2);
    this.x_continue_game = Math.trunc((240 - this.w_continue_game) / 2);
    this.x_instructions = Math.trunc((240 - this.w_instructions) / 2);
    this.x_options = Math.trunc((240 - this.w_options) / 2);
    this.x_credits = Math.trunc((240 - this.w_credits) / 2);
    this.x_quit = Math.trunc((240 - this.w_quit) / 2);
    this.x_bottom = Math.trunc((240 - this.w_bottom) / 2);

    // Stack the parts vertically, each one directly below the one before.
    let y = this.menu_start_y;
    this.y_top = y;
    y = y + this.h_top;
    this.y_new_game = y;
    y = y + this.h_new_game;
    this.y_continue_game = y;
    y = y + this.h_continue_game;
    this.y_high_scores = y;
    y = y + this.h_high_scores;
    this.y_instructions = y;
    y = y + this.h_instructions;
    this.y_options = y;
    y = y + this.h_options;
    this.y_credits = y;
    y = y + this.h_credits;
    this.y_quit = y;
    y = y + this.h_quit;
    this.y_bottom = y;

    // So that if we just saved a game and exited, it will be re-read as started.
    readKGAFile();

    // The original showed a blank, black screen while it was loading.
    backbuffer.FillRect(null, RGB(0, 0, 0));

    // When a mini-game played in Mini-Game Melee finishes, the player should arrive back at the New Game Type
    // screen, not here.  But that screen has no loading of its own (everything it uses belongs to the main menu),
    // so what the original did was to load the main menu as usual and then, if this flag had been set by the
    // mini-game on its way out, hand straight over to the New Game Type screen without ever showing the menu.
    //
    // NOTE: the original never cleared the flag here.  It was only cleared when the next mini-game started or a
    // new game was begun, so until then ANY loading of the main menu (coming back from a continued adventure,
    // say) wrongly landed on the New Game Type screen as well.  The flag is now cleared as soon as it has been
    // acted on, at Frank's request.
    if (gameState.jumpBackToNewGameType) {
      gameState.jumpBackToNewGameType = false;
      this.switchScreen(`NewGameTypeScene`);
    }

  } /* End loadScreen(). */


  /**
   * Cleans the screen up.
   */
  destroyScreen() {

    console.log(`MainMenuScene.destroyScreen()`);

    sndObj.stopSounds();
    gameState.themePlaying = false;

    // The original showed a blank, black screen while it was unloading, except when the game was shutting down (the
    // shutdown sequence calls this method directly, and takes care of the screen itself).
    if (gameState.shutdownStep === 0) {
      backbuffer.FillRect(null, RGB(0, 0, 0));
    }

  } /* End destroyScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Start the theme music, if it is not already playing.  It loops until something stops it.
    if (!gameState.themePlaying) {
      gameState.themePlaying = true;
      sndObj.playSound(`sfx_music_theme`, true);
    }

    // Set up for fading.  Everything except the background is drawn at this opacity, which is what makes the menu
    // fade out and in when moving to and from the other screens.
    const fade_value = gameState.fade_value;

    // Background.
    this.scrollingBackground(inBackbuffer);

    // Title.
    inBackbuffer.BltFast(this.x_title, this.title_y, `gfx_main_menu_title`, null, fade_value);

    // Blit menu.  Each button is drawn with its highlighted image if it is the active item, or its normal image if
    // it is not.
    inBackbuffer.BltFast(this.x_top, this.y_top, `gfx_menu_top`, null, fade_value);
    if (this.active_item === 1) {
      inBackbuffer.BltFast(this.x_new_game, this.y_new_game, `gfx_menu_new_game_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_new_game, this.y_new_game, `gfx_menu_new_game_0`, null, fade_value);
    }
    if (this.active_item === 2) {
      inBackbuffer.BltFast(this.x_continue_game, this.y_continue_game, `gfx_menu_continue_game_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_continue_game, this.y_continue_game, `gfx_menu_continue_game_0`, null, fade_value);
    }
    if (this.active_item === 3) {
      inBackbuffer.BltFast(this.x_high_scores, this.y_high_scores, `gfx_menu_high_scores_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_high_scores, this.y_high_scores, `gfx_menu_high_scores_0`, null, fade_value);
    }
    if (this.active_item === 4) {
      inBackbuffer.BltFast(this.x_instructions, this.y_instructions, `gfx_menu_instructions_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_instructions, this.y_instructions, `gfx_menu_instructions_0`, null, fade_value);
    }
    if (this.active_item === 5) {
      inBackbuffer.BltFast(this.x_options, this.y_options, `gfx_menu_options_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_options, this.y_options, `gfx_menu_options_0`, null, fade_value);
    }
    if (this.active_item === 6) {
      inBackbuffer.BltFast(this.x_credits, this.y_credits, `gfx_menu_credits_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_credits, this.y_credits, `gfx_menu_credits_0`, null, fade_value);
    }
    if (this.active_item === 7) {
      inBackbuffer.BltFast(this.x_quit, this.y_quit, `gfx_menu_quit_1`, null, fade_value);
    } else {
      inBackbuffer.BltFast(this.x_quit, this.y_quit, `gfx_menu_quit_0`, null, fade_value);
    }
    inBackbuffer.BltFast(this.x_bottom, this.y_bottom, `gfx_menu_bottom`, null, fade_value);

    // Fading.
    this.screenFader();

  } /* End pnf(). */


  /**
   * A key was pressed.  UP and DOWN move the highlight, wrapping around at the ends.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (inKey === gameState.kUp) {
      sndObj.playSound(`sfx_misc_3`);
      this.active_item--;
      if (this.active_item < 1) {
        this.active_item = 7;
      }
    }

    if (inKey === gameState.kDown) {
      sndObj.playSound(`sfx_misc_3`);
      this.active_item++;
      if (this.active_item > 7) {
        this.active_item = 1;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  ACTION picks the highlighted button.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    if (inKey === gameState.kAction) {
      switch (this.active_item) {

        // New Game.
        case 1: {
          this.scene.get(`NewGameTypeScene`).ngtReset();
          sndObj.playSound(`sfx_misc_1`);
          gameState.fade_function = 1;
          gameState.next_screen = `NewGameTypeScene`;
        break; }

        // Continue Game.
        case 2: {
          sndObj.playSound(`sfx_misc_1`);
          readKGAFile();
          gameState.current_level_initialized = false;
          if (gameState.gameRestarted) {
            gameState.startingNewGame = false;
            gameState.whichGameBeingPlayed = 0;
            gameState.current_level_initialized = false;
            gameState.player_dir_north = false;
            gameState.player_dir_south = false;
            gameState.player_dir_east = false;
            gameState.player_dir_west = false;
            gameState.player_button_down = false;
            gameState.game_mode = gmAdventureGame;
            this.doDestroy(getSceneKeyForScreen(csWalkingAroundTheShip));
          } else {
            // Do a popup...
            // Popup callback.
            this.popupCallback = this.popupCallbackMainMenuContinueGame;
            // Popup options.
            gameState.gpOptionsCount = 1;
            gameState.gpOptions[0] = `Ok`;
            // Start popup.
            this.startPopup(`There is no saved`, `game to continue`);
          }
        break; }

        // High Scores.
        case 3: {
          this.scene.get(`HighScoresScene`).hisReset();
          sndObj.playSound(`sfx_misc_1`);
          gameState.fade_function = 1;
          gameState.next_screen = `HighScoresScene`;
        break; }

        // Instructions.
        case 4: {
          this.scene.get(`InstructionsScene`).insReset();
          sndObj.playSound(`sfx_misc_1`);
          gameState.fade_function = 1;
          gameState.next_screen = `InstructionsScene`;
        break; }

        // Options.
        case 5: {
          this.scene.get(`OptionsScene`).optReset();
          sndObj.playSound(`sfx_misc_1`);
          readKGAFile();
          gameState.fade_function = 1;
          gameState.next_screen = `OptionsScene`;
        break; }

        // Credits.
        case 6: {
          this.scene.get(`CreditsScene`).crdReset();
          sndObj.playSound(`sfx_misc_1`);
          gameState.fade_function = 1;
          gameState.next_screen = `CreditsScene`;
        break; }

        // Quit.  This starts the "television being switched off" effect.  See ExitingScene.js.
        case 7: {
          sndObj.stopSounds();
          sndObj.playSound(`sfx_misc_1`);
          gameState.ExitCounter = 0;
          gameState.ExitFadeCounter = 255;
          gameState.shutdownStep = 1;
          sndObj.playSound(`sfx_game_exit_sound`);
          this.switchScreen(`ExitingScene`);
        break; }

      }
    }

  } /* End ku(). */


  /**
   * The stylus went down.  Touching a button highlights it.
   *
   * @param {object} inPoint Where on the screen it went down, with x and y properties.
   */
  sd(inPoint) {

    if (PtInRect(CRect(this.x_new_game, this.y_new_game,
      this.x_new_game + this.w_new_game, this.y_new_game + this.h_new_game), inPoint)
    ) {
      this.active_item = 1;
    }
    if (PtInRect(CRect(this.x_continue_game, this.y_continue_game,
      this.x_continue_game + this.w_continue_game, this.y_continue_game + this.h_continue_game), inPoint)
    ) {
      this.active_item = 2;
    }
    if (PtInRect(CRect(this.x_high_scores, this.y_high_scores,
      this.x_high_scores + this.w_high_scores, this.y_high_scores + this.h_high_scores), inPoint)
    ) {
      this.active_item = 3;
    }
    if (PtInRect(CRect(this.x_instructions, this.y_instructions,
      this.x_instructions + this.w_instructions, this.y_instructions + this.h_instructions), inPoint)
    ) {
      this.active_item = 4;
    }
    if (PtInRect(CRect(this.x_options, this.y_options,
      this.x_options + this.w_options, this.y_options + this.h_options), inPoint)
    ) {
      this.active_item = 5;
    }
    if (PtInRect(CRect(this.x_credits, this.y_credits,
      this.x_credits + this.w_credits, this.y_credits + this.h_credits), inPoint)
    ) {
      this.active_item = 6;
    }
    if (PtInRect(CRect(this.x_quit, this.y_quit,
      this.x_quit + this.w_quit, this.y_quit + this.h_quit), inPoint)
    ) {
      this.active_item = 7;
    }

  } /* End sd(). */


  /**
   * The stylus came up.  Letting go over a button picks whichever button is highlighted, exactly as if ACTION had
   * been pressed.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    if (PtInRect(CRect(this.x_new_game, this.y_new_game,
      this.x_new_game + this.w_new_game, this.y_new_game + this.h_new_game), inPoint)
    ) {
      this.ku(gameState.kAction);
    }
    if (PtInRect(CRect(this.x_continue_game, this.y_continue_game,
      this.x_continue_game + this.w_continue_game, this.y_continue_game + this.h_continue_game), inPoint)
    ) {
      this.ku(gameState.kAction);
    }
    if (PtInRect(CRect(this.x_high_scores, this.y_high_scores,
      this.x_high_scores + this.w_high_scores, this.y_high_scores + this.h_high_scores), inPoint)
    ) {
      this.ku(gameState.kAction);
    }
    if (PtInRect(CRect(this.x_instructions, this.y_instructions,
      this.x_instructions + this.w_instructions, this.y_instructions + this.h_instructions), inPoint)
    ) {
      this.ku(gameState.kAction);
    }
    if (PtInRect(CRect(this.x_options, this.y_options,
      this.x_options + this.w_options, this.y_options + this.h_options), inPoint)
    ) {
      this.ku(gameState.kAction);
    }
    if (PtInRect(CRect(this.x_credits, this.y_credits,
      this.x_credits + this.w_credits, this.y_credits + this.h_credits), inPoint)
    ) {
      this.ku(gameState.kAction);
    }
    if (PtInRect(CRect(this.x_quit, this.y_quit,
      this.x_quit + this.w_quit, this.y_quit + this.h_quit), inPoint)
    ) {
      this.ku(gameState.kAction);
    }

  } /* End su(). */


  /**
   * Popup Callback Handler for when Continue Game clicked and there is no saved game.
   *
   * @param {number} inOption The number of the option that was picked.
   */
  popupCallbackMainMenuContinueGame(inOption) {

    // Do nothing, the popup just ends.

  } /* End popupCallbackMainMenuContinueGame(). */


} /* End class. */
