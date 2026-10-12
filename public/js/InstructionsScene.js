/**
 * The Instructions screen: fifteen pages of text telling the story and explaining how to play.  LEFT and RIGHT (or
 * the arrow buttons at the bottom corners) turn the pages, each new page sliding in from the side as the old one
 * slides out.  COMMAND (or a tap on the bottom line) goes back to the main menu.
 *
 * This is the port of instructions.cpp.
 *
 * Like the other screens around the main menu, this one is never loaded or unloaded.  It is reached and left with
 * a fade (see screenFader() in GameScene.js), and the main menu calls insReset() just before fading to it.
 */
class InstructionsScene extends GameScene {


  // Flags: is the Previous or the Next button currently being pressed?
  PreviousTapped = false;
  NextTapped = false;

  // The horizontal position the current page's text is drawn at, and the position the page that is sliding in is
  // drawn at.  Both are 0 except while a page turn is under way.
  scrollCurrent = 0;
  scrollNew = 0;

  // Which way the page is turning: 0 = it is not, 1 = to the previous page, 2 = to the next page.
  pageSwitchDir = 0;

  // The page being shown, counting from 1.
  currentPage = 1;

  // How many pixels the pages slide on each frame of a page turn.
  scrollIncrement = 8;

  // The vertical position of the first line of text.
  textYLocation = 60;

  // How many pages there are.
  totalPages = 15;

