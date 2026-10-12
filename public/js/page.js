/**
 * Looks after how big the picture of the PocketPC, and the game screen inside it, are SHOWN on the page.
 *
 * The game itself never changes size: it always draws a 240 by 320 screen that sits inside a 348 by 532 picture of
 * the device.  What changes is how large that whole thing is displayed.  The page has a "1x" and a "2x" button for
 * choosing a size, and on a narrow screen (a phone, say) the device also shrinks to fit the space there is.
 *
 * The way it works: the stylesheet (css/main.css) gives the box around the device (the "viewport") whatever width
 * it should have, and keeps it the same shape as the picture.  All this code then does is measure that box and
 * stretch or shrink the device, as a single unit, to fill it exactly.
 *
 * This is presentation only, and is not part of the original game.
 */
const pageDisplay = {

  // The width of the picture of the device, in pixels, when it is shown at its natural size.
  frameWidth: 348,

  // The element that wraps the whole page.  The chosen size is recorded on it (as a data-game-size attribute), and
  // the stylesheet uses that to decide how wide the viewport should be.
  page: null,

  // The viewport: the box that reserves the space on the page that the device takes up at its displayed size.
  viewport: null,

  // The device: the picture of the PocketPC together with the game screen.  This is what gets stretched or shrunk.
  device: null,

  // The element inside the device that Phaser puts the game's canvas into.
  container: null,

  // The size buttons.
  buttons: null,

  // The browser's ID for the screen update we have asked for and are still waiting on, or null when we are not
  // waiting on one.
  pendingFrame: null,


  /**
   * Finds the elements on the page that we work with, and starts watching for everything that can change how big
   * the device should be shown.  Called once, at the bottom of this file.
   */
  init: function() {

    console.log(`pageDisplay.init()`);

    pageDisplay.page = document.querySelector(`.page`);
    pageDisplay.viewport = document.getElementById(`deviceViewport`);
    pageDisplay.device = document.getElementById(`outerContainer`);
    pageDisplay.container = document.getElementById(`container`);
    pageDisplay.buttons = document.querySelectorAll(`button[data-game-size]`);

    // The size buttons.
    for (const button of pageDisplay.buttons) {
      button.addEventListener(`click`, pageDisplay.onSizeButtonClick);
    }

    // The viewport changing size, for whatever reason: a size button, the window being resized, or a phone being
    // turned on its side.
    new ResizeObserver(pageDisplay.syncDisplay).observe(pageDisplay.viewport);

    // The game creating its canvas.  That happens a moment after the page loads, and Phaser needs telling how big
    // the canvas is being shown as soon as there is one.
    new MutationObserver(pageDisplay.syncDisplay).observe(pageDisplay.container, { childList: true });

    // The window being resized.  This can move the device on the page without changing its size, which the watch
    // on the viewport above would not notice.
    window.addEventListener(`resize`, pageDisplay.syncDisplay);

    // And set things up for how the page is right now.
    pageDisplay.syncDisplay();

  }, /* End init(). */


  /**
   * Handles a click on one of the size buttons.
   *
   * @param {MouseEvent} inEvent The browser's event.
   */
  onSizeButtonClick: function(inEvent) {

    const clickedButton = inEvent.currentTarget;

    // Record the chosen size on the page.  The stylesheet does the rest: it gives the viewport a new width, and our
    // watch on the viewport then notices that and rescales the device.
    pageDisplay.page.dataset.gameSize = clickedButton.dataset.gameSize;

    // Mark the clicked button as the one that is pressed, and all the others as not.  This is what highlights it,
    // and it is also how a screen reader knows which size is in effect.
    for (const button of pageDisplay.buttons) {
      button.setAttribute(`aria-pressed`, String(button === clickedButton));
    }

    pageDisplay.syncDisplay();

  }, /* End onSizeButtonClick(). */


  /**
   * Asks for the device to be rescaled to fit the viewport.  The work is not done right away, but just before the
   * browser next redraws the page.  Several things can ask for this at almost the same moment (clicking a size
   * button, for one, also changes the size of the viewport), and this way the work is only done once.
   */
  syncDisplay: function() {

    // If we are already waiting on a redraw, forget that request and make a new one.
    if (pageDisplay.pendingFrame !== null) {
      cancelAnimationFrame(pageDisplay.pendingFrame);
    }
    pageDisplay.pendingFrame = requestAnimationFrame(pageDisplay.applyDisplay);

  }, /* End syncDisplay(). */


  /**
   * Rescales the device to fit the viewport, and tells Phaser about it.
   */
  applyDisplay: function() {

    pageDisplay.pendingFrame = null;

    // Stretch or shrink the device to exactly fill the viewport.  The picture and the game screen are scaled
    // together, as one, so the screen always stays in the right place within the picture.
    const scale = pageDisplay.viewport.getBoundingClientRect().width / pageDisplay.frameWidth;
    pageDisplay.device.style.transform = `scale(${scale})`;

    // Phaser needs to know how big the canvas is being shown, so that it can work out where on the game's own
    // 240 by 320 screen a click or tap landed.  It does not notice a change like this by itself, so we tell it to
    // measure again.  (There is nothing to tell until the game and its canvas exist.)
    if (game !== null && game.scale !== undefined && game.scale.canvas) {
      game.scale.refresh();
    }

  } /* End applyDisplay(). */

}; /* End pageDisplay. */


// Get going.  This script is loaded with the "defer" attribute, which means that the browser does not run it until
// it has read the whole page, so all of the elements that init() looks for are certain to exist by now.
pageDisplay.init();
