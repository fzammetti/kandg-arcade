/**
 * The Options screen.  There are four options, one below the other: the volume, whether to show the frame rate,
 * whether to show the frame time, and the key mappings.  UP and DOWN move between them (the active one has a pale
 * box behind it), LEFT and RIGHT change the active one, and ACTION on the key mappings option starts a walk
 * through the game's six buttons, asking for a key for each in turn.  Below the options is a box that restores
 * the default key mappings when tapped.  COMMAND (or a tap on the bottom line) saves the options and goes back to
 * the main menu.
 *
 * This is the port of options.cpp.
 *
 * Like the other screens around the main menu, this one is never loaded or unloaded.  It is reached and left with
 * a fade (see screenFader() in GameScene.js), and the main menu calls optReset() just before fading to it.
 */
class OptionsScene extends GameScene {


  // The names of the four volume levels, in the order of the vl constants in main.js.
  volumeLevels = [ `No Sound`, `Low`, `Medium`, `High` ];

  // Flags: is the Previous or the Next arrow of the active option currently being pressed?
  PreviousTapped = false;
  NextTapped = false;

  // Flag: is the "restore default key mappings" box currently being pressed?
  defaultBox = false;

  // Which option is active: 1 = Volume, 2 = Show Frame Rate, 3 = Show Frame Time, 4 = Keys.
  active_option = 0;

