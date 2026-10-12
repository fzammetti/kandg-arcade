/**
 * The mini-game "Defen'DOH!".  The player's fighter sits near the right-hand edge of the play area, facing left,
 * and can only move up and down.  An alien landscape scrolls past underneath it.  UFOs come in from the left, one
 * at a time, wobbling up and down as they cross.  ACTION fires a missile to the left.  Blowing up a UFO scores 25
 * points; being hit by one, or flying into the ground, costs 75.
 *
 * This is the port of mini_games/defendoh.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class DefendohScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csDefendoh;
  game_name = `"Defen'DOH!"`;
  target_score = 250;
  target_score_text = `250`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Defen'DOH!`,
    ``,
    `Top Gun in space!  Fly`,
    `your fighter over the`,
    `alien terrain and`,
    `blow up the attacking,`,
    `most probably drunk,`,
    `UFO's coming at you.`,
    `Watch for a good place`,
    `to eat too!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Destroy as many UFO's`,
    `as you can.  Each time`,
    `you get hit by a UFO`,
    `or the ground, it costs`,
    `you points, but you come`,
    `right back to try again.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up and down (it's a`,
    `lousy fighter, it can't`,
    `move any other way!)`,
    `and press ACTION to fire`,
    `at the oncoming UFO's.`,
    ``,
    ``,
    ``
  ];

  // The picture of the landscape.  It is 1100 pixels wide, and only a 200 pixel wide slice of it is shown at a
  // time (see landscape_rect below).
  landscape = `gfx_defendoh_landscape`;

  // The two frames of the ship's animation, and the two frames of the alien's.
  ship = [ `gfx_defendoh_ship_00`, `gfx_defendoh_ship_01` ];
  alien = [ `gfx_defendoh_alien_00`, `gfx_defendoh_alien_01` ];

  // The two frames of the missile's animation, and the five frames of the explosion's.
  missile = [ `gfx_missile_00`, `gfx_missile_01` ];
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // The sounds.  The ship's engine hum plays continuously while the game is running.
  sfxShip = `sfx_ship`;
  sfxExplosion = `sfx_explosion`;
  sfxMissileFiring = `sfx_missile_firing`;

  // Position of alien.
  alien_pos = { x: 0, y: 0 };

  // Position of the missile.
  missile_pos = { x: 0, y: 0 };

  // Stores the point a collision between the missile and the alien occurred at.
  alien_exploding_point = { x: 0, y: 0 };

  // Stores the point a collision between the ship and the alien, or the ship and the ground, occurred at.
  ship_exploding_point = { x: 0, y: 0 };

  // Which slice of the landscape picture is showing.  It moves 3 pixels to the left along the picture every frame,
  // which makes the ground appear to slide to the right, and jumps back to the right-hand end when it reaches the
  // left-hand end.
  landscape_rect = CRect(0, 0, 0, 0);

  // True while the ship's engine hum is playing.
  sfxShipPlaying = false;

  // True when ship is being blown up.
  ship_exploding = false;

  // True if missile hit alien and alien is exploding.
  alien_exploding = false;

  // True if the missile has been fired.
  missile_fired = false;

  // Which frame of the alien is showing, and a counter used to time its frames.
  alien_frame = 0;
  alien_frame_delay = 0;

  // Which frame of the ship is showing, and a counter used to time its frames.
  ship_frame = 0;
  ship_frame_delay = 0;

  // Which frame of the explosion is showing, and a counter used to time its frames.
  explosion_frame = 0;
  explosion_frame_delay = 0;

  // Which frame of the missile is showing, and a counter used to time its frames.
  missile_frame = 0;
  missile_frame_delay = 0;

  // Starfield X coordinates and Y coordinates.  There are 50 stars, and in this game they do not move.
  stars_x = [ ];
  stars_y = [ ];

  // The engine hum while it is playing, so that it can be stopped.  (The original kept the number of the sound
  // channel it was playing on, hence the name.)
  sfxShiphssChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`DefendohScene.constructor`);

    super(`DefendohScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`DefendohScene.loadMiniGame()`);

    this.sfxShiphssChannel = null;
    this.missile_pos = { x: 0, y: 0 };
    this.alien_exploding_point = { x: 0, y: 0 };
    this.ship_exploding_point = { x: 0, y: 0 };

    this.initializeDefendoh();

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

    // Starfield.  Each star is a little 2x2 square of white pixels.
    for (let i = 0; i < 50; i++) {
      // Plot the next star.
      inBackbuffer.SetPixel(xadj + this.stars_x[i], yadj + this.stars_y[i], RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i] + 1, yadj + this.stars_y[i], RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i], yadj + this.stars_y[i] + 1, RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i] + 1, yadj + this.stars_y[i] + 1, RGB(255, 255, 255));
    }

    // Blit landscape and update source rect.  The landscape fills the bottom half of the play area.
    inBackbuffer.BltFast(xadj + 0, yadj + 100, this.landscape, this.landscape_rect);
    this.landscape_rect.left = this.landscape_rect.left - 3;
    this.landscape_rect.right = this.landscape_rect.right - 3;
    if (this.landscape_rect.left < 0) {
      this.landscape_rect.left = 900;
      this.landscape_rect.right = 1100;
    }

    // Blit missile, update animation frame and stop it if off the screen.  The missile's picture points up, so it
    // is turned three quarters of the way round (the angle is in hundredths of a degree) to point left.
    if (this.missile_fired) {
      const missileRect = CRect(
        xadj + this.missile_pos.x, yadj + this.missile_pos.y,
        xadj + this.missile_pos.x + 12, yadj + this.missile_pos.y + 12
      );
      inBackbuffer.Blt(missileRect, this.missile[this.missile_frame], null, { nRotationAngle: 27000 });
      this.missile_pos.x = this.missile_pos.x - 4;
      if (this.missile_pos.x < -16) {
        this.missile_fired = false;
        this.missile_pos.x = 154;
      }
      this.missile_frame_delay++;
      if (this.missile_frame_delay > 1) {
        this.missile_frame_delay = 0;
        this.missile_frame++;
        if (this.missile_frame > 1) {
          this.missile_frame = 0;
        }
      }
      // Check for collision with alien, begin explosion if it hits.
      if (this.missile_fired) {
        colPoint = Surface.Intersect(
          xadj + this.alien_pos.x, yadj + this.alien_pos.y, this.alien[this.alien_frame], null,
          xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          sndObj.playSound(this.sfxExplosion);
          this.alien_exploding_point = colPoint;
          this.alien_exploding = true;
          this.missile_fired = false;
          this.missile_pos.x = 154;
        }
      }
    }

    // Blit ship and take care of player movements (if not exploding).
    inBackbuffer.BltFast(
      xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
    );
    if (!this.ship_exploding) {
      this.ship_frame_delay++;
      if (this.ship_frame_delay > 1) {
        this.ship_frame_delay = 0;
        this.ship_frame++;
        if (this.ship_frame > 1) {
          this.ship_frame = 0;
        }
      }
      // Moving up.
      if (gameState.player_dir_north) {
        gameState.player_pos.y = gameState.player_pos.y - 3;
        // Stop at edge of screen.
        if (gameState.player_pos.y < 1) {
          gameState.player_pos.y = 1;
        }
      }
      // Moving down.  (There is no edge to stop at this way: the ground sees to that.)
      if (gameState.player_dir_south) {
        gameState.player_pos.y = gameState.player_pos.y + 3;
      }
    }

    // Blit alien and move it (if not exploding).
    inBackbuffer.BltFast(xadj + this.alien_pos.x, yadj + this.alien_pos.y, this.alien[this.alien_frame], null);
    if (!this.ship_exploding && !this.alien_exploding) {
      this.alien_frame_delay++;
      if (this.alien_frame_delay > 3) {
        this.alien_frame_delay = 0;
        this.alien_frame++;
        if (this.alien_frame > 1) {
          this.alien_frame = 0;
        }
      }
      // Move the alien across the screen.  Every frame it also jumps up or down, the toss of a coin deciding
      // which, though never above the top of the play area or below the top of the landscape.
      this.alien_pos.x = this.alien_pos.x + 2;
      if (((rand() % 2) + 1) === 1) {
        this.alien_pos.y = this.alien_pos.y - 4;
      } else {
        this.alien_pos.y = this.alien_pos.y + 4;
      }
      if (this.alien_pos.y < 1) {
        this.alien_pos.y = 1;
      }
      if (this.alien_pos.y > 100) {
        this.alien_pos.y = 100;
      }
      // If we're off the screen, start it at the left at a random vertical position.
      if (this.alien_pos.x > 234) {
        this.alien_pos.x = -34;
        this.alien_pos.y = (rand() % 100) + 1; // Y coordinate (1-100)
      }
    }

    // If alien is exploding, do that.
    if (this.alien_exploding) {
      // Stretch explosion to 40 in all directions around point of collision.
      const alienExplosionRect = CRect(
        this.alien_exploding_point.x - 40, this.alien_exploding_point.y - 40,
        this.alien_exploding_point.x + 40, this.alien_exploding_point.y + 40
      );
      inBackbuffer.Blt(alienExplosionRect, this.explosion[this.explosion_frame], null);
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
      // At the explosion's maximum size, hide the alien.
      if (ret_val === 99) {
        this.alien_pos.x = -200;
      }
      // When the explosion finishes, get on with the game.
      if (ret_val === -1) {
        this.addToScore(25);
        this.alien_exploding = false;
        // Initial alien position.
        this.alien_pos.x = -34;
        this.alien_pos.y = (rand() % 100) + 1; // Y coordinate (1-100)
        // Reset missile.
        this.alien_exploding = false;
        this.missile_fired = false;
        this.missile_pos.x = 154;
      }
    }

    // If the ship is exploding, do that, otherwise check for a collision.
    if (this.ship_exploding) {
      // Stretch explosion to 40 in all directions around point of collision.
      const shipExplosionRect = CRect(
        this.ship_exploding_point.x - 40, this.ship_exploding_point.y - 40,
        this.ship_exploding_point.x + 40, this.ship_exploding_point.y + 40
      );
      inBackbuffer.Blt(shipExplosionRect, this.explosion[this.explosion_frame], null);
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
      // At the explosion's maximum size, hide the ship and alien.
      if (ret_val === 99) {
        this.alien_pos.x = -200;
        gameState.player_pos.x = -200;
      }
      // When the explosion finishes, reposition the ship and alien and let us get on with the game.
      if (ret_val === -1) {
        this.subtractFromScore(75);
        this.explosion_frame = 0;
        this.ship_exploding = false;
        // Start ship at initial coordinates.
        gameState.player_pos.x = 165;
        gameState.player_pos.y = 36;
        // Initial alien position.
        this.alien_pos.x = -34;
        this.alien_pos.y = (rand() % 100) + 1; // Y coordinate (1-100)
        // Reset missile.
        this.missile_fired = false;
        this.missile_pos.x = 154;
      }
    } else {
      // See if there is a collision with the alien.
      colPoint = Surface.Intersect(
        xadj + this.alien_pos.x, yadj + this.alien_pos.y, this.alien[this.alien_frame], null,
        xadj + 165, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
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
      // See if there is a collision with the landscape.  Only the slice of the landscape that is showing counts.
      colPoint = Surface.Intersect(
        xadj + 0, yadj + 100, this.landscape, this.landscape_rect,
        xadj + 165, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
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
   * A key was pressed.  UP and DOWN start the ship moving, and ACTION fires the missile (only one can be in flight
   * at a time).  Nothing works while the ship is exploding.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (!this.ship_exploding) {

      // Handle up movement events.
      if (inKey === gameState.kUp) {
        gameState.player_dir_north = true;
        gameState.player_dir_south = false;
      }

      // Handle down movement events.
      if (inKey === gameState.kDown) {
        gameState.player_dir_south = true;
        gameState.player_dir_north = false;
      }

      // Handle keypresses.
      if (inKey === gameState.kAction) {
        gameState.player_button_down = true;
        if (!this.missile_fired) {
          sndObj.playSound(this.sfxMissileFiring);
          this.missile_fired = true;
          this.missile_pos.y = gameState.player_pos.y + 8;
        }
      }

    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of UP or DOWN stops
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

      // Handle up movement events.
      if (inKey === gameState.kUp) {
        gameState.player_dir_north = false;
      }

      // Handle down movement events.
      if (inKey === gameState.kDown) {
        gameState.player_dir_south = false;
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
  initializeDefendoh() {

    // Generate initial starfield.
    this.stars_x = [ ];
    this.stars_y = [ ];
    for (let i = 0; i < 50; i++) {
      this.stars_x.push((rand() % 199) + 1); // X coordinate (1-199)
      this.stars_y.push((rand() % 199) + 1); // Y coordinate (1-199)
    }

    // Initial landscape source rect: the right-hand end of the picture.
    this.landscape_rect = CRect(900, 0, 1100, 100);

    // Start ship at its initial coordinates.
    gameState.player_pos.x = 165;
    gameState.player_pos.y = 36;

    // Missile setup.
    this.missile_fired = false;
    this.missile_pos.x = 154;

    // Start off with the ship and alien not exploding.
    this.ship_exploding = false;
    this.alien_exploding = false;

    // Initial alien position.
    this.alien_pos.x = -34;
    this.alien_pos.y = (rand() % 100) + 1; // Y coordinate (1-100)

    this.sfxShipPlaying = false;

    this.alien_frame = 0;
    this.alien_frame_delay = 0;
    this.ship_frame = 0;
    this.ship_frame_delay = 0;

  } /* End initializeDefendoh(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the engine hum.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxShiphssChannel)) {
      sndObj.stopSound(this.sfxShiphssChannel);
    }

  } /* End endMiniGame(). */


} /* End class. */