  // The text: eleven lines for each of the fifteen pages, one page after another.  The spacing inside each line
  // (including the space every line begins with, which acts as a left margin) is exactly as it was in the original.
  screen1Text = [
    // ------------------------------ Page 1.
    ` The Story... (1/15)`,
    ``,
    ` In K&G Arcade, you play the`,
    ` part of Henry Miller,`,
    ` mild-mannered farmer from`,
    ` jolly-old 17th-century`,
    ` England.  One night while`,
    ` tending your field, you see`,
    ` a strange light appear in`,
    ` the sky above you.  It grows`,
    ` ever larger as it nears...`,
    // ------------------------------ Page 2.
    ` The Story... (2/15)`,
    ``,
    ` It is a strange flying`,
    ` object that you cannot`,
    ` identify.  It is round on`,
    ` top with a spinning disc`,
    ` beneath and yellow orbs`,
    // NOTE: the original reads "it's outer" in the next line.  Corrected to "its", at Frank's request.
    ` dancing around its outer`,
    ` surface.  What could it be?`,
    ``,
    ` Why, it's Krelmac & Gentoo!`,
    // ------------------------------ Page 3.
    ` The Story... (3/15)`,
    ``,
    ` Turns out those two goofball`,
    ` tormentors have decided to`,
    ` go back in time to annoy the`,
    ` human race at a time when`,
    ` we were even more primitive`,
    ` than they say we are in`,
    ` their own time.  More to the`,
    ` point, they decide to`,
    ` run YOU through the ringer!`,
    // ------------------------------ Page 4.
    ` The Story... (4/15)`,
    ``,
    ` So, they beam you aboard`,
    ` their ship, give you a few`,
    ` anal probes for good measure`,
    ` and send you out to escape`,
    ` from their ship.  You will`,
    ` have to make your way`,
    ` through all five levels of`,
    ` the ship in order to escape`,
    ` their semi-evil clutches.`,
    // ------------------------------ Page 5.
    ` Playing Adventure... (5/15)`,
    ``,
    ` Being sick, sadistic alien`,
    ` torturers, it's not quite`,
    ` as easy as it sounds...`,
    ` Each level of the ship is a`,
    ` complex maze, and within`,
    ` each maze are gaming`,
    ` consoles, five per level.`,
    ` You must find and play each`,
    ` of the games.`,
    // ------------------------------ Page 6.
    ` Playing Adventure... (6/15)`,
    ``,
    ` More importantly, you must`,
    ` achieve a given minimum`,
    ` score on each game.  As you`,
    ` do so, the indicators on the`,
    ` display will light up.  When`,
    ` all five are lit, you will`,
    ` be able to access the`,
    ` teleporter pad and move on`,
    ` to the next level.`,
    // ------------------------------ Page 7.
    ` Playing Adventure... (7/15)`,
    `                              `,
    ` A word on game controls...`,
    ` To activate a game console,`,
    ` touch it and press the ACTION`,
    ` button.  Likewise, to use an`,
    ` activated teleporter pad,`,
    ` touch it and press ACTION.`,
    ` You can pull up a menu at`,
    ` any time by pressing the`,
    ` COMMAND button.  Anyway...`,
    // ------------------------------ Page 8.
    ` Playing Adventure... (8/15)`,
    ``,
    ` All the while, robots will`,
    ` hunt you down.  These are`,
    ` odd little robots though...`,
    ` They were a failed science`,
    ` fair project by Gentoo, and`,
    ` they cannot move around the`,
    ` ship normally,  They instead`,
    ` utilize a rather unique mode`,
    ` of transportation...`,
    // ------------------------------ Page 9.
    ` Playing Adventure... (9/15)`,
    ``,
    ` The robots move by using a`,
    ` Quantum Sub-Temporal Inter-`,
    ` Spatial Displacement`,
    ` Modulation Field Generator,`,
    ` or QSTISDMFG for short.  Put`,
    ` in terms a lame human could`,
    ` understand, it means they`,
    ` teleport in discrete units`,
    ` from place to place.`,
    // ------------------------------ Page 10.
    ` Playing Adventure... (10/15)`,
    ``,
    ` This makes them less than`,
    ` perfect killing machines,`,
    ` a failing Gentoo greatly`,
    ` regrets, but it DOES make`,
    ` them highly unpredictable`,
    ` and generally a nuisance.`,
    ` You can take a few hits from`,
    ` them, but your heart rate`,
    ` increases each hit.`,
    // ------------------------------ Page 11.
    ` Playing Adventure... (11/15)`,
    ``,
    ` The number on the heart`,
    ` tells you how many more`,
    ` hits you can take.  If it`,
    ` says 0 and your heartrate`,
    ` is going like mad, one more`,
    ` kills!  Some of the games`,
    ` are virtually impossible to`,
    ` win at, by the way, but`,
    ` there is always a way...`,
    // ------------------------------ Page 12.
    ` Playing Adventure... (12/15)`,
    ``,
    ` Krelmac has been a bit`,
    ` careless in the past when`,
    ` tormenting other creatures.`,
    ` He has left some of them on`,
    ` the levels of the ship with`,
    ` you, one on each level, by`,
    ` some bizarre coincidence of`,
    ` wacky cosmic numerology.`,
    ` Seek them out!`,
    // ------------------------------ Page 13.
    ` Playing Adventure... (13/15)`,
    ``,
    ` You will have to talk to`,
    ` them, and gain their trust`,
    ` by saying the right things`,
    ` at the right time.  You will`,
    ` know when they trust you`,
    ` completely, and only then ask`,
    ` them to 'Please tell me the`,
    ` secret hint!' and they will`,
    ` give some needed info.`,
    // ------------------------------ Page 14.
    ` Playing Melee... (14/15)`,
    ``,
    ` As you progress through the`,
    ` mini-games in Adventure mode`,
    ` the games that you achieve`,
    ` the minimum score in will be`,
    ` unlocked to play in Mini-`,
    ` Game Melee mode.  This allows`,
    ` you to play any game you`,
    ` have unlocked in timed mode`,
    ` or until you say stop.`,
    // ------------------------------ Page 15.
    ` In closing... (15/15)`,
    ``,
    ` That's really about all there`,
    ` is to it.  Go fight your way`,
    ` through Adventure mode,`,
    ` unlock all the mini-games,`,
    ` and then enjoy them any time`,
    ` you want in Melee mode.`,
    ``,
    ` See ya!                      `,
    ``
  ];


