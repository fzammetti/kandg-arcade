/**
 * The mini-game "DeathTrap".  The player stands at the near corner of a room whose floor is covered in tiles, and
 * must hop from tile to tile to the escape hatch on the far side.  Only some of the tiles are safe: the rest are
 * electrified, and landing on one of those fries the player and sends them back to the start.  There is nothing
 * to show which are which, so the safe route has to be found by trial and (painful) error.  Getting out scores
 * 1,000 points, and then it all starts again with a different route.
 *
 * This is one of the five "special" mini-games, the ones on the fifth console of each level of the ship, which
 * have a short cut that only works in an Adventure game once the level's captive has given the player the secret
 * hint.  Here the short cut is to hop back and forth between the starting tile and the one to its right, ten hops
 * in all, which wins at once.
 *
 * This is the port of mini_games/deathtrap.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class DeathTrapScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csDeathTrap;
  game_name = `"DeathTrap"`;
  target_score = 1000;
  target_score_text = `1,000`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `DeathTrap`,
    ``,
    `You find yourself in a`,
    `room with tiles all over`,
    `the floor.  Unfortunately`,
    `for you, only a single`,
    `path of safe tiles exists,`,
    `all the rest are`,
    `electrified and will toast`,
    `you on contact.  Ouch!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `You must find the safe`,
    `route through the room`,
    `to reach the escape`,
    `hatch on the far side.`,
    `Accomplish this at least`,
    `once before time runs`,
    `out.`,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right to hop from tile to`,
    `tile.`,
    ``,
    ``,
    ``,
    ``,
    ``
  ];

  // Which ways the player can hop from a tile (the values in move_matrix below).  The letters are the compass
  // directions that are open: NES, for example, is a tile that can be left to the north, the east or the south,
  // but not the west.  NONE is a place where there is no tile at all.
  NONE = 0;
  NE = 1;
  NW = 2;
  ES = 3;
  SW = 4;
  NES = 5;
  NSW = 6;
  ESW = 7;
  NEW = 8;
  NESW = 9;

  // What the player is doing (the values of player_state below): hopping about, being fried, or flying out of
  // the escape hatch.
  PSALIVE = 10;
  PSDEAD = 11;
  PSWON = 12;

  // The pictures.
  background = `gfx_deathtrap_background`;
  player_standing = `gfx_deathtrap_player_standing`;
  player_jumping = `gfx_deathtrap_player_jumping`;

  // The two frames of the player being fried.
  player_dieing = [ `gfx_deathtrap_player_dieing_00`, `gfx_deathtrap_player_dieing_01` ];

  // The sounds.
  sfxZap = `sfx_zap`;
  sfxWin = `sfx_win_2`;
  sfxJump = `sfx_jump`;

  // Where the player was when the present hop began.
  player_prev_pos = { x: 0, y: 0 };

  // True when a new safe route is to be chosen the next time the player is put back at the start.  It is set when
  // a game begins (see loadMiniGame()) and each time the player escapes; being fried does not set it, so the route
  // stays the same until the player gets out.
  regen_path = true;

  // What the player is doing: one of PSALIVE, PSDEAD or PSWON.
  player_state = 0;

  // Counts frames during a hop up or down the screen, so that the player moves sideways on every second one.
  vert_move_count = 0;

  // Which tile the player is on (or is hopping to): its column and its row in the two tables below.
  player_tile_x = 0;
  player_tile_y = 0;

  // Which of the safe routes is in use: an index into death_matrix.
  correct_path = -1;

  // Counts the frames of the player being fried, and of the player flying out of the hatch.
  dead_counter = 0;
  win_counter = 0;

  // How many hops in a row have been made between the starting tile and the one to its right, for the short cut.
  //
  // NOTE: the original never put this back to 0 when a game began, so neither do we (see loadMiniGame()).
  cheat_count = 0;

  // The floor.  The room is drawn at an angle, so its tiles lie in slanting rows: this table has one line for each
  // row of tiles, from the far side of the room (the first line) to the near side (the last), and says for each
  // tile which ways the player can hop from it.  The player starts on the second tile of the last line, and the
  // escape hatch is reached by hopping north from the fifth tile of the first line.
  move_matrix = [
    [ this.ES,    this.ESW,   this.ESW,   this.ESW,   this.NSW,   this.NONE,  this.NONE,  this.NONE,  this.NONE ],
    [ this.NES,   this.NESW,  this.NESW,  this.NESW,  this.NSW,   this.NONE,  this.NONE,  this.NONE,  this.NONE ],
    [ this.NES,   this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.SW,    this.NONE,  this.NONE,  this.NONE ],
    [ this.NES,   this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NSW,   this.NONE,  this.NONE,  this.NONE ],
    [ this.NES,   this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.SW,    this.NONE,  this.NONE ],
    [ this.NES,   this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NSW,   this.NONE,  this.NONE ],
    [ this.NE,    this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NSW,   this.NONE,  this.NONE ],
    [ this.NONE,  this.NES,   this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.NESW,  this.SW,    this.NONE ],
    [ this.NONE,  this.NE,    this.NEW,   this.NEW,   this.NEW,   this.NEW,   this.NEW,   this.NW,    this.NONE ]
  ];

  // The safe routes.  Each is a table the same shape as the one above, in which 1 is an OK tile and 0 is a death
  // tile.  There are ten of them, but the original only ever picks from the first nine.
  death_matrix = [
    // Route 0.
    [
      [ 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 1, 1, 0, 0, 0, 1, 0, 0, 0 ],
      [ 1, 1, 0, 0, 0, 1, 0, 0, 0 ],
      [ 1, 1, 0, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 0, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 0, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 0, 0, 0, 0, 0 ]
    ],
    // Route 1.
    [
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 1, 0, 0, 0, 1, 1, 0, 0, 0 ],
      [ 1, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 1, 1, 1, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 1, 0, 0, 0, 0, 0, 0 ]
    ],
    // Route 2.
    [
      [ 1, 1, 1, 0, 1, 0, 0, 0, 0 ],
      [ 1, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 0, 0, 0 ],
      [ 1, 1, 1, 1, 0, 1, 0, 0, 0 ],
      [ 1, 0, 0, 1, 0, 1, 0, 0, 0 ],
      [ 1, 1, 0, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 1, 1, 0, 1, 1, 1, 0, 0 ]
    ],
    // Route 3.
    [
      [ 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 1, 1, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 1, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 0, 0 ]
    ],
    // Route 4.
    [
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 1, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 1, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 0, 0, 0, 0 ]
    ],
    // Route 5.
    [
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 1, 1, 1, 0, 1, 0, 0, 0, 0 ],
      [ 1, 0, 1, 0, 1, 0, 0, 0, 0 ],
      [ 1, 0, 1, 0, 1, 0, 0, 0, 0 ],
      [ 1, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 1, 1, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 0, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 0, 0 ]
    ],
    // Route 6.
    [
      [ 0, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 1, 0, 1, 1, 0, 0, 0, 0 ],
      [ 0, 1, 0, 1, 0, 0, 0, 0, 0 ],
      [ 1, 1, 0, 1, 1, 1, 1, 0, 0 ],
      [ 1, 1, 0, 0, 0, 0, 1, 0, 0 ],
      [ 0, 1, 0, 0, 0, 0, 1, 1, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 1, 0 ]
    ],
    // Route 7.
    [
      [ 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 0, 0, 1, 1, 0, 0, 0, 0 ],
      [ 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 1, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 1, 0, 0, 1, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 0, 0, 0 ]
    ],
    // Route 8.
    [
      [ 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 1, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 1, 0, 1, 0, 1, 0, 0, 0, 0 ],
      [ 1, 0, 1, 0, 1, 1, 0, 0, 0 ],
      [ 1, 1, 1, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 0, 0 ],
      [ 0, 0, 0, 0, 1, 0, 1, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 0, 0 ]
    ],
    // Route 9 (never used).
    [
      [ 0, 0, 0, 0, 1, 0, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 1, 0, 1, 0, 0, 0, 0, 0 ],
      [ 1, 1, 0, 1, 0, 1, 0, 0, 0 ],
      [ 1, 0, 0, 1, 0, 1, 0, 0, 0 ],
      [ 1, 1, 0, 1, 0, 1, 0, 0, 0 ],
      [ 0, 1, 0, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 0, 0, 1, 1, 1, 0 ]
    ]
  ];


  /**
   * Constructor.
   */
  constructor() {

    console.log(`DeathTrapScene.constructor`);

    super(`DeathTrapScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   *
   * NOTE: cheat_count is deliberately NOT touched here.  The original set it to 0 once, when the program started,
   * and never again outside of play, so hops made towards the short cut at the end of one game still count at the
   * start of the next.
   */
  loadMiniGame() {

    console.log(`DeathTrapScene.loadMiniGame()`);

    this.player_prev_pos = { x: 0, y: 0 };

    // NOTE: the original did not do this.  It asked for a new safe route only once, when the program started, and
    // after that only when the player escaped, so a game of DeathTrap began with whatever route the last one had
    // ended on, and a player who had run out of time met the same route again.  Every game now begins with a
    // route chosen afresh, at Frank's request.
    this.regen_path = true;

    this.initializeDeathTrap();

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

    // Blit background.
    inBackbuffer.BltFast(xadj + 0, yadj + 0, this.background, null);

    switch (this.player_state) {

      // Player is dieing.  The two pictures alternate for 31 frames, with a second zap half way through, and then
      // the player is put back at the start.
      case this.PSDEAD: {
        if (this.dead_counter % 2 === 0) {
          inBackbuffer.BltFast(
            xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player_dieing[0], null
          );
        } else {
          inBackbuffer.BltFast(
            xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player_dieing[1], null
          );
        }
        this.dead_counter++;
        if (this.dead_counter === 15) {
          sndObj.playSound(this.sfxZap);
        }
        if (this.dead_counter > 30) {
          this.initializeDeathTrap();
        }
      break; }

      // Player won.  The player floats up and away to the right, shrinking to nothing as they go, and then the
      // points are given and a new route is chosen.
      case this.PSWON: {
        const destRect = CRect(
          xadj + gameState.player_pos.x, yadj + gameState.player_pos.y,
          xadj + gameState.player_pos.x + 22, yadj + gameState.player_pos.y + 41
        );
        inBackbuffer.Blt(
          destRect, this.player_jumping, null,
          { dwRotationScale: 100 - (this.win_counter * 2), nRotationAngle: 0 }
        );
        this.win_counter = this.win_counter + 2;
        gameState.player_pos.y = gameState.player_pos.y - 1;
        this.vert_move_count++;
        if (this.vert_move_count > 1) {
          this.vert_move_count = 0;
          gameState.player_pos.x = gameState.player_pos.x + 1;
        }
        if (this.win_counter > 50) {
          this.addToScore(1000);
          this.regen_path = true;
          this.initializeDeathTrap();
        }
      break; }

      // Player is alive.
      case this.PSALIVE: {

        // Blit player: in mid-hop, or standing.
        if (gameState.player_dir_north || gameState.player_dir_east || gameState.player_dir_south ||
          gameState.player_dir_west
        ) {
          inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player_jumping, null);
        } else {
          inBackbuffer.BltFast(
            xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player_standing, null
          );
        }

        // Handle player movement.
        // Horizontal movement: x +- 26.
        // Vertical movement:   x +- 10 && y +- 16.

        // North.
        if (gameState.player_dir_north) {
          if (gameState.player_pos.y <= (this.player_prev_pos.y - 16)) {
            // If movement is done, finish up: put the player exactly on the tile, and see what kind of tile it is.
            this.cheat_count = 0;
            this.vert_move_count = 0;
            gameState.player_pos.x = this.player_prev_pos.x + 10;
            gameState.player_pos.y = this.player_prev_pos.y - 16;
            gameState.player_dir_north = false;
            if (this.isDeathTile()) {
              this.player_state = this.PSDEAD;
              sndObj.playSound(this.sfxZap);
            } else {
              sndObj.playSound(this.sfxJump);
            }
          } else {
            // Otherwise, move the player.
            gameState.player_pos.y = gameState.player_pos.y - 3;
            this.vert_move_count++;
            if (this.vert_move_count > 1) {
              this.vert_move_count = 0;
              gameState.player_pos.x = gameState.player_pos.x + 3;
            }
          }
        }

        // East.
        if (gameState.player_dir_east) {
          if (gameState.player_pos.x >= (this.player_prev_pos.x + 26)) {
            // If movement is done, finish up.
            gameState.player_pos.x = this.player_prev_pos.x + 26;
            gameState.player_dir_east = false;
            if (this.isDeathTile()) {
              this.player_state = this.PSDEAD;
              sndObj.playSound(this.sfxZap);
            } else {
              sndObj.playSound(this.sfxJump);
            }
            // The short cut: a hop to the right from the starting tile counts towards it.
            if (this.player_prev_pos.x === 10 && this.player_prev_pos.y === 152) {
              this.cheat_count++;
            } else {
              this.cheat_count = 0;
            }
          } else {
            // Otherwise, move the player.
            gameState.player_pos.x = gameState.player_pos.x + 3;
          }
        }

        // West.
        if (gameState.player_dir_west) {
          if (gameState.player_pos.x <= (this.player_prev_pos.x - 26)) {
            // If movement is done, finish up.
            gameState.player_pos.x = this.player_prev_pos.x - 26;
            gameState.player_dir_west = false;
            if (this.isDeathTile()) {
              this.player_state = this.PSDEAD;
              sndObj.playSound(this.sfxZap);
            } else {
              sndObj.playSound(this.sfxJump);
            }
            // The short cut: a hop back to the starting tile counts towards it too, but only in an Adventure game
            // in which the captive has given the hint.  The tenth hop in a row wins the game on the spot.
            if (gameState.game_mode === gmAdventureGame && gameState.levelHintDone &&
              this.player_prev_pos.x === 36 && this.player_prev_pos.y === 152
            ) {
              this.cheat_count++;
              if (this.cheat_count >= 10) {
                this.addToScore(1000);
                gameState.force_game_over = true;
              }
            } else {
              this.cheat_count = 0;
            }
          } else {
            // Otherwise, move the player.
            gameState.player_pos.x = gameState.player_pos.x - 3;
          }
        }

        // South.
        if (gameState.player_dir_south) {
          if (gameState.player_pos.y >= (this.player_prev_pos.y + 16)) {
            // If movement is done, finish up.
            this.cheat_count = 0;
            this.vert_move_count = 0;
            gameState.player_pos.x = this.player_prev_pos.x - 10;
            gameState.player_pos.y = this.player_prev_pos.y + 16;
            gameState.player_dir_south = false;
            if (this.isDeathTile()) {
              this.player_state = this.PSDEAD;
              sndObj.playSound(this.sfxZap);
            } else {
              sndObj.playSound(this.sfxJump);
            }
          } else {
            // Otherwise, move the player.
            gameState.player_pos.y = gameState.player_pos.y + 3;
            this.vert_move_count++;
            if (this.vert_move_count > 1) {
              this.vert_move_count = 0;
              gameState.player_pos.x = gameState.player_pos.x - 3;
            }
          }
        }

      break; }

    } /* End switch. */

  } /* End pnfMiniGame(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.  UP, DOWN, LEFT and RIGHT each
   * start a hop to the next tile that way, if the player is standing still and the tile they are on can be left in
   * that direction.  (Nothing happens when a key is pressed in this game, only when it is let go.)
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

    if (!gameState.player_dir_north && !gameState.player_dir_east && !gameState.player_dir_south &&
      !gameState.player_dir_west && this.player_state === this.PSALIVE
    ) {

      // Which ways can the tile the player is on be left?
      const exits = this.move_matrix[this.player_tile_y][this.player_tile_x];

      // Handle up movement events.
      if (inKey === gameState.kUp) {
        if (exits === this.NE || exits === this.NW || exits === this.NES || exits === this.NSW ||
          exits === this.NEW || exits === this.NESW
        ) {
          this.cheat_count = 0;
          if (this.player_tile_y === 0 && this.player_tile_x === 4) {
            // North from this tile is the escape hatch.
            this.player_state = this.PSWON;
            sndObj.playSound(this.sfxWin);
            this.vert_move_count = 0;
          } else {
            this.player_tile_y--;
            this.player_prev_pos = { x: gameState.player_pos.x, y: gameState.player_pos.y };
            gameState.player_dir_north = true;
            gameState.player_dir_east = false;
            gameState.player_dir_south = false;
            gameState.player_dir_west = false;
          }
        }
      }

      // Handle right movement events.
      if (inKey === gameState.kRight) {
        if (exits === this.NE || exits === this.ES || exits === this.NES || exits === this.ESW ||
          exits === this.NEW || exits === this.NESW
        ) {
          this.player_tile_x++;
          this.player_prev_pos = { x: gameState.player_pos.x, y: gameState.player_pos.y };
          gameState.player_dir_north = false;
          gameState.player_dir_east = true;
          gameState.player_dir_south = false;
          gameState.player_dir_west = false;
        }
      }

      // Handle down movement events.
      if (inKey === gameState.kDown) {
        if (exits === this.ES || exits === this.SW || exits === this.NES || exits === this.NSW ||
          exits === this.ESW || exits === this.NESW
        ) {
          this.cheat_count = 0;
          this.player_tile_y++;
          this.player_prev_pos = { x: gameState.player_pos.x, y: gameState.player_pos.y };
          gameState.player_dir_north = false;
          gameState.player_dir_east = false;
          gameState.player_dir_south = true;
          gameState.player_dir_west = false;
        }
      }

      // Handle left movement events.
      if (inKey === gameState.kLeft) {
        if (exits === this.NW || exits === this.SW || exits === this.NSW || exits === this.ESW ||
          exits === this.NEW || exits === this.NESW
        ) {
          this.player_tile_x--;
          this.player_prev_pos = { x: gameState.player_pos.x, y: gameState.player_pos.y };
          gameState.player_dir_north = false;
          gameState.player_dir_east = false;
          gameState.player_dir_south = false;
          gameState.player_dir_west = true;
        }
      }

    }

  } /* End ku(). */


  /**
   * Initialize.  Puts the player back on the starting tile, alive.  This is called when the game is loaded, each
   * time the player has been fried, and each time the player has escaped.  A new safe route is chosen only if one
   * has been asked for (see regen_path).
   *
   * (The original followed its random pick with a check that the number was in range, going back to pick again if
   * it was not.  The check could never fail, so it is left out here.)
   */
  initializeDeathTrap() {

    // Initialize player.
    gameState.player_pos.x = 10;
    gameState.player_pos.y = 152;
    this.vert_move_count = 0;
    this.player_state = this.PSALIVE;
    this.player_tile_x = 1;
    this.player_tile_y = 8;

    // Choose correct path.
    if (this.regen_path) {
      this.correct_path = rand() % 9;
      this.regen_path = false;
    }

    // Counters used to do dieing and winner.
    this.dead_counter = 0;
    this.win_counter = 0;

  } /* End initializeDeathTrap(). */


  /**
   * This function checks the current tile to see if it's a death tile.
   *
   * @return {boolean} True if it is a death tile, false otherwise.
   */
  isDeathTile() {

    return this.death_matrix[this.correct_path][this.player_tile_y][this.player_tile_x] === 0;

  } /* End isDeathTile(). */


} /* End class. */
