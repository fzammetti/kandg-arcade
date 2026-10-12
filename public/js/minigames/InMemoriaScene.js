/**
 * The mini-game "In Memoria".  Twenty-five face-down tiles, five rows of five, hide pairs of pictures.  The player
 * moves a selection box from tile to tile and presses ACTION to turn a tile over, then another: if the two
 * pictures match the tiles blow up and are gone, scoring 25 points, and if not they are turned back after a
 * moment.  When twelve pairs have been matched a fresh set of tiles is dealt.
 *
 * This is the port of mini_games/in_memoria.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class InMemoriaScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csInMemoria;
  game_name = `"In Memoria"`;
  target_score = 250;
  target_score_text = `250`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: two lines differ from the original, which read "Time to see if your a" on page 1 and "Match as many
  // tiles in" (followed by "before time runs out") on page 2.  They now say "you're" and leave out the stray "in",
  // at Frank's request.  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `In Memoria`,
    ``,
    `Some alien races view`,
    `memory as the ultimate`,
    `measure of intelligence.`,
    `Time to see if you're a`,
    `pangalactic super genius`,
    `or an Aldevrian Marsh`,
    `Rat's leftover dinner`,
    `from three nights ago.`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Match as many tiles`,
    `before time runs out`,
    `as you can.`,
    ``,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right and press ACTION`,
    `to flip over a tile.`,
    `Flip another to see if`,
    `they match.`,
    ``,
    ``,
    ``
  ];

  // The three things a tile can be (the values in tile_states below): face down, face up, or matched and gone.
  TILE_UNFLIPPED = 0;
  TILE_FLIPPED = 1;
  TILE_MATCHED = 2;

  // The picture that is used for unflipped tiles.
  unflipped_tile_picture = `gfx_in_memoria_unflipped_tile_picture`;

  // The five frames of the explosion's animation.
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // All the possible pictures for underneath tiles.  There are twelve.
  tile_source_pictures = [
    `gfx_in_memoria_tile_picture_00`, `gfx_in_memoria_tile_picture_01`, `gfx_in_memoria_tile_picture_02`,
    `gfx_in_memoria_tile_picture_03`, `gfx_in_memoria_tile_picture_04`, `gfx_in_memoria_tile_picture_05`,
    `gfx_in_memoria_tile_picture_06`, `gfx_in_memoria_tile_picture_07`, `gfx_in_memoria_tile_picture_08`,
    `gfx_in_memoria_tile_picture_09`, `gfx_in_memoria_tile_picture_10`, `gfx_in_memoria_tile_picture_11`
  ];

  // The sounds.
  sfxFlip = `sfx_misc_3`;
  sfxUnflip = `sfx_unflip`;
  sfxNoMatch = `sfx_no_match`;
  sfxExplosion = `sfx_explosion`;

  // Flag to tell whether we're currently unflipping a pair of tiles (they did not match, and are being left on
  // show for a moment before they are turned back).
  unflipping = false;

  // Flag to tell us whether we are currently exploding matched tiles.
  explosion_running = false;

  // Stores the number of tiles currently flipped.
  tiles_flipped = 0;

  // Used to delay before unflipping a pair of tiles.
  unflipping_counter = 0;

  // X and Y index of the first tile of the pair that has been turned over, and of the second.  (The original's
  // names say "unflipped", but these are the tiles that are face up.)
  unflipped_tile_1_x = 0;
  unflipped_tile_1_y = 0;
  unflipped_tile_2_x = 0;
  unflipped_tile_2_y = 0;

  // Number of pairs matched so far.
  number_matched = 0;

  // X and Y index of the tile the select box is currently around.
  box_around_x = 0;
  box_around_y = 0;

  // Which frame of the explosion is showing, and a counter used to time its frames.
  explosion_frame = 0;
  explosion_frame_delay = 0;

  // The current state of each tile: a list of five rows of five, each one of the TILE values above.
  tile_states = [ ];

  // What picture is under each tile: the same shape, each a number from 0 to 11 (an index into
  // tile_source_pictures).
  tile_pictures = [ ];

  // The selection box pulses: this is which way its brightness is going (0 for up, 1 for down) and how solid it is
  // at the moment (out of 255).
  op_dir = 0;
  op = 240;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`InMemoriaScene.constructor`);

    super(`InMemoriaScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`InMemoriaScene.loadMiniGame()`);

    // Make the two tables: five rows of five.
    this.tile_states = [ ];
    this.tile_pictures = [ ];
    for (let y = 0; y < 5; y++) {
      this.tile_states.push([ 0, 0, 0, 0, 0 ]);
      this.tile_pictures.push([ 0, 0, 0, 0, 0 ]);
    }

    this.initializeInMemoria();
    this.setTileStatesUnflipped();
    this.randomizeTiles();
    this.explosion_frame = 0;
    this.explosion_frame_delay = 0;

    // NOTE: the original did not do this.  It cleared the flag only when an explosion finished, so if a game ended
    // in the fifth of a second that a matched pair was blowing up, the next game of In Memoria began with an
    // explosion still "running": it played out on the top-left tile, and that tile was then gone, unmatched and
    // unscored, leaving its partner with nothing to match.  Every game now begins with no explosion, at Frank's
    // request.
    this.explosion_running = false;

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

    let loc_x = 0;
    let loc_y = 0;

    // Draw the tiles in the correct current state.  (A matched tile is not drawn at all, which leaves a black
    // gap where it was.)
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        // Calculate the proper X/Y coordinates for each tile: they are 36 pixels square with 3 between them.
        loc_x = ((x * 36) + (x * 3)) + 4;
        loc_y = ((y * 36) + (y * 3)) + 4;
        // Draw the tile depending on its state.
        switch (this.tile_states[y][x]) {
          case this.TILE_FLIPPED: {
            inBackbuffer.BltFast(
              xadj + loc_x, yadj + loc_y, this.tile_source_pictures[this.tile_pictures[y][x]], null
            );
          break; }
          case this.TILE_UNFLIPPED: {
            inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.unflipped_tile_picture, null);
          break; }
        }
      }
    }

    // Draw the selection box around the correct tile.  It is yellow, one pixel bigger than the tile all round, and
    // it pulses: brighter by 10 a frame up to 250, then dimmer by 10 a frame down to 150, and so on.
    loc_x = ((this.box_around_x * 36) + (this.box_around_x * 3)) + 3;
    loc_y = ((this.box_around_y * 36) + (this.box_around_y * 3)) + 3;
    const rect = CRect(xadj + loc_x, yadj + loc_y, xadj + loc_x + 38, yadj + loc_y + 38);
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

    // Handle player movements.  The box moves one tile on the frame after the key is pressed (kd() sets the delay
    // high to make that happen) and then, if the key is held, one more every seventh frame.  It comes round to the
    // other side when it goes off an edge.
    if (gameState.player_dir_north) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_y--;
        if (this.box_around_y < 0) {
          this.box_around_y = 4;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_south) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_y++;
        if (this.box_around_y > 4) {
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
          this.box_around_x = 4;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }
    if (gameState.player_dir_east) {
      if (gameState.player_dir_delay > 5) {
        gameState.player_dir_delay = 0;
        this.box_around_x++;
        if (this.box_around_x > 4) {
          this.box_around_x = 0;
        }
      } else {
        gameState.player_dir_delay++;
      }
    }

    // If we're currently unflipping a pair of tiles (i.e., they didn't match), we need to do that.  We'll just
    // keep incrementing our counter until we hit the desired amount, then flip the tiles back over.
    if (this.unflipping) {
      this.unflipping_counter++;
      if (this.unflipping_counter > 15) {
        sndObj.playSound(this.sfxNoMatch);
        this.unflipping = false;
        this.unflipping_counter = 0;
        this.tiles_flipped = 0;
        this.tile_states[this.unflipped_tile_1_y][this.unflipped_tile_1_x] = this.TILE_UNFLIPPED;
        this.tile_states[this.unflipped_tile_2_y][this.unflipped_tile_2_x] = this.TILE_UNFLIPPED;
      }
    }

    // If we're currently exploding a pair of matched tiles, we need to do that: an explosion over each of the two,
    // for five frames, after which the two tiles are marked as matched (again: they were already).
    if (this.explosion_running) {
      loc_x = ((this.unflipped_tile_1_x * 36) + (this.unflipped_tile_1_x * 3)) + 3;
      loc_y = ((this.unflipped_tile_1_y * 36) + (this.unflipped_tile_1_y * 3)) + 3;
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.explosion[this.explosion_frame], null);
      loc_x = ((this.unflipped_tile_2_x * 36) + (this.unflipped_tile_2_x * 3)) + 3;
      loc_y = ((this.unflipped_tile_2_y * 36) + (this.unflipped_tile_2_y * 3)) + 3;
      inBackbuffer.BltFast(xadj + loc_x, yadj + loc_y, this.explosion[this.explosion_frame], null);
      let ret_val = 0;
      this.explosion_frame_delay++;
      if (this.explosion_frame_delay > 0) {
        this.explosion_frame_delay = 0;
        this.explosion_frame++;
        if (this.explosion_frame > 4) {
          this.explosion_frame = 0;
          ret_val = -1;
        } else {
          ret_val = this.explosion_frame;
        }
      }
      if (this.explosion_frame === 2) {
        ret_val = 99;
      }
      if (ret_val === -1) {
        this.explosion_running = false;
        this.tiles_flipped = 0;
        this.tile_states[this.unflipped_tile_1_y][this.unflipped_tile_1_x] = this.TILE_MATCHED;
        this.tile_states[this.unflipped_tile_2_y][this.unflipped_tile_2_x] = this.TILE_MATCHED;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT start the selection box moving.  Nothing works while a pair of
   * tiles is being turned back or blown up.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (!this.unflipping && !this.explosion_running) {

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

    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.  Letting go of a direction stops
   * the selection box.  Letting go of ACTION is what turns a tile over (or back), and when it is the second tile
   * of a pair, this is where the two are compared.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

    // Only process events if we're not unflipping tiles and not exploding tiles.
    if (!this.unflipping && !this.explosion_running) {

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

        switch (this.tile_states[this.box_around_y][this.box_around_x]) {

          // Tile is currently flipped, so unflip it.
          case this.TILE_FLIPPED: {
            sndObj.playSound(this.sfxUnflip);
            this.tile_states[this.box_around_y][this.box_around_x] = this.TILE_UNFLIPPED;
            this.tiles_flipped--;
          break; }

          // Tile is currently unflipped, so flip it.
          case this.TILE_UNFLIPPED: {

            sndObj.playSound(this.sfxFlip);
            this.tile_states[this.box_around_y][this.box_around_x] = this.TILE_FLIPPED;
            this.tiles_flipped++;

            // If it's the first tile that's flipped, store it in the first set of vars.
            if (this.tiles_flipped === 1) {
              this.unflipped_tile_1_x = this.box_around_x;
              this.unflipped_tile_1_y = this.box_around_y;
            }

            // If it's the second tile that's flipped, store it in the second set of vars.
            if (this.tiles_flipped === 2) {
              this.unflipped_tile_2_x = this.box_around_x;
              this.unflipped_tile_2_y = this.box_around_y;
            }

            // If two tiles are now flipped, check to see if they match.  If they don't, set our unflipping flag
            // so they will be unflipped after a brief delay.
            if (this.tiles_flipped === 2) {

              if (this.tile_pictures[this.unflipped_tile_1_y][this.unflipped_tile_1_x] ===
                this.tile_pictures[this.unflipped_tile_2_y][this.unflipped_tile_2_x]
              ) {

                // Match.
                this.tile_states[this.unflipped_tile_1_y][this.unflipped_tile_1_x] = this.TILE_MATCHED;
                this.tile_states[this.unflipped_tile_2_y][this.unflipped_tile_2_x] = this.TILE_MATCHED;

                sndObj.playSound(this.sfxExplosion);

                this.number_matched++;
                this.addToScore(25);

                if (this.number_matched > 11) {
                  // If the game is over (twelve pairs matched), restart it with a fresh set of tiles.
                  this.initializeInMemoria();
                  this.setTileStatesUnflipped();
                  this.randomizeTiles();
                } else {
                  // Otherwise, set our flag to blow up the tiles and reset movements.
                  this.explosion_running = true;
                  gameState.player_dir_north = false;
                  gameState.player_dir_south = false;
                  gameState.player_dir_east = false;
                  gameState.player_dir_west = false;
                }

              } else {

                // No match.  Unflip our tiles (after a pause) and reset movements.
                this.unflipping = true;
                this.unflipping_counter = 0;
                gameState.player_dir_north = false;
                gameState.player_dir_south = false;
                gameState.player_dir_east = false;
                gameState.player_dir_west = false;

              }

            }

          break; }

        } /* End switch. */

      }

    }

  } /* End ku(). */


  /**
   * Initialize.  Puts the counters and the selection box back to the start.  (It does not deal the tiles: the
   * two methods below do that, and whoever calls this calls them too.)
   */
  initializeInMemoria() {

    this.tiles_flipped = 0;
    this.unflipping = false;
    this.unflipping_counter = 0;
    this.unflipped_tile_1_x = 0;
    this.unflipped_tile_1_y = 0;
    this.unflipped_tile_2_x = 0;
    this.unflipped_tile_2_y = 0;
    this.number_matched = 0;
    this.box_around_x = 0;
    this.box_around_y = 0;
    this.op_dir = 0;
    this.op = 240;

  } /* End initializeInMemoria(). */


  /**
   * Set all our tile states to unflipped.
   */
  setTileStatesUnflipped() {

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        this.tile_states[y][x] = this.TILE_UNFLIPPED;
      }
    }

  } /* End setTileStatesUnflipped(). */


  /**
   * Randomly choose which pictures will be under the tiles.
   *
   * Eleven of the twelve pictures are dealt in turn, each to two tiles picked at random from those still empty,
   * and the tiles left over at the end all get the twelfth picture.  There are 25 tiles, so that is three left
   * over, two of which can be matched with each other to make the twelfth pair.  (The third is never matched: a
   * fresh set of tiles is dealt as soon as the twelfth pair has been found.)
   *
   * NOTE: the original did not check that the two tiles it picked for a picture were different tiles.  When they
   * were the same one, that picture went on a single tile, which could then never be matched (and one more tile
   * was left over for the twelfth picture).  One such slip still left twelve pairs to find, but two or more left
   * at most eleven, and as a fresh set of tiles is only dealt after twelve, such a board could never be finished.
   * About one board in five was like that.  The two tiles must now be different ones, at Frank's request, so every
   * board has exactly twelve pairs.
   */
  randomizeTiles() {

    // Set all tiles to -1, which means no image assigned.
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        this.tile_pictures[y][x] = -1;
      }
    }

    // For each source tile, randomly choose two tiles and assign them the next image.  If either of the two is
    // already taken, or the two are one and the same tile, choose again.  (There are always at least five empty
    // tiles, so this cannot go on for ever.)
    for (let i = 0; i < 11; i++) {
      let chosen = false;
      while (!chosen) {
        const x1 = rand() % 5;
        const y1 = rand() % 5;
        const x2 = rand() % 5;
        const y2 = rand() % 5;
        const sameTile = (x1 === x2 && y1 === y2);
        if (this.tile_pictures[y1][x1] === -1 && this.tile_pictures[y2][x2] === -1 && !sameTile) {
          this.tile_pictures[y1][x1] = i;
          this.tile_pictures[y2][x2] = i;
          chosen = true;
        }
      }
    }

    // Find the tiles left with nothing in them and set them to the last image.
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (this.tile_pictures[y][x] === -1) {
          this.tile_pictures[y][x] = 11;
        }
      }
    }

  } /* End randomizeTiles(). */


} /* End class. */
