/**
 * The mini-game "CopyCat".  Four alien symbols sit in the four corners of the play area.  The game lights them up
 * one after another, each with its own tone, and the player must then repeat the sequence: move a white square
 * around with UP, DOWN, LEFT and RIGHT to choose a symbol, and press ACTION to light it.  Every time the player
 * gets the whole sequence right it grows by one symbol and is played again from the start.  Each correct symbol
 * scores 25 points, and the first wrong one ends the game.
 *
 * This is the port of mini_games/copycat.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class CopyCatScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csCopyCat;
  game_name = `"CopyCat"`;
  target_score = 800;
  target_score_text = `800`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `CopyCat`,
    ``,
    `Every sentient species`,
    `in the universe has`,
    `at least one thing in`,
    `common: a game just like`,
    `this one!  Mimic the`,
    `ever-expanding pattern`,
    `of lighted alien symbols`,
    `until your brain melts.`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Mimic the sequence`,
    `until you mess up, or`,
    `time elapses, whichever`,
    `comes first.  The`,
    `farther you go, the`,
    `more points you get.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `When it's your turn, move`,
    `up, down, left or right`,
    `to highlight a symbol,`,
    `then press ACTION to`,
    `activate it.  Keep`,
    `doing this for the`,
    `entire sequence.`,
    ``
  ];

  // The three things the game can be doing (the values of game_state below).  SEQUENCEPLAYING: the game is showing
  // the sequence.  PLAYERMOVING: it is the player's turn, and they are choosing a symbol.  SELECTION: the player
  // has just chosen a symbol, and it is being lit up for a moment.
  SEQUENCEPLAYING = 1;
  PLAYERMOVING = 2;
  SELECTION = 3;

  // The pictures of the four symbols, as they normally look and lit up.  The symbols are numbered 1 to 4 in the
  // sequence: 1 is top-left, 2 is top-right, 3 is bottom-left and 4 is bottom-right.  Symbol 1 is picture 0 in
  // these lists, and so on.
  symbols = [
    `gfx_copycat_symbol_00`, `gfx_copycat_symbol_01`, `gfx_copycat_symbol_02`, `gfx_copycat_symbol_03`
  ];
  symbols_highlight = [
    `gfx_copycat_symbol_highlight_00`, `gfx_copycat_symbol_highlight_01`,
    `gfx_copycat_symbol_highlight_02`, `gfx_copycat_symbol_highlight_03`
  ];

  // The tone that goes with each symbol.
  sfxTones = [ `sfx_tone_a`, `sfx_tone_b`, `sfx_tone_c`, `sfx_tone_d` ];

  // While a symbol the player chose is being shown: false while it is lit, true during the short pause after.
  selection_pause = false;

  // While the sequence is being played: true once the tone for the current symbol has been started.
  sequence_tone_play = false;

  // While the sequence is being played: false while a symbol is lit, true during the short gap before the next.
  play_pause = false;

  // Which symbol the player's white square is on: column (1 is left, 2 is right) and row (1 is top, 2 is bottom).
  pos_x = 0;
  pos_y = 0;

  // How far the game has got: the sequence currently runs from element 0 to this element.
  sequence_place = 0;

  // While the sequence is being played: which element is being shown, and a counter that times it.
  play_place = 0;
  play_delay = 0;

  // What the game is doing: one of SEQUENCEPLAYING, PLAYERMOVING and SELECTION.
  game_state = 0;

  // How many symbols the player has entered so far this turn.
  player_sequence_place = 0;

  // A counter that times how long the symbol the player chose is lit, and the pause after it.
  selection_delay = 0;

  // A counter that makes the game wait a moment before it starts playing the sequence.
  sequence_play_start_delay = 0;

  // The whole sequence, decided when the game starts (each element is a symbol number, 1 to 4), and the symbols
  // the player has entered this turn.
  sequence = [ ];
  player_sequence = [ ];


  /**
   * Constructor.
   */
  constructor() {

    console.log(`CopyCatScene.constructor`);

    super(`CopyCatScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`CopyCatScene.loadMiniGame()`);

    // Make the two lists, empty (all zeroes).  They have 102 elements because that is the size the original
    // declared them, although only the first 100 are used.
    this.sequence = [ ];
    this.player_sequence = [ ];
    for (let i = 0; i < 102; i++) {
      this.sequence.push(0);
      this.player_sequence.push(0);
    }

    this.initializeCopyCat();

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

    // Fill background.
    inBackbuffer.FillRect(CRect(xadj, yadj, xadj + 200, yadj + 200), RGB(128, 128, 128));

    // If not playing sequence, draw the square under the current symbol.
    if (this.game_state === this.PLAYERMOVING) {
      inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 91, `Your Turn`, font1, GDDRAWTEXT_CENTER);
      if (this.pos_x === 1 && this.pos_y === 1) {
        inBackbuffer.FillRect(CRect(xadj + 8, yadj + 5, xadj + 8 + 85, yadj + 5 + 85), RGB(255, 255, 255));
      }
      if (this.pos_x === 2 && this.pos_y === 1) {
        inBackbuffer.FillRect(CRect(xadj + 107, yadj + 5, xadj + 107 + 85, yadj + 5 + 85), RGB(255, 255, 255));
      }
      if (this.pos_x === 1 && this.pos_y === 2) {
        inBackbuffer.FillRect(CRect(xadj + 8, yadj + 112, xadj + 8 + 85, yadj + 112 + 85), RGB(255, 255, 255));
      }
      if (this.pos_x === 2 && this.pos_y === 2) {
        inBackbuffer.FillRect(CRect(xadj + 107, yadj + 112, xadj + 107 + 85, yadj + 112 + 85), RGB(255, 255, 255));
      }
    }

    // Blit the symbols in their normal state (always).
    inBackbuffer.BltFast(xadj + 8, yadj + 5, this.symbols[0], null);
    inBackbuffer.BltFast(xadj + 107, yadj + 5, this.symbols[1], null);
    inBackbuffer.BltFast(xadj + 8, yadj + 112, this.symbols[2], null);
    inBackbuffer.BltFast(xadj + 107, yadj + 112, this.symbols[3], null);

    // We're playing the sequence...
    if (this.game_state === this.SEQUENCEPLAYING) {
      inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 91, `Try To Remember`, font1, GDDRAWTEXT_CENTER);
      // Nothing happens for the first ten frames, to give the player a moment to get ready.
      this.sequence_play_start_delay++;
      if (this.sequence_play_start_delay > 10) {
        // Start the tone for the current symbol, once.
        if (!this.sequence_tone_play) {
          sndObj.playSound(this.sfxTones[this.sequence[this.play_place] - 1]);
          this.sequence_tone_play = true;
        }
        // See if we're in the pause in between or not.  If not, go ahead and highlight the next symbol in sequence.
        if (!this.play_pause) {
          switch (this.sequence[this.play_place]) {
            case 1: {
              inBackbuffer.BltFast(xadj + 8, yadj + 5, this.symbols_highlight[0], null);
              break;
            }
            case 2: {
              inBackbuffer.BltFast(xadj + 107, yadj + 5, this.symbols_highlight[1], null);
              break;
            }
            case 3: {
              inBackbuffer.BltFast(xadj + 8, yadj + 112, this.symbols_highlight[2], null);
              break;
            }
            case 4: {
              inBackbuffer.BltFast(xadj + 107, yadj + 112, this.symbols_highlight[3], null);
              break;
            }
            default: {
              break;
            }
          }
          // If the symbol has been highlighted long enough...
          this.play_delay++;
          if (this.play_delay > 10) {
            // Go to the next element in sequence and start the pause countdown.
            this.play_place++;
            this.play_delay = 0;
            this.play_pause = true;
            this.sequence_tone_play = false;
            // If we move beyond the current element in sequence, stop the playing loop: it is the player's turn.
            if (this.play_place > this.sequence_place) {
              this.sequence_play_start_delay = 0;
              this.game_state = this.PLAYERMOVING;
              this.play_place = 0;
              this.play_pause = false;
            }
          }
        // We must be pausing...
        } else {
          this.play_delay++;
          // See if it's time to continue playing.
          if (this.play_delay > 1) {
            // It is, so reset the delay and get out of pause mode.
            this.play_delay = 0;
            this.play_pause = false;
          }
        }
      }
    }

    // Highlight selection user last made.
    if (this.game_state === this.SELECTION) {
      inBackbuffer.DrawText(gameState.bbCenterPoint, yadj + 91, `Your Turn`, font1, GDDRAWTEXT_CENTER);
      if (!this.selection_pause) {
        switch (this.player_sequence[this.player_sequence_place - 1]) {
          case 1: {
            inBackbuffer.BltFast(xadj + 8, yadj + 5, this.symbols_highlight[0], null);
            break;
          }
          case 2: {
            inBackbuffer.BltFast(xadj + 107, yadj + 5, this.symbols_highlight[1], null);
            break;
          }
          case 3: {
            inBackbuffer.BltFast(xadj + 8, yadj + 112, this.symbols_highlight[2], null);
            break;
          }
          case 4: {
            inBackbuffer.BltFast(xadj + 107, yadj + 112, this.symbols_highlight[3], null);
            break;
          }
          default: {
            break;
          }
        }
        this.selection_delay++;
        if (this.selection_delay > 2) {
          this.selection_delay = 0;
          this.selection_pause = true;
        }
      } else {
        // Slight pause after highlighting.
        this.selection_delay++;
        if (this.selection_delay > 2) {
          this.selection_delay = 0;
          this.selection_pause = false;
          // If their count is greater than the sequence place, add one to the sequence place and play the sequence,
          // and clear their entry array.  Otherwise they have more of the sequence to enter, so carry on.
          if (this.player_sequence_place > this.sequence_place) {
            this.sequence_place++;
            this.pos_x = 1;
            this.pos_y = 1;
            for (let i = 0; i < 100; i++) {
              this.player_sequence[i] = 0;
            }
            this.player_sequence_place = 0;
            this.game_state = this.SEQUENCEPLAYING;
          } else {
            this.game_state = this.PLAYERMOVING;
          }
        }
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT move the player's square from symbol to symbol (going off one side
   * brings it back on the other), and ACTION chooses the symbol it is on.  Nothing works while the game is playing
   * the sequence.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (this.game_state !== this.SEQUENCEPLAYING) {

      if (inKey === gameState.kUp) {
        this.pos_y--;
        if (this.pos_y < 1) {
          this.pos_y = 2;
        }
      }

      if (inKey === gameState.kDown) {
        this.pos_y++;
        if (this.pos_y > 2) {
          this.pos_y = 1;
        }
      }

      if (inKey === gameState.kLeft) {
        this.pos_x--;
        if (this.pos_x < 1) {
          this.pos_x = 2;
        }
      }

      if (inKey === gameState.kRight) {
        this.pos_x++;
        if (this.pos_x > 2) {
          this.pos_x = 1;
        }
      }

      // Handle keypresses.
      if (inKey === gameState.kAction) {
        gameState.player_button_down = true;
        // Determine which square they selected.
        let what_symbol = 0;
        if (this.pos_x === 1 && this.pos_y === 1) {
          what_symbol = 1;
        }
        if (this.pos_x === 2 && this.pos_y === 1) {
          what_symbol = 2;
        }
        if (this.pos_x === 1 && this.pos_y === 2) {
          what_symbol = 3;
        }
        if (this.pos_x === 2 && this.pos_y === 2) {
          what_symbol = 4;
        }
        sndObj.playSound(this.sfxTones[what_symbol - 1]);
        // Add it to the array of their entries in the correct place.
        this.player_sequence[this.player_sequence_place] = what_symbol;
        this.player_sequence_place++;
        // Compare their entry array so far with the sequence array, force game over when they miss.
        for (let i = 0; i < this.player_sequence_place; i++) {
          if (this.sequence[i] !== this.player_sequence[i]) {
            gameState.force_game_over = true;
            return;
          }
        }
        // They got it right: score it, and light the symbol up for a moment.
        this.addToScore(25);
        this.game_state = this.SELECTION;
        this.selection_delay = 0;
      }

    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
    }

  } /* End ku(). */


  /**
   * Initialize.  Decides the whole sequence and starts the game off playing its first element.
   */
  initializeCopyCat() {

    // Determine our sequence out to 100 moves.
    for (let i = 0; i < 100; i++) {
      this.sequence[i] = (rand() % 4) + 1;
    }
    this.sequence_place = 0;
    this.selection_delay = 0;
    this.selection_pause = false;

    // Start off playing the sequence at the first element.
    this.game_state = this.SEQUENCEPLAYING;
    this.play_delay = 0;
    this.play_place = 0;
    this.play_pause = false;

    // Start us in the upper left-hand corner.
    this.pos_x = 1;
    this.pos_y = 1;
    this.player_sequence_place = 0;
    this.sequence_play_start_delay = 0;
    this.sequence_tone_play = false;

  } /* End initializeCopyCat(). */


} /* End class. */
