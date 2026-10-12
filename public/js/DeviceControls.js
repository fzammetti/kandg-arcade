/**
 * Makes the picture of the PocketPC that surrounds the game screen work as a set of controls, so that the game can
 * be played on a phone or tablet, which has no keyboard.
 *
 * The picture shows a round control disc at the bottom-left and a cluster of buttons at the bottom-right.  Touching
 * the disc works like the cursor keys: touch its top edge for UP, its right edge for RIGHT, and so on, and touch
 * between two of those for a diagonal.  A finger can be slid around the disc to change direction without lifting
 * it.  Of the buttons, the right-hand one is ACTION and the bottom one is COMMAND (the top one does nothing).
 *
 * Nothing is added to the page for any of this, and nothing is drawn.  We simply watch for touches on the picture
 * and work out from WHERE on the picture each touch is.
 *
 * As far as the game is concerned, a touch on one of these controls is exactly the same thing as pressing the
 * keyboard key that is currently set for that button on the Options screen: the very same handlers are called
 * (onKeyDown() and onKeyUp() in GameScene.js).  So no screen needs to know or care that these controls exist.
 *
 * This is not part of the original game, which of course had real buttons.
 */
const deviceControls = {

  // The size of the picture of the device, in pixels.  All of the positions below are measured on the picture at
  // this size, from its top-left corner.
  frameWidth: 348,
  frameHeight: 532,

  // The center of the control disc, how far out from the center a touch still counts as being on the disc (a little
  // beyond its edge, because fingers are not precise), and the size of the "dead" spot in the very middle, where a
  // touch does not mean any direction at all.
  discCenterX: 77,
  discCenterY: 466,
  discOuterRadius: 46,
  discDeadRadius: 9,

  // The centers of the two buttons we use, and how close to a center a touch must be to count as that button.
  actionX: 289,
  actionY: 470,
  commandX: 230,
  commandY: 490,
  buttonRadius: 22,

  // The picture of the device (the HTML image element).
  frame: null,

  // What each finger that is currently on a control is doing.  A touchscreen can track several fingers at once, and
  // the browser gives each one an ID number.  This holds one entry per finger, under that ID.  Each entry has a
  // control property (`disc`, `action` or `command`, saying which control the finger landed on) and a buttons
  // property listing which of the game's six buttons that finger is currently holding down.
  pointers: { },

  // For each of the game's six buttons, how many fingers are currently holding it down.  A button is "pressed" when
  // its count goes from 0 to 1 and "released" when it goes back to 0.
  heldCounts: { up: 0, down: 0, left: 0, right: 0, action: 0, command: 0 },


  /**
   * Starts watching the picture of the device for touches.  Called once, when the page has loaded.
   */
  init: function() {

    console.log(`deviceControls.init()`);

    deviceControls.frame = document.getElementById(`background`);

    // Stop the browser from letting the picture be dragged about with a mouse.
    deviceControls.frame.draggable = false;

    // "Pointer" events cover mouse, finger and pen alike.  A finger going down, moving, and coming up are three
    // separate events.  "Cancel" is what the browser sends instead of "up" if it takes the touch away from us (if
    // a phone call comes in, for instance), and must be treated just like the finger being lifted.
    deviceControls.frame.addEventListener(`pointerdown`, deviceControls.onPointerDown);
    deviceControls.frame.addEventListener(`pointermove`, deviceControls.onPointerMove);
    deviceControls.frame.addEventListener(`pointerup`, deviceControls.onPointerUp);
    deviceControls.frame.addEventListener(`pointercancel`, deviceControls.onPointerUp);

    // Holding a finger on a picture normally brings up the browser's "save image" menu.  We don't want that
    // appearing while someone is holding a direction.
    deviceControls.frame.addEventListener(`contextmenu`, function(inEvent) {
      inEvent.preventDefault();
    });

  }, /* End init(). */


  /**
   * Works out where on the picture of the device an event happened.
   *
   * @param  {PointerEvent} inEvent The browser's event.
   * @return {object}               A point, with x and y properties, measured in pixels of the picture at its
   *                                natural size from its top-left corner.
   */
  getFramePoint: function(inEvent) {

    // The browser tells us where the event was in the window.  Take away where the picture is in the window to get
    // the position within the picture.  The scaling is in case the picture is ever shown at other than its natural
    // size.
    const rect = deviceControls.frame.getBoundingClientRect();
    return {
      x: (inEvent.clientX - rect.left) * (deviceControls.frameWidth / rect.width),
      y: (inEvent.clientY - rect.top) * (deviceControls.frameHeight / rect.height)
    };

  }, /* End getFramePoint(). */


  /**
   * Works out how far apart two points are.
   *
   * @param  {number} inX1 The X coordinate of the first point.
   * @param  {number} inY1 The Y coordinate of the first point.
   * @param  {number} inX2 The X coordinate of the second point.
   * @param  {number} inY2 The Y coordinate of the second point.
   * @return {number}      The distance between them, in pixels.
   */
  getDistance: function(inX1, inY1, inX2, inY2) {

    const distanceX = inX2 - inX1;
    const distanceY = inY2 - inY1;
    return Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));

  }, /* End getDistance(). */


  /**
   * Works out which directions a touch on the control disc means.
   *
   * Picture the disc cut into eight equal slices, like a pizza.  The slice at the top means UP, the next one round
   * means UP and RIGHT together, the next means RIGHT, and so on.  The mathematics below amounts to this: a
   * direction counts if the touch is no more than 67.5 degrees round from it (2.4142 is the tangent of 67.5
   * degrees), which makes every slice 45 degrees wide.
   *
   * @param  {object} inPoint The position of the touch on the picture, with x and y properties.
   * @return {string[]}       The buttons being held: any of `up`, `down`, `left` and `right`.  Empty if the touch
   *                          is on the dead spot in the middle.
   */
  getDiscButtons: function(inPoint) {

    const buttons = [ ];

    const offsetX = inPoint.x - deviceControls.discCenterX;
    const offsetY = inPoint.y - deviceControls.discCenterY;

    // Right in the middle does not mean any direction.
    if (deviceControls.getDistance(0, 0, offsetX, offsetY) < deviceControls.discDeadRadius) {
      return buttons;
    }

    const acrossAmount = Math.abs(offsetX);
    const upDownAmount = Math.abs(offsetY);

    // LEFT or RIGHT counts unless the touch is almost directly above or below the center.
    if (upDownAmount <= acrossAmount * 2.4142) {
      if (offsetX < 0) {
        buttons.push(`left`);
      } else {
        buttons.push(`right`);
      }
    }

    // UP or DOWN counts unless the touch is almost directly to one side of the center.
    if (acrossAmount <= upDownAmount * 2.4142) {
      if (offsetY < 0) {
        buttons.push(`up`);
      } else {
        buttons.push(`down`);
      }
    }

    return buttons;

  }, /* End getDiscButtons(). */


  /**
   * Handles a finger (or the mouse button) going down on the picture of the device.
   *
   * @param {PointerEvent} inEvent The browser's event.
   */
  onPointerDown: function(inEvent) {

    const point = deviceControls.getFramePoint(inEvent);

    // Work out which control, if any, the touch has landed on.
    let control = null;
    if (deviceControls.getDistance(point.x, point.y, deviceControls.actionX, deviceControls.actionY) <=
      deviceControls.buttonRadius
    ) {
      control = `action`;
    } else if (deviceControls.getDistance(point.x, point.y, deviceControls.commandX, deviceControls.commandY) <=
      deviceControls.buttonRadius
    ) {
      control = `command`;
    } else if (deviceControls.getDistance(point.x, point.y, deviceControls.discCenterX, deviceControls.discCenterY) <=
      deviceControls.discOuterRadius
    ) {
      control = `disc`;
    }

    // A touch anywhere else on the picture means nothing.
    if (control === null) {
      return;
    }

    // This touch is ours.  Stop the browser from also treating it as the start of a text selection or a drag.
    inEvent.preventDefault();

    // Ask the browser to keep sending us this finger's events even if it slides off the picture, so that we are
    // certain to hear about it being lifted.
    deviceControls.frame.setPointerCapture(inEvent.pointerId);

    // Remember what this finger is doing, and press whatever it is on.
    deviceControls.pointers[inEvent.pointerId] = { control: control, buttons: [ ] };
    if (control === `disc`) {
      deviceControls.setPointerButtons(inEvent.pointerId, deviceControls.getDiscButtons(point));
    } else {
      deviceControls.setPointerButtons(inEvent.pointerId, [ control ]);
    }

  }, /* End onPointerDown(). */


  /**
   * Handles a finger (or the mouse) moving.  This only matters for a finger that is on the control disc, where
   * sliding round the disc changes direction.  A finger that went down on one of the buttons keeps that button held
   * until it is lifted, wherever it wanders.
   *
   * @param {PointerEvent} inEvent The browser's event.
   */
  onPointerMove: function(inEvent) {

    const pointer = deviceControls.pointers[inEvent.pointerId];
    if (pointer === undefined || pointer.control !== `disc`) {
      return;
    }

    inEvent.preventDefault();
    const point = deviceControls.getFramePoint(inEvent);
    deviceControls.setPointerButtons(inEvent.pointerId, deviceControls.getDiscButtons(point));

  }, /* End onPointerMove(). */


  /**
   * Handles a finger (or the mouse button) coming up, or the browser taking the touch away from us.
   *
   * @param {PointerEvent} inEvent The browser's event.
   */
  onPointerUp: function(inEvent) {

    if (deviceControls.pointers[inEvent.pointerId] === undefined) {
      return;
    }

    inEvent.preventDefault();

    // Release everything this finger was holding, then forget about the finger.
    deviceControls.setPointerButtons(inEvent.pointerId, [ ]);
    delete deviceControls.pointers[inEvent.pointerId];

  }, /* End onPointerUp(). */


  /**
   * Changes which of the game's buttons a particular finger is holding down, pressing and releasing buttons as
   * needed to get from what it was holding before to what it is holding now.
   *
   * @param {number}   inPointerId The browser's ID number for the finger.
   * @param {string[]} inButtons   The buttons the finger is now holding.
   */
  setPointerButtons: function(inPointerId, inButtons) {

    const pointer = deviceControls.pointers[inPointerId];
    const before = pointer.buttons;
    pointer.buttons = inButtons;

    // Release the buttons that this finger was holding but no longer is.  Releases are done before presses, so that
    // sliding straight from LEFT to RIGHT lets go of LEFT before RIGHT goes down, as it would on a real control.
    for (const button of before) {
      if (!inButtons.includes(button)) {
        deviceControls.heldCounts[button]--;
        if (deviceControls.heldCounts[button] === 0) {
          deviceControls.sendKey(button, false);
        }
      }
    }

    // Press the buttons that this finger is holding now but was not before.
    for (const button of inButtons) {
      if (!before.includes(button)) {
        deviceControls.heldCounts[button]++;
        if (deviceControls.heldCounts[button] === 1) {
          deviceControls.sendKey(button, true);
        }
      }
    }

  }, /* End setPointerButtons(). */


  /**
   * Tells the game that one of its six buttons has been pressed or released, exactly as if the keyboard key set for
   * that button had been.
   *
   * @param {string}  inButton One of `up`, `down`, `left`, `right`, `action` or `command`.
   * @param {boolean} inIsDown True if the button has been pressed, false if it has been released.
   */
  sendKey: function(inButton, inIsDown) {

    // Find the keyboard key that is currently set for this button.
    let code = null;
    switch (inButton) {
      case `up`: {
        code = gameState.kUp;
      break; }
      case `down`: {
        code = gameState.kDown;
      break; }
      case `left`: {
        code = gameState.kLeft;
      break; }
      case `right`: {
        code = gameState.kRight;
      break; }
      case `action`: {
        code = gameState.kAction;
      break; }
      case `command`: {
        code = gameState.kCommand;
      break; }
    }

    // Find the scene that is showing.  Only one is ever active at a time.
    const scenes = game.scene.getScenes(true);
    if (scenes.length === 0) {
      return;
    }
    const scene = scenes[0];

    // The game's key handlers expect to be given the browser's keyboard event, of which they use three things: the
    // code of the key, whether this is the keyboard auto-repeating, and a function for telling the browser not to
    // act on the key itself.  So we make up an object with just those three things in it.
    const keyEvent = {
      code: code,
      repeat: false,
      preventDefault: function() {
      }
    };

    if (typeof scene.onKeyDown === `function` && typeof scene.onKeyUp === `function`) {
      // An ordinary screen of the game.
      if (inIsDown) {
        scene.onKeyDown(keyEvent);
      } else {
        scene.onKeyUp(keyEvent);
      }
    } else if (typeof scene.startGame === `function` && scene.waitingForPlayer === true && !inIsDown) {
      // The "Click to start" screen, which starts the game when a key is released.
      scene.startGame();
    }

  } /* End sendKey(). */

}; /* End deviceControls. */
