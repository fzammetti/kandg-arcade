/**
 * The base class that every screen of the game (other than the preloader and the cut scenes) extends.
 *
 * In the original, one class (CGame) received every event from the system - "time to draw a frame", "a key went
 * down", "the stylus touched the screen" and so on - and passed each one along to whichever screen was showing at
 * the time.  Each screen was a group of functions with a common naming pattern: for the main menu they were
 * loadMainMenu(), destroyMainMenu(), pnfMainMenu() (pnf is short for Process Next Frame), kdMainMenu() and
 * kuMainMenu() (Key Down and Key Up), and sdMainMenu() and suMainMenu() (Stylus Down and Stylus Up).
 *
 * This class is the port of that central event handling.  A screen extends it and provides whichever of these
 * methods it needs, which correspond one-for-one with the original functions:
 *
 *   loadScreen()    - set the screen up.  Called when the screen is arrived at via doDestroy().
 *   destroyScreen() - clean the screen up.  Called when the screen is left via doDestroy().
 *   pnf(inSurface)  - draw one frame (and do one frame's worth of game logic).  Called 24 times a second.
 *   kd(inKey)       - a key was pressed.
 *   ku(inKey)       - a key was released.
 *   sd(inPoint)     - the stylus (the mouse button or a finger, these days) went down.
 *   su(inPoint)     - the stylus came back up.
 *
 * It also holds the things from the original's main.cpp that several screens share: the scrolling background and
 * the fade used by the main menu and the screens around it, and the popup box.
 *
 * There are two ways of getting from one screen to another, exactly as there were in the original:
 *
 *   doDestroy(sceneKey)    - the full route.  This screen is cleaned up (destroyScreen) and the next one is set up
 *                            from scratch (loadScreen).
 *   switchScreen(sceneKey) - the quick route.  The original simply changed which screen was current, with no
 *                            cleaning up and no setting up.  The main menu and the screens around it (options,
 *                            instructions, high scores and so on) move between one another this way, which is why
 *                            the music keeps playing and the menu remembers which item was highlighted.
 *
 * IMPORTANT: Phaser creates each scene object just once and re-uses it every time the scene is shown.  That means
 * a screen's variables are NOT automatically reset when the player comes back to it, so loadScreen() must set every
 * one of them back to its starting value.  (The original was the same: its load functions did exactly this.)
 */
class GameScene extends Phaser.Scene {


  // How many frames of game logic have run since we last worked out the frame rate, and when that was.  These are
  // static (shared by every screen) so that the measurement carries on smoothly from one screen to the next.
  static framesCounted = 0;
  static frameRateMeasuredAt = 0;

  // The most recently measured frame rate, in frames per second.  It should hover right around 24.
  static actualFrameRate = 0;

  // How long the most recent frame took to draw, in milliseconds.
  static actualFrameTime = 0;

  // The method to call when the player picks an option in a popup.  A screen sets this just before it calls
  // startPopup().  It is called with the number of the option that was picked (0 for the first option).
  popupCallback = null;

  // The Phaser image that shows the backbuffer on the screen.  It is made afresh each time the scene is shown (see
  // create()).  Only cut scenes need to get at it.  See CutScene.js.
  backbufferImage = null;


  /**
   * Constructor.
   *
   * @param {string} inKey The name Phaser will know this scene by.
   */
  constructor(inKey) {

    console.log(`GameScene.constructor`, inKey);

    super({ key: inKey });

  } /* End constructor. */


