/**
 * The mini-game "Trouble In Vectropolis".  The player flies down a trench drawn in white lines, with lines sweeping
 * outwards along its walls and floor to give the feeling of speed.  Three enemy fighters at a time appear far off in
 * the middle and grow as they come nearer, drifting as they do.  The player moves a set of crosshairs with UP,
 * DOWN, LEFT and RIGHT and fires his lasers with ACTION: a fighter caught by them explodes, for 20 points, and one
 * that gets past costs 40.  The lasers heat up as they fire (the meter along the top shows how hot), and if they
 * overheat they will not fire again until they have cooled right down.
 *
 * This is the port of mini_games/trouble_in_vectropolis.cpp.  Everything that is the same for every mini-game (the
 * frame, the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class TroubleInVectropolisScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csTroubleInVectropolis;
  game_name = `"Trouble In Vectropolis"`;
  target_score = 350;
  target_score_text = `350`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Trouble In Vectropolis`,
    ``,
    `It's an alternate`,
    `dimension, or something.`,
    `A dimension of sight`,
    `and sound, but zero`,
    `physical substance.`,
    `As if an artist drew`,
    `an outline, but then lost`,
    `his box of crayons!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Fly down the trench,`,
    `destroying as many`,
    `enemy fighters as`,
    `possible.  Each one`,
    `that gets past will`,
    `cost you points.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right to target, ACTION`,
    `to fire.  Aim for the`,
    `center of the enemy`,
    `ships!  If your lasers`,
    `overheat, they will not`,
    `fire for a second.  Watch`,
    `the meter along the top!`
  ];

  // The eight ways a fighter can be drifting (the values in ship_movement below).
  SM_NORTH = 0;
  SM_EAST = 1;
  SM_SOUTH = 2;
  SM_WEST = 3;
  SM_NORTH_EAST = 4;
  SM_SOUTH_EAST = 5;
  SM_SOUTH_WEST = 6;
  SM_NORTH_WEST = 7;

  // The pictures: the six frames of a fighter's animation, and the crosshairs when the lasers are overheated and
  // when they are not.
  ship = [
    `gfx_trouble_in_line_world_ship_00`, `gfx_trouble_in_line_world_ship_01`, `gfx_trouble_in_line_world_ship_02`,
    `gfx_trouble_in_line_world_ship_03`, `gfx_trouble_in_line_world_ship_04`, `gfx_trouble_in_line_world_ship_05`
  ];
  crosshairs_red = `gfx_trouble_in_line_world_crosshairs_red`;
  crosshairs_green = `gfx_trouble_in_line_world_crosshairs_green`;

  // The sounds.  The first two go round and round.
  sfxShip = `sfx_ship`;
  sfxLaser = `sfx_laser`;
  sfxExplosion = `sfx_explosion`;

  // The moving lines, four along the left wall, four along the right and four along the floor.  Each is a list of
  // two points: where the line starts and where it ends.
  linesLeft = this.newLines();
  linesRight = this.newLines();
  linesBottom = this.newLines();

  // For each moving line, how many frames it waits before it sets off (so that they do not all go at once).
  linesLeftDelay = [ 0, 0, 0, 0 ];
  linesRightDelay = [ 0, 0, 0, 0 ];
  linesBottomDelay = [ 0, 0, 0, 0 ];

  // The three fighters.  For each: where it is, as a rectangle (the picture is stretched to fill it, which is how
  // it grows); which frame of its animation it is on, and the count of frames until the next; the count of frames
  // until it next grows, and how long it has been coming; which way it is drifting (one of the SM values);
  // whether it is exploding and, if it is, where, how far the explosion reaches, and whether it is still
  // spreading (true) or shrinking back (false).
  //
  // NOTE: a fighter's rectangle is in SCREEN coordinates (positionShip() adds xadj and yadj to it), unlike nearly
  // everything else in this game, which is measured from the corner of the play area.  That is how the original
  // has it.  The point an explosion spreads from is in screen coordinates too, which is NOT how the original has
  // it: see the NOTE in pnfMiniGame() where the lasers are tested against a fighter.
  ship_loc = [ CRect(0, 0, 0, 0), CRect(0, 0, 0, 0), CRect(0, 0, 0, 0) ];
  ship_frame = [ 0, 0, 0 ];
  ship_frame_delay = [ 0, 0, 0 ];
  ship_growth_delay = [ 0, 0, 0 ];
  ship_growth_count = [ 0, 0, 0 ];
  ship_movement = [ 0, 0, 0 ];
  ship_exploding = [ false, false, false ];
  ship_explosion_point = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];
  ship_explosion_step = [ 0, 0, 0 ];
  ship_explosion_cycle = [ false, false, false ];

  // Where the crosshairs are (the top-left corner of their picture).
  chairs = { x: 0, y: 0 };

  // Whether the lasers are overheated, how hot they are (0 to 26), and the count of frames between one step of
  // cooling and the next.
  laser_overheated = false;
  laser_heat = 0;
  cooldown_delay = 0;

  // True while the sound of the player's ship is playing, and that sound and the lasers' so that they can be
  // stopped.
  sfxShipPlaying = false;
  laserhssChannel = null;
  sfxShiphssChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`TroubleInVectropolisScene.constructor`);

    super(`TroubleInVectropolisScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.  (The original did the second half of this in its loader, straight after calling its
   * initialize function.)
   */
  loadMiniGame() {

    console.log(`TroubleInVectropolisScene.loadMiniGame()`);

    this.initializeTroubleInVectropolis();

    this.chairs.x = 80;
    this.chairs.y = 80;
    this.laser_heat = 0;
    this.cooldown_delay = 0;
    this.laser_overheated = false;
    this.sfxShipPlaying = false;
    this.positionShip(0);
    this.positionShip(1);
    this.positionShip(2);

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const white = RGB(255, 255, 255);
    const chairs = this.chairs;

    // Start the sound of the ship if it is not already going.  (It stops while the COMMAND popup is up.)
    if (!this.sfxShipPlaying) {
      this.sfxShipPlaying = true;
      this.sfxShiphssChannel = sndObj.playSound(this.sfxShip, true);
    }

    // First, draw the non-moving lines.
    // Top diagonals: left, right.
    inBackbuffer.DrawLine(xadj + 0, yadj + 0, xadj + 80, yadj + 80, white);
    inBackbuffer.DrawLine(xadj + 120, yadj + 80, xadj + 200, yadj + 0, white);
    // Bottom diagonals: left, right.
    inBackbuffer.DrawLine(xadj + 0, yadj + 200, xadj + 80, yadj + 120, white);
    inBackbuffer.DrawLine(xadj + 120, yadj + 120, xadj + 200, yadj + 200, white);
    // Inner joiners (the U-shape).
    inBackbuffer.DrawLine(xadj + 80, yadj + 80, xadj + 80, yadj + 120, white);
    inBackbuffer.DrawLine(xadj + 120, yadj + 80, xadj + 120, yadj + 120, white);
    inBackbuffer.DrawLine(xadj + 80, yadj + 120, xadj + 120, yadj + 120, white);
    // Dimensional crossmembers: left top, left bottom, right top, right bottom, bottom left, bottom right.
    inBackbuffer.DrawLine(xadj + 0, yadj + 60, xadj + 80, yadj + 90, white);
    inBackbuffer.DrawLine(xadj + 0, yadj + 140, xadj + 80, yadj + 110, white);
    inBackbuffer.DrawLine(xadj + 200, yadj + 60, xadj + 120, yadj + 90, white);
    inBackbuffer.DrawLine(xadj + 200, yadj + 140, xadj + 120, yadj + 110, white);
    inBackbuffer.DrawLine(xadj + 60, yadj + 200, xadj + 90, yadj + 120, white);
    inBackbuffer.DrawLine(xadj + 140, yadj + 200, xadj + 110, yadj + 120, white);

    // Now, draw the moving lines and move them, if it's time to.  Each starts at the far end of the trench and
    // sweeps outwards, two pixels a frame, getting longer as it comes; when it reaches the corner of the play area
    // it starts again.
    for (let i = 0; i < 4; i++) {
      const left = this.linesLeft[i];
      const right = this.linesRight[i];
      const bottom = this.linesBottom[i];
      // Draw the lines.
      inBackbuffer.DrawLine(xadj + left[0].x, yadj + left[0].y, xadj + left[1].x, yadj + left[1].y, white);
      inBackbuffer.DrawLine(xadj + right[0].x, yadj + right[0].y, xadj + right[1].x, yadj + right[1].y, white);
      inBackbuffer.DrawLine(xadj + bottom[0].x, yadj + bottom[0].y, xadj + bottom[1].x, yadj + bottom[1].y, white);
      // Lines on the left.
      if (this.linesLeftDelay[i] > 0) {
        // If we're not at zero yet, continue the delay.
        this.linesLeftDelay[i]--;
      } else {
        // Move the line's endpoints.
        left[0].x = left[0].x - 2;
        left[0].y = left[0].y - 2;
        left[1].x = left[1].x - 2;
        left[1].y = left[1].y + 2;
        // Check if the line is at the edge.
        if (left[0].x === 0 && left[0].y === 0) {
          // Reset delay and initial position.
          this.linesLeftDelay[i] = 0;
          left[0].x = 80;
          left[0].y = 80;
          left[1].x = 80;
          left[1].y = 120;
        }
      }
      // Lines on the right.
      if (this.linesRightDelay[i] > 0) {
        this.linesRightDelay[i]--;
      } else {
        right[0].x = right[0].x + 2;
        right[0].y = right[0].y - 2;
        right[1].x = right[1].x + 2;
        right[1].y = right[1].y + 2;
        if (right[0].x === 200 && right[0].y === 0) {
          this.linesRightDelay[i] = 0;
          right[0].x = 120;
          right[0].y = 80;
          right[1].x = 120;
          right[1].y = 120;
        }
      }
      // Lines on the bottom.
      if (this.linesBottomDelay[i] > 0) {
        this.linesBottomDelay[i]--;
      } else {
        bottom[0].x = bottom[0].x - 2;
        bottom[0].y = bottom[0].y + 2;
        bottom[1].x = bottom[1].x + 2;
        bottom[1].y = bottom[1].y + 2;
        if (bottom[0].x === 0 && bottom[0].y === 200) {
          this.linesBottomDelay[i] = 0;
          bottom[0].x = 80;
          bottom[0].y = 120;
          bottom[1].x = 120;
          bottom[1].y = 120;
        }
      }
    } /* End for. */

    // Draw the enemies.
    for (let i = 0; i < 3; i++) {
      if (this.ship_exploding[i]) {
        // An explosion is eight lines out from a point, all one color, which is chosen afresh at random on every
        // frame.  They reach further each frame, and then draw back in.
        const r = rand() % 255;
        const g = rand() % 255;
        const b = rand() % 255;
        const color = RGB(r, g, b);
        const point_x = this.ship_explosion_point[i].x;
        const point_y = this.ship_explosion_point[i].y;
        const step = this.ship_explosion_step[i];
        // N, S, E, W, NW, NE, SW, SE.
        inBackbuffer.DrawLine(point_x, point_y, point_x, point_y - step, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x, point_y + step, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x + step, point_y, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x - step, point_y, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x - step, point_y - step, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x + step, point_y - step, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x - step, point_y + step, color);
        inBackbuffer.DrawLine(point_x, point_y, point_x + step, point_y + step, color);
        if (this.ship_explosion_cycle[i]) {
          // Expansion.
          this.ship_explosion_step[i] = this.ship_explosion_step[i] + 3;
          if (this.ship_explosion_step[i] > 20) {
            this.ship_explosion_cycle[i] = false;
          }
        } else {
          // Contraction.
          this.ship_explosion_step[i] = this.ship_explosion_step[i] - 3;
          if (this.ship_explosion_step[i] === 0) {
            this.positionShip(i);
          }
        }
      } else {
        // Ship NOT exploding.
        const loc = this.ship_loc[i];
        inBackbuffer.Blt(loc, this.ship[this.ship_frame[i]], null);
        // Animate enemy.
        this.ship_frame_delay[i]++;
        if (this.ship_frame_delay[i] > 2) {
          this.ship_frame_delay[i] = 0;
          this.ship_frame[i]++;
          if (this.ship_frame[i] > 5) {
            this.ship_frame[i] = 0;
          }
        }
        // Move enemy.
        switch (this.ship_movement[i]) {
          case this.SM_NORTH: {
            loc.top--;
            loc.bottom--;
          break; }
          case this.SM_EAST: {
            loc.left++;
            loc.right++;
          break; }
          case this.SM_SOUTH: {
            loc.top++;
            loc.bottom++;
          break; }
          case this.SM_WEST: {
            loc.left--;
            loc.right--;
          break; }
          case this.SM_NORTH_EAST: {
            loc.left++;
            loc.right++;
            loc.top--;
            loc.bottom--;
          break; }
          case this.SM_SOUTH_EAST: {
            loc.left++;
            loc.right++;
            loc.top++;
            loc.bottom++;
          break; }
          case this.SM_SOUTH_WEST: {
            loc.left--;
            loc.right--;
            loc.top++;
            loc.bottom++;
          break; }
          case this.SM_NORTH_WEST: {
            loc.left--;
            loc.right--;
            loc.top--;
            loc.bottom--;
          break; }
        }
        // Grow enemy: a pixel bigger all round every other frame.
        this.ship_growth_delay[i]++;
        if (this.ship_growth_delay[i] > 1) {
          this.ship_growth_delay[i] = 0;
          loc.left--;
          loc.top--;
          loc.right++;
          loc.bottom++;
        }
        this.ship_growth_count[i]++;
        // This is when a ship gets past the player.
        if (this.ship_growth_count[i] > 100) {
          this.positionShip(i);
          this.subtractFromScore(40);
        }
      }
    } /* End for. */

    // Draw crosshairs and move them, if applicable.
    if (this.laser_overheated) {
      inBackbuffer.BltFast(xadj + chairs.x, yadj + chairs.y, this.crosshairs_red, null);
    } else {
      inBackbuffer.BltFast(xadj + chairs.x, yadj + chairs.y, this.crosshairs_green, null);
    }
    if (gameState.player_dir_east) {
      if (chairs.x < 170) {
        chairs.x = chairs.x + 4;
      }
    }
    if (gameState.player_dir_west) {
      if (chairs.x > 10) {
        chairs.x = chairs.x - 4;
      }
    }
    if (gameState.player_dir_north) {
      if (chairs.y > 10) {
        chairs.y = chairs.y - 4;
      }
    }
    if (gameState.player_dir_south) {
      if (chairs.y < 170) {
        chairs.y = chairs.y + 4;
      }
    }

    // Draw lasers, if applicable, and check for collision with enemy, destroy if appropriate.  The lasers are six
    // lines, three from each bottom corner of the play area, meeting in the middle of the crosshairs, all one color
    // chosen afresh at random on every frame.
    //
    // NOTE: this is not as the original has it; the aim was put right at Frank's request.  In the original the
    // lines met 10 pixels in from the corner of the crosshairs' picture (whose middle is 16 in), and the point
    // tested against a fighter was that same point measured from the corner of the play area, while a fighter's
    // rectangle is in screen coordinates, 20 pixels greater each way.  Put together, a fighter was hit only when
    // the middle of the crosshairs was 26 pixels to the right of and below some point of it as drawn.  Here the
    // lines meet at the middle of the crosshairs, that is the point tested, in screen coordinates as the fighters
    // are, and the explosion spreads from it: what the crosshairs are on is what is hit.
    if (gameState.player_button_down && !this.laser_overheated) {
      const r = rand() % 255;
      const g = rand() % 255;
      const b = rand() % 255;
      const color = RGB(r, g, b);
      const aim = { x: xadj + chairs.x + 16, y: yadj + chairs.y + 16 };
      inBackbuffer.DrawLine(xadj + 0, yadj + 199, aim.x, aim.y, color);
      inBackbuffer.DrawLine(xadj + 0, yadj + 200, aim.x, aim.y, color);
      inBackbuffer.DrawLine(xadj + 1, yadj + 200, aim.x, aim.y, color);
      inBackbuffer.DrawLine(xadj + 200, yadj + 199, aim.x, aim.y, color);
      inBackbuffer.DrawLine(xadj + 200, yadj + 200, aim.x, aim.y, color);
      inBackbuffer.DrawLine(xadj + 199, yadj + 200, aim.x, aim.y, color);
      for (let i = 0; i < 3; i++) {
        const p = { x: aim.x, y: aim.y };
        // Got it!
        if (!this.ship_exploding[i] && PtInRect(this.ship_loc[i], p)) {
          sndObj.playSound(this.sfxExplosion);
          this.ship_exploding[i] = true;
          this.ship_explosion_cycle[i] = true;
          this.ship_explosion_step[i] = 0;
          this.ship_explosion_point[i].x = p.x;
          this.ship_explosion_point[i].y = p.y;
          this.addToScore(20);
        }
      }
    }

    // Draw outline of laser heat meter.
    inBackbuffer.DrawRect(CRect(xadj + 63, yadj + 4, xadj + 137, yadj + 14), RGB(0, 0, 255));

    // Fill in the heat meter as appropriate: a block for each degree of heat, redder the hotter it is.
    if (this.laser_heat > 0) {
      for (let i = 0; i < this.laser_heat; i++) {
        const r = 10 * i;
        inBackbuffer.FillRect(
          CRect(xadj + 64 + (3 * i), yadj + 5, xadj + 67 + (3 * i), yadj + 13), RGB(r, 100, 50)
        );
      }
    }

    // Adjust laser heat: two degrees hotter for every frame of firing, and one degree cooler for every fourth
    // frame of not firing.  Past 24 the lasers are overheated, and stay so until they have cooled to nothing.
    if (gameState.player_button_down && !this.laser_overheated) {
      this.laser_heat = this.laser_heat + 2;
      if (this.laser_heat > 24) {
        if (sndObj.isPlaying(this.laserhssChannel)) {
          sndObj.stopSound(this.laserhssChannel);
        }
        this.laser_overheated = true;
        this.cooldown_delay = 0;
      }
    } else {
      this.cooldown_delay++;
      if (this.cooldown_delay > 3) {
        this.cooldown_delay = 0;
        if (this.laser_heat > 0) {
          this.laser_heat--;
        } else {
          // laser_heat is 0.  If we were cooling down from an overheat, reset stuff.
          if (this.laser_overheated) {
            this.laser_overheated = false;
            gameState.player_button_down = false;
          }
        }
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  ACTION starts the lasers firing (and their sound), unless they are overheated; UP, DOWN,
   * LEFT and RIGHT start the crosshairs moving.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (inKey === gameState.kAction && !this.laser_overheated) {
      gameState.player_button_down = true;
      this.laserhssChannel = sndObj.playSound(this.sfxLaser, true);
    }

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
   * A key was released.  COMMAND stops the sound of the ship and brings up the "Continue Game / Quit Game" popup.
   * Letting go of ACTION stops the lasers and their sound, unless they are overheated (in which case it does
   * nothing at all: the button is taken to be let go when they have cooled).  Letting go of a direction stops the
   * crosshairs moving that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxShiphssChannel)) {
        sndObj.stopSound(this.sfxShiphssChannel);
      }
      this.sfxShipPlaying = false;
      this.miniGameCommandButtonHandler();
    }

    if (inKey === gameState.kAction && !this.laser_overheated) {
      gameState.player_button_down = false;
      this.cooldown_delay = 0;
      if (sndObj.isPlaying(this.laserhssChannel)) {
        sndObj.stopSound(this.laserhssChannel);
      }
    }

    if (inKey === gameState.kUp) {
      gameState.player_dir_north = false;
    }

    if (inKey === gameState.kDown) {
      gameState.player_dir_south = false;
    }

    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = false;
    }

    if (inKey === gameState.kRight) {
      gameState.player_dir_east = false;
    }

  } /* End ku(). */


  /**
   * Initialize.  Puts the moving lines at the far end of the trench, to set off ten frames apart.
   */
  initializeTroubleInVectropolis() {

    // Initial position of the moving lines on the left, on the right and on the bottom.
    for (let i = 0; i < 4; i++) {
      this.linesLeft[i][0].x = 80;
      this.linesLeft[i][0].y = 80;
      this.linesLeft[i][1].x = 80;
      this.linesLeft[i][1].y = 120;
    }
    for (let i = 0; i < 4; i++) {
      this.linesRight[i][0].x = 120;
      this.linesRight[i][0].y = 80;
      this.linesRight[i][1].x = 120;
      this.linesRight[i][1].y = 120;
    }
    for (let i = 0; i < 4; i++) {
      this.linesBottom[i][0].x = 80;
      this.linesBottom[i][0].y = 120;
      this.linesBottom[i][1].x = 120;
      this.linesBottom[i][1].y = 120;
    }

    // Set up delays so lines don't all come out at once.
    for (let i = 0; i < 4; i++) {
      this.linesLeftDelay[i] = i * 10;
      this.linesRightDelay[i] = i * 10;
      this.linesBottomDelay[i] = i * 10;
    }

    this.laserhssChannel = null;
    this.sfxShiphssChannel = null;

  } /* End initializeTroubleInVectropolis(). */


  /**
   * Stops the sound of the ship and the sound of the lasers when the mini-game ends.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxShiphssChannel)) {
      sndObj.stopSound(this.sfxShiphssChannel);
    }
    if (sndObj.isPlaying(this.laserhssChannel)) {
      sndObj.stopSound(this.laserhssChannel);
    }

  } /* End endMiniGame(). */


  /**
   * Makes a set of four moving lines: four lists of two points each.
   *
   * @return {Array} The lines.
   */
  newLines() {

    const lines = [ ];
    for (let i = 0; i < 4; i++) {
      lines.push([ { x: 0, y: 0 }, { x: 0, y: 0 } ]);
    }
    return lines;

  } /* End newLines(). */


  /**
   * Starts a fighter off afresh: a dot somewhere in the far end of the trench, on a frame of its animation and
   * drifting a way both chosen at random.
   *
   * @param {number} inIndex Which fighter: 0, 1 or 2.
   */
  positionShip(inIndex) {

    const loc = this.ship_loc[inIndex];
    loc.left = xadj + (rand() % 40) + 80;
    loc.top = yadj + (rand() % 40) + 80;
    loc.right = loc.left;
    loc.bottom = loc.top;
    this.ship_frame[inIndex] = rand() % 5;
    this.ship_frame_delay[inIndex] = 0;
    this.ship_growth_delay[inIndex] = 0;
    this.ship_growth_count[inIndex] = 0;
    this.ship_movement[inIndex] = rand() % 8;
    this.ship_exploding[inIndex] = false;

  } /* End positionShip(). */


} /* End class. */