  /**
   * Constructor.
   */
  constructor() {

    console.log(`InstructionsScene.constructor`);

    super(`InstructionsScene`);

  } /* End constructor. */


  /**
   * Sets the screen up.  This screen is normally arrived at by a fade from the main menu, which calls insReset()
   * itself, in which case this method is not called at all.  It is here so that the screen also works when it is
   * jumped to directly during development.
   */
  loadScreen() {

    console.log(`InstructionsScene.loadScreen()`);

    this.insReset();

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
    inBackbuffer.DrawText(gameState.bbCenterPoint, 10, `Instructions`, font1_green, GDDRAWTEXT_CENTER, fade_value);

    // Lines.
    inBackbuffer.BltFast(0, 40, `gfx_divider_00`, null, fade_value);
    inBackbuffer.BltFast(0, 290, `gfx_divider_00`, null, fade_value);

    // Back.
    inBackbuffer.DrawText(
      gameState.bbCenterPoint, 300, `COMMAND/Click for Main Menu`, font1_green, GDDRAWTEXT_CENTER, fade_value
    );

    // Draw the text for the current screen.  Each page is eleven lines, so the first line of page N is at position
    // (N - 1) * 11 in the text array.
    let lineIncr = this.textYLocation;
    let arrayIndex = (this.currentPage - 1) * 11;
    for (let i = 0; i < 11; i++) {
      inBackbuffer.DrawText(
        this.scrollCurrent, lineIncr, this.screen1Text[i + arrayIndex], font1, GDDRAWTEXT_LEFT, fade_value
      );
      lineIncr = lineIncr + 16;
    }

    // If we're changing the instructions page, do it now.  The page being turned to is drawn as well, one screen's
    // width to the side of the current page, and then both are moved along together.  When the new page arrives at
    // the left edge of the screen, the turn is finished and it becomes the current page.
    if (this.pageSwitchDir > 0) {
      switch (this.pageSwitchDir) {
        case 1: { // Previous
          arrayIndex = (this.currentPage - 2) * 11;
          lineIncr = this.textYLocation;
          for (let i = 0; i < 11; i++) {
            inBackbuffer.DrawText(
              this.scrollNew, lineIncr, this.screen1Text[i + arrayIndex], font1, GDDRAWTEXT_LEFT, fade_value
            );
            lineIncr = lineIncr + 16;
          }
          this.scrollNew = this.scrollNew + this.scrollIncrement;
          this.scrollCurrent = this.scrollCurrent + this.scrollIncrement;
          if (this.scrollNew >= 0) {
            this.scrollNew = 0;
            this.scrollCurrent = 0;
            this.pageSwitchDir = 0;
            this.currentPage--;
          }
        break; }
        case 2: { // Next
          arrayIndex = this.currentPage * 11;
          lineIncr = this.textYLocation;
          for (let i = 0; i < 11; i++) {
            inBackbuffer.DrawText(
              this.scrollNew, lineIncr, this.screen1Text[i + arrayIndex], font1, GDDRAWTEXT_LEFT, fade_value
            );
            lineIncr = lineIncr + 16;
          }
          this.scrollNew = this.scrollNew - this.scrollIncrement;
          this.scrollCurrent = this.scrollCurrent - this.scrollIncrement;
          if (this.scrollNew <= 0) {
            this.scrollNew = 0;
            this.scrollCurrent = 0;
            this.pageSwitchDir = 0;
            this.currentPage++;
          }
        break; }
      }
    }

    // Draw next/prev buttons.  A button is drawn pressed while it is being pressed, and is not drawn at all when
    // there is no page in that direction to turn to.
    if (this.PreviousTapped) {
      inBackbuffer.BltFast(5, 262, `gfx_ins_prev_1`, null, fade_value);
    } else {
      if (this.currentPage > 1) {
        inBackbuffer.BltFast(5, 262, `gfx_ins_prev_0`, null, fade_value);
      }
    }
    if (this.NextTapped) {
      inBackbuffer.BltFast(211, 262, `gfx_ins_next_1`, null, fade_value);
    } else {
      if (this.currentPage < this.totalPages) {
        inBackbuffer.BltFast(211, 262, `gfx_ins_next_0`, null, fade_value);
      }
    }

    // Fading.
    this.screenFader();

  } /* End pnf(). */


