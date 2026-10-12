/**
 * The mini-game "Virus".  The play area is filled with an 11 by 11 grid of "virus bits" of three kinds.  The player
 * moves a selection box about the grid.  ACTION on a bit that has at least one bit of its own kind next to it
 * selects the whole group it belongs to; ACTION on a selected bit removes the group, for points (the bigger the
 * group, the more each bit is worth).  The bits above then fall into the gaps, and when a whole column is emptied
 * the columns to its right move over to close it up.  Clearing the grid completely scores 2,000 points and brings
 * a new grid; so does getting stuck with no groups left, but for no points.
 *
 * This is the port of mini_games/virus.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class VirusScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csVirus;
  game_name = `"Virus"`;
  target_score = 2000;
  target_score_text = `2,000`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: one line of page 2 differs from the original, which read "There are four types of".  There are three
  // kinds of virus bit in the game, not four, so it now says "three", at Frank's request.  Everything else is as
  // the original has it.
  instructions = [
    // ----- Page 1.
    `Virus`,
    ``,
    `You are now playing the`,
    `part of an antivirus`,
    `program.  Really!  You`,
    `must eradicate the virus`,
    `from the system's`,
    `memory banks before`,
    `it's too late.`,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `There are three types of`,
    `virus variants.  You can`,
    `clear sections of them by`,
    `pressing on groups.  Try`,
    `to clear the entire memory`,
    `surface at least once`,
    `before time runs out.`,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Select any virus bit`,
    `twice to remove it and`,
    `any like bits adjacent`,
    `to them.  The bigger`,
    `the virus colony you`,
    `clear, the more`,
    `points you get.`,
    ``
  ];

  // The pictures of the bits.  The numbers in the three grids below are indexes into this list: 0, 1 and 2 are the
  // three kinds of bit, and 3, 4 and 5 are the same three kinds when they are selected.  (So adding 3 to a bit's
  // number selects it.)  A space in a grid with no bit in it holds -1.
  symbols = [
    `gfx_virus_symbol_00`, `gfx_virus_symbol_01`, `gfx_virus_symbol_02`,
    `gfx_virus_symbol_selected_00`, `gfx_virus_symbol_selected_01`, `gfx_virus_symbol_selected_02`
  ];

  // The sounds.
  sfxSelect = `sfx_misc_3`;
  sfxUnselect = `sfx_unflip`;
  sfxClear = `sfx_no_match`;
  sfxLose = `sfx_missed`;
  sfxWin = `sfx_win_1`;

  // The grid as it really is, with nothing selected: eleven lists (the rows, from the top) of eleven numbers each.
  symbol_matrix_generated = this.newMatrix();

  // The grid as it is drawn: the same as the one above, but with the selected group (if any) marked as selected.
  symbol_matrix_working = this.newMatrix();

  // A grid to do the working-out in.
  symbol_matrix_temp = this.newMatrix();

  // Which bit the selection box is around: its column and its row.
  box_around_x = 0;
  box_around_y = 0;

  // How many bits the last search for a group found.
  match_count = 0;

  // The selection box pulses.  This is how solid it is at the moment, from 0 (invisible) to 255 (fully solid), and
  // whether it is getting more solid (0) or less (1).
  op_dir = 0;
  op = 240;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`VirusScene.constructor`);

    super(`VirusScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`VirusScene.loadMiniGame()`);

    this.initializeVirus();

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

    // Blit symbols.  Each is 16 pixels square, and they are 18 pixels apart.
    let loc_x;
    let loc_y;
    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        if (this.symbol_matrix_working[y][x] >= 0) {
          loc_x = ((x * 16) + (x * 2)) + 2;
          loc_y = ((y * 16) + (y * 2)) + 2;
          inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.symbols[this.symbol_matrix_working[y][x]], null);
        }
      }
    }

    // Draw the selection box around the correct tile.  It is yellow, and it pulses: brighter by 10 a frame up to
    // 250, then dimmer by 10 a frame down to 150, and so on.
    loc_x = ((this.box_around_x * 16) + (this.box_around_x * 2)) + 2;
    loc_y = ((this.box_around_y * 16) + (this.box_around_y * 2)) + 2;
    const rect = CRect(xadj + loc_x, yadj + loc_y, xadj + loc_x + 18, yadj + loc_y + 18);
    inBackbuffer.DrawRect(rect, RGB(255, 255, 32), this.op);
    switch (this.op_dir) {
      case 0: {
        this.op = this.op + 10;
        if (this.op >= 250) {
          this.op_dir = 1;
        }
      break; }
      case 1: {
        this.op = this.op - 10;
        if (this.op <= 150) {
          this.op_dir = 0;
        }
      break; }
    }

    // Handle player movements.  While a direction is held down the box moves one space, and then one more every
    // seventh frame.  (A key going down sets the delay to 10, which is why the first move comes at once.)  Going
    // off one side of the grid brings the box back on at the other.
    if (gameState.player_dir_north) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_y--;
        if (this.box_around_y < 0) {
          this.box_around_y = 10;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_south) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_y++;
        if (this.box_around_y > 10) {
          this.box_around_y = 0;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_west) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_x--;
        if (this.box_around_x < 0) {
          this.box_around_x = 10;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_east) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_x++;
        if (this.box_around_x > 10) {
          this.box_around_x = 0;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT start the selection box moving; ACTION pushes the button in (what
   * it does happens when it is let go, in ku()).
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      gameState.player_dir_north = true;
      gameState.player_dir_south = false;
      gameState.player_dir_east = false;
      gameState.player_dir_west = false;
      gameState.player_dir_delay = 10;
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_north = false;
      gameState.player_dir_south = true;
      gameState.player_dir_east = false;
      gameState.player_dir_west = false;
      gameState.player_dir_delay = 10;
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_north = false;
      gameState.player_dir_south = false;
      gameState.player_dir_east = false;
      gameState.player_dir_west = true;
      gameState.player_dir_delay = 10;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_north = false;
      gameState.player_dir_south = false;
      gameState.player_dir_east = true;
      gameState.player_dir_west = false;
      gameState.player_dir_delay = 10;
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of a direction stops
   * the selection box; letting go of ACTION selects the group the box is on, or removes it if it is already
   * selected.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
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

      this.match_count = 0;
      let x;
      let y;

      // If the symbol type they tapped on is less than three, then they tapped on an unselected item.  In that
      // case, we'll have to see if they tapped on something with at least one other adjacent symbol.  If so,
      // select them all.  If not, unselect everything.
      if (this.symbol_matrix_working[this.box_around_y][this.box_around_x] < 3 &&
        this.symbol_matrix_working[this.box_around_y][this.box_around_x] !== -1
      ) {

        // Copy the generated matrix over to our temp matrix.
        this.copyGeneratedToTemp();

        // Call the match finding recursor.  Send it the X/Y the selection box is currently around, the current
        // symbol type, and the target symbol type.
        this.matchFinder(this.box_around_x, this.box_around_y,
          this.symbol_matrix_temp[this.box_around_y][this.box_around_x],
          this.symbol_matrix_temp[this.box_around_y][this.box_around_x] + 3
        );

        if (this.match_count > 1) {

          // If more than one match was found, copy the temp matrix into our working matrix, because they are
          // selecting a region.
          this.copyTempToWorking();
          sndObj.playSound(this.sfxSelect);

        } else {

          // If one match is found (0 matches can never occur), we want to essentially unselect all symbols, so to
          // do that we'll just copy over the generated matrix.
          this.copyGeneratedToWorking();
          sndObj.playSound(this.sfxUnselect);

        }

      } else if (this.symbol_matrix_working[this.box_around_y][this.box_around_x] >= 3) {

        // If the symbol type was 3 or higher, they tapped on a selected symbol.  In this case, we need to destroy
        // all the adjacent symbols.
        let x1;
        let y1;
        let x_loc;
        let y_loc;
        let column_empty;

        // Copy the working matrix over to our temp matrix.  (See the NOTE on copyWorkingToTemp(): it does not do
        // that, in the original or here, and it does not matter.)
        this.copyWorkingToTemp();

        // We need to call matchFinder again, but this time we need it to set the values in the temp matrix to -1
        // so we know to not draw those symbols again.  Then score: the bigger the group, the more each bit of it
        // is worth.
        this.matchFinder(this.box_around_x, this.box_around_y,
          this.symbol_matrix_temp[this.box_around_y][this.box_around_x], -1
        );
        if (this.match_count >= 2 && this.match_count <= 4) {
          this.addToScore(this.match_count * 2);
        }
        if (this.match_count >= 5 && this.match_count <= 7) {
          this.addToScore(this.match_count * 3);
        }
        if (this.match_count >= 8 && this.match_count <= 10) {
          this.addToScore(this.match_count * 4);
        }
        if (this.match_count >= 11 && this.match_count <= 13) {
          this.addToScore(this.match_count * 5);
        }
        if (this.match_count >= 14) {
          this.addToScore(this.match_count * 10);
        }

        // Now we have to shift everything down to fill in the gaps.
        for (x = 0; x < 11; x++) {
          // y_loc is needed because when we scan the column for empty elements, we can't use y because if we did,
          // we wouldn't shift properly (i.e., the current element being checked, y, would never be shifted into).
          // We need a separate index of the element being checked so that when we shift, we don't increment it
          // automatically.
          y_loc = 10;
          // Scan from the bottom of the current column to the top...
          for (y = 0; y < 11; y++) {
            if (this.symbol_matrix_temp[y_loc][x] === -1) {
              // When we find an empty element, loop from that point back to the top, shifting everything down...
              for (y1 = y_loc; y1 > 0; y1--) {
                this.symbol_matrix_temp[y1][x] = this.symbol_matrix_temp[y1 - 1][x];
              }
              // And add an empty element at the top.
              this.symbol_matrix_temp[0][x] = -1;
            } else {
              // No empty element found, move on.
              y_loc--;
            }
          }
        }

        // Now shift everything to the right of an empty column left.  x_loc is needed for the same reason y_loc
        // above is, but horizontally instead of vertically.
        //
        // NOTE: this does not quite do what was meant, and it is the same in the original.  The last column is
        // emptied ("empty-fill the right") inside the loop that moves the columns over, so by the time that loop
        // gets round to moving the last column into the last but one, there is nothing left in it.  The upshot
        // is that whenever a column is closed up, whatever was in the last column of the grid simply disappears
        // (unless the column closed up was the last but one).  It happens at most once or twice to a grid, since
        // the last column is empty from then on.
        x_loc = 0;
        // Scan from left to right...
        for (x = 0; x < 11; x++) {
          column_empty = true;
          // Scan the current column.  If there are ANY non-empty elements, we'll be skipping this column...
          for (y = 0; y < 11; y++) {
            if (this.symbol_matrix_temp[y][x_loc] !== -1) {
              column_empty = false;
            }
          }
          if (column_empty) {
            // If the column was empty, then starting at this column, shift everything to the right of it left.
            for (x1 = x_loc; x1 < 10; x1++) {
              for (y = 0; y < 11; y++) {
                this.symbol_matrix_temp[y][x1] = this.symbol_matrix_temp[y][x1 + 1];
                // Empty-fill the right.
                this.symbol_matrix_temp[y][10] = -1;
              }
            }
          } else {
            // Column was NOT empty, so move on.
            x_loc++;
          }
        }

        // Check to see if there are any valid moves left.  To do this, we scan through the temp array, checking
        // the four adjacent elements to each.  If we get any matches at all, the game continues, otherwise it
        // ends.
        let num_matches = 0;
        for (y = 0; y < 11; y++) {
          for (x = 0; x < 11; x++) {
            const symbol_type = this.symbol_matrix_temp[y][x];
            if (symbol_type !== -1) {
              if (x < 10) {
                if (this.symbol_matrix_temp[y][x + 1] === symbol_type) {
                  num_matches++;
                }
              }
              if (x > 0) {
                if (this.symbol_matrix_temp[y][x - 1] === symbol_type) {
                  num_matches++;
                }
              }
              if (y < 10) {
                if (this.symbol_matrix_temp[y + 1][x] === symbol_type) {
                  num_matches++;
                }
              }
              if (y > 0) {
                if (this.symbol_matrix_temp[y - 1][x] === symbol_type) {
                  num_matches++;
                }
              }
            }
          }
        }

        // If we got no matches, this grid is finished with.  But, we need to see how many symbols are left.  If
        // none, they won.  If one or more, they are stuck.  Either way a new grid is made.
        if (num_matches === 0) {
          let num_symbols_left = 0;
          for (y = 0; y < 11; y++) {
            for (x = 0; x < 11; x++) {
              if (this.symbol_matrix_temp[y][x] !== -1) {
                num_symbols_left++;
              }
            }
          }
          if (num_symbols_left === 0) {
            sndObj.playSound(this.sfxWin);
            this.addToScore(2000);
            this.initializeVirus();
            return;
          } else {
            sndObj.playSound(this.sfxLose);
            this.initializeVirus();
            return;
          }
        }

        // Now copy the resultant temp matrix into both the working and generated matrixes.
        this.copyTempToWorking();
        this.copyTempToGenerated();

        sndObj.playSound(this.sfxClear);

      }

    } /* End if (inKey === gameState.kAction). */

  } /* End ku(). */


  /**
   * Initialize.  Puts the selection box in the top-left corner and fills the grid with bits chosen at random.
   */
  initializeVirus() {

    // Start selection box in upper left-hand corner.
    this.box_around_x = 0;
    this.box_around_y = 0;

    // Randomly fill spaces.
    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        this.symbol_matrix_generated[y][x] = rand() % 3;
        this.symbol_matrix_working[y][x] = this.symbol_matrix_generated[y][x];
      }
    }

    this.op_dir = 0;
    this.op = 240;
    gameState.player_dir_delay = 0;
    this.match_count = 0;

  } /* End initializeVirus(). */


  /**
   * Makes an empty grid: eleven rows of eleven zeros.
   *
   * @return {Array} The grid.
   */
  newMatrix() {

    const matrix = [ ];
    for (let y = 0; y < 11; y++) {
      matrix.push([ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
    }
    return matrix;

  } /* End newMatrix(). */


  /**
   * Does a flood-fill to find all adjacent matching symbols to a starting point: every bit of the given kind that
   * can be reached from the starting point by going up, down, left or right through bits of that kind.  Each one
   * found is counted in match_count and changed, in the temp matrix, to the new kind.
   *
   * @param {number} inX             The column to look at.
   * @param {number} inY             The row to look at.
   * @param {number} inSymbolType    The kind of bit being looked for.
   * @param {number} inNewSymbolType What to change each one found to.
   */
  matchFinder(inX, inY, inSymbolType, inNewSymbolType) {

    if (this.symbol_matrix_temp[inY][inX] === inSymbolType) {
      this.match_count++;
      this.symbol_matrix_temp[inY][inX] = inNewSymbolType;
      if (inX < 10) {
        this.matchFinder(inX + 1, inY, inSymbolType, inNewSymbolType);
      }
      if (inX > 0) {
        this.matchFinder(inX - 1, inY, inSymbolType, inNewSymbolType);
      }
      if (inY < 10) {
        this.matchFinder(inX, inY + 1, inSymbolType, inNewSymbolType);
      }
      if (inY > 0) {
        this.matchFinder(inX, inY - 1, inSymbolType, inNewSymbolType);
      }
    }

  } /* End matchFinder(). */


  /**
   * Copies the generated symbol matrix to the temp matrix.
   */
  copyGeneratedToTemp() {

    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        this.symbol_matrix_temp[y][x] = this.symbol_matrix_generated[y][x];
      }
    }

  } /* End copyGeneratedToTemp(). */


  /**
   * Copies the temp symbol matrix to the working matrix.
   */
  copyTempToWorking() {

    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        this.symbol_matrix_working[y][x] = this.symbol_matrix_temp[y][x];
      }
    }

  } /* End copyTempToWorking(). */


  /**
   * Copies the generated symbol matrix to the working matrix.
   */
  copyGeneratedToWorking() {

    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        this.symbol_matrix_working[y][x] = this.symbol_matrix_generated[y][x];
      }
    }

  } /* End copyGeneratedToWorking(). */


  /**
   * By its name, copies the working symbol matrix to the temp matrix.
   *
   * NOTE: it does not, and that is how the original has it: it copies the generated matrix to the working matrix,
   * just as copyGeneratedToWorking() does.  No harm comes of it.  It is only called when the player presses ACTION
   * on a selected bit, and there can only be selected bits in the working matrix when the temp matrix already
   * holds the very same thing (it was copied from there when the group was selected, and neither has been changed
   * since).  And the working matrix, which this does change, is written over straight afterwards.
   */
  copyWorkingToTemp() {

    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        this.symbol_matrix_working[y][x] = this.symbol_matrix_generated[y][x];
      }
    }

  } /* End copyWorkingToTemp(). */


  /**
   * Copies the temp symbol matrix to the generated matrix.
   */
  copyTempToGenerated() {

    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        this.symbol_matrix_generated[y][x] = this.symbol_matrix_temp[y][x];
      }
    }

  } /* End copyTempToGenerated(). */


} /* End class. */
