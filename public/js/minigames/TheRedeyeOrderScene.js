/**
 * The mini-game "The Redeye Order".  This is the classic sliding-tile puzzle: fifteen numbered tiles are scrambled
 * in a four by four grid with one empty space.  The player moves a selection box around with UP, DOWN, LEFT and
 * RIGHT, and pressing ACTION on a tile that is next to the empty space slides it into the space.  The aim is to
 * get the tiles into numerical order, with the space in the bottom right-hand corner, before time runs out.  Doing
 * so scores 5,000 points plus 50 for every second left on the clock.
 *
 * In an Adventure game there is also a shortcut, which the captive on the first level of the ship gives away as a
 * hint: once the hint has been given, simply getting tiles 1, 2, 3 and 4 into the four corners (going clockwise
 * from the top left) wins the game.
 *
 * This is the port of mini_games/the_redeye_order.cpp.  Everything that is the same for every mini-game (the frame,
 * the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class TheRedeyeOrderScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csTheRedeyeOrder;
  game_name = `"The Redeye Order"`;
  target_score = 5000;
  target_score_text = `5,000`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `The Redeye Order`,
    ``,
    `It's not rocket-science`,
    `after all... Can you`,
    `count?  GOOD!  Shouldn't`,
    `be a problem then!`,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Slide the tiles into`,
    `numerical order before`,
    `time runs out.`,
    ``,
    `What, you were`,
    `expecting more?!?`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Press on a tile next to`,
    `the empty space, and the`,
    `tile will swap itself`,
    `with the empty space.`,
    `Keeping doing this until`,
    `they are in order and`,
    `the space is in the`,
    `lower right-hand corner.`
  ];

  // The pictures of the fifteen tiles.  Tile number 1 is picture 0 in this list, and so on up to tile number 15,
  // which is picture 14.
  tiles = [
    `gfx_the_redeye_order_1`, `gfx_the_redeye_order_2`, `gfx_the_redeye_order_3`, `gfx_the_redeye_order_4`,
    `gfx_the_redeye_order_5`, `gfx_the_redeye_order_6`, `gfx_the_redeye_order_7`, `gfx_the_redeye_order_8`,
    `gfx_the_redeye_order_9`, `gfx_the_redeye_order_10`, `gfx_the_redeye_order_11`, `gfx_the_redeye_order_12`,
    `gfx_the_redeye_order_13`, `gfx_the_redeye_order_14`, `gfx_the_redeye_order_15`
  ];

  // The sounds: a tile sliding, and the puzzle being solved.
  sfxMove = `sfx_the_redeye_order_move`;
  sfxWin = `sfx_the_redeye_order_win`;

  // What is in each of the sixteen places on the board.  The places are numbered along the rows: 0 to 3 is the top
  // row (left to right), 4 to 7 the second row, and so on down to 15, the bottom right-hand corner.  Each entry is
  // the number of a picture in the tiles list above (so 0 is tile number 1), or 15 for the empty space.
  tiles_index = [ ];

  // The selection box pulses, slowly getting fainter and then more solid again.  op is how solid it is right now
  // (255 would be fully solid) and op_dir says which way it is going: 0 for getting more solid, 1 for fainter.
  op_dir = 0;
  op = 240;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`TheRedeyeOrderScene.constructor`);

    super(`TheRedeyeOrderScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`TheRedeyeOrderScene.loadMiniGame()`);

    // Make the list of what is in each place (18 entries, the size the original declared it, although there are only
    // 16 places).
    this.tiles_index = [ ];
    for (let i = 0; i < 18; i++) {
      this.tiles_index.push(0);
    }

    this.initializeTheRedeyeOrder();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured from the top-left corner of the play area, which is why
   * xadj and yadj (the position of the play area on the screen) are added whenever something is drawn.
   *
   * In this mini-game gameState.player_pos is not a position in pixels: it is the column (x) and row (y) of the
   * place the selection box is on, each from 0 to 3.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    // Blit tiles.
    let loc_x = 0;
    let loc_y = 0;
    let i = 0;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        // Calculate the proper X/Y coordinates for each tile.  Each tile is 48 pixels square, with a 2 pixel gap
        // between one and the next, and the whole board starts 1 pixel in from the edge of the play area.
        loc_x = ((x * 48) + (x * 2)) + 1;
        loc_y = ((y * 48) + (y * 2)) + 1;
        // Draw the tile depending on its state.
        if (this.tiles_index[i] !== 15) { // 15 is a blank space
          inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.tiles[this.tiles_index[i]], null);
        }
        i++;
      }
    }

    // Draw the selection box around the correct tile.  It is 50 pixels square, so it sits just outside the tile.
    loc_x = ((gameState.player_pos.x * 48) + (gameState.player_pos.x * 2)) + 0;
    loc_y = ((gameState.player_pos.y * 48) + (gameState.player_pos.y * 2)) + 0;
    const rect = CRect(xadj + loc_x, yadj + loc_y, xadj + loc_x + 50, yadj + loc_y + 50);
    inBackbuffer.DrawRect(rect, RGB(255, 255, 32), this.op);
    // Make the box pulse: its opacity goes up in tens to 250, then down in tens to 150, and round again.
    switch (this.op_dir) {
      case 0: {
        this.op = this.op + 10;
        if (this.op >= 250) {
          this.op_dir = 1;
        }
        break;
      }
      case 1: {
        this.op = this.op - 10;
        if (this.op <= 150) {
          this.op_dir = 0;
        }
        break;
      }
      default: {
        break;
      }
    }

    // Handle player movements.  When a direction is first pressed the box moves at once (kd() sets the delay
    // counter to 10 to make that happen); while the direction is held it then moves again every seventh frame.
    // Going off one side of the board brings the box back on the other.
    if (gameState.player_dir_north) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        gameState.player_pos.y--;
        if (gameState.player_pos.y < 0) {
          gameState.player_pos.y = 3;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_south) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        gameState.player_pos.y++;
        if (gameState.player_pos.y > 3) {
          gameState.player_pos.y = 0;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_west) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        gameState.player_pos.x--;
        if (gameState.player_pos.x < 0) {
          gameState.player_pos.x = 3;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_east) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        gameState.player_pos.x++;
        if (gameState.player_pos.x > 3) {
          gameState.player_pos.x = 0;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }

    // See if they won, end the game if so.  They have won when every place holds the tile that belongs there:
    // place 0 holds picture 0 (tile number 1), place 1 holds picture 1, and so on, with the empty space (15) in
    // place 15.
    let in_order = true;
    for (let place = 0; place < 16; place++) {
      if (this.tiles_index[place] !== place) {
        in_order = false;
      }
    }
    if (in_order) {
      sndObj.playSound(this.sfxWin);
      gameState.force_game_over = true;
      this.addToScore(5000 + (gameState.countdown_seconds * 50)); // More points for doing it quickly
    }

    // Cheat (only if in Adventure mode and only if level hint gotten): 1, 2, 3, 4 tiles in corners going clockwise.
    // That is tile number 1 top left (place 0), 2 top right (place 3), 3 bottom right (place 15) and 4 bottom left
    // (place 12).
    if (
      gameState.game_mode === gmAdventureGame && gameState.levelHintDone &&
      this.tiles_index[0] === 0 && this.tiles_index[3] === 1 && this.tiles_index[12] === 3 &&
      this.tiles_index[15] === 2
    ) {
      sndObj.playSound(this.sfxWin);
      gameState.force_game_over = true;
      this.addToScore(5000);
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT move the selection box (only one direction at a time), and ACTION
   * slides the tile the box is on into the empty space, if the empty space is directly above, below, left or right
   * of it.
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
      // The place the selection box is on, and what is in it.
      const source_index = (gameState.player_pos.y * 4) + gameState.player_pos.x;
      const source_value = this.tiles_index[source_index];
      // Is the empty space directly above?  (Not looked at if the box is on the top row.)
      if (gameState.player_pos.y > 0) {
        const destination_index = ((gameState.player_pos.y - 1) * 4) + gameState.player_pos.x;
        const destination_value = this.tiles_index[destination_index];
        if (destination_value === 15) {
          this.tiles_index[destination_index] = source_value;
          this.tiles_index[source_index] = 15;
          sndObj.playSound(this.sfxMove);
          return;
        }
      }
      // Directly below?
      if (gameState.player_pos.y < 3) {
        const destination_index = ((gameState.player_pos.y + 1) * 4) + gameState.player_pos.x;
        const destination_value = this.tiles_index[destination_index];
        if (destination_value === 15) {
          this.tiles_index[destination_index] = source_value;
          this.tiles_index[source_index] = 15;
          sndObj.playSound(this.sfxMove);
          return;
        }
      }
      // Directly to the left?
      if (gameState.player_pos.x > 0) {
        const destination_index = (gameState.player_pos.y * 4) + (gameState.player_pos.x - 1);
        const destination_value = this.tiles_index[destination_index];
        if (destination_value === 15) {
          this.tiles_index[destination_index] = source_value;
          this.tiles_index[source_index] = 15;
          sndObj.playSound(this.sfxMove);
          return;
        }
      }
      // Directly to the right?
      if (gameState.player_pos.x < 3) {
        const destination_index = (gameState.player_pos.y * 4) + (gameState.player_pos.x + 1);
        const destination_value = this.tiles_index[destination_index];
        if (destination_value === 15) {
          this.tiles_index[destination_index] = source_value;
          this.tiles_index[source_index] = 15;
          sndObj.playSound(this.sfxMove);
          return;
        }
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of a direction stops
   * the selection box moving.
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
    }

  } /* End ku(). */


  /**
   * Initialize.  Scrambles the board and starts the selection box's pulse from the beginning.
   */
  initializeTheRedeyeOrder() {

    this.resetBoard();
    this.op_dir = 0;
    this.op = 240;

  } /* End initializeTheRedeyeOrder(). */


  /**
   * Scrambles the board: each of the fifteen tiles, and the empty space, is put in a place chosen at random.
   *
   * NOTE: this differs from the original in one way.  With a sliding puzzle, only half of all the possible
   * arrangements can ever be slid into order; from the other half it is impossible, however long the player tries.
   * The original scrambled the board once and used whatever came out, so about one game in two could not be won
   * by putting the tiles in order.  Here the board is scrambled, in exactly the original's way, again and again
   * until an arrangement comes out that CAN be solved.
   */
  resetBoard() {

    let solvable = false;
    while (!solvable) {

      // Mark every place as not yet filled.
      for (let i = 0; i < 16; i++) {
        this.tiles_index[i] = -1;
      }

      // For each tile in turn (and lastly the empty space, which is number 15), keep picking a place at random
      // until one is found that has not been filled yet, and put the tile there.
      for (let i = 0; i < 16; i++) {
        let j = rand() % 16;
        while (this.tiles_index[j] !== -1) {
          j = rand() % 16;
        }
        this.tiles_index[j] = i;
      }

      // Keep this arrangement only if it can be solved.  Otherwise go round and scramble again.
      solvable = this.isBoardSolvable();

    }

  } /* End resetBoard(). */


  /**
   * Says whether the board, as it is now, can be slid into order.  This is not part of the original game; it is
   * here for resetBoard() to use.
   *
   * There is a well-known rule for telling, without trying to solve the puzzle.  Go through the places in order
   * (along each row, top row first) and count the "inversions": the pairs of tiles where a higher-numbered tile
   * comes somewhere before a lower-numbered one.  The empty space is left out of this count.  Then find which row
   * the empty space is on, counting from the bottom (the bottom row is 1, the top row is 4).  Add the two numbers
   * together.  On a board four places wide, the puzzle can be solved exactly when that total is odd.
   *
   * (A quick check of the rule: on the finished board no tile is before a lower one, so there are 0 inversions,
   * and the space is on the bottom row, which is row 1.  The total is 1, which is odd, as it should be.)
   *
   * @return {boolean} True if the board can be solved, false if it cannot.
   */
  isBoardSolvable() {

    // Count the inversions.  For every place, look at every place after it.
    let inversions = 0;
    for (let first = 0; first < 16; first++) {
      for (let second = first + 1; second < 16; second++) {
        const first_value = this.tiles_index[first];
        const second_value = this.tiles_index[second];
        // 15 is the empty space, which does not count.
        if (first_value !== 15 && second_value !== 15 && first_value > second_value) {
          inversions++;
        }
      }
    }

    // Find the row the empty space is on, counted from the bottom.  Places 0 to 3 are the top row (row 4 from the
    // bottom), places 4 to 7 the next (row 3), and so on.
    let space_row_from_bottom = 0;
    for (let place = 0; place < 16; place++) {
      if (this.tiles_index[place] === 15) {
        space_row_from_bottom = 4 - Math.trunc(place / 4);
      }
    }

    // Solvable exactly when the total is odd.
    return ((inversions + space_row_from_bottom) % 2) === 1;

  } /* End isBoardSolvable(). */


} /* End class. */
