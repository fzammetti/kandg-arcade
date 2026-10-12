/**
 * A test card: a single screen that exercises everything the foundation of the port provides, so that it can all be
 * checked at a glance before any real screens are built on top of it.  This is not part of the original game.
 *
 * What it shows, from top to bottom:
 *   - Every character of the bitmap font, and text aligned left, center and right in both fonts.
 *   - Sprites drawn over colored stripes, which proves the pink color key really has become transparency.
 *   - An image stretched, an image rotating, an image mirrored, and an image fading in and out.
 *   - Lines, a rectangle outline and single pixels, drawn inside a clipping rectangle that cuts the lines off.
 *   - The six logical buttons, which light up green while their keys are held down.
 *   - The last key pressed, where the stylus last touched, and the measured frame rate (which should be 24).
 *   - ACTION plays a sound effect; COMMAND starts and stops the looping theme music.
 *
 * It can be reached at any time with index.html?scene=TestCardScene.
 */
class TestCardScene extends GameScene {


  // How many frames have been drawn since the screen was shown.  Drives the animations.
  frameCount = 0;

  // Which of the six logical buttons are currently held down.
  heldUp = false;
  heldDown = false;
  heldLeft = false;
  heldRight = false;
  heldAction = false;
  heldCommand = false;

  // The code of the last key pressed.
  lastKey = ``;

  // Where the stylus last went down or came up, and which of those it was.
  stylusPoint = null;
  stylusState = ``;