  /**
   * Create the scene.  Phaser calls this every time the scene is started.
   *
   * @param {object} inData Data passed to the scene when it was started.  If it has a skipLoad property that is
   *                        true, the scene was started by switchScreen() and must not be set up afresh.
   */
  create(inData) {

    console.log(`GameScene.create()`, this.scene.key, inData);

    // Put the backbuffer on the screen.  This single image, covering the whole screen, is the only Phaser display
    // object the scene has.  Everything the player sees is drawn onto the backbuffer by the screen's pnf() method.
    // (The one exception is a cut scene, where OASIS adds pictures of its own; that is why we keep hold of the
    // image here.  See CutScene.js.)
    this.backbufferImage = this.add.image(0, 0, `backbuffer`).setOrigin(0, 0);

    // Listen for the keyboard.  Phaser removes these listeners by itself when the scene shuts down, so they do not
    // pile up if the player comes back to this screen later.
    this.input.keyboard.on(`keydown`, this.onKeyDown, this);
    this.input.keyboard.on(`keyup`, this.onKeyUp, this);

    // Listen for the mouse or a finger, which stand in for the PocketPC's stylus.  The "outside" event covers the
    // case of pressing on the screen, dragging off the edge of it, and then letting go.
    this.input.on(`pointerdown`, this.onPointerDown, this);
    this.input.on(`pointerup`, this.onPointerUp, this);
    this.input.on(`pointerupoutside`, this.onPointerUp, this);

    // If we got here by the quick route, that is all there is to do.  Everything else carries straight on from
    // where the previous screen left it (including whether events are being processed, since the quick route is
    // normally taken half way through a fade, when they are not).
    if (inData && inData.skipLoad === true) {
      return;
    }

    // Reset stored frame time so this scene stays synced to the expected frame rate.
    frameTime = 0;

    // Events are processed unless the screen says otherwise.
    gameState.processEvents = true;

    // Make a note of any keys that are being held down as we arrive, so that letting go of them does nothing on
    // this screen.  See keyCameUp().
    gameState.keysDownOnArrival = { };
    for (const code of Object.keys(gameState.keysDown)) {
      gameState.keysDownOnArrival[code] = true;
    }

    // Now let the screen itself get set up.  It may well draw something (most screens start by clearing to black,
    // as the original did while loading), so tell Phaser the backbuffer has changed.
    this.loadScreen();
    backbufferTexture.refresh();

  } /* End create(). */


  /**
   * Render the next frame.  Phaser calls this every time the browser is ready to redraw, typically 60 times a
   * second.  This is the port of CGame::ProcessNextFrame().
   *
   * @param {number} inTime  The current time.
   * @param {number} inDelta The delta time in milliseconds since the last frame.
   */
  update(inTime, inDelta) {

    // The original game ran at 24 frames per second, and all of its animation and timing is counted in frames.  So
    // we only do anything when a 24th of a second has gone by.
    if (!limitFrameRateTo24(inDelta)) { return; }

    // Keep track of the frame rate we are actually achieving, re-calculating it once a second.
    GameScene.framesCounted++;
    const elapsed = inTime - GameScene.frameRateMeasuredAt;
    if (elapsed >= 1000) {
      GameScene.actualFrameRate = (GameScene.framesCounted * 1000) / elapsed;
      GameScene.framesCounted = 0;
      GameScene.frameRateMeasuredAt = inTime;
    }

    // While a popup is showing, it is drawn INSTEAD of the screen.  The screen underneath is not redrawn at all, so
    // it simply stays frozen exactly as it was when the popup appeared.  We time how long the drawing takes, for
    // the frame time display below.
    const drawingStarted = performance.now();
    if (gameState.doPopup) {
      this.pnfPopup(backbuffer);
    } else {
      this.pnf(backbuffer);
    }
    GameScene.actualFrameTime = performance.now() - drawingStarted;

    // If the Options screen has switched them on, show the frame rate in the top-left corner of the screen and the
    // frame time in the top-right.  Each is a whole number on a small black patch, drawn over the top of everything
    // else.  The frame rate is how many frames are being drawn each second (which should be 24).  The frame time
    // is how many milliseconds it took to draw this frame (which, on a modern computer, is next to nothing).
    if (gameState.show_fps) {
      backbuffer.FillRect(CRect(0, 0, 22, 16), RGB(0, 0, 0));
      backbuffer.DrawText(0, -4, GameScene.actualFrameRate.toFixed(0), font1, GDDRAWTEXT_LEFT);
    }
    if (gameState.show_frame_time) {
      backbuffer.FillRect(CRect(218, 0, 240, 16), RGB(0, 0, 0));
      backbuffer.DrawText(240, -4, GameScene.actualFrameTime.toFixed(0), font1, GDDRAWTEXT_RIGHT);
    }

    // Finally, tell Phaser that the backbuffer has changed so that it copies the new picture to the screen.
    backbufferTexture.refresh();

  } /* End update(). */