  // Where we are in mapping the keys: 0 = not mapping, then 1 = waiting for the key for UP, 2 = DOWN, 3 = LEFT,
  // 4 = RIGHT, 5 = ACTION, 6 = COMMAND.
  key_map_step = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`OptionsScene.constructor`);

    super(`OptionsScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.  This screen is normally arrived at by a fade from the main menu, which calls optReset()
   * itself, in which case this method is not called at all.  It is here so that the screen also works when it is
   * jumped to directly during development.
   */
  loadScreen() {

    console.log(`OptionsScene.loadScreen()`);

    this.optReset();

  } /* End loadScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Set up for fading.
    const fade_value = gameState.fade_value;

    // Scrolling background.
    this.scrollingBackground(inBackbuffer);

    // Title.
    inBackbuffer.DrawText(gameState.bbCenterPoint, 10, `Options`, font1_green, GDDRAWTEXT_CENTER, fade_value);

    // Lines.
    inBackbuffer.BltFast(0, 40, `gfx_divider_00`, null, fade_value);
    inBackbuffer.BltFast(0, 290, `gfx_divider_00`, null, fade_value);

    // Back.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 300, `COMMAND/Click for Main Menu`, font1_green, GDDRAWTEXT_CENTER, fade_value
    );

    // The vertical position of the option being drawn.
    let top = 0;

    // The opacity of the pale box drawn behind the active option.  When not fading, it's a 50% blend.  When fading
    // in or out, use fade_value when it is less than that, so that the box fades along with everything else.
    let boxOpacity = 128;
    if (gameState.fade_function !== 0) {
      if (fade_value < 128) {
        boxOpacity = fade_value;
      }
    }

    // *************************************
    // -----****>>>>> Volume <<<<<*****-----
    // *************************************
    top = 60;
    if (this.active_option === 1) {
      // Blended box.
      inBackbuffer.FillRect(CRect(0, top - 2, 240, top + 26), RGB(240, 240, 240), boxOpacity);
    }
    // Label.
    inBackbuffer.DrawText(2, top + 1, `Volume :`, font1, GDDRAWTEXT_LEFT, fade_value);
    // Value.
    inBackbuffer.DrawText(
      73, top + 1, this.volumeLevels[gameState.volumeLevel], font1_green, GDDRAWTEXT_LEFT, fade_value
    );
    // Arrows.
    if (this.active_option === 1) {
      if (this.PreviousTapped) {
        inBackbuffer.BltFast(185, top, `gfx_ins_prev_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(185, top, `gfx_ins_prev_0`, null, fade_value);
      }
      if (this.NextTapped) {
        inBackbuffer.BltFast(214, top, `gfx_ins_next_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(214, top, `gfx_ins_next_0`, null, fade_value);
      }
    }

    // *****************************************
    // -----****>>>>> Frame Rate <<<<<*****-----
    // *****************************************
    top = 100;
    if (this.active_option === 2) {
      // Blended box.
      inBackbuffer.FillRect(CRect(0, top - 2, 240, top + 26), RGB(240, 240, 240), boxOpacity);
    }
    // Label.
    inBackbuffer.DrawText(2, top + 1, `Show Frame Rate :`, font1, GDDRAWTEXT_LEFT, fade_value);
    // Value.
    let szYesNo1 = `No`;
    if (gameState.show_fps) {
      szYesNo1 = `Yes`;
    }
    inBackbuffer.DrawText(155, top + 1, szYesNo1, font1_green, GDDRAWTEXT_LEFT, fade_value);
    // Arrows.
    if (this.active_option === 2) {
      if (this.PreviousTapped) {
        inBackbuffer.BltFast(185, top, `gfx_ins_prev_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(185, top, `gfx_ins_prev_0`, null, fade_value);
      }
      if (this.NextTapped) {
        inBackbuffer.BltFast(214, top, `gfx_ins_next_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(214, top, `gfx_ins_next_0`, null, fade_value);
      }
    }

    // *****************************************
    // -----****>>>>> Frame Time <<<<<*****-----
    // *****************************************
    top = 140;
    if (this.active_option === 3) {
      // Blended box.
      inBackbuffer.FillRect(CRect(0, top - 2, 240, top + 26), RGB(240, 240, 240), boxOpacity);
    }
    // Label.  (In the original this label, and the value beside it, sit one pixel away from where the pattern set by
    // the other options says they should: the label is at 140 rather than top + 1, and the value is at 154 rather
    // than 155.  They are kept where the original had them.)
    inBackbuffer.DrawText(2, 140, `Show Frame Time :`, font1, GDDRAWTEXT_LEFT, fade_value);
    // Value.
    let szYesNo2 = `No`;
    if (gameState.show_frame_time) {
      szYesNo2 = `Yes`;
    }
    inBackbuffer.DrawText(154, top + 1, szYesNo2, font1_green, GDDRAWTEXT_LEFT, fade_value);
    // Arrows.
    if (this.active_option === 3) {
      if (this.PreviousTapped) {
        inBackbuffer.BltFast(185, top, `gfx_ins_prev_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(185, top, `gfx_ins_prev_0`, null, fade_value);
      }
      if (this.NextTapped) {
        inBackbuffer.BltFast(214, top, `gfx_ins_next_1`, null, fade_value);
      } else {
        inBackbuffer.BltFast(214, top, `gfx_ins_next_0`, null, fade_value);
      }
    }

    // *******************************************
    // -----****>>>>> Key Mappings <<<<<*****-----
    // *******************************************
    top = 180;
    if (this.active_option === 4) {
      // Blended box.
      inBackbuffer.FillRect(CRect(0, top - 2, 240, top + 26), RGB(240, 240, 240), boxOpacity);
    }
    // Label.
    inBackbuffer.DrawText(2, top + 1, `Keys :`, font1, GDDRAWTEXT_LEFT, fade_value);
    // Value.  When not mapping, this is an invitation to start (shown only while this option is the active one).
    // While mapping, it says which of the game's buttons a key is wanted for.
    switch (this.key_map_step) {
      case 0: {
        if (this.active_option === 4) {
          inBackbuffer.DrawText(55, top + 1, `ACTION or Click to map...`, font1_green, GDDRAWTEXT_LEFT, fade_value);
        }
      break; }
      case 1: {
        inBackbuffer.DrawText(55, top + 1, `Press UP`, font1_green, GDDRAWTEXT_LEFT, fade_value);
      break; }
      case 2: {
        inBackbuffer.DrawText(55, top + 1, `Press DOWN`, font1_green, GDDRAWTEXT_LEFT, fade_value);
      break; }
      case 3: {
        inBackbuffer.DrawText(55, top + 1, `Press LEFT`, font1_green, GDDRAWTEXT_LEFT, fade_value);
      break; }
      case 4: {
        inBackbuffer.DrawText(55, top + 1, `Press RIGHT`, font1_green, GDDRAWTEXT_LEFT, fade_value);
      break; }
      case 5: {
        inBackbuffer.DrawText(55, top + 1, `Press ACTION`, font1_green, GDDRAWTEXT_LEFT, fade_value);
      break; }
      case 6: {
        inBackbuffer.DrawText(55, top + 1, `Press COMMAND`, font1_green, GDDRAWTEXT_LEFT, fade_value);
      break; }
    }

    // The "restore default key mappings" box.  It is an outline normally, and filled in solid while it is being
    // pressed.
    if (this.defaultBox) {
      inBackbuffer.FillRect(CRect(0, 223, 240, 263), RGB(255, 255, 255), fade_value);
    } else {
      inBackbuffer.DrawRect(CRect(0, 223, 240, 263), RGB(255, 255, 255), fade_value);
    }
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 224, `Click in this box to restore`, font1, GDDRAWTEXT_CENTER, fade_value
    );
    inBackbuffer.DrawText(gameState.bbCenterPoint, 240, `default key mappings`, font1, GDDRAWTEXT_CENTER, fade_value);

    // Fading.
    this.screenFader();

  } /* End pnf(). */


  /**
   * A key was pressed.  LEFT and RIGHT press the Previous and Next arrows of the active option (the key mappings
   * option has no arrows).
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Left.
    if (inKey === gameState.kLeft) {
      if (this.active_option < 4) {
        this.PreviousTapped = true;
      }
    }

    // Right.
    if (inKey === gameState.kRight) {
      if (this.active_option < 4) {
        this.NextTapped = true;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // If we're mapping buttons...
    if (this.key_map_step > 0) {

      // ...then whatever key was just released becomes the key for the button we are currently asking about, and
      // we move on to the next button.
      //
      // The original could only offer the PocketPC's eight hardware buttons here.  A keyboard has a great many
      // more keys, and any of them will do.  The one thing we insist on is that the browser can name the key (a
      // few unusual keys have no name), and that the name is a sensible length, which are the same rules that the
      // saved settings are checked against when they are read back in (see cleanKeyCode() in main.js).
      const usableKey = typeof inKey === `string` && inKey.length > 0 && inKey.length <= 32;

      switch (this.key_map_step) {
        case 1: { // UP
          if (usableKey) {
            gameState.kUp = inKey;
            this.key_map_step++;
          }
        break; }
        case 2: { // DOWN
          if (usableKey) {
            gameState.kDown = inKey;
            this.key_map_step++;
          }
        break; }
        case 3: { // LEFT
          if (usableKey) {
            gameState.kLeft = inKey;
            this.key_map_step++;
          }
        break; }
        case 4: { // RIGHT
          if (usableKey) {
            gameState.kRight = inKey;
            this.key_map_step++;
          }
        break; }
        case 5: { // ACTION
          if (usableKey) {
            gameState.kAction = inKey;
            this.key_map_step++;
          }
        break; }
        case 6: { // COMMAND
          // (The original had a slip here: pressing the device's RIGHT button for COMMAND mapped COMMAND to the
          // LEFT button instead.  That has not been reproduced.)
          if (usableKey) {
            gameState.kCommand = inKey;
          }
          // That was the last one, so mapping is finished.
          this.key_map_step = 0;
        break; }
      }

    } else { // We're NOT mapping buttons...

      // Up.
      if (inKey === gameState.kUp) {
        sndObj.playSound(`sfx_misc_3`);
        this.active_option--;
        if (this.active_option < 1) {
          this.active_option = 4;
        }
        this.key_map_step = 0;
      }

      // Down.
      if (inKey === gameState.kDown) {
        sndObj.playSound(`sfx_misc_3`);
        this.active_option++;
        if (this.active_option > 4) {
          this.active_option = 1;
        }
        this.key_map_step = 0;
      }

      // Left.
      if (inKey === gameState.kLeft) {
        this.PreviousTapped = false;
        sndObj.playSound(`sfx_misc_5`);
        switch (this.active_option) {
          case 1: { // Volume
            gameState.volumeLevel--;
            if (gameState.volumeLevel < 0) {
              gameState.volumeLevel = 0;
            }
            setVolumeLevel();
          break; }
          case 2: { // Frame Rate
            gameState.show_fps = !gameState.show_fps;
          break; }
          case 3: { // Frame Time
            gameState.show_frame_time = !gameState.show_frame_time;
          break; }
        }
      }

      // Right.
      if (inKey === gameState.kRight) {
        this.NextTapped = false;
        sndObj.playSound(`sfx_misc_5`);
        switch (this.active_option) {
          case 1: { // Volume
            gameState.volumeLevel++;
            if (gameState.volumeLevel > 3) {
              gameState.volumeLevel = 3;
            }
            setVolumeLevel();
          break; }
          case 2: { // Frame Rate
            gameState.show_fps = !gameState.show_fps;
          break; }
          case 3: { // Frame Time
            gameState.show_frame_time = !gameState.show_frame_time;
          break; }
        }
      }

      // Action.
      if (inKey === gameState.kAction) {
        if (this.active_option === 4 && this.key_map_step === 0) { // Map keys.
          sndObj.playSound(`sfx_misc_3`);
          this.key_map_step = 1;
        }
      }

      // Back.  The options are saved on the way out.
      if (inKey === gameState.kCommand) {
        sndObj.playSound(`sfx_misc_4`);
        writeKGAFile(gameState.gameRestarted, false);
        gameState.fade_function = 1;
        gameState.next_screen = `MainMenuScene`;
      }

    }

  } /* End ku(). */


  /**
   * The stylus went down.  Nothing can be tapped while keys are being mapped.
   *
   * @param {object} inPoint Where on the screen it went down, with x and y properties.
   */
  sd(inPoint) {

    if (this.key_map_step === 0) {

      if (PtInRect(CRect(0, 223, 240, 263), inPoint)) { // Restore default key mappings
        this.defaultBox = true;
        return;
      }

      // Check previous/next buttons, depending on current option.
      switch (this.active_option) {
        // Volume.
        case 1: {
          if (PtInRect(CRect(185, 60, 209, 84), inPoint)) { // Previous
            this.kd(gameState.kLeft);
          }
          if (PtInRect(CRect(214, 60, 238, 84), inPoint)) { // Next
            this.kd(gameState.kRight);
          }
        break; }
        // Frame rate.
        case 2: {
          if (PtInRect(CRect(185, 100, 209, 124), inPoint)) { // Previous
            this.kd(gameState.kLeft);
          }
          if (PtInRect(CRect(214, 100, 238, 124), inPoint)) { // Next
            this.kd(gameState.kRight);
          }
        break; }
        // Frame time.
        case 3: {
          if (PtInRect(CRect(185, 140, 209, 164), inPoint)) { // Previous
            this.kd(gameState.kLeft);
          }
          if (PtInRect(CRect(214, 140, 238, 164), inPoint)) { // Next
            this.kd(gameState.kRight);
          }
        break; }
      }

    }

  } /* End sd(). */


  /**
   * The stylus came up.  Nothing can be tapped while keys are being mapped.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    if (this.key_map_step === 0) {

      // Restore default key mappings.
      //
      // NOTE: this is one place where the port deliberately differs from the original.  The original checked
      // whether the stylus came up over the rectangle (2, 181, 40, 201), which is the "Keys :" label, and not over
      // the box that says "Click in this box".  The result was that tapping the box did nothing at all (to make
      // it work you had to press in the box, drag up to the label, and let go there).  That was plainly a slip,
      // and since a keyboard makes it much easier to map the keys into a mess than a PocketPC did, the way out of
      // that mess needs to work.  So here we check the box itself.
      if (this.defaultBox && !this.PreviousTapped && !this.NextTapped &&
        PtInRect(CRect(0, 223, 240, 263), inPoint)
      ) {
        gameState.kUp = defaultKeyUp;
        gameState.kDown = defaultKeyDown;
        gameState.kLeft = defaultKeyLeft;
        gameState.kRight = defaultKeyRight;
        gameState.kAction = defaultKeyAction;
        gameState.kCommand = defaultKeyCommand;
        // (As in the original, we leave here without clearing defaultBox, so the box stays filled in until the
        // screen is next tapped.  It makes a handy sign that the defaults really have been restored.)
        return;
      }

      // Begin mapping.
      if (this.active_option === 4 && !this.defaultBox && !this.PreviousTapped && !this.NextTapped &&
        PtInRect(CRect(54, 181, 240, 201), inPoint)
      ) {
        this.ku(gameState.kAction);
        return;
      }

      // Exit.
      if (!this.defaultBox && !this.PreviousTapped && !this.NextTapped &&
        PtInRect(CRect(0, 300, 240, 320), inPoint)
      ) {
        this.ku(gameState.kCommand);
        return;
      }

      // Activate volume.
      if (!this.defaultBox && !this.PreviousTapped && !this.NextTapped && PtInRect(CRect(2, 61, 65, 81), inPoint)) {
        sndObj.playSound(`sfx_misc_3`);
        this.active_option = 1;
        return;
      }

      // Activate frame rate.
      if (!this.defaultBox && !this.PreviousTapped && !this.NextTapped &&
        PtInRect(CRect(2, 101, 145, 121), inPoint)
      ) {
        sndObj.playSound(`sfx_misc_3`);
        this.active_option = 2;
        return;
      }

      // Activate frame time.
      if (!this.defaultBox && !this.PreviousTapped && !this.NextTapped &&
        PtInRect(CRect(2, 141, 145, 161), inPoint)
      ) {
        sndObj.playSound(`sfx_misc_3`);
        this.active_option = 3;
        return;
      }

      // Activate key mapping.
      if (!this.defaultBox && !this.PreviousTapped && !this.NextTapped && PtInRect(CRect(2, 181, 45, 201), inPoint)) {
        sndObj.playSound(`sfx_misc_3`);
        this.active_option = 4;
        return;
      }

      // Check previous/next buttons, depending on current option.
      if (!this.defaultBox && (this.PreviousTapped || this.NextTapped)) {
        switch (this.active_option) {
          case 1: { // Volume
            if (this.PreviousTapped && PtInRect(CRect(185, 60, 209, 84), inPoint)) { // Previous
              this.ku(gameState.kLeft);
              return;
            }
            if (this.NextTapped && PtInRect(CRect(214, 60, 238, 84), inPoint)) { // Next
              this.ku(gameState.kRight);
              return;
            }
          break; }
          case 2: { // Frame rate
            if (this.PreviousTapped && PtInRect(CRect(185, 100, 209, 124), inPoint)) { // Previous
              this.ku(gameState.kLeft);
              return;
            }
            if (this.NextTapped && PtInRect(CRect(214, 100, 238, 124), inPoint)) { // Next
              this.ku(gameState.kRight);
              return;
            }
          break; }
          case 3: { // Frame time
            if (this.PreviousTapped && PtInRect(CRect(185, 140, 209, 164), inPoint)) { // Previous
              this.ku(gameState.kLeft);
              return;
            }
            if (this.NextTapped && PtInRect(CRect(214, 140, 238, 164), inPoint)) { // Next
              this.ku(gameState.kRight);
              return;
            }
          break; }
        }
      }

    }

    this.PreviousTapped = false;
    this.NextTapped = false;
    this.defaultBox = false;

  } /* End su(). */


  /**
   * Puts the screen back to its starting state: the volume option active, and not mapping keys.  The main menu
   * calls this just before it fades to this screen.
   */
  optReset() {

    this.active_option = 1;
    this.key_map_step = 0;
    this.PreviousTapped = false;
    this.NextTapped = false;

  } /* End optReset(). */


} /* End class. */
