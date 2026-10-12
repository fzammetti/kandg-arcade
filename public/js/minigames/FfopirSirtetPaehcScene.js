/**
 * The mini-game "Paehc Sirtet Ffopir" (read each word backwards).  Pieces made of four blocks fall, one at a time,
 * down a well 11 blocks wide and 20 high.  The player moves the falling piece left and right, turns it with ACTION
 * and hurries it down with DOWN.  A piece stops when it reaches the floor or comes to rest on the blocks already
 * there.  Every row filled right across is cleared for 25 points, and the rows above drop down.  If a piece comes to
 * rest right at the top, the game is over and 250 points are lost.
 *
 * This is the port of mini_games/ffopir_sirtet_paehc.cpp.  Everything that is the same for every mini-game (the
 * frame, the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class FfopirSirtetPaehcScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csFfopirSirtetPaehc;
  game_name = `"Paehc Sirtet Ffopir"`;
  target_score = 200;
  target_score_text = `200`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: one line of page 1 differs from the original, which read "thing in school, your".  It now says "you're",
  // at Frank's request.  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Ffopir Sirtet Paehc`,
    ``,
    `If Geometry wasn't your`,
    `thing in school, you're`,
    `not going to like this!`,
    `Actually, it doesn't`,
    `matter in the least.`,
    `Decode the title and`,
    `there's not really`,
    `any more to say.`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Form complete lines`,
    `across the screen`,
    `to keep clearing away`,
    `pieces.  Don't go`,
    `past the top!`,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move the falling piece`,
    `left or right and press`,
    `the ACTION button to`,
    `rotate it.  Press down`,
    `to drop it faster.`,
    ``,
    ``,
    ``
  ];

  // The four ways a piece can be turned (the values in shape_rotation below).
  ROTATION_0 = 1;
  ROTATION_90 = 2;
  ROTATION_180 = 3;
  ROTATION_270 = 4;

  // The pictures.
  block = `gfx_ffopir_sirtet_paehc_block`;
  background = `gfx_ffopir_sirtet_paehc_background`;

  // The sounds.
  sfxMove = `sfx_move`;
  sfxRotating = `sfx_ffopir_sirtet_paehc_rotating`;
  sfxLandedClear = `sfx_ffopir_sirtet_paehc_landed_clear`;

  // The seven shapes.  There is a list for each shape, and in it a list for each of the four ways it can be turned,
  // which says where its four blocks are: how many blocks across and how many down from the position of the piece
  // (gameState.player_pos).  This is what getShapePoints() in the original said, with a "switch" statement inside
  // a "switch" statement; it was taken out of the original by a script, not typed.  The little pictures in the
  // comments show each shape ("/" marks the start of the next row of blocks down).
  shape_table = [
    // ----- Shape 1.
    [
      // ROTATION_0:   *  /  *  /  *  /  *
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 } ],
      // ROTATION_90:   ****
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 } ],
      // ROTATION_180:   *  /  *  /  *  /  *
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 } ],
      // ROTATION_270:   ****
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 } ]
    ],
    // ----- Shape 2.
    [
      // ROTATION_0:   *  /  **  /   *
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 } ],
      // ROTATION_90:    **  /  **
      [ { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 } ],
      // ROTATION_180:   *  /  **  /   *
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 } ],
      // ROTATION_270:    **  /  **
      [ { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 } ]
    ],
    // ----- Shape 3.
    [
      // ROTATION_0:   **  /  **
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 } ],
      // ROTATION_90:   **  /  **
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 } ],
      // ROTATION_180:   **  /  **
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 } ],
      // ROTATION_270:   **  /  **
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 } ]
    ],
    // ----- Shape 4.
    [
      // ROTATION_0:    *  /  **  /  *
      [ { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 } ],
      // ROTATION_90:   **  /   **
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 } ],
      // ROTATION_180:    *  /  **  /  *
      [ { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 } ],
      // ROTATION_270:   **  /   **
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 } ]
    ],
    // ----- Shape 5.
    [
      // ROTATION_0:    *  /  ***
      [ { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 } ],
      // ROTATION_90:   *  /  **  /  *
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 } ],
      // ROTATION_180:   ***  /   *
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 } ],
      // ROTATION_270:    *  /  **  /   *
      [ { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 } ]
    ],
    // ----- Shape 6.
    [
      // ROTATION_0:   *  /  *  /  **
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 } ],
      // ROTATION_90:   ***  /  *
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 } ],
      // ROTATION_180:   **  /   *  /   *
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 } ],
      // ROTATION_270:     *  /  ***
      [ { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 } ]
    ],
    // ----- Shape 7.
    [
      // ROTATION_0:    *  /   *  /  **
      [ { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 } ],
      // ROTATION_90:   *  /  ***
      [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 } ],
      // ROTATION_180:   **  /  *  /  *
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 } ],
      // ROTATION_270:   ***  /    *
      [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 } ]
    ]
  ];

  // Where the four blocks of the piece are, as getShapePoints() last worked them out: a list of four points.
  shape_points = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];

  // True while DOWN is held, which makes the piece fall a row every frame.
  quick_down = false;

  // Which way the falling piece is turned (one of the four ROTATION values), and which of the seven shapes it is
  // (1 to 7).
  shape_rotation = 0;
  current_shape = 0;

  // How many frames a piece waits between falling one row and the next (it never changes), and the count of them.
  player_speed = 0;
  player_speed_delay = 0;

  // Counts the frames between one sideways move and the next while LEFT or RIGHT is held.
  //
  // NOTE: the original never put this back to 0 when a game began, so neither do we.  It makes no difference: it
  // is set afresh whenever LEFT or RIGHT is pressed.
  lateral_move_delay = 0;

  // The well: a list for each row, from the top, holding a number for each column: 1 where there is a block, 0
  // where there is not.  Only the first 20 rows and the first 11 columns are the well itself.
  //
  // NOTE: the original's array has 22 rows of 13, and so has room to spare below the floor, and it needs it: see
  // the NOTE on kd().  Rows 20 and 21 are never drawn and never cleared, not even when a new game begins, exactly
  // as in the original.  This one has 23 rows.  The 23rd is not in the original at all: it stands for whatever
  // lay in memory straight after the array, which the original could read and write in one rare case (also
  // explained at kd()).  Here it is simply kept empty, so that the same case does no harm.
  matrix = this.newMatrix();

  // A second well to do the working-out in when rows are cleared.
  matrix_temp = this.newMatrix();


  /**
   * Constructor.
   */
  constructor() {

    console.log(`FfopirSirtetPaehcScene.constructor`);

    super(`FfopirSirtetPaehcScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`FfopirSirtetPaehcScene.loadMiniGame()`);

    this.initializeFfopirSirtetPaehc();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured in blocks (10 pixels) from the top-left corner of the
   * well, which is 45 pixels in from the left of the play area.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    // Background.
    inBackbuffer.BltFast(xadj, yadj, this.background, null);

    // Blit matrix.
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 11; x++) {
        if (this.matrix[y][x] === 1) {
          inBackbuffer.BltFast(xadj + 45 + (x * 10), yadj + (y * 10), this.block, null);
        }
      }
    }

    // Blit current shape.
    const player_pos = gameState.player_pos;
    const shape_points = this.shape_points;
    this.getShapePoints(this.current_shape, this.shape_rotation);
    for (let i = 0; i < 4; i++) {
      inBackbuffer.BltFast(
        xadj + 45 + ((player_pos.x + shape_points[i].x) * 10), yadj + ((player_pos.y + shape_points[i].y) * 10),
        this.block, null
      );
    }

    // If shape hits bottom, work it into the matrix and start a new one.
    if (player_pos.y + shape_points[0].y === 19 ||
      player_pos.y + shape_points[1].y === 19 ||
      player_pos.y + shape_points[2].y === 19 ||
      player_pos.y + shape_points[3].y === 19
    ) {
      this.matrix[player_pos.y + shape_points[0].y][player_pos.x + shape_points[0].x] = 1;
      this.matrix[player_pos.y + shape_points[1].y][player_pos.x + shape_points[1].x] = 1;
      this.matrix[player_pos.y + shape_points[2].y][player_pos.x + shape_points[2].x] = 1;
      this.matrix[player_pos.y + shape_points[3].y][player_pos.x + shape_points[3].x] = 1;
      const num_cleared = this.clearRows();
      if (num_cleared !== 0) {
        this.addToScore(25 * num_cleared);
        sndObj.playSound(this.sfxLandedClear);
      }
      this.newShape();
    }

    // If shape hits top of another shape, work it into the matrix and start a new one.
    //
    // Note that if a new piece has just been started (above), this test is made, and so is everything else in
    // the rest of this frame, with the position of the NEW piece but with the blocks of the OLD one: shape_points
    // is not worked out again until the next frame.  That is how the original has it.
    if (this.matrix[player_pos.y + 1 + shape_points[0].y][player_pos.x + shape_points[0].x] === 1 ||
      this.matrix[player_pos.y + 1 + shape_points[1].y][player_pos.x + shape_points[1].x] === 1 ||
      this.matrix[player_pos.y + 1 + shape_points[2].y][player_pos.x + shape_points[2].x] === 1 ||
      this.matrix[player_pos.y + 1 + shape_points[3].y][player_pos.x + shape_points[3].x] === 1
    ) {
      // If the position of the piece is <= 0, it means we're above the top, so abort the game.
      if (player_pos.y <= 0) {
        this.subtractFromScore(250);
        gameState.force_game_over = true;
        return;
      }
      this.matrix[player_pos.y + shape_points[0].y][player_pos.x + shape_points[0].x] = 1;
      this.matrix[player_pos.y + shape_points[1].y][player_pos.x + shape_points[1].x] = 1;
      this.matrix[player_pos.y + shape_points[2].y][player_pos.x + shape_points[2].x] = 1;
      this.matrix[player_pos.y + shape_points[3].y][player_pos.x + shape_points[3].x] = 1;
      const num_cleared = this.clearRows();
      if (num_cleared !== 0) {
        this.addToScore(25 * num_cleared);
        sndObj.playSound(this.sfxLandedClear);
      }
      this.newShape();
    }

    // Move current shape down: one row every eleventh frame, or one every frame while DOWN is held.
    this.player_speed_delay++;
    if (this.player_speed_delay > this.player_speed || this.quick_down === true) {
      this.player_speed_delay = 0;
      player_pos.y++;
      sndObj.playSound(this.sfxMove);
    }

    // Handle left movement events.  While LEFT is held the piece moves one column every sixth frame (and at once
    // when the key goes down, because that sets the delay to 5).  The sound plays whether it can move or not.
    if (gameState.player_dir_west) {
      this.lateral_move_delay++;
      if (this.lateral_move_delay > 5) {
        sndObj.playSound(this.sfxMove);
        this.lateral_move_delay = 0;
        if (player_pos.x > 0) {
          // Make sure the target area is clear of blocks.
          if (this.matrix[player_pos.y + shape_points[0].y][player_pos.x - 1 + shape_points[0].x] === 0 &&
            this.matrix[player_pos.y + shape_points[1].y][player_pos.x - 1 + shape_points[1].x] === 0 &&
            this.matrix[player_pos.y + shape_points[2].y][player_pos.x - 1 + shape_points[2].x] === 0 &&
            this.matrix[player_pos.y + shape_points[3].y][player_pos.x - 1 + shape_points[3].x] === 0
          ) {
            player_pos.x--;
          }
        }
      }
    }

    // Handle right movement events.
    if (gameState.player_dir_east) {
      this.lateral_move_delay++;
      if (this.lateral_move_delay > 5) {
        sndObj.playSound(this.sfxMove);
        this.lateral_move_delay = 0;
        if (player_pos.x + shape_points[0].x < 10 &&
          player_pos.x + shape_points[1].x < 10 &&
          player_pos.x + shape_points[2].x < 10 &&
          player_pos.x + shape_points[3].x < 10
        ) {
          // Make sure the target area is clear of blocks.
          if (this.matrix[player_pos.y + shape_points[0].y][player_pos.x + 1 + shape_points[0].x] === 0 &&
            this.matrix[player_pos.y + shape_points[1].y][player_pos.x + 1 + shape_points[1].x] === 0 &&
            this.matrix[player_pos.y + shape_points[2].y][player_pos.x + 1 + shape_points[2].x] === 0 &&
            this.matrix[player_pos.y + shape_points[3].y][player_pos.x + 1 + shape_points[3].x] === 0
          ) {
            player_pos.x++;
          }
        }
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  LEFT and RIGHT start the piece moving sideways, DOWN makes it fall fast, and ACTION turns it
   * a quarter of a turn, if there is room for it turned.
   *
   * NOTE: "room" means two things here: none of its blocks would be past the right-hand side of the well, and none
   * would be on top of a block already in the well.  Nothing looks at the floor.  So a piece turned when it is just
   * above the floor can end up with blocks below it (the long piece, lying flat one or two rows up and turned
   * upright, does), and when it lands on the next frame those blocks are written into rows 20 and 21 of the matrix.
   * Those rows are never drawn, so the blocks are not seen (the piece seems to have sunk into the floor); and they
   * are never cleared either, not even when a new game begins, so from then on the same turn in the same column is
   * refused, because there is "a block in the way".  All of this is how the original has it.  One case goes a row
   * further: the long piece lying flat on the very bottom row, turned in the single frame before it is found to
   * have landed, would have a block in row 22, which the original's array does not have.  What the original read
   * and wrote there was whatever followed the array in memory (most likely the first row of matrix_temp, which is
   * always empty when read and is cleared straight after being written).  The matrix here has that extra row,
   * and clearRows() keeps it empty, which comes to the same thing.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
      this.lateral_move_delay = 5;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
      this.lateral_move_delay = 5;
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_south = true;
      this.quick_down = true;
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
      const player_pos = gameState.player_pos;
      const shape_points = this.shape_points;
      // See if the shape will be out of bounds or will collide with existing blocks if we rotate.  If not, do it.
      // (Note that shape_points is left holding the blocks of the piece as it would be if turned, whether it is
      // turned or not.  The next frame works it out again before using it.)
      switch (this.shape_rotation) {
        case this.ROTATION_0: {
          this.getShapePoints(this.current_shape, this.ROTATION_90);
          // Check right boundary.
          if (player_pos.x + shape_points[0].x < 11 &&
            player_pos.x + shape_points[1].x < 11 &&
            player_pos.x + shape_points[2].x < 11 &&
            player_pos.x + shape_points[3].x < 11
          ) {
            // Make sure the target area is clear of blocks.
            if (this.matrix[player_pos.y + shape_points[0].y][player_pos.x + shape_points[0].x] === 0 &&
              this.matrix[player_pos.y + shape_points[1].y][player_pos.x + shape_points[1].x] === 0 &&
              this.matrix[player_pos.y + shape_points[2].y][player_pos.x + shape_points[2].x] === 0 &&
              this.matrix[player_pos.y + shape_points[3].y][player_pos.x + shape_points[3].x] === 0
            ) {
              sndObj.playSound(this.sfxRotating);
              this.shape_rotation = this.ROTATION_90;
            }
          }
        break; }
        case this.ROTATION_90: {
          this.getShapePoints(this.current_shape, this.ROTATION_180);
          // Check right boundary.
          if (player_pos.x + shape_points[0].x < 11 &&
            player_pos.x + shape_points[1].x < 11 &&
            player_pos.x + shape_points[2].x < 11 &&
            player_pos.x + shape_points[3].x < 11
          ) {
            // Make sure the target area is clear of blocks.
            if (this.matrix[player_pos.y + shape_points[0].y][player_pos.x + shape_points[0].x] === 0 &&
              this.matrix[player_pos.y + shape_points[1].y][player_pos.x + shape_points[1].x] === 0 &&
              this.matrix[player_pos.y + shape_points[2].y][player_pos.x + shape_points[2].x] === 0 &&
              this.matrix[player_pos.y + shape_points[3].y][player_pos.x + shape_points[3].x] === 0
            ) {
              sndObj.playSound(this.sfxRotating);
              this.shape_rotation = this.ROTATION_180;
            }
          }
        break; }
        case this.ROTATION_180: {
          this.getShapePoints(this.current_shape, this.ROTATION_270);
          // Check right boundary.
          if (player_pos.x + shape_points[0].x < 11 &&
            player_pos.x + shape_points[1].x < 11 &&
            player_pos.x + shape_points[2].x < 11 &&
            player_pos.x + shape_points[3].x < 11
          ) {
            // Make sure the target area is clear of blocks.
            if (this.matrix[player_pos.y + shape_points[0].y][player_pos.x + shape_points[0].x] === 0 &&
              this.matrix[player_pos.y + shape_points[1].y][player_pos.x + shape_points[1].x] === 0 &&
              this.matrix[player_pos.y + shape_points[2].y][player_pos.x + shape_points[2].x] === 0 &&
              this.matrix[player_pos.y + shape_points[3].y][player_pos.x + shape_points[3].x] === 0
            ) {
              sndObj.playSound(this.sfxRotating);
              this.shape_rotation = this.ROTATION_270;
            }
          }
        break; }
        case this.ROTATION_270: {
          this.getShapePoints(this.current_shape, this.ROTATION_0);
          // Check right boundary.
          if (player_pos.x + shape_points[0].x < 11 &&
            player_pos.x + shape_points[1].x < 11 &&
            player_pos.x + shape_points[2].x < 11 &&
            player_pos.x + shape_points[3].x < 11
          ) {
            // Make sure the target area is clear of blocks.
            if (this.matrix[player_pos.y + shape_points[0].y][player_pos.x + shape_points[0].x] === 0 &&
              this.matrix[player_pos.y + shape_points[1].y][player_pos.x + shape_points[1].x] === 0 &&
              this.matrix[player_pos.y + shape_points[2].y][player_pos.x + shape_points[2].x] === 0 &&
              this.matrix[player_pos.y + shape_points[3].y][player_pos.x + shape_points[3].x] === 0
            ) {
              sndObj.playSound(this.sfxRotating);
              this.shape_rotation = this.ROTATION_0;
            }
          }
        break; }
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of LEFT or RIGHT stops
   * the piece moving sideways, and letting go of DOWN stops it falling fast.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = false;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = false;
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_south = false;
      this.quick_down = false;
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
    }

  } /* End ku(). */


  /**
   * Initialize.  Starts the first piece falling and empties the well (its 20 rows that are seen, that is: see the
   * NOTE on the matrix).
   */
  initializeFfopirSirtetPaehc() {

    this.newShape();
    this.player_speed_delay = 0;
    this.player_speed = 10;
    this.quick_down = false;

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 11; x++) {
        this.matrix[y][x] = 0;
      }
    }

  } /* End initializeFfopirSirtetPaehc(). */


  /**
   * Makes an empty well: 23 rows of 13 zeros.  (See the NOTE on the matrix for why it is that size.)
   *
   * @return {Array} The well.
   */
  newMatrix() {

    const matrix = [ ];
    for (let y = 0; y < 23; y++) {
      matrix.push([ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
    }
    return matrix;

  } /* End newMatrix(). */


  /**
   * Starts a new piece: one of the seven shapes, chosen at random, at the top of the well in the middle, not turned
   * and not falling fast (so DOWN has to be let go and pressed again for each piece).
   */
  newShape() {

    // 1-7.
    this.current_shape = (rand() % 7) + 1;
    gameState.player_pos.x = 5;
    gameState.player_pos.y = 0;
    this.shape_rotation = this.ROTATION_0;
    this.player_speed_delay = 0;
    this.quick_down = false;

  } /* End newShape(). */


  /**
   * Clears every row of the well that is filled right across, dropping the rows above it down.  This is called
   * every time a piece lands, whether it has filled a row or not.
   *
   * Note that the top two rows of the well are never copied across, so anything in them is lost every time this
   * is called.  That is how the original has it.  (It matters little: a piece that comes to rest with blocks up
   * there loses those blocks at once.)
   *
   * @return {number} How many rows were cleared.
   */
  clearRows() {

    let num_cleared = 0;
    let clear_row;

    for (let y = 0; y < 20; y++) {
      clear_row = true;
      // Scan the next row.  If any blank spaces found, don't clear it.
      for (let x = 0; x < 11; x++) {
        if (this.matrix[y][x] === 0) {
          clear_row = false;
        }
      }
      // No blanks found, go ahead and set the row to be cleared.
      if (clear_row) {
        num_cleared++;
        this.matrix[y][0] = 2;
      }
    }

    // At this point, all rows to be cleared have values of 2 in the matrix.  So, we go through the matrix again,
    // and each row that is not to be cleared, we copy over to the temp matrix, then back again when we're done.
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 11; x++) {
        this.matrix_temp[y][x] = 0;
      }
    }
    let dest = 19;
    for (let y = 19; y > 1; y--) {
      if (this.matrix[y][0] !== 2) {
        for (let x = 0; x < 11; x++) {
          this.matrix_temp[dest][x] = this.matrix[y][x];
        }
        dest--;
      }
    }
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 11; x++) {
        this.matrix[y][x] = this.matrix_temp[y][x];
      }
    }

    // NOTE: this is not in the original.  It keeps the row that stands for what lay beyond the end of the
    // original's array empty; see the NOTE on kd().
    for (let x = 0; x < 11; x++) {
      this.matrix[22][x] = 0;
    }

    return num_cleared;

  } /* End clearRows(). */


  /**
   * Works out where the four blocks of a shape are when it is turned a given way, and puts the answer in
   * shape_points.
   *
   * @param {number} inShapeNumber Which shape: 1 to 7.
   * @param {number} inRotation    Which way it is turned: one of the four ROTATION values.
   */
  getShapePoints(inShapeNumber, inRotation) {

    const points = this.shape_table[inShapeNumber - 1][inRotation - 1];
    for (let i = 0; i < 4; i++) {
      this.shape_points[i].x = points[i].x;
      this.shape_points[i].y = points[i].y;
    }

  } /* End getShapePoints(). */


} /* End class. */
