/**
 * The mini-game "The Escape".  The player is in a cave, seen from above on a grid of 10 squares by 10, with some
 * "magic stones" (rocks) and as many "magic stone pads".  He moves a square at a time, and walking into a rock
 * pushes it one square along, provided there is neither a wall nor another rock beyond it.  When every rock is on a
 * pad he has escaped: 1,000 points, and he finds himself in another cave.  ACTION puts the cave back as it was at
 * the start, for when a rock has been pushed somewhere it cannot be got out of.  There are six caves, of which five
 * are used (see the NOTE on level_patterns).
 *
 * This is one of the "special" mini-games: in an Adventure game, once the captive on the level has given the hint,
 * there is a short cut that wins it on the spot (see movePlayer()).
 *
 * This is the port of mini_games/the_escape.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class TheEscapeScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csTheEscape;
  game_name = `"The Escape"`;
  target_score = 1000;
  target_score_text = `1,000`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: one line of page 1 differs from the original, which read "damp. miserable caves.".  The full stop after
  // "damp" is now a comma, at Frank's request.  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `The Escape`,
    ``,
    `Lousy caves.  Dark,`,
    `damp, miserable caves.`,
    `Hey, how did you get`,
    `in a cave anyway?!?`,
    `Ah well, just worry`,
    `about getting out for`,
    `now.`,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Push the magic stones`,
    `(yeah, sure, magic`,
    `stones!) onto the magic`,
    `stone pads (creative,`,
    `isn't it?!?) to escape`,
    `each cave.  Escape as`,
    `many caves as you can`,
    `before time runs out.`,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right.  You will push a`,
    `stone that is not blocked`,
    `on the opposite side`,
    `you are trying to move`,
    `it.  Press the ACTION`,
    `button to reset the`,
    `cave when you mess up.`
  ];

  // What a square of a cave can be (the numbers in level_patterns below).  WALL_2 is a square of wall that is drawn
  // a little differently from the rest; there is one in every cave, and it is what the short cut is about.
  NOTHING = 0;
  WALL = 1;
  DESTPAD = 2;
  WALL_2 = 3;

  // The pictures.
  wall = `gfx_the_escape_wall`;
  wall_2 = `gfx_the_escape_wall_2`;
  destpad = `gfx_the_escape_destpad`;
  rock = `gfx_the_escape_rock`;
  rock_in_place = `gfx_the_escape_rock_in_place`;
  player_still = `gfx_the_escape_player_still`;
  player_up = `gfx_the_escape_player_up`;
  player_down = `gfx_the_escape_player_down`;
  player_left = `gfx_the_escape_player_left`;
  player_right = `gfx_the_escape_player_right`;

  // The sounds.
  sfxLevelUp = `sfx_the_escape_levelup`;
  sfxPush = `sfx_the_escape_push`;

  // The six caves.  There is a list for each cave, and in it a list for each row of squares, from the top, holding
  // a number for each square: NOTHING, WALL, DESTPAD or WALL_2.  Only the first ten rows and the first ten squares
  // of each row are the cave itself; the two spare ones on each side, all NOTHING, are in the original too, and
  // are what its code finds when it looks two squares beyond a rock near the edge.
  //
  // These tables, and the three after them, were taken out of the original by a script, not typed.
  //
  // NOTE: cave 4 cannot be escaped.  Every position it can be got into was searched (there are 11,705 of them),
  // and in none of them are all four rocks on pads.  That is how the original has it, and the cave is still here
  // as the original has it; but at Frank's request it is never chosen (see initializeTheEscape() and the end of
  // pnfMiniGame()), so it is never seen.
  level_patterns = [
    // ----- Cave 1.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0 ],
      [ 0, 1, 2, 1, 0, 1, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 2, 0, 0, 0, 1, 0, 1, 0, 0, 0 ],
      [ 0, 1, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 3, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Cave 2.
    [
      [ 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0 ],
      [ 1, 0, 0, 0, 1, 0, 0, 1, 2, 1, 0, 0 ],
      [ 1, 1, 1, 0, 1, 1, 1, 1, 2, 1, 0, 0 ],
      [ 0, 1, 1, 0, 0, 0, 0, 0, 2, 1, 0, 0 ],
      [ 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0 ],
      [ 0, 3, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0 ],
      [ 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Cave 3.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 0, 1, 3, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 1, 0, 0, 0, 2, 1, 0, 0, 0 ],
      [ 0, 1, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Cave 4.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 3, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Cave 5.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0 ],
      [ 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0 ],
      [ 0, 0, 3, 0, 0, 1, 1, 0, 0, 1, 0, 0 ],
      [ 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0 ],
      [ 1, 2, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0 ],
      [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    // ----- Cave 6.
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 2, 2, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 2, 0, 0, 1, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 2, 2, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 3, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ]
  ];

  // Where the player starts in each cave: a point for each (its column and its row).
  levels_player_start_pos = [
    { x: 3, y: 2 }, { x: 1, y: 1 }, { x: 5, y: 5 }, { x: 3, y: 3 }, { x: 8, y: 2 }, { x: 2, y: 5 }
  ];

  // How many rocks there are in each cave.
  levels_num_rocks = [ 3, 3, 4, 4, 5, 5 ];

  // Where the rocks start in each cave: a list of points for each.
  levels_rocks_start_pos = [
    [ { x: 4, y: 3 }, { x: 3, y: 6 }, { x: 6, y: 7 } ],
    [ { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 } ],
    [ { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 6 } ],
    [ { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 6 }, { x: 5, y: 5 } ],
    [ { x: 3, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 } ],
    [ { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 3, y: 6 }, { x: 6, y: 4 }, { x: 6, y: 6 } ]
  ];

  // Where the rocks are now in each cave: a list of points for each, as above.
  levels_rocks_current_pos = this.newRockLists();

  // Which cave the player is in, 1 to 6, and how many he has escaped from in this game.
  curlev = 0;
  number_completed = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`TheEscapeScene.constructor`);

    super(`TheEscapeScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`TheEscapeScene.loadMiniGame()`);

    this.initializeTheEscape();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured in squares of 20 pixels from the top-left corner of the
   * play area.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const player_pos = gameState.player_pos;
    let loc_x;
    let loc_y;
    const clmo = this.curlev - 1;

    // Draw the tiles in the correct current state.
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        // Calculate the proper X/Y coordinates for each tile.
        loc_x = (x * 20);
        loc_y = (y * 20);
        // Draw the tile depending on its state.
        switch (this.level_patterns[clmo][y][x]) {
          case this.WALL: {
            inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.wall, null);
          break; }
          case this.WALL_2: {
            inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.wall_2, null);
          break; }
          case this.DESTPAD: {
            // Note that a pad is drawn once for every rock in the cave, one picture on top of another: the "rock in
            // place" picture for a rock that is on this pad, and the empty pad for each rock that is not.  (And
            // the rocks themselves are drawn over the lot further down.)  That is how the original has it.
            for (let i = 0; i < this.levels_num_rocks[clmo]; i++) {
              if (this.levels_rocks_current_pos[clmo][i].x === x && this.levels_rocks_current_pos[clmo][i].y === y) {
                inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.rock_in_place, null);
              } else {
                inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.destpad, null);
              }
            }
          break; }
        }
      }
    }

    // Blit player: facing the way he is going while a direction key is held, and standing still otherwise.
    loc_x = player_pos.x * 20;
    loc_y = player_pos.y * 20;
    if (gameState.player_dir_east) {
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.player_right, null);
    } else if (gameState.player_dir_west) {
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.player_left, null);
    } else if (gameState.player_dir_north) {
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.player_up, null);
    } else if (gameState.player_dir_south) {
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.player_down, null);
    } else {
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.player_still, null);
    }

    // Blit rocks.
    for (let i = 0; i < this.levels_num_rocks[clmo]; i++) {
      loc_x = this.levels_rocks_current_pos[clmo][i].x * 20;
      loc_y = this.levels_rocks_current_pos[clmo][i].y * 20;
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.rock, null);
    }

    // Check for a win: every rock on a pad.
    let rocks_in_place = 0;
    for (let i = 0; i < this.levels_num_rocks[clmo]; i++) {
      const rock_pos = this.levels_rocks_current_pos[clmo][i];
      if (this.level_patterns[clmo][rock_pos.y][rock_pos.x] === this.DESTPAD) {
        rocks_in_place++;
      }
    }
    if (rocks_in_place === this.levels_num_rocks[clmo]) {
      // Pick a new cave: not the one he is in.
      //
      // Note that a 6 is thrown away as well ("z > 5"), so cave 6 is never the next cave: it is only ever seen as
      // the first cave of a game, which is chosen without this test.  That is how the original has it.
      //
      // NOTE: "z === 4" is not in the original.  Cave 4 cannot be escaped, so at Frank's request it is never
      // chosen.
      let z = (rand() % 6) + 1;
      while (z < 0 || z > 5 || z === this.curlev || z === 4) {
        z = (rand() % 6) + 1;
      }
      this.curlev = z;
      this.number_completed++;
      this.resetLevel(this.curlev);
      this.addToScore(1000);
      sndObj.playSound(this.sfxLevelUp);
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT move the player one square, if he can go that way; ACTION pushes
   * the button in (what it does happens when it is let go, in ku()).
   *
   * The original spelled the same thing out four times over, once for each direction; here it is done once, in
   * movePlayer(), which is told which way.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      const valid_move = this.movePlayer(0, -1);
      // The short cut was taken: the game is over, and nothing more is done.
      if (valid_move === null) {
        return;
      }
      // Do the move if it was valid.
      if (valid_move) {
        gameState.player_dir_north = true;
        gameState.player_pos.y--;
      }
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      const valid_move = this.movePlayer(0, 1);
      if (valid_move === null) {
        return;
      }
      if (valid_move) {
        gameState.player_dir_south = true;
        gameState.player_pos.y++;
      }
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      const valid_move = this.movePlayer(-1, 0);
      if (valid_move === null) {
        return;
      }
      if (valid_move) {
        gameState.player_dir_west = true;
        gameState.player_pos.x--;
      }
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      const valid_move = this.movePlayer(1, 0);
      if (valid_move === null) {
        return;
      }
      if (valid_move) {
        gameState.player_dir_east = true;
        gameState.player_pos.x++;
      }
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
    }

  } /* End kd(). */


  /**
   * Works out whether the player can move one square the way given, and pushes a rock along if there is one in the
   * way that can be pushed.  The player himself is not moved here: kd() does that.
   *
   * This is also where the short cut is.  In an Adventure game in which the captive has given the hint, when the
   * player has escaped from exactly one cave, walking into the square of wall that looks different (WALL_2) is
   * worth 1,000 points and ends the game there and then.  At any other time that square is simply a wall.
   *
   * @param  {number}  inX Which way across: -1 for left, 1 for right, 0 for neither.
   * @param  {number}  inY Which way up or down: -1 for up, 1 for down, 0 for neither.
   * @return {boolean}     True if the player can move, false if he cannot, and null if the short cut was taken.
   */
  movePlayer(inX, inY) {

    const player_pos = gameState.player_pos;
    const pattern = this.level_patterns[this.curlev - 1];
    const rocks = this.levels_rocks_current_pos[this.curlev - 1];
    const num_rocks = this.levels_num_rocks[this.curlev - 1];

    // Flag to determine if this was a valid move or not.
    let valid_move = false;

    // If the move would not take the player out of bounds...  (The original makes this same test, on the column
    // alone, whichever of the four ways he is going.  It makes no difference: no cave lets him get to the last
    // column, or near any edge.)
    if (player_pos.x < 9) {
      // If the move would not hit a wall...
      if (pattern[player_pos.y + inY][player_pos.x + inX] !== this.WALL) {
        // Move will be valid unless it's a rock we can't move or it's a disallowed cheat.
        valid_move = true;
        // CHEAT CHECK.
        if (pattern[player_pos.y + inY][player_pos.x + inX] === this.WALL_2) {
          if (gameState.game_mode === gmAdventureGame && gameState.levelHintDone && this.number_completed === 1) {
            this.addToScore(1000);
            gameState.force_game_over = true;
            return null;
          } else {
            valid_move = false;
          }
        }
        // See if the move will bump into a rock.
        for (let i = 0; i < num_rocks; i++) {
          if (player_pos.y + inY === rocks[i].y && player_pos.x + inX === rocks[i].x) {
            // Disallow move if a wall is on the far side of the rock.
            const beyond = pattern[player_pos.y + (inY * 2)][player_pos.x + (inX * 2)];
            if (beyond === this.WALL || beyond === this.WALL_2) {
              valid_move = false;
            } else {
              // Scan all the rocks and see if any are on the far side of this rock.  Disallow move if so.
              for (let j = 0; j < num_rocks; j++) {
                if (player_pos.y + (inY * 2) === rocks[j].y && player_pos.x + (inX * 2) === rocks[j].x) {
                  valid_move = false;
                }
              }
              if (valid_move) {
                sndObj.playSound(this.sfxPush);
                // Move the rock too.
                rocks[i].x = rocks[i].x + inX;
                rocks[i].y = rocks[i].y + inY;
              }
            }
          }
        }
      }
    }

    return valid_move;

  } /* End movePlayer(). */


  /**
   * A key was released.  Whatever key it was, the player stops facing the way he was going.  COMMAND brings up the
   * "Continue Game / Quit Game" popup, and ACTION puts the cave back as it was when he came into it.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    gameState.player_dir_north = false;
    gameState.player_dir_south = false;
    gameState.player_dir_west = false;
    gameState.player_dir_east = false;

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
      return;
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
      this.resetLevel(this.curlev);
      return;
    }

  } /* End ku(). */


  /**
   * Initialize.  Chooses the first cave at random and puts the player and the rocks at their starting places.
   *
   * (The original also filled in the tables of starting places here, one number at a time.  They are fields of
   * this class instead, with the cave maps.)
   */
  initializeTheEscape() {

    this.curlev = (rand() % 6) + 1;
    // NOTE: this is not in the original, which took whichever of the six caves came up.  Cave 4 cannot be escaped
    // (see the NOTE on level_patterns), so at Frank's request it is never chosen: if it comes up, another is.
    while (this.curlev === 4) {
      this.curlev = (rand() % 6) + 1;
    }

    this.resetLevel(this.curlev);
    this.number_completed = 0;

  } /* End initializeTheEscape(). */


  /**
   * Makes the lists that say where the rocks are now: six lists, one for each cave, of five points each (no cave
   * has more than five rocks).
   *
   * @return {Array} The lists.
   */
  newRockLists() {

    const lists = [ ];
    for (let level = 0; level < 6; level++) {
      const list = [ ];
      for (let i = 0; i < 5; i++) {
        list.push({ x: 0, y: 0 });
      }
      lists.push(list);
    }
    return lists;

  } /* End newRockLists(). */


  /**
   * Puts a cave back as it is at the start: the player and every rock in their starting places.
   *
   * @param {number} inLevelNumber Which cave: 1 to 6.
   */
  resetLevel(inLevelNumber) {

    // Initial player position.
    gameState.player_pos.x = this.levels_player_start_pos[inLevelNumber - 1].x;
    gameState.player_pos.y = this.levels_player_start_pos[inLevelNumber - 1].y;

    // Reset current rock positions.
    for (let i = 0; i < this.levels_num_rocks[inLevelNumber - 1]; i++) {
      this.levels_rocks_current_pos[inLevelNumber - 1][i].x = this.levels_rocks_start_pos[inLevelNumber - 1][i].x;
      this.levels_rocks_current_pos[inLevelNumber - 1][i].y = this.levels_rocks_start_pos[inLevelNumber - 1][i].y;
    }

  } /* End resetLevel(). */


} /* End class. */