  /**
   * Leaves this screen and goes to another by the full route: this screen is cleaned up and the next one is set up
   * from scratch.  This is the port of CGame::doDestroy(), which the original screens called to move on.
   *
   * @param {string} inSceneKey The name of the scene to go to next.
   */
  doDestroy(inSceneKey) {

    console.log(`GameScene.doDestroy()`, this.scene.key, `->`, inSceneKey);

    // Nothing more should happen on this screen.
    gameState.processEvents = false;

    // Let the screen clean up after itself, then move on.
    this.destroyScreen();

    // Note that we say explicitly that this is NOT the quick route.  Phaser remembers the data a scene was last
    // started with, and hands it over again if the scene is started without any.  So if we said nothing here, a
    // scene that had ever been reached by the quick route would believe that every later arrival was by the quick
    // route too, and would never be set up again.
    this.scene.start(inSceneKey, { skipLoad: false });

  } /* End doDestroy(). */


  /**
   * Leaves this screen and goes to another by the quick route: nothing is cleaned up and the next screen is not set
   * up afresh.  This is the equivalent of the original simply assigning a new value to current_screen.
   *
   * @param {string} inSceneKey The name of the scene to go to next.
   */
  switchScreen(inSceneKey) {

    console.log(`GameScene.switchScreen()`, this.scene.key, `->`, inSceneKey);

    this.scene.start(inSceneKey, { skipLoad: true });

  } /* End switchScreen(). */


  /**
   * Handles a key being pressed.  This is the port of CGame::KeyDown().
   *
   * @param {KeyboardEvent} inEvent The browser's keyboard event.
   */
  onKeyDown(inEvent) {

    this.preventBrowserDefault(inEvent);

    // When a key is held down, the browser reports it being pressed over and over.  A PocketPC button reported
    // going down just once, so we ignore the repeats.
    if (inEvent.repeat) {
      return;
    }

    this.keyWentDown(inEvent.code);

    // A popup takes all key presses for itself.
    if (gameState.doPopup) {
      this.kdPopup(inEvent.code);
      return;
    }

    // While the game is shutting down, any key press hurries the shutdown along to its next step.
    if (gameState.shutdownStep > 0) {
      gameState.shutdownStep++;
      return;
    }

    if (gameState.processEvents) {
      this.kd(inEvent.code);
    }

  } /* End onKeyDown(). */


  /**
   * Handles a key being released.  This is the port of CGame::KeyUp().
   *
   * @param {KeyboardEvent} inEvent The browser's keyboard event.
   */
  onKeyUp(inEvent) {

    this.preventBrowserDefault(inEvent);

    // A key that was already down when this screen was arrived at: letting go of it does nothing here.
    if (this.keyCameUp(inEvent.code)) {
      return;
    }

    // A popup takes all key releases for itself.
    if (gameState.doPopup) {
      this.kuPopup(inEvent.code);
      return;
    }

    if (gameState.processEvents) {
      this.ku(inEvent.code);
    }

  } /* End onKeyUp(). */


  /**
   * Makes a note that a key has gone down.  Every key press comes through here (the keyboard's, and those of the
   * buttons on the picture of the device), whatever the screen then does with it.
   *
   * @param {string} inCode The code of the key.
   */
  keyWentDown(inCode) {

    gameState.keysDown[inCode] = true;

    // A key pressed on this screen is this screen's own, so its release counts, whatever was noted on arrival.
    delete gameState.keysDownOnArrival[inCode];

  } /* End keyWentDown(). */


  /**
   * Makes a note that a key has been let go, and says whether the screen should take no notice of it.  Every key
   * release comes through here.
   *
   * NOTE: this is not in the original, and is here to make up for something the original did without meaning
   * to.  Some screens are left on the PRESS of a key: a mini-game is started from the ship by pressing ACTION at
   * a console.  The key is let go a moment later, by which time the next screen has taken over.  In the original
   * the next screen spent that moment showing "Loading", during which it ignored every key, so the release was
   * never seen.  Here nothing has to be loaded and the next screen is ready at once, so it WOULD see the
   * release: a mini-game's instructions took it for ACTION and were gone before they could be read, or (if the
   * key was let go very quickly) the mini-game itself was given it before it had begun.  So the release of any
   * key that was already down when the screen was arrived at by the full route is ignored, as if it had come
   * while the screen was loading.
   *
   * @param  {string}  inCode The code of the key.
   * @return {boolean}        True if the key was already down when this screen was arrived at, in which case the
   *                          screen should do nothing about its being let go.  False otherwise.
   */
  keyCameUp(inCode) {

    delete gameState.keysDown[inCode];

    if (gameState.keysDownOnArrival[inCode] === true) {
      delete gameState.keysDownOnArrival[inCode];
      return true;
    }

    return false;

  } /* End keyCameUp(). */