  // The theme music, while it is playing (so that it can be stopped), or null when it is not.
  music = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`TestCardScene.constructor`);

    super(`TestCardScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.
   */
  loadScreen() {

    console.log(`TestCardScene.loadScreen()`);

    this.frameCount = 0;
    this.heldUp = false;
    this.heldDown = false;
    this.heldLeft = false;
    this.heldRight = false;
    this.heldAction = false;
    this.heldCommand = false;
    this.lastKey = `(none yet)`;
    this.stylusPoint = null;
    this.stylusState = ``;
    this.music = null;

  } /* End loadScreen(). */


  /**
   * Cleans the screen up.
   */
  destroyScreen() {

    console.log(`TestCardScene.destroyScreen()`);

    sndObj.stopSounds();
    this.music = null;

  } /* End destroyScreen(). */


  /**
   * Draws one frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    this.frameCount++;

    // Start with a clean, dark blue screen.
    inBackbuffer.FillRect(null, RGB(0, 0, 64));

    // ----- The font. -----

    // A heading, centered.
    inBackbuffer.DrawText(gameState.bbCenterPoint, 0, `K&G Arcade Test Card`, font1_green, GDDRAWTEXT_CENTER);

    // Every character in the font, 24 to a line.  The font holds the 96 characters from ASCII 32 to ASCII 127.
    let y = 16;
    for (let lineStart = 32; lineStart < 128; lineStart = lineStart + 24) {
      let line = ``;
      for (let code = lineStart; code < lineStart + 24; code++) {
        line = line + String.fromCharCode(code);
      }
      inBackbuffer.DrawText(2, y, line, font1, GDDRAWTEXT_LEFT);
      y = y + 16;
    }

    // The three alignments.  The thin vertical lines mark the X coordinate each piece of text was asked to be drawn
    // at: the left one should touch the start of "Left", the middle one should pass through the middle of
    // "Center", and the right one should touch the end of "Right".
    inBackbuffer.DrawLine(2, 82, 2, 100, RGB(255, 0, 0));
    inBackbuffer.DrawLine(120, 82, 120, 100, RGB(255, 0, 0));
    inBackbuffer.DrawLine(237, 82, 237, 100, RGB(255, 0, 0));
    inBackbuffer.DrawText(2, 82, `Left`, font1, GDDRAWTEXT_LEFT);
    inBackbuffer.DrawText(120, 82, `Center`, font1_green, GDDRAWTEXT_CENTER);
    inBackbuffer.DrawText(238, 82, `Right`, font1, GDDRAWTEXT_RIGHT);

    // ----- Images. -----

    // Colored stripes to draw the sprites over.  If the color key conversion had not worked, each sprite would sit
    // in a solid pink box instead of letting the stripes show through.
    const stripeColors = [
      RGB(160, 0, 0), RGB(0, 120, 0), RGB(0, 0, 200), RGB(140, 140, 0), RGB(0, 130, 130), RGB(130, 0, 130)
    ];
    for (let i = 0; i < 12; i++) {
      inBackbuffer.FillRect(CRect(i * 20, 104, (i * 20) + 20, 200), stripeColors[i % 6]);
    }

    // Plain sprites at their natural size.
    inBackbuffer.BltFast(4, 108, `gfx_player_walking_s_00`, null);
    inBackbuffer.BltFast(28, 108, `gfx_robot_still_00`, null);
    inBackbuffer.BltFast(52, 106, `gfx_explosion_02`, null);
    inBackbuffer.BltFast(92, 108, `gfx_go`, null);

    // Just the left half of an image, using a source rectangle.
    inBackbuffer.BltFast(4, 132, `gfx_go`, CRect(0, 0, 18, 24));

    // An image stretched to one and a half times its size.
    inBackbuffer.Blt(CRect(132, 106, 186, 142), `gfx_go`, null);

    // An image rotating, a quarter turn every twelve frames (half a second).
    const quarterTurns = Math.floor(this.frameCount / 12) % 4;
    inBackbuffer.Blt(CRect(200, 112, 220, 132), `gfx_glutton_head`, null, { nRotationAngle: quarterTurns * 9000 });

    // An image as it is, mirrored left-to-right, and mirrored top-to-bottom.
    inBackbuffer.BltFast(4, 152, `gfx_far_out_fowl_chicken_00`, null);
    inBackbuffer.Blt(CRect(54, 152, 102, 197), `gfx_far_out_fowl_chicken_00`, null, { mirrorLeftRight: true });
    inBackbuffer.Blt(CRect(104, 152, 152, 197), `gfx_far_out_fowl_chicken_00`, null, { mirrorUpDown: true });

    // An image fading smoothly in and out.  The opacity runs from 0 up to 255 and back down again.
    let opacity = (this.frameCount * 8) % 510;
    if (opacity > 255) {
      opacity = 510 - opacity;
    }
    inBackbuffer.BltFast(30, 134, `gfx_get_ready`, null, opacity);

    // ----- Lines, rectangles, pixels and the clipper. -----

    // A box with a fan of lines spreading out from its center.  The lines are all longer than the box, but the
    // clipper is set to the inside of the box, so they should be cut off cleanly at its edges.
    const box = CRect(160, 148, 236, 198);
    inBackbuffer.FillRect(box, RGB(0, 0, 0));
    inBackbuffer.SetClipper(CRect(box.left + 1, box.top + 1, box.right - 1, box.bottom - 1));
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      inBackbuffer.DrawLine(
        198, 173, 198 + Math.round(Math.cos(angle) * 60), 173 + Math.round(Math.sin(angle) * 60), RGB(0, 255, 0)
      );
    }
    // A half-transparent red rectangle over the middle of the fan.
    inBackbuffer.FillRect(CRect(180, 160, 216, 186), RGB(255, 0, 0), 128);
    inBackbuffer.SetClipper(null);
    inBackbuffer.DrawRect(box, RGB(255, 255, 255));
    // A dotted line of single pixels just inside the top of the box.
    for (let x = box.left + 3; x < box.right - 2; x = x + 3) {
      inBackbuffer.SetPixel(x, box.top + 3, RGB(255, 255, 0));
    }

    // ----- Input. -----

    // The six logical buttons.  Each is drawn in green while its key is held down, and in yellow otherwise.
    this.drawButton(inBackbuffer, 4, 202, `UP`, this.heldUp);
    this.drawButton(inBackbuffer, 44, 202, `DOWN`, this.heldDown);
    this.drawButton(inBackbuffer, 104, 202, `LEFT`, this.heldLeft);
    this.drawButton(inBackbuffer, 160, 202, `RIGHT`, this.heldRight);
    this.drawButton(inBackbuffer, 4, 218, `ACTION`, this.heldAction);
    this.drawButton(inBackbuffer, 104, 218, `COMMAND`, this.heldCommand);

    // The last key pressed.
    inBackbuffer.DrawText(4, 236, `Key: ${this.lastKey}`, font1, GDDRAWTEXT_LEFT);

    // Where the stylus last was.  A little white cross is also drawn at that spot.
    if (this.stylusPoint === null) {
      inBackbuffer.DrawText(4, 252, `Stylus: (click the screen)`, font1, GDDRAWTEXT_LEFT);
    } else {
      const p = this.stylusPoint;
      inBackbuffer.DrawText(4, 252, `Stylus: ${p.x},${p.y} ${this.stylusState}`, font1, GDDRAWTEXT_LEFT);
      inBackbuffer.DrawLine(p.x - 4, p.y, p.x + 4, p.y, RGB(255, 255, 255));
      inBackbuffer.DrawLine(p.x, p.y - 4, p.x, p.y + 4, RGB(255, 255, 255));
    }

    // ----- Timing and sound. -----

    // The measured frame rate, which should settle at 24, and a running count of frames.
    const frameRate = GameScene.actualFrameRate.toFixed(1);
    inBackbuffer.DrawText(4, 268, `FPS: ${frameRate}  Frame: ${this.frameCount}`, font1, GDDRAWTEXT_LEFT);

    // What the buttons do on this screen.
    let musicState = `off`;
    if (this.music !== null) {
      musicState = `on`;
    }
    inBackbuffer.DrawText(4, 284, `ACTION = sound effect`, font1_green, GDDRAWTEXT_LEFT);
    inBackbuffer.DrawText(4, 300, `COMMAND = music (${musicState})`, font1_green, GDDRAWTEXT_LEFT);

  } /* End pnf(). */


  /**
   * Draws the name of one of the logical buttons, in green if it is held down or yellow if it is not.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   * @param {number}  inX          The X coordinate to draw at.
   * @param {number}  inY          The Y coordinate to draw at.
   * @param {string}  inName       The name of the button.
   * @param {boolean} inHeld       True if the button is currently held down.
   */
  drawButton(inBackbuffer, inX, inY, inName, inHeld) {

    if (inHeld) {
      inBackbuffer.DrawText(inX, inY, inName, font1_green, GDDRAWTEXT_LEFT);
    } else {
      inBackbuffer.DrawText(inX, inY, inName, font1, GDDRAWTEXT_LEFT);
    }

  } /* End drawButton(). */


  /**
   * A key was pressed.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    this.lastKey = inKey;
    this.setHeld(inKey, true);

  } /* End kd(). */


  /**
   * A key was released.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    this.setHeld(inKey, false);

    // ACTION plays a sound effect.  Press it quickly a few times and the sounds should overlap.
    if (inKey === gameState.kAction) {
      sndObj.playSound(`sfx_misc_1`);
    }

    // COMMAND starts the theme music looping, or stops it if it is already playing.
    if (inKey === gameState.kCommand) {
      if (this.music === null) {
        this.music = sndObj.playSound(`sfx_music_theme`, true);
      } else {
        sndObj.stopSound(this.music);
        this.music = null;
      }
    }

  } /* End ku(). */


  /**
   * Records whether one of the six logical buttons is held down.
   *
   * @param {string}  inKey  The code of the key that changed.
   * @param {boolean} inHeld True if it went down, false if it came up.
   */
  setHeld(inKey, inHeld) {

    if (inKey === gameState.kUp) {
      this.heldUp = inHeld;
    }
    if (inKey === gameState.kDown) {
      this.heldDown = inHeld;
    }
    if (inKey === gameState.kLeft) {
      this.heldLeft = inHeld;
    }
    if (inKey === gameState.kRight) {
      this.heldRight = inHeld;
    }
    if (inKey === gameState.kAction) {
      this.heldAction = inHeld;
    }
    if (inKey === gameState.kCommand) {
      this.heldCommand = inHeld;
    }

  } /* End setHeld(). */


  /**
   * The stylus went down.
   *
   * @param {object} inPoint Where on the screen it went down, with x and y properties.
   */
  sd(inPoint) {

    this.stylusPoint = inPoint;
    this.stylusState = `down`;

  } /* End sd(). */


  /**
   * The stylus came up.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    this.stylusPoint = inPoint;
    this.stylusState = `up`;

  } /* End su(). */


} /* End class. */
