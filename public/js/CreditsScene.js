/**
 * The Credits screen: the credits scroll slowly up the middle of the screen, over and over, until the player
 * leaves.  COMMAND (or a tap on the bottom line) goes back to the main menu.
 *
 * This is the port of credits.cpp.
 *
 * Like the other screens around the main menu, this one is never loaded or unloaded.  It is reached and left with
 * a fade (see screenFader() in GameScene.js), and the main menu calls crdReset() just before fading to it.
 *
 * How the scrolling works: at any moment, 18 lines of text are being shown, one below the other, 16 pixels apart.
 * Every frame, all 18 are drawn one pixel higher than the frame before.  Once they have moved up 16 pixels (which
 * is exactly one line), they are all put back down where they started, but each line is given the text of the line
 * below it, and the bottom line is given the next line of the credits.  To the eye, that looks like one continuous,
 * smooth scroll.  The lines are only allowed to show inside a window in the middle of the screen (this is what
 * the "clipper" is for), so they appear at the bottom of the window and disappear at the top.
 */
class CreditsScene extends GameScene {


  // This is the actual data, line-by-line to scroll.  Each array element is a line.
  scrollerLines = [
    ``,
    `K&G Arcade`,
    `Version 1.1`,
    ``,
    `A game by`,
    `Frank W. Zammetti`,
    `and`,
    `Anthony Volpe`,
    ``,
    `A joint production of`,
    `Omnytex Technologies`,
    `and`,
    `Crackhead Creations`,
    ``,
    `Game concept and design:`,
    `Frank W. Zammetti`,
    ``,
    `Graphics:`,
    `99% Anthony Volpe`,
    `1% Frank W. Zammetti`,
    `(If it sucks, you can assume`,
    `that Frank did it!)`,
    ``,
    `Coding:`,
    `Frank W. Zammetti`,
    ``,
    `Cut scene scripts:`,
    `Frank W. Zammetti`,
    `and`,
    `Anthony Volpe`,
    ``,
    `Voice of Gentoo:`,
    `Anthony Volpe`,
    ``,
    `Voice of Krelmac:`,
    `Frank W. Zammetti`,
    ``,
    `Sound FX:`,
    `Frank W. Zammetti`,
    ``,
    `Music composed by:`,
    `Frank W. Zammetti`,
    ``,
    `Anything else we forgot:`,
    `Frank W. Zammetti`,
    `and/or`,
    `Anthony Volpe`,
    ``,
    `(And the point of all that,`,
    `aside from good old-fashioned`,
    `ego stroking, was what?!?)`,
    ``,
    // NOTE: the original has "it's" where "its" is meant in three places: the two in the next four lines, and
    // "OASIS engine for it's" further down.  All three are corrected, at Frank's request.
    `K&G Arcade uses the`,
    `GapiDraw toolkit for its`,
    `graphics and the Hekkus`,
    `Sound System for its audio.`,
    `For information on`,
    `GapiDraw, visit`,
    `http://www.gapidraw.com`,
    `and for Hekkus, go to`,
    `http://www.shlzero.com`,
    `Thanks very much to`,
    `Johan Sanneblad and`,
    `Thomas Maniero (aka Gerson)`,
    `for their great work in`,
    `creating GapiDraw and`,
    `Hekkus, respectively!`,
    ``,
    `K&G Arcade uses the`,
    `OASIS engine for its`,
    `cinematic cut scenes.`,
    `This is a proprietary`,
    `library written by`,
    `Frank W. Zammetti of`,
    `Omnytex Technologies.`,
    `If you want it, give`,
    `me lots 'o cash!`,
    `But since I know you`,
    `can do better on your own,`,
    `I won't hold my breath!`,
    ``,
    `All voiceover recordings`,
    `were done on a Mac at`,
    `Anthony's house and were`,
    `processed via GoldWave`,
    `and SoundForge on`,
    `Frank's Dell PC.`,
    `Sorry BillG, Mac's are`,
    `kinda cool buddy!`,
    ``,
    `Special thanks to those who`,
    `were beta testers for us:`,
    `10inchAssassin, blankg, com,`,
    `felixdd, hockeydude and Helios,`,
    `all of PocketMatrix.com fame!`,
    ``,
    `Visit the K&G Arcade web site:`,
    `http://www.kgarcade.com`,
    ``,
    `K&G Arcade`,
    `(C)opyright 2004`,
    `Omnytex Technologies`,
    `All rights reserved.`,
    ``,
    `Krelmac and Gentoo are`,
    `trademarks of`,
    `Frank W. Zammetti`,
    `and Anthony Volpe`,
    `Brenda Bubey, Sully,`,
    `Eeeger, Catrina and`,
    `Frederick J. Smiley`,
    `are trademarks of `,
    `Anthony Volpe.`,
    `All rights reserved.`,
    ``,
    `K&G Arcade...`,
    `Today's experiment:`,
    `FAILED!`,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``
  ];