  /**
   * Handles the stylus (mouse button or finger) going down.  This is the port of CGame::StylusDown().
   *
   * @param {Phaser.Input.Pointer} inPointer Phaser's object describing the mouse or finger.
   */
  onPointerDown(inPointer) {

    const point = { x: Math.floor(inPointer.x), y: Math.floor(inPointer.y) };

    // A popup takes all taps for itself.
    if (gameState.doPopup) {
      this.sdPopup(point);
      return;
    }

    // While the game is shutting down, any tap hurries the shutdown along to its next step.  (Unlike the key
    // version of this, the original did not stop here but carried on to the code below, so we do too.)
    if (gameState.shutdownStep > 0) {
      gameState.shutdownStep++;
    }

    if (gameState.processEvents) {
      this.sd(point);
    }

  } /* End onPointerDown(). */


  /**
   * Handles the stylus (mouse button or finger) coming up.  This is the port of CGame::StylusUp().
   *
   * @param {Phaser.Input.Pointer} inPointer Phaser's object describing the mouse or finger.
   */
  onPointerUp(inPointer) {

    const point = { x: Math.floor(inPointer.x), y: Math.floor(inPointer.y) };

    // A popup takes all taps for itself.
    if (gameState.doPopup) {
      this.suPopup(point);
      return;
    }

    if (gameState.processEvents) {
      this.su(point);
    }

  } /* End onPointerUp(). */


  /**
   * Stops the browser from doing its own thing with a key that the game uses.  Without this, the arrow keys and
   * the space bar would scroll the page while the player is trying to play.  Keys the game does not use (F5 to
   * reload the page, for example) are left alone.
   *
   * @param {KeyboardEvent} inEvent The browser's keyboard event.
   */
  preventBrowserDefault(inEvent) {

    const code = inEvent.code;
    if (code === gameState.kUp || code === gameState.kDown || code === gameState.kLeft ||
      code === gameState.kRight || code === gameState.kAction || code === gameState.kCommand
    ) {
      inEvent.preventDefault();
    }

  } /* End preventBrowserDefault(). */


  // ****************************************************************************************************************
  // Things shared by the main menu and the screens around it.
  // ****************************************************************************************************************


  /**
   * Draws the scrolling background used by the main menu and related screens: a single 60x60 tile repeated across
   * the whole screen, drifting diagonally down and to the left by one pixel every frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  scrollingBackground(inBackbuffer) {

    // Seven rows of five tiles.  The first row starts one tile above the top of the screen, and the extra column
    // hangs off the right-hand edge, so that there is always something to scroll into view.
    for (let y = -1; y < 6; y++) {
      const y1 = (y * 60) + gameState.v_offset;
      for (let x = 0; x < 5; x++) {
        inBackbuffer.BltFast((x * 60) - gameState.h_offset, y1, `gfx_main_menu_background_tile`, null);
      }
    }

    // Move along one pixel.  Once we have moved a whole tile's worth, snap back to the start, which looks
    // identical and so the scrolling appears to go on forever.
    gameState.h_offset++;
    gameState.v_offset++;
    if (gameState.h_offset > 60) {
      gameState.h_offset = 0;
      gameState.v_offset = 0;
    }

  } /* End scrollingBackground(). */


  /**
   * Fades between screens.  The main menu and the screens around it all draw themselves at an opacity of
   * gameState.fade_value and call this at the end of every frame.  To move to another screen, a screen sets
   * gameState.next_screen to that screen's name and gameState.fade_function to 1.  This then fades the current
   * screen out, switches to the next one, and fades that in.
   */
  screenFader() {

    switch (gameState.fade_function) {
      case 1: { // Out
        gameState.processEvents = false;
        gameState.fade_value = gameState.fade_value - 20;
        if (gameState.fade_value <= 0) {
          gameState.fade_function = 2;
          gameState.fade_value = 0;
          this.switchScreen(gameState.next_screen);
        }
      break; }
      case 2: { // In
        gameState.processEvents = false;
        gameState.fade_value = gameState.fade_value + 20;
        if (gameState.fade_value >= 255) {
          gameState.fade_function = 0;
          gameState.fade_value = 255;
          gameState.processEvents = true;
        }
      break; }
    }

  } /* End screenFader(). */


