/**
 * The mini-game "Refluxive".  Three spinning "bouncy thingys" fly about the play area on the diagonal, bouncing off
 * its sides and its top.  The player slides a paddle left and right along the bottom to bounce them back up.
 * Each bounce scores 10 points.  A thingy that gets past the paddle and off the bottom is gone for good and costs
 * 50 points, and when all three are gone the game is over.
 *
 * This is the port of mini_games/refluxive.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class RefluxiveScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csRefluxive;
  game_name = `"Refluxive"`;
  target_score = 350;
  target_score_text = `350`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: one line of page 3 differs from the original, which read "Try not to miss" and then, on the next line,
  // "miss any of them,".  The word is now there only once, at Frank's request.  Everything else is as the original
  // has it.
  instructions = [
    // ----- Page 1.
    `Refluxive`,
    ``,
    `They came from beyond:`,
    `small, rubber objects`,
    `that destroy entire`,
    `worlds on a whim.  You`,
    `are the Earth's last`,
    `line of defense against`,
    `the evil bouncy thingys`,
    `from space!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Keep bouncing the things`,
    `as long as you can.`,
    `Each missed thingy`,
    `costs you points.`,
    `Missing them all`,
    `ends the game.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move left or right to`,
    `position your bouncy`,
    `thingy returner.`,
    `Try not to`,
    `miss any of them,`,
    `as if that needs to`,
    `be said at all!`,
    ``
  ];

  // The four ways a bouncy can be travelling (the values in bouncy_dir below).  It always moves on the diagonal:
  // up and to the right (north-east), up and to the left, down and to the right, or down and to the left.
  BOUNCY_DIR_NE = 1;
  BOUNCY_DIR_NW = 2;
  BOUNCY_DIR_SE = 3;
  BOUNCY_DIR_SW = 4;

  // The pictures.
  paddle = `gfx_refluxive_paddle`;
  bouncy = `gfx_refluxive_bouncy`;
  background = `gfx_refluxive_background`;

  // The sounds.
  sfxMissed = `sfx_missed`;
  sfxBounce = `sfx_bounce`;

  // Where each of the three bouncies is: a list of points.
  bouncy_pos = [ ];

  // Whether each bouncy has gone off the bottom of the screen.
  bouncy_gone = [ ];

  // How far round each bouncy has spun, in hundredths of a degree.
  bouncy_rotation_angle = [ ];

  // Which way each bouncy is travelling: one of the four BOUNCY_DIR values.
  bouncy_dir = [ ];


  /**
   * Constructor.
   */
  constructor() {

    console.log(`RefluxiveScene.constructor`);

    super(`RefluxiveScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`RefluxiveScene.loadMiniGame()`);

    this.initializeRefluxive();

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

    // Background.
    inBackbuffer.BltFast(xadj + 0, yadj + 0, this.background, null);

    // Blit paddle and take care of player movements.
    inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.paddle, null);
    // Moving right.
    if (gameState.player_dir_east) {
      gameState.player_pos.x = gameState.player_pos.x + 4;
      // Stop at edge of screen.
      if (gameState.player_pos.x > 174) {
        gameState.player_pos.x = 174;
      }
    }
    // Moving left.
    if (gameState.player_dir_west) {
      gameState.player_pos.x = gameState.player_pos.x - 4;
      // Stop at edge of screen.
      if (gameState.player_pos.x < 1) {
        gameState.player_pos.x = 1;
      }
    }

    // Blit bouncies and take care of movements.
    for (let i = 0; i < 3; i++) {

      // Move the bouncy 3 pixels across and 3 pixels up or down, according to the way it is going.
      if (this.bouncy_dir[i] === this.BOUNCY_DIR_NE) {
        this.bouncy_pos[i].x = this.bouncy_pos[i].x + 3;
        this.bouncy_pos[i].y = this.bouncy_pos[i].y - 3;
      }
      if (this.bouncy_dir[i] === this.BOUNCY_DIR_NW) {
        this.bouncy_pos[i].x = this.bouncy_pos[i].x - 3;
        this.bouncy_pos[i].y = this.bouncy_pos[i].y - 3;
      }
      if (this.bouncy_dir[i] === this.BOUNCY_DIR_SE) {
        this.bouncy_pos[i].x = this.bouncy_pos[i].x + 3;
        this.bouncy_pos[i].y = this.bouncy_pos[i].y + 3;
      }
      if (this.bouncy_dir[i] === this.BOUNCY_DIR_SW) {
        this.bouncy_pos[i].x = this.bouncy_pos[i].x - 3;
        this.bouncy_pos[i].y = this.bouncy_pos[i].y + 3;
      }

      // Draw it, spun round to its present angle.
      const destRect = CRect(
        xadj + this.bouncy_pos[i].x, yadj + this.bouncy_pos[i].y,
        xadj + this.bouncy_pos[i].x + 18, yadj + this.bouncy_pos[i].y + 18
      );
      inBackbuffer.Blt(destRect, this.bouncy, null, { nRotationAngle: this.bouncy_rotation_angle[i] });

      // Update bouncy rotation: seven and a half degrees further round each frame.
      this.bouncy_rotation_angle[i] = this.bouncy_rotation_angle[i] + 750;
      if (this.bouncy_rotation_angle[i] > 36000) {
        this.bouncy_rotation_angle[i] = 0;
      }

      // Check for collision with paddle.  (What is done about it comes further down.)
      const colPoint = Surface.Intersect(
        xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.paddle, null,
        xadj + this.bouncy_pos[i].x, yadj + this.bouncy_pos[i].y, this.bouncy, null
      );

      // Bounce off the frame edges (horizontal).
      if (this.bouncy_pos[i].x < 1) {
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_NW) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_NE;
        }
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_SW) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_SE;
        }
      }
      if (this.bouncy_pos[i].x > 182) {
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_NE) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_NW;
        }
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_SE) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_SW;
        }
      }

      // Bounce off the frame edges (vertical).  Only the top: there is nothing to bounce off at the bottom but the
      // paddle.
      if (this.bouncy_pos[i].y < 1) {
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_NE) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_SE;
        }
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_NW) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_SW;
        }
      }

      // See if it goes off the bottom of the screen, flag it if so.
      if (this.bouncy_pos[i].y > 200 && this.bouncy_gone[i] === false) {
        sndObj.playSound(this.sfxMissed);
        this.bouncy_gone[i] = true;
        this.subtractFromScore(50);
      }

      // Check for collision with top of paddle, bounce if so.  A bouncy on its way down is sent back up: to the
      // left if its middle is to the left of the paddle's middle, to the right if it is to the right.
      if ((colPoint.x !== -1 || colPoint.y !== -1) && this.bouncy_pos[i].y < 180) {
        sndObj.playSound(this.sfxBounce);
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_SE &&
          this.bouncy_pos[i].x + 9 < gameState.player_pos.x + 12
        ) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_NW;
          this.addToScore(10);
        }
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_SE &&
          this.bouncy_pos[i].x + 9 > gameState.player_pos.x + 12
        ) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_NE;
          this.addToScore(10);
        }
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_SW &&
          this.bouncy_pos[i].x + 9 < gameState.player_pos.x + 12
        ) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_NW;
          this.addToScore(10);
        }
        if (this.bouncy_dir[i] === this.BOUNCY_DIR_SW &&
          this.bouncy_pos[i].x + 9 > gameState.player_pos.x + 12
        ) {
          this.bouncy_dir[i] = this.BOUNCY_DIR_NE;
          this.addToScore(10);
        }
      }

    } /* End for. */

    // Check to see if all bouncies are gone.  If so, end game.
    if (this.bouncy_gone[0] && this.bouncy_gone[1] && this.bouncy_gone[2]) {
      gameState.force_game_over = true;
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  LEFT and RIGHT start the paddle moving.  Nothing else does anything in this game.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
      gameState.player_dir_east = false;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
      gameState.player_dir_west = false;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of LEFT or RIGHT stops
   * the paddle.
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

  } /* End ku(). */


  /**
   * Initialize.  Puts everything in its starting position: the paddle in the middle, and the three bouncies at
   * three different heights, each somewhere at random across the play area.
   */
  initializeRefluxive() {

    // Start paddle in the middle.
    gameState.player_pos.x = 88;
    gameState.player_pos.y = 188;

    // Bouncy initial positions.
    this.bouncy_pos = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];
    this.bouncy_pos[0].x = (rand() % 180) + 1;
    this.bouncy_pos[0].y = 10;
    this.bouncy_pos[1].x = (rand() % 180) + 1;
    this.bouncy_pos[1].y = 70;
    this.bouncy_pos[2].x = (rand() % 180) + 1;
    this.bouncy_pos[2].y = 140;

    // Bouncy initial rotation angles.
    this.bouncy_rotation_angle = [ 0, 9000, 18000 ];

    // Bouncy initial directions.
    this.bouncy_dir = [ this.BOUNCY_DIR_SE, this.BOUNCY_DIR_SW, this.BOUNCY_DIR_NE ];

    // Make sure they aren't gone off the bottom of the screen yet.
    this.bouncy_gone = [ false, false, false ];

  } /* End initializeRefluxive(). */


} /* End class. */