  /**
   * A key was pressed.  LEFT and RIGHT press the Previous and Next buttons (if there is a page to turn to, and a
   * page turn is not already under way).
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Left.
    if (inKey === gameState.kLeft && this.pageSwitchDir === 0) {
      if (this.currentPage > 1) {
        this.PreviousTapped = true;
      }
    }

    // Right.
    if (inKey === gameState.kRight && this.pageSwitchDir === 0) {
      if (this.currentPage < this.totalPages) {
        this.NextTapped = true;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  LEFT and RIGHT start a page turn; COMMAND goes back to the main menu.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Left.  The previous page starts one screen's width off to the left and slides in to the right.
    if (inKey === gameState.kLeft && this.pageSwitchDir === 0) {
      if (this.currentPage > 1) {
        sndObj.playSound(`sfx_ins_arrow`);
        this.NextTapped = false;
        this.PreviousTapped = false;
        this.pageSwitchDir = 1;
        this.scrollCurrent = 0;
        this.scrollNew = -240;
      }
    }

    // Right.  The next page starts one screen's width off to the right and slides in to the left.
    if (inKey === gameState.kRight && this.pageSwitchDir === 0) {
      if (this.currentPage < this.totalPages) {
        sndObj.playSound(`sfx_ins_arrow`);
        this.NextTapped = false;
        this.PreviousTapped = false;
        this.pageSwitchDir = 2;
        this.scrollCurrent = 0;
        this.scrollNew = 240;
      }
    }

    // Back.
    if (inKey === gameState.kCommand && this.pageSwitchDir === 0) {
      sndObj.playSound(`sfx_misc_4`);
      gameState.fade_function = 1;
      gameState.next_screen = `MainMenuScene`;
    }

  } /* End ku(). */


  /**
   * The stylus went down.  Touching one of the arrow buttons is treated exactly like pressing LEFT or RIGHT.
   *
   * @param {object} inPoint Where on the screen it went down, with x and y properties.
   */
  sd(inPoint) {

    // Previous.
    if (PtInRect(CRect(5, 262, 29, 287), inPoint)) {
      this.kd(gameState.kLeft);
      return;
    }

    // Next.
    if (PtInRect(CRect(211, 262, 264, 287), inPoint)) {
      this.kd(gameState.kRight);
      return;
    }

  } /* End sd(). */


  /**
   * The stylus came up.  Something only happens if it comes up over the same button it went down on; otherwise
   * the press is simply forgotten.
   *
   * @param {object} inPoint Where on the screen it came up, with x and y properties.
   */
  su(inPoint) {

    // Exit.
    if (!this.PreviousTapped && !this.NextTapped && PtInRect(CRect(0, 300, 240, 320), inPoint)) {
      this.ku(gameState.kCommand);
      return;
    }

    // Previous.
    if (this.PreviousTapped && PtInRect(CRect(5, 262, 29, 287), inPoint)) {
      this.ku(gameState.kLeft);
      return;
    }

    // Next.
    if (this.NextTapped && PtInRect(CRect(211, 262, 264, 287), inPoint)) {
      this.ku(gameState.kRight);
      return;
    }

    this.NextTapped = false;
    this.PreviousTapped = false;

  } /* End su(). */


  /**
   * Puts the screen back to its starting state: showing the first page, with no page turn under way.  The main
   * menu calls this just before it fades to this screen.
   */
  insReset() {

    this.scrollCurrent = 0;
    this.scrollNew = 0;
    this.pageSwitchDir = 0;
    this.PreviousTapped = false;
    this.NextTapped = false;
    this.currentPage = 1;
    this.scrollIncrement = 8;

  } /* End insReset(). */


} /* End class. */