  // ****************************************************************************************************************
  // The popup: a box in the middle of the screen showing two lines of text and a choice of options.  The player
  // steps through the options with LEFT and RIGHT (or the arrows either side) and picks one with ACTION (or by
  // tapping it).
  // ****************************************************************************************************************


  /**
   * Initializes a popup.  Before calling this, a screen must set this.popupCallback to the method that should be
   * told which option was picked, and fill in gameState.gpOptions (the option names) and gameState.gpOptionsCount
   * (how many of them there are).
   *
   * @param {string} inLine1 The first line of text to show.
   * @param {string} inLine2 The second line of text to show.
   */
  startPopup(inLine1, inLine2) {

    gameState.popupLine1 = inLine1;
    gameState.popupLine2 = inLine2;
    sndObj.playSound(`sfx_misc_1`);
    gameState.gpBlendDone = false;
    gameState.gpButtonPressed = 0;
    gameState.player_dir_east = false;
    gameState.player_dir_west = false;
    gameState.player_dir_north = false;
    gameState.player_dir_south = false;
    gameState.player_button_down = false;
    gameState.doPopup = true;
    gameState.gpCurrentOption = 0;

    // This off-screen surface will hold a copy of the patch of screen behind the popup, once it has been tinted
    // blue.  See pnfPopup().
    gameState.gpTempBlended = new Surface(170, 88);

  } /* End startPopup(). */


