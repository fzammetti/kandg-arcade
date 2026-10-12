/**
 * The mini-game "Son Of Eliminator".  A board of holes, all but one or two of them holding a marble.  The player
 * moves a highlight from hole to hole, raises a marble with ACTION, and with ACTION again on an empty hole two
 * away (up, down, across or diagonally) jumps the marble into it, which clears the marble jumped over, for 10
 * points.  When no jump is left there are 250 points if a single marble remains and 50 lost if not, and a new
 * board is dealt.
 *
 * This is the port of mini_games/son_of_eliminator.cpp.  Everything that is the same for every mini-game (the
 * frame, the instructions, the clock, the score and so on) is in MiniGameScene.js.
 *
 * This is level 5's "special" game: the captive on that level gives a hint ("raise each exactly once without
 * lowering it or doing anything else, and you win!"), and in an Adventure, once that hint has been heard, doing so
 * wins the game outright.  See ku().
 */
class SonOfEliminatorScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csSonOfEliminator;
  game_name = `"Son Of Eliminator"`;
  target_score = 300;
  target_score_text = `300`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: one line of page 1 differs from the original, at Frank's request.  It read "Bobba Fett and let's", which
  // now says "Boba".  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Son Of Eliminator`,
    ``,
    `Well, not so much a son`,
    `as much a flat-out`,
    `CLONE!  Just call it`,
    `Boba Fett and let's`,
    `leave it at that.`,
    ``,
    ``,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Clear as many marbles`,
    `as you can, trying to`,
    `leave just one.  When no`,
    `valid moves remain, the`,
    `marbles will reappear for`,
    `you to try again.  You`,
    `will lose points if more`,
    `than one marble remains.`,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Select a marble, press`,
    `ACTION to raise it.  Then`,
    `select an empty hole such`,
    `that there is one marble`,
    `between it and the raised`,
    `marble in any direction.`,
    `Press ACTION to jump`,
    `the marble and clear it.`
  ];

  // What a square of the board can be: no hole at all, an empty hole, a hole with a marble in it, and a hole with
  // a raised marble in it.
  T_BLANK = 0;
  T_EMPTY = 1;
  T_FILLED = 2;
  T_RAISED = 3;

  // The pictures: an empty hole, a raised marble and a marble that is down; and the same three with the highlight
  // that shows where the player is.
  tile_empty = `gfx_son_of_eliminator_empty`;
  tile_raised = `gfx_son_of_eliminator_up`;
  tile_filled = `gfx_son_of_eliminator_down`;
  tile_empty_current = `gfx_son_of_eliminator_empty_current`;
  tile_raised_current = `gfx_son_of_eliminator_up_current`;
  tile_filled_current = `gfx_son_of_eliminator_down_current`;

  // The sounds.
  sfxLose = `sfx_missed`;
  sfxWin = `sfx_win_1`;
  sfxRaised = `sfx_son_of_eliminator_up`;
  sfxDown = `sfx_son_of_eliminator_down`;
  sfxRemove = `sfx_son_of_eliminator_remove`;

  // The boards, taken out of the original by a script, not typed: the original named them Big Cross, Diamond,
  // Horseshoe and Strange Invaders.  Each is a list of 14 rows of 14 squares (each one of the T values above), of
  // which only rows and columns 1 to 10 are the board itself.  The rest is always blank, so that the square next
  // to one on the edge can be looked at without it mattering that it is off the board.
  //
  // NOTE: the fourth board, Strange Invaders, is never dealt, in the original or here.  See initPattern().
  Patterns = [
    // ----- Big Cross.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Diamond.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0 ],
      [ 0, 0, 2, 2, 2, 2, 1, 2, 2, 2, 0, 0, 0, 0 ],
      [ 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0 ],
      [ 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Horseshoe.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0 ],
      [ 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0 ],
      [ 0, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Strange Invaders.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0 ],
      [ 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0 ],
      [ 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0 ],
      [ 0, 0, 2, 0, 2, 0, 0, 2, 0, 2, 0, 0, 0, 0 ],
      [ 0, 0, 2, 0, 2, 1, 1, 2, 0, 2, 0, 0, 0, 0 ],
      [ 0, 0, 2, 0, 0, 2, 2, 0, 0, 2, 0, 0, 0, 0 ],
      [ 0, 0, 2, 0, 1, 1, 1, 1, 0, 2, 0, 0, 0, 0 ],
      [ 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ]
  ];

  // The board as it now stands: laid out as one of the boards above.
  CurrentStates = this.newBoard();

  // Where the marble last raised or lowered is on the board (x and y are -1 when there is none), and whether a
  // marble is up.
  prev_current = { x: -1, y: -1 };
  piece_up = false;

  // How many marbles were left when the last board ran out of jumps, and which board is being played.
  pieces_left = 0;
  pattern_index = 0;

  // For the short cut: how many marbles the board began with, how many times a marble has been raised since it was
  // dealt, and whether the short cut can still be taken (it cannot once anything else has been done).
  marble_count = 0;
  cheat_count = 0;
  cheat_possible = true;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`SonOfEliminatorScene.constructor`);

    super(`SonOfEliminatorScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`SonOfEliminatorScene.loadMiniGame()`);

    this.pieces_left = 0;
    this.pattern_index = 0;
    this.cheat_count = 0;
    this.marble_count = 0;

    // Deal a board, and put the player three holes from the right-hand edge and half way down (a marble, on every
    // board that is ever dealt).
    this.initPattern(-1);
    gameState.player_pos.x = 8;
    gameState.player_pos.y = 5;
    this.piece_up = false;
    this.prev_current.x = -1;
    this.prev_current.y = -1;
    this.cheat_possible = true;
    this.cheat_count = 0;

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game.  (All of this game's logic is in ku(): nothing happens until a key is let
   * go.)
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const player_pos = gameState.player_pos;

    // Draw the board in its current state, highlighting the current square.
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        switch (this.CurrentStates[y + 1][x + 1]) {
          case this.T_EMPTY: {
            if (player_pos.x - 1 === x && player_pos.y - 1 === y) {
              inBackbuffer.BltFast(xadj + (x * 20), yadj + (y * 20), this.tile_empty_current, null);
            } else {
              inBackbuffer.BltFast(xadj + (x * 20), yadj + (y * 20), this.tile_empty, null);
            }
            break;
          }
          case this.T_FILLED: {
            if (player_pos.x - 1 === x && player_pos.y - 1 === y) {
              inBackbuffer.BltFast(xadj + (x * 20), yadj + (y * 20), this.tile_filled_current, null);
            } else {
              inBackbuffer.BltFast(xadj + (x * 20), yadj + (y * 20), this.tile_filled, null);
            }
            break;
          }
          case this.T_RAISED: {
            if (player_pos.x - 1 === x && player_pos.y - 1 === y) {
              inBackbuffer.BltFast(xadj + (x * 20), yadj + (y * 20), this.tile_raised_current, null);
            } else {
              inBackbuffer.BltFast(xadj + (x * 20), yadj + (y * 20), this.tile_raised, null);
            }
            break;
          }
        }
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  Nothing is done until it is let go.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (inKey === gameState.kUp) {
      gameState.player_dir_north = true;
    }

    if (inKey === gameState.kDown) {
      gameState.player_dir_south = true;
    }

    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
    }

    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.  ACTION raises the marble the
   * player is on, lowers it if it is already up, or, on an empty hole with a marble up, makes the jump if it is
   * one.  A direction moves the player one hole that way, if there is a hole there.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    const CurrentStates = this.CurrentStates;
    const player_pos = gameState.player_pos;
    const prev_current = this.prev_current;

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

    // ACTION.
    if (inKey === gameState.kAction) {

      // If they clicked on a filled hole, lower any previously raised marble and raise the new one.
      if (CurrentStates[player_pos.y][player_pos.x] === this.T_FILLED) {
        if (prev_current.x !== -1 && prev_current.y !== -1) {
          CurrentStates[prev_current.y][prev_current.x] = this.T_FILLED;
        }
        sndObj.playSound(this.sfxRaised);
        CurrentStates[player_pos.y][player_pos.x] = this.T_RAISED;
        prev_current.y = player_pos.y;
        prev_current.x = player_pos.x;
        this.piece_up = true;
        // The short cut.  In an Adventure, once the captive's hint has been heard, raising marbles as many times
        // as the board has marbles, with nothing else done in between, wins outright.
        //
        // NOTE: the hint says to raise EACH marble once.  What is counted is only how many times a marble has been
        // raised, so going back and forth between two marbles does just as well.  That is how the original has
        // it.
        this.cheat_count++;
        if (
          gameState.game_mode === gmAdventureGame && gameState.levelHintDone && this.cheat_possible &&
          this.cheat_count === this.marble_count
        ) {
          this.addToScore(500);
          gameState.force_game_over = true;
        }
        return;
      }

      // If they clicked on a raised marble, lower it.
      if (CurrentStates[player_pos.y][player_pos.x] === this.T_RAISED) {
        if (prev_current.x !== -1 && prev_current.y !== -1) {
          CurrentStates[prev_current.y][prev_current.x] = this.T_FILLED;
        }
        sndObj.playSound(this.sfxDown);
        CurrentStates[player_pos.y][player_pos.x] = this.T_FILLED;
        prev_current.y = player_pos.y;
        prev_current.x = player_pos.x;
        this.piece_up = false;
        this.cheat_possible = false;
        return;
      }

      // If they clicked an empty tile AND a piece is currently up...
      if (CurrentStates[player_pos.y][player_pos.x] === this.T_EMPTY) {
        this.cheat_possible = false;
        if (this.piece_up) {
          // Go through each possible move.  Make sure it's geometrically a valid move and make sure there is a
          // playable piece in between the source and destination.  If it passes both tests, update the status of
          // the middle peg...
          const clicked_x = player_pos.x;
          const clicked_y = player_pos.y;
          const current_x = prev_current.x;
          const current_y = prev_current.y;
          let valid_move = 0;
          let middle_y = 0;
          let middle_x = 0;
          if (
            clicked_y === current_y - 2 && clicked_x === current_x + 0 &&
            CurrentStates[current_y - 1][current_x + 0] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y - 1;
            middle_x = current_x + 0;
          } else if (
            clicked_y === current_y + 2 && clicked_x === current_x + 0 &&
            CurrentStates[current_y + 1][current_x + 0] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y + 1;
            middle_x = current_x + 0;
          } else if (
            clicked_y === current_y + 0 && clicked_x === current_x - 2 &&
            CurrentStates[current_y + 0][current_x - 1] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y + 0;
            middle_x = current_x - 1;
          } else if (
            clicked_y === current_y + 0 && clicked_x === current_x + 2 &&
            CurrentStates[current_y + 0][current_x + 1] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y + 0;
            middle_x = current_x + 1;
          } else if (
            clicked_y === current_y - 2 && clicked_x === current_x - 2 &&
            CurrentStates[current_y - 1][current_x - 1] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y - 1;
            middle_x = current_x - 1;
          } else if (
            clicked_y === current_y - 2 && clicked_x === current_x + 2 &&
            CurrentStates[current_y - 1][current_x + 1] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y - 1;
            middle_x = current_x + 1;
          } else if (
            clicked_y === current_y + 2 && clicked_x === current_x - 2 &&
            CurrentStates[current_y + 1][current_x - 1] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y + 1;
            middle_x = current_x - 1;
          } else if (
            clicked_y === current_y + 2 && clicked_x === current_x + 2 &&
            CurrentStates[current_y + 1][current_x + 1] === this.T_FILLED
          ) {
            valid_move = 1;
            middle_y = current_y + 1;
            middle_x = current_x + 1;
          }
          if (valid_move === 1) {
            sndObj.playSound(this.sfxRemove);
            this.addToScore(10);
            // So we don't reset the piece we just cleared...
            prev_current.x = -1;
            prev_current.y = -1;
            // Make sure we set our flag so we know no pieces are up now.
            this.piece_up = false;
            // Change the target hole to filled.
            CurrentStates[clicked_y][clicked_x] = this.T_FILLED;
            // Change the current piece to empty.
            CurrentStates[current_y][current_x] = this.T_EMPTY;
            // The piece in between, set to empty.
            CurrentStates[middle_y][middle_x] = this.T_EMPTY;
            // If there's no valid moves left...
            if (this.checkMoreMoves()) {
              if (this.pieces_left === 1) { // One piece left, they won
                sndObj.playSound(this.sfxWin);
                this.addToScore(250);
              } else { // More than one piece left, they lost
                sndObj.playSound(this.sfxLose);
                this.subtractFromScore(50);
              }
              this.initPattern(-1);
              player_pos.x = 8;
              player_pos.y = 5;
            }
          }
          return;
        }
      }

    }

    // Up.
    if (inKey === gameState.kUp && CurrentStates[player_pos.y - 1][player_pos.x] !== this.T_BLANK) {
      if (player_pos.y > 1) {
        player_pos.y--;
      }
      gameState.player_dir_north = false;
    }

    // Down.
    if (inKey === gameState.kDown && CurrentStates[player_pos.y + 1][player_pos.x] !== this.T_BLANK) {
      if (player_pos.y < 10) {
        player_pos.y++;
      }
      gameState.player_dir_south = false;
    }

    // Left.
    if (inKey === gameState.kLeft && CurrentStates[player_pos.y][player_pos.x - 1] !== this.T_BLANK) {
      if (player_pos.x > 1) {
        player_pos.x--;
      }
      gameState.player_dir_west = false;
    }

    // Right.
    if (inKey === gameState.kRight && CurrentStates[player_pos.y][player_pos.x + 1] !== this.T_BLANK) {
      if (player_pos.x < 10) {
        player_pos.x++;
      }
      gameState.player_dir_east = false;
    }

  } /* End ku(). */


  /**
   * Initialize a pattern: lays a board out, counts its marbles and makes the short cut possible again.
   *
   * NOTE: the board is picked with "rand() % 3", which is 0, 1 or 2, so the fourth board (Strange Invaders) is
   * never dealt.  The original then checked that the number was not above 3, as if "% 4" had been meant.  That
   * may well have been on purpose: on that board the player would begin on a square with no hole, and whole parts
   * of it could not be got to.
   *
   * @param {number} inPNum Which board to lay out (0 to 3), or -1 to pick one at random.
   */
  initPattern(inPNum) {

    this.cheat_possible = true;
    this.cheat_count = 0;
    this.marble_count = 0;
    // If we are passed -1, we pick a pattern, otherwise we initialize what we were passed.
    if (inPNum === -1) {
      this.pattern_index = rand() % 3;
    } else {
      this.pattern_index = inPNum;
    }
    // Load the pattern into the CurrentStates array.
    for (let y = 1; y < 11; y++) {
      for (let x = 1; x < 11; x++) {
        this.CurrentStates[y][x] = this.Patterns[this.pattern_index][y][x];
        if (this.Patterns[this.pattern_index][y][x] === 2) {
          this.marble_count++;
        }
      }
    }

  } /* End initPattern(). */


  /**
   * This routine checks to see if there are any moves remaining after the last move made.  It also counts the
   * marbles left, into pieces_left.
   *
   * @return {boolean} True if there are NO moves left (the board is finished), false if there is at least one.
   */
  checkMoreMoves() {

    const CurrentStates = this.CurrentStates;
    const tFilled = this.T_FILLED;
    const tEmpty = this.T_EMPTY;

    this.pieces_left = 0;
    let moves_left = 0;
    for (let y = 1; y < 11; y++) {
      for (let x = 1; x < 11; x++) {
        if (CurrentStates[y][x] === tFilled) {
          this.pieces_left++;
          // A jump is possible over this marble if there is a marble on one side of it and an empty hole on the
          // opposite side, in any of the eight directions.
          if (
            (CurrentStates[y + 1][x] === tFilled && CurrentStates[y - 1][x] === tEmpty) ||
            (CurrentStates[y - 1][x] === tFilled && CurrentStates[y + 1][x] === tEmpty) ||
            (CurrentStates[y][x + 1] === tFilled && CurrentStates[y][x - 1] === tEmpty) ||
            (CurrentStates[y][x - 1] === tFilled && CurrentStates[y][x + 1] === tEmpty) ||
            (CurrentStates[y + 1][x - 1] === tFilled && CurrentStates[y - 1][x + 1] === tEmpty) ||
            (CurrentStates[y - 1][x + 1] === tFilled && CurrentStates[y + 1][x - 1] === tEmpty) ||
            (CurrentStates[y + 1][x + 1] === tFilled && CurrentStates[y - 1][x - 1] === tEmpty) ||
            (CurrentStates[y - 1][x - 1] === tFilled && CurrentStates[y + 1][x + 1] === tEmpty)
          ) {
            moves_left = 1;
          }
        }
      }
    }
    // BOARD CLEARED!!
    if (moves_left === 0) {
      return true;
    } else {
      return false;
    }

  } /* End checkMoreMoves(). */


  /**
   * Makes a board with nothing on it: 14 rows of 14 blank squares.
   *
   * @return {Array} The board.
   */
  newBoard() {

    const rows = [ ];
    for (let y = 0; y < 14; y++) {
      const row = [ ];
      for (let x = 0; x < 14; x++) {
        row.push(0);
      }
      rows.push(row);
    }
    return rows;

  } /* End newBoard(). */


} /* End class. */