  // The lines currently on the screen, from top to bottom.
  scrollerLinesTemp = [ ];

  // Number of displayable elements in the scrollerLines array.
  scrollerLinesCount = 134;

  // Number of lines to display on the screen.
  scrollerLinesOnScreen = 18;

  // Top of the area the scroller covers.
  scrollerTopY = 10;

  // Current amount a line is scrolled upwards.
  currentScrollerAmount = 0;

  // Current line currently being fed into scroller.
  currentLineIndex = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`CreditsScene.constructor`);

    super(`CreditsScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.  This screen is normally arrived at by a fade from the main menu, which calls crdReset()
   * itself, in which case this method is not called at all.  It is here so that the screen also works when it is
   * jumped to directly during development.
   */
  loadScreen() {

    console.log(`CreditsScene.loadScreen()`);

    this.crdReset();

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
    inBackbuffer.DrawText(gameState.bbCenterPoint, 10, `Credits`, font1_green, GDDRAWTEXT_CENTER, fade_value);

    // Lines.
    inBackbuffer.BltFast(0, 40, `gfx_divider_00`, null, fade_value);
    inBackbuffer.BltFast(0, 290, `gfx_divider_00`, null, fade_value);

    // Back.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 300, `COMMAND/Click for Main Menu`, font1_green, GDDRAWTEXT_CENTER, fade_value
    );

    // Set the clipper, so that the scrolling text only shows between the two divider lines.
    inBackbuffer.SetClipper(CRect(0, 50, 240, 280));

    // Draw text: the top line, then the lines in between, then the bottom line.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, this.scrollerTopY - this.currentScrollerAmount, this.scrollerLinesTemp[0],
      font1, GDDRAWTEXT_CENTER, fade_value
    );
    for (let i = 1, j = 16; i < this.scrollerLinesOnScreen - 1; i++, j = j + 16) {
      inBackbuffer.DrawText(
        gameState.bbCenterPoint, (this.scrollerTopY + j) - this.currentScrollerAmount, this.scrollerLinesTemp[i],
        font1, GDDRAWTEXT_CENTER, fade_value
      );
    }
    inBackbuffer.DrawText(
      gameState.bbCenterPoint,
      this.scrollerTopY + (16 * (this.scrollerLinesOnScreen - 1)) - this.currentScrollerAmount,
      this.scrollerLinesTemp[this.scrollerLinesOnScreen - 1], font1, GDDRAWTEXT_CENTER, fade_value
    );

    // Scroll all lines up one pixel.
    this.currentScrollerAmount++;

    // If we've scrolled all lines up 16 pixels, it's time to cycle some text.
    if (this.currentScrollerAmount > 15) {
      this.currentScrollerAmount = 0;
      // Cycle all text in the temp area upwards one full line.  (The original's loop went one line too far here,
      // copying from just past the end of the array into the bottom line.  It did no harm, because the bottom
      // line is given its proper new text a few lines further down, but there is nothing past the end to copy
      // from here, so this loop stops where it should.)
      for (let i = 0; i < this.scrollerLinesOnScreen - 1; i++) {
        this.scrollerLinesTemp[i] = this.scrollerLinesTemp[i + 1];
      }
      // Get the next line of text to pop on to the bottom, or start at the beginning again if it's time.
      this.currentLineIndex++;
      if (this.currentLineIndex === this.scrollerLinesCount) {
        this.currentLineIndex = 0;
      }
      // Pop the next string on to the bottom of our scroller area.
      this.scrollerLinesTemp[this.scrollerLinesOnScreen - 1] = this.scrollerLines[this.currentLineIndex];
    }

    inBackbuffer.SetClipper(null);

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
   * Puts the screen back to its starting state: nothing on the screen yet, and the credits about to start from the
   * top.  The main menu calls this just before it fades to this screen.
   */
  crdReset() {

    this.currentScrollerAmount = 0;
    this.currentLineIndex = 0;
    this.scrollerLinesTemp = [ ];
    for (let i = 0; i < 18; i++) {
      this.scrollerLinesTemp.push(``);
    }

  } /* End crdReset(). */


} /* End class. */