  /**
   * Handles KeyDown popup events.
   *
   * @param {string} inKey The code of the key.
   */
  kdPopup(inKey) {

    if (inKey === gameState.kLeft) {
      gameState.gpButtonPressed = 1;
      gameState.player_dir_west = true;
    }
    if (inKey === gameState.kRight) {
      gameState.gpButtonPressed = 2;
      gameState.player_dir_east = true;
    }
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
    }

  } /* End kdPopup(). */


  /**
   * Handles KeyUp popup events.
   *
   * @param {string} inKey The code of the key.
   */
  kuPopup(inKey) {

    // LEFT: show the previous option, wrapping around from the first to the last.
    if (inKey === gameState.kLeft && gameState.gpButtonPressed === 1) {
      gameState.gpButtonPressed = 0;
      gameState.player_dir_west = false;
      sndObj.playSound(`sfx_ins_arrow`);
      gameState.gpCurrentOption--;
      if (gameState.gpCurrentOption < 0) {
        gameState.gpCurrentOption = gameState.gpOptionsCount - 1;
      }
    }

    // RIGHT: show the next option, wrapping around from the last to the first.
    if (inKey === gameState.kRight && gameState.gpButtonPressed === 2) {
      gameState.gpButtonPressed = 0;
      gameState.player_dir_east = false;
      sndObj.playSound(`sfx_ins_arrow`);
      gameState.gpCurrentOption++;
      if (gameState.gpCurrentOption > gameState.gpOptionsCount - 1) {
        gameState.gpCurrentOption = 0;
      }
    }

    // ACTION: pick the option that is showing.  The popup goes away and the screen is told what was picked.
    if (inKey === gameState.kAction && gameState.player_button_down) {
      gameState.doPopup = false;
      gameState.player_dir_east = false;
      gameState.player_dir_west = false;
      gameState.player_dir_north = false;
      gameState.player_dir_south = false;
      gameState.player_button_down = false;
      sndObj.playSound(`sfx_misc_4`);
      gameState.gpTempBlended = null;
      this.popupCallback(gameState.gpCurrentOption);
    }

  } /* End kuPopup(). */


  /**
   * StylusDown handler for popups.  Tapping the arrows or the option is treated exactly like pressing the
   * matching key.
   *
   * @param {object} inPoint Where on the screen the stylus went down, with x and y properties.
   */
  sdPopup(inPoint) {

    if (PtInRect(CRect(35, 117, 59, 141), inPoint)) { // Previous
      this.kdPopup(gameState.kLeft);
      return;
    }

    if (PtInRect(CRect(178, 117, 202, 141), inPoint)) { // Next
      this.kdPopup(gameState.kRight);
      return;
    }

    if (PtInRect(CRect(63, 119, 174, 139), inPoint)) { // Select
      this.kdPopup(gameState.kAction);
      return;
    }

  } /* End sdPopup(). */


  /**
   * StylusUp handler for popups.  Something only happens if the stylus comes up over the same thing it went down
   * on; otherwise the press is simply forgotten.
   *
   * @param {object} inPoint Where on the screen the stylus came up, with x and y properties.
   */
  suPopup(inPoint) {

    if (gameState.gpButtonPressed === 1 && PtInRect(CRect(35, 117, 59, 141), inPoint)) { // Previous
      this.kuPopup(gameState.kLeft);
      return;
    }

    if (gameState.gpButtonPressed === 2 && PtInRect(CRect(178, 117, 202, 141), inPoint)) { // Next
      this.kuPopup(gameState.kRight);
      return;
    }

    if (gameState.player_button_down && PtInRect(CRect(63, 119, 174, 139), inPoint)) { // Select
      this.kuPopup(gameState.kAction);
      return;
    }

    gameState.player_dir_east = false;
    gameState.player_dir_west = false;
    gameState.player_button_down = false;
    gameState.gpButtonPressed = 0;

  } /* End suPopup(). */


  /**
   * Handles Popup ProcessNextFrame events: draws the popup.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfPopup(inBackbuffer) {

    // The background of the popup is the screen behind it, tinted blue.  The tinting must only be done ONCE: doing
    // it again every frame would pile tint upon tint until the area was solid blue.  So, on the first frame, we
    // tint that patch of the screen and take a copy of the result.  On every frame after that, we just draw the
    // copy back.
    if (gameState.gpBlendDone) {
      inBackbuffer.BltFast(34, 65, gameState.gpTempBlended, null);
    } else {
      // Blended region.
      const rect = CRect(34, 65, 204, 153);
      inBackbuffer.FillRect(rect, RGB(0, 0, 250), 128);
      gameState.gpBlendDone = true;
      gameState.gpTempBlended.BltFast(0, 0, inBackbuffer, rect);
    }

    // Border.
    inBackbuffer.BltFast(28, 59, `gfx_popup_border`, null);

    // Text.
    inBackbuffer.DrawText(gameState.bbCenterPoint, 72, gameState.popupLine1, font1, GDDRAWTEXT_CENTER);
    inBackbuffer.DrawText(gameState.bbCenterPoint, 92, gameState.popupLine2, font1, GDDRAWTEXT_CENTER);

    // Arrows.  Each is drawn in its "pressed" form while it is being pressed.
    if (gameState.gpButtonPressed === 1) {
      inBackbuffer.BltFast(35, 117, `gfx_ins_prev_1`, null);
    } else {
      inBackbuffer.BltFast(35, 117, `gfx_ins_prev_0`, null);
    }
    if (gameState.gpButtonPressed === 2) {
      inBackbuffer.BltFast(178, 117, `gfx_ins_next_1`, null);
    } else {
      inBackbuffer.BltFast(178, 117, `gfx_ins_next_0`, null);
    }

    // Option text.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 119, gameState.gpOptions[gameState.gpCurrentOption], font1, GDDRAWTEXT_CENTER
    );

    // The original also updated the joystick hands here when the popup was over a mini-game.  That will be added
    // along with the mini-games themselves.

  } /* End pnfPopup(). */


  // ****************************************************************************************************************
  // The methods that screens override.
  // ****************************************************************************************************************


  /**
   * Sets the screen up.  Screens override this.  Remember that it must reset ALL of the screen's variables.
   */
  loadScreen() {
  } /* End loadScreen(). */


  /**
   * Cleans the screen up.  Screens override this if they have anything to clean up.
   */
  destroyScreen() {
  } /* End destroyScreen(). */


  /**
   * Draws one frame.  Screens override this.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {
  } /* End pnf(). */


  /**
   * A key was pressed.  Screens override this if they care.
   *
   * @param {string} inKey The code of the key, to be compared against gameState.kUp, gameState.kAction and so on.
   */
  kd(inKey) {
  } /* End kd(). */


  /**
   * A key was released.  Screens override this if they care.
   *
   * @param {string} inKey The code of the key, to be compared against gameState.kUp, gameState.kAction and so on.
   */
  ku(inKey) {
  } /* End ku(). */


  /**
   * The stylus went down.  Screens override this if they care.
   *
   * @param {object} inPoint Where on the screen it went down, with x and y properties.
   */
  sd(inPoint) {
  } /* End sd(). */


  /**
   * The stylus came up.  Screens override this if they care.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {
  } /* End su(). */


} /* End class. */
