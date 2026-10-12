/**
 * The mini-game "Alien Babble".  Two aliens stand at the bottom of the play area, one on each side.  Every so often
 * one of them turns and throws a symbol (an arrow pointing up, down, left or right) into the air, and it drifts up
 * the screen above the alien that threw it.  Near the top of each side is a "translator box", and the player's
 * target sits on one of them; ACTION hops it over to the other.  While a symbol is passing through the box the
 * target is on, the player must press the direction the arrow points in.  Doing so scores 25 points.  A symbol
 * that gets away off the top of the screen costs 25.
 *
 * This is the port of mini_games/alien_babble.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class AlienBabbleScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csAlienBabble;
  game_name = `"Alien Babble"`;
  target_score = 900;
  target_score_text = `900`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Alien Babble`,
    ``,
    `You find yourself in a`,
    `First Contact situation!`,
    `These aliens throw weird`,
    `symbols in the air to`,
    `communicate, and they`,
    `expect you to mimic`,
    `them to show that you`,
    `understand them.`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Mimic as many alien`,
    `symbols correctly as`,
    `you can.  Missed`,
    `symbols cost you points.`,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Press ACTION to jump`,
    `between translator`,
    `boxes.  Move in the`,
    `direction indicated by`,
    `the symbol when it is`,
    `within the appropriate`,
    `translator box.`,
    ``
  ];

  // The two things an alien can be doing (the values of alien1_state and alien2_state below).  STILL: standing
  // facing the player.  TURNED: turned to one side, winding up to throw a symbol.
  STILL = 1;
  TURNED = 2;

  // What a symbol can be (the values in symbols_dir below): an arrow pointing one of four ways, or HIT, which means
  // the player has dealt with it and it is just waiting to be cleared away.
  UP = 3;
  DOWN = 4;
  LEFT = 5;
  RIGHT = 6;
  HIT = 7;

  // The pictures.  The box is the bit of scenery that stands between the two aliens.  The arrow is drawn pointing
  // up, and is turned as it is drawn to make the other three symbols.
  box = `gfx_alien_babble_box`;
  alien_still = `gfx_alien_babble_alien_still`;
  alien_left = `gfx_alien_babble_alien_left`;
  arrow = `gfx_alien_babble_arrow`;
  target = `gfx_alien_babble_target`;
  background = `gfx_alien_babble_background`;

  // The sounds.  The aliens' babbling plays continuously while the game is running.
  sfxBabbling = `sfx_alien_babble_babbling`;
  sfxHit = `sfx_alien_babble_hit`;

  // Where each symbol in the air is: a list of points.  Only the first symbol_count entries mean anything.  (The
  // original had room for 12 symbols.  There can never be more than 4 in the air at once, because each alien
  // throws at most one every 52 frames and a symbol is gone 82 frames after it was thrown.)
  symbols_pos = [ ];

  // A spare copy of symbols_pos, used while clearing away the symbols that have gone.
  symbols_pos_temp = [ ];

  // True while the babbling sound is playing.
  babblePlaying = false;

  // What the alien on the left is doing, and a counter used to time it.
  alien1_state = 0;
  alien1_state_delay = 0;

  // The same for the alien on the right.
  alien2_state = 0;
  alien2_state_delay = 0;

  // Which translator box the player's target is on: 1 for the left-hand one, 2 for the right-hand one.
  target_position = 0;

  // How many symbols are in the air.
  symbol_count = 0;

  // What each symbol in the air is: one of UP, DOWN, LEFT, RIGHT or HIT.
  symbols_dir = [ ];

  // A spare copy of symbols_dir, used while clearing away the symbols that have gone.
  symbols_dir_temp = [ ];

  // The babbling while it is playing, so that it can be stopped.  (The original kept the number of the sound
  // channel it was playing on, hence the name.)
  sfxBabblinghssChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`AlienBabbleScene.constructor`);

    super(`AlienBabbleScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`AlienBabbleScene.loadMiniGame()`);

    this.babblePlaying = false;
    this.sfxBabblinghssChannel = null;

    // Give every one of the 12 places a symbol can occupy a point of its own to hold its position.
    this.symbols_pos = [ ];
    this.symbols_pos_temp = [ ];
    this.symbols_dir = [ ];
    this.symbols_dir_temp = [ ];
    for (let i = 0; i < 12; i++) {
      this.symbols_pos.push({ x: 0, y: 0 });
      this.symbols_pos_temp.push({ x: 0, y: 0 });
      this.symbols_dir.push(0);
      this.symbols_dir_temp.push(0);
    }

    this.initializeAlienBabble();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured from the top-left corner of the play area, which is why
   * xadj and yadj (the position of the play area on the screen) are added whenever something is drawn.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    // Start the babbling, if it is not already going.
    if (!this.babblePlaying) {
      this.babblePlaying = true;
      this.sfxBabblinghssChannel = sndObj.playSound(this.sfxBabbling, true);
    }

    // Background.
    inBackbuffer.BltFast(xadj, yadj, this.background, null);

    // Blit box.
    inBackbuffer.BltFast(xadj + 65, yadj + 168, this.box, null);

    // Blit the aliens.  The one on the left is the same two pictures as the one on the right, flipped over to face
    // the other way.  (Note the 15 where 20 might be expected when it is standing still.  The rectangle is 48
    // pixels wide and the picture only 38, so the left-hand alien is drawn stretched a quarter wider than the
    // right-hand one.  That is how the original has it.)
    switch (this.alien1_state) {
      case this.STILL: {
        inBackbuffer.Blt(
          CRect(xadj + 15, yadj + 162, xadj + 20 + 43, yadj + 162 + 38), this.alien_still, null,
          { mirrorLeftRight: true }
        );
      break; }
      case this.TURNED: {
        inBackbuffer.Blt(
          CRect(xadj + 20, yadj + 162, xadj + 20 + 43, yadj + 162 + 38), this.alien_left, null,
          { mirrorLeftRight: true }
        );
      break; }
    }
    switch (this.alien2_state) {
      case this.STILL: {
        inBackbuffer.BltFast(xadj + 137, yadj + 162, this.alien_still, null);
      break; }
      case this.TURNED: {
        inBackbuffer.BltFast(xadj + 137, yadj + 162, this.alien_left, null);
      break; }
    }

    // Blit target.
    if (this.target_position === 1) {
      inBackbuffer.BltFast(xadj + 23, yadj + 20, this.target, null);
    } else {
      inBackbuffer.BltFast(xadj + 145, yadj + 20, this.target, null);
    }

    // Blit symbols, and move each one up the screen.  The arrow is turned to point the right way: the angle is in
    // hundredths of a degree, clockwise.  A symbol that has been hit is not drawn at all (but still moves).
    for (let i = 0; i < this.symbol_count; i++) {
      const destRect = CRect(
        xadj + this.symbols_pos[i].x, yadj + this.symbols_pos[i].y,
        xadj + this.symbols_pos[i].x + 30, yadj + this.symbols_pos[i].y + 30
      );
      switch (this.symbols_dir[i]) {
        case this.UP: {
          inBackbuffer.Blt(destRect, this.arrow, null, { nRotationAngle: 0 });
        break; }
        case this.RIGHT: {
          inBackbuffer.Blt(destRect, this.arrow, null, { nRotationAngle: 9000 });
        break; }
        case this.DOWN: {
          inBackbuffer.Blt(destRect, this.arrow, null, { nRotationAngle: 18000 });
        break; }
        case this.LEFT: {
          inBackbuffer.Blt(destRect, this.arrow, null, { nRotationAngle: 27000 });
        break; }
      }
      this.symbols_pos[i].y = this.symbols_pos[i].y - 2;
    }

    // Tighten up the arrays: remove any elements off the screen.  First take a copy of every symbol...
    for (let i = 0; i < this.symbol_count; i++) {
      this.symbols_pos_temp[i].x = this.symbols_pos[i].x;
      this.symbols_pos_temp[i].y = this.symbols_pos[i].y;
      this.symbols_dir_temp[i] = this.symbols_dir[i];
    }
    // ... then copy back only the ones that are still on the screen, closing up the gaps.  A symbol that has gone
    // off the top without being hit costs the player points.  (One that was hit has also "gone off the top", in
    // that checkForHit() moves it far above the screen, but there is nothing to pay for that one.)
    let new_symbol_count = 0;
    for (let i = 0; i < this.symbol_count; i++) {
      if (this.symbols_pos_temp[i].y > -30) {
        this.symbols_pos[new_symbol_count].x = this.symbols_pos_temp[i].x;
        this.symbols_pos[new_symbol_count].y = this.symbols_pos_temp[i].y;
        this.symbols_dir[new_symbol_count] = this.symbols_dir_temp[i];
        new_symbol_count++;
      } else {
        if (this.symbols_dir[i] !== this.HIT) {
          this.subtractFromScore(25);
        }
      }
    }
    this.symbol_count = new_symbol_count;

    // Update state of alien 1.  Every 26 frames it changes from standing still to turned, or back again, and each
    // time it turns back it may throw a symbol.
    this.alien1_state_delay++;
    if (this.alien1_state_delay > 25) {
      this.alien1_state_delay = 0;
      if (this.alien1_state === this.TURNED) {
        this.alien1_state = this.STILL;
        this.newSymbol(1);
      } else if (this.alien1_state === this.STILL) {
        this.alien1_state = this.TURNED;
      }
    }

    // Update state of alien 2.
    this.alien2_state_delay++;
    if (this.alien2_state_delay > 25) {
      this.alien2_state_delay = 0;
      if (this.alien2_state === this.TURNED) {
        this.alien2_state = this.STILL;
        this.newSymbol(2);
      } else if (this.alien2_state === this.STILL) {
        this.alien2_state = this.TURNED;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT are the player's answer to a symbol: if a symbol pointing that
   * way is in the translator box the target is on, it is hit.  ACTION hops the target to the other box.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      gameState.player_dir_north = true;
      if (this.checkForHit(this.UP)) {
        this.addToScore(25);
        sndObj.playSound(this.sfxHit);
      }
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_south = true;
      if (this.checkForHit(this.DOWN)) {
        this.addToScore(25);
        sndObj.playSound(this.sfxHit);
      }
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
      if (this.checkForHit(this.LEFT)) {
        this.addToScore(25);
        sndObj.playSound(this.sfxHit);
      }
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
      if (this.checkForHit(this.RIGHT)) {
        this.addToScore(25);
        sndObj.playSound(this.sfxHit);
      }
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
      if (this.target_position === 1) {
        this.target_position = 2;
      } else {
        this.target_position = 1;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.  The other keys only matter to
   * the hands on the console below the play area, which move with them.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.  The babbling is silenced while the popup is up; it starts again by itself on the next frame
    // of the game, if the player chooses to continue.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxBabblinghssChannel)) {
        sndObj.stopSound(this.sfxBabblinghssChannel);
      }
      this.babblePlaying = false;
      this.miniGameCommandButtonHandler();
    }

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      gameState.player_dir_north = false;
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_south = false;
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = false;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = false;
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
    }

  } /* End ku(). */


  /**
   * Initialize.  Puts everything in its starting position: both aliens standing still, nothing in the air, and the
   * target on the left-hand translator box.
   */
  initializeAlienBabble() {

    this.alien1_state = this.STILL;
    this.alien1_state_delay = 0;
    this.alien2_state = this.STILL;
    this.alien2_state_delay = 0;
    this.symbol_count = 0;
    this.target_position = 1;

  } /* End initializeAlienBabble(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the babbling.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxBabblinghssChannel)) {
      sndObj.stopSound(this.sfxBabblinghssChannel);
    }

  } /* End endMiniGame(). */


  /**
   * Gives an alien the chance to throw a new symbol.  Three times in four it does, and the symbol starts just above
   * its head, pointing in a direction picked at random.
   *
   * (The original followed each of its two random picks with a check that the number was in range, going back to
   * pick again if it was not.  Neither check could ever fail, so they are left out here.  The same random numbers
   * are asked for, in the same order.)
   *
   * @param {number} inAlienNumber Which alien: 1 for the one on the left, 2 for the one on the right.
   */
  newSymbol(inAlienNumber) {

    const rand_num = (rand() % 100) + 1;

    // Only add a new symbol sometimes.
    if (rand_num > 25) {
      const symbol_dir = (rand() % 4) + 1;
      if (symbol_dir === 1) {
        this.symbols_dir[this.symbol_count] = this.UP;
      }
      if (symbol_dir === 2) {
        this.symbols_dir[this.symbol_count] = this.RIGHT;
      }
      if (symbol_dir === 3) {
        this.symbols_dir[this.symbol_count] = this.DOWN;
      }
      if (symbol_dir === 4) {
        this.symbols_dir[this.symbol_count] = this.LEFT;
      }
      this.symbols_pos[this.symbol_count].y = 134;
      if (inAlienNumber === 1) {
        this.symbols_pos[this.symbol_count].x = 24;
      } else {
        this.symbols_pos[this.symbol_count].x = 146;
      }
      this.symbol_count++;
    }

  } /* End newSymbol(). */


  /**
   * Looks for symbols that the player has just answered correctly, and marks them as hit.  A symbol counts if it
   * points the way the player pressed, is on the side the target is on, and is inside the translator box (its top
   * edge is from 10 to 38 pixels down the play area).  A symbol that is hit is whisked far above the top of the
   * screen, so that the next frame clears it away.
   *
   * @param  {number}  inDir The direction the player pressed: one of UP, DOWN, LEFT or RIGHT.
   * @return {boolean}       True if at least one symbol was hit.
   */
  checkForHit(inDir) {

    let ret_val = false;

    // Symbols on the left are at x = 24, and those on the right at x = 146.
    let x = 146;
    if (this.target_position === 1) {
      x = 24;
    }

    for (let i = 0; i < this.symbol_count; i++) {
      if (this.symbols_dir[i] === inDir && this.symbols_pos[i].x === x &&
        this.symbols_pos[i].y > 9 && this.symbols_pos[i].y < 39
      ) {
        this.symbols_pos[i].y = -50;
        this.symbols_dir[i] = this.HIT;
        ret_val = true;
      }
    }

    return ret_val;

  } /* End checkForHit(). */


} /* End class. */
