/**
 * The mini-game "Flight Of Doom".  The player's spaceship sits at the bottom of the play area and can move left and
 * right.  Asteroids tumble down from the top, one at a time.  ACTION fires a pair of missiles straight up.  Blowing
 * up an asteroid scores 50 points; being hit by one costs 250.  A starfield scrolls by in the background.
 *
 * This is the port of mini_games/flight_of_doom.cpp.  Everything that is the same for every mini-game (the frame,
 * the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class FlightOfDoomScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csFlightOfDoom;
  game_name = `"Flight Of Doom"`;
  target_score = 2000;
  target_score_text = `2,000`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Flight Of Doom`,
    ``,
    `It seemed so simple:`,
    `fly your spaceship to`,
    `the galactic core to`,
    `pick up milk.  You`,
    `should have paid more`,
    `attention to the asteroid`,
    `weather reports.`,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Keep blowing up`,
    `asteroids without`,
    `getting hit.`,
    ``,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move your ship left or`,
    `right and press ACTION`,
    `to shoot.`,
    ``,
    ``,
    ``,
    ``,
    ``
  ];

  // The picture of the ship, and the picture of the asteroid.
  ship = `gfx_flight_of_doom_ship`;
  asteroid = `gfx_flight_of_doom_asteroid`;

  // The two frames of the missile's animation, and the five frames of the explosion's.
  missile = [ `gfx_missile_00`, `gfx_missile_01` ];
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // The sounds.  The ship's engine hum plays continuously while the game is running.
  sfxExplosion = `sfx_explosion`;
  sfxMissileFiring = `sfx_missile_firing`;
  sfxShip = `sfx_ship`;

  // X/Y coordinates of asteroid.
  asteroid_pos = { x: 0, y: 0 };

  // Stores the point a collision between the ship and the asteroid occurred at.
  ship_exploding_point = { x: 0, y: 0 };

  // Coordinates the missile is fired at (the left-hand missile of the pair; the other is 24 pixels to its right).
  missile_pos = { x: 0, y: 0 };

  // Stores the point a collision between a missile and the asteroid occurred at.
  asteroid_exploding_point = { x: 0, y: 0 };

  // True when ship is being blown up.
  ship_exploding = false;

  // True if the missile has been fired.
  missile_fired = false;

  // True if missile hit asteroid and asteroid is exploding.
  asteroid_exploding = false;

  // True while the ship's engine hum is playing.
  sfxShipPlaying = false;

  // Which frame of the explosion is showing, and a counter used to time its frames.
  explosion_frame = 0;
  explosion_frame_delay = 0;

  // Which frame of the missile is showing, and a counter used to time its frames.
  missile_frame = 0;
  missile_frame_delay = 0;

  // Starfield X coordinates, Y coordinates and velocities.  There are 50 stars.
  stars_x = [ ];
  stars_y = [ ];
  stars_v = [ ];

  // The engine hum while it is playing, so that it can be stopped.  (The original kept the number of the sound
  // channel it was playing on, hence the name.)
  sfxShiphssChannel = null;

  // Used to rotate asteroid.  In hundredths of a degree.
  asteroid_rotation_angle = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`FlightOfDoomScene.constructor`);

    super(`FlightOfDoomScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`FlightOfDoomScene.loadMiniGame()`);

    this.sfxShiphssChannel = null;
    this.missile_pos = { x: 0, y: 0 };
    this.ship_exploding_point = { x: 0, y: 0 };
    this.asteroid_exploding_point = { x: 0, y: 0 };

    this.initializeFlightOfDoom();

    this.missile_frame = 0;
    this.missile_frame_delay = 0;
    this.explosion_frame = 0;
    this.explosion_frame_delay = 0;

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

    // Start the engine hum, if it is not already going.
    if (!this.sfxShipPlaying) {
      this.sfxShipPlaying = true;
      this.sfxShiphssChannel = sndObj.playSound(this.sfxShip, true);
    }

    let colPoint = { x: -1, y: -1 };
    let ret_val = 0;

    // Starfield.
    for (let i = 0; i < 50; i++) {
      // Plot the next star.  Each star is a little 2x2 square of white pixels.
      inBackbuffer.SetPixel(xadj + this.stars_x[i], yadj + this.stars_y[i], RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i] + 1, yadj + this.stars_y[i], RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i], yadj + this.stars_y[i] + 1, RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i] + 1, yadj + this.stars_y[i] + 1, RGB(255, 255, 255));
      // ... Move the star down the screen.
      this.stars_y[i] = this.stars_y[i] + this.stars_v[i];
      // Regenerate stars that move off the bottom.
      if (this.stars_y[i] > 200) {
        this.stars_x[i] = (rand() % 199) + 1; // X coordinate (1-199)
        this.stars_y[i] = -1; // Y coordinate (off top of screen)
        this.stars_v[i] = (rand() % 5) + 2; // Velocity (2-6)
      }
    }

    // Blit missile, update animation frame and stop it if off the screen.
    if (this.missile_fired) {
      inBackbuffer.BltFast(
        xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
      );
      inBackbuffer.BltFast(
        xadj + this.missile_pos.x + 24, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
      );
      this.missile_pos.y = this.missile_pos.y - 4;
      if (this.missile_pos.y < -16) {
        this.missile_fired = false;
        this.missile_pos.y = 162;
      }
      this.missile_frame_delay++;
      if (this.missile_frame_delay > 1) {
        this.missile_frame_delay = 0;
        this.missile_frame++;
        if (this.missile_frame > 1) {
          this.missile_frame = 0;
        }
      }
      // Check for collision with asteroid, begin explosion if it hits.
      if (this.missile_fired) {
        // Check the left missile.
        colPoint = Surface.Intersect(
          xadj + this.asteroid_pos.x, yadj + this.asteroid_pos.y, this.asteroid, null,
          xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          sndObj.playSound(this.sfxExplosion);
          this.asteroid_exploding_point = colPoint;
          this.asteroid_exploding = true;
          this.missile_fired = false;
          this.missile_pos.y = 162;
        }
        // Check the right missile.
        colPoint = Surface.Intersect(
          xadj + this.asteroid_pos.x, yadj + this.asteroid_pos.y, this.asteroid, null,
          xadj + this.missile_pos.x + 24, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          sndObj.playSound(this.sfxExplosion);
          this.asteroid_exploding_point = colPoint;
          this.asteroid_exploding = true;
          this.missile_fired = false;
          this.missile_pos.y = 162;
        }
      }
    }

    // Blit ship and take care of player movements (if not exploding).
    inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship, null);
    if (!this.ship_exploding) {
      // Moving right.
      if (gameState.player_dir_east) {
        gameState.player_pos.x = gameState.player_pos.x + 3;
        // Stop at edge of screen.
        if (gameState.player_pos.x > 167) {
          gameState.player_pos.x = 167;
        }
      }
      // Moving left.
      if (gameState.player_dir_west) {
        gameState.player_pos.x = gameState.player_pos.x - 3;
        // Stop at edge of screen.
        if (gameState.player_pos.x < 1) {
          gameState.player_pos.x = 1;
        }
      }
    }

    // Blit asteroid and move it (if not exploding) - 32 is height & width.
    let destRect = CRect(
      xadj + this.asteroid_pos.x, yadj + this.asteroid_pos.y,
      xadj + this.asteroid_pos.x + 32, yadj + this.asteroid_pos.y + 32
    );
    inBackbuffer.Blt(destRect, this.asteroid, null, { nRotationAngle: this.asteroid_rotation_angle });
    if (!this.ship_exploding && !this.asteroid_exploding) {
      // Rotate 360 degrees in 1/100th of a degree increments.
      this.asteroid_rotation_angle = this.asteroid_rotation_angle + 360;
      if (this.asteroid_rotation_angle > 36000) {
        this.asteroid_rotation_angle = 0;
      }
      // Move the asteroid down the screen.
      this.asteroid_pos.y = this.asteroid_pos.y + 6;
      // If we're off the screen, start it at the top at a random horizontal position.
      if (this.asteroid_pos.y > 234) {
        this.asteroid_pos.x = (rand() % 168) + 1; // X coordinate (1-168)
        this.asteroid_pos.y = -34;
      }
    }

    // If asteroid is exploding, do that.
    if (this.asteroid_exploding) {
      // Stretch explosion to 40 in all directions around point of collision.
      destRect = CRect(
        this.asteroid_exploding_point.x - 40, this.asteroid_exploding_point.y - 40,
        this.asteroid_exploding_point.x + 40, this.asteroid_exploding_point.y + 40
      );
      inBackbuffer.Blt(destRect, this.explosion[this.explosion_frame], null);
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
      // At the explosion's maximum size, hide the asteroid.
      if (ret_val === 99) {
        this.asteroid_pos.x = -200;
      }
      // When the explosion finishes, get on with the game.
      if (ret_val === -1) {
        this.addToScore(50);
        this.explosion_frame = 0;
        this.asteroid_exploding = false;
        // Initial asteroid position.
        this.asteroid_pos.x = (rand() % 168) + 1; // X coordinate (1-168)
        this.asteroid_pos.y = -34;
        // Reset missile.
        this.asteroid_exploding = false;
        this.missile_fired = false;
        this.missile_pos.y = 162;
      }
    }

    // If the ship is exploding, do that, otherwise check for a collision.
    if (this.ship_exploding) {
      // Stretch explosion to 40 in all directions around point of collision.
      destRect = CRect(
        this.ship_exploding_point.x - 40, this.ship_exploding_point.y - 40,
        this.ship_exploding_point.x + 40, this.ship_exploding_point.y + 40
      );
      inBackbuffer.Blt(destRect, this.explosion[this.explosion_frame], null);
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
      // At the explosion's maximum size, hide the ship and asteroid.
      if (ret_val === 99) {
        this.asteroid_pos.x = -200;
        gameState.player_pos.x = -200;
      }
      // When the explosion finishes, reposition the ship and asteroid and let us get on with the game.
      if (ret_val === -1) {
        this.subtractFromScore(250);
        this.ship_exploding = false;
        // Start ship in the middle.
        gameState.player_pos.x = 84;
        // Initial asteroid position.
        this.asteroid_pos.x = (rand() % 168) + 1; // X coordinate (1-168)
        this.asteroid_pos.y = -34;
        // Reset missile.
        this.missile_fired = false;
        this.missile_pos.y = 162;
      }
    } else {
      // See if there is a collision.
      colPoint = Surface.Intersect(
        xadj + this.asteroid_pos.x, yadj + this.asteroid_pos.y, this.asteroid, null,
        xadj + gameState.player_pos.x, yadj + 166, this.ship, null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        sndObj.playSound(this.sfxExplosion);
        this.ship_exploding = true;
        this.ship_exploding_point = colPoint;
        // Make sure all movements cease too.
        gameState.player_dir_north = false;
        gameState.player_dir_south = false;
        gameState.player_dir_east = false;
        gameState.player_dir_west = false;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  LEFT and RIGHT start the ship moving, and ACTION fires the missiles (only one pair can be
   * in flight at a time).  Nothing works while the ship is exploding.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (!this.ship_exploding) {

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

      // Handle keypresses.
      if (inKey === gameState.kAction) {
        gameState.player_button_down = true;
        if (!this.missile_fired) {
          sndObj.playSound(this.sfxMissileFiring);
          this.missile_fired = true;
          this.missile_pos.x = gameState.player_pos.x + 1;
        }
      }

    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of LEFT or RIGHT stops
   * the ship.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.  The engine hum is silenced while the popup is up; it starts again by itself on the next
    // frame of the game, if the player chooses to continue.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxShiphssChannel)) {
        sndObj.stopSound(this.sfxShiphssChannel);
      }
      this.sfxShipPlaying = false;
      this.miniGameCommandButtonHandler();
    }

    if (!this.ship_exploding) {

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

    }

  } /* End ku(). */


  /**
   * Initialize.  Puts everything in its starting position.
   */
  initializeFlightOfDoom() {

    // Generate initial starfield.
    this.stars_x = [ ];
    this.stars_y = [ ];
    this.stars_v = [ ];
    for (let i = 0; i < 50; i++) {
      this.stars_x.push((rand() % 199) + 1); // X coordinate (1-199)
      this.stars_y.push((rand() % 199) + 1); // Y coordinate (1-199)
      this.stars_v.push((rand() % 4) + 1); // Velocity (1-4)
    }

    // Start ship in the middle.
    gameState.player_pos.x = 84;
    gameState.player_pos.y = 166;

    // Initial asteroid position and rotation angle.
    this.asteroid_pos.x = (rand() % 168) + 1; // X coordinate (1-168)
    this.asteroid_pos.y = -34;
    this.asteroid_rotation_angle = 0;
    this.asteroid_exploding = false;

    // Missile setup.
    this.missile_fired = false;
    this.missile_pos.y = 162;

    // Start off with the ship not exploding.
    this.ship_exploding = false;

    this.sfxShipPlaying = false;

  } /* End initializeFlightOfDoom(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the engine hum.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxShiphssChannel)) {
      sndObj.stopSound(this.sfxShiphssChannel);
    }

  } /* End endMiniGame(). */


} /* End class. */
