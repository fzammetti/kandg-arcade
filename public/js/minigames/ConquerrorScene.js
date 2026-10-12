/**
 * The mini-game "Conquerror".  The player's gun sits at the bottom of the play area, looking up at an alien city of
 * four buildings.  LEFT and RIGHT move the gun, UP and DOWN raise and lower its barrel (the elevation, from 01 to
 * 17, is shown on the gun), and ACTION lobs a missile up and over at whichever building is above the gun.  Each
 * building has a secret elevation that hits it; fire too low and the missile lands in front of the building, too
 * high and it comes down behind it, which is the clue to adjust by.  Meanwhile the city lobs missiles back, creeping
 * in on a secret elevation of its own, and when it finds it the gun is knocked out for about three seconds and the
 * player loses points.  A building destroyed scores 100.  When all four buildings have been destroyed they are
 * rebuilt and it starts again.
 *
 * This is the port of mini_games/conquerror.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class ConquerrorScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csConquerror;
  game_name = `"Conquerror"`;
  target_score = 400;
  target_score_text = `400`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: page 1 differs from the original in one word: "your human" is now "you're human", at Frank's request.
  // The longer word made its line three pixels too wide for the play area, so the line breaks of that paragraph
  // were moved as well (lines 5 to 9 of the page); the words, the punctuation and the spacing are otherwise the
  // original's.  The original's lines were "innocent inhabitants", "of a large alien city", "on a world you've
  // never", "seen before.  Go ahead," and "your human, destruction".  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Conquerror`,
    ``,
    `Take out your pent-up`,
    `aggression on the`,
    `innocent inhabitants of`,
    `a large alien city on a`,
    `world you've never seen`,
    `before.  Go ahead, you're`,
    `human, destruction`,
    `comes naturally to you!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Fire your missile at the`,
    `city to destroy the four`,
    `buildings.  They fire`,
    `back of course, and`,
    `each hit costs you`,
    `points.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move left or right,`,
    `and elevate your turret`,
    `with up and down.  Press`,
    `ACTION to fire.  Note the`,
    `elevation number and if`,
    `the shot goes behind or`,
    `in front of your target`,
    `to adjust the next time.`
  ];

  // The pictures: the sky and ground behind everything, and the two halves of the gun (the barrel, which moves up
  // and down, and the base, which does not).
  background = `gfx_conquerror_background`;
  gun_top = `gfx_conquerror_gun_top`;
  gun_bottom = `gfx_conquerror_gun_bottom`;

  // The four buildings, as they stand and as ruins.
  building = [
    `gfx_conquerror_building_1`, `gfx_conquerror_building_2`, `gfx_conquerror_building_3`,
    `gfx_conquerror_building_4`
  ];
  building_destroyed = [
    `gfx_conquerror_building_1_destroyed`, `gfx_conquerror_building_2_destroyed`,
    `gfx_conquerror_building_3_destroyed`, `gfx_conquerror_building_4_destroyed`
  ];

  // The two frames of the missile's animation, and the five frames of the explosion's.
  missile = [ `gfx_missile_00`, `gfx_missile_01` ];
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // The sounds.
  sfxExplosion = `sfx_explosion`;
  sfxMissileFiring = `sfx_missile_firing`;

  // Where the explosion is drawn: the place the player's missile was when it struck.
  explosion_pos = { x: 0, y: 0 };

  // Where each of the four buildings stands.
  building_pos = [ ];

  // Where the player's missile is, and where the city's is.
  missile_pos = { x: 0, y: 0 };
  city_missile_pos = { x: 0, y: 0 };

  // True while the city's missile is on its way up, false when it is coming down.
  city_missile_ascending = false;

  // True while the player's missile is in the air, and true while it is on its way up.
  missile_fired = false;
  missile_ascending = false;

  // True while an explosion is showing (a building hit, or a missile that fell short).
  building_exploding = false;

  // True while the city's missile is in the air.
  city_missile_fired = false;

  // Whether each building has been destroyed.
  building_destroyed_flag = [ ];

  // The "magic number" of each building: the elevation, from 1 to 17, that hits it.
  building_hit_numbers = [ ];

  // Counts frames while UP or DOWN is held, so that the barrel moves a step on every third one.
  barrel_delay = 0;

  // The elevation of the gun's barrel, from 1 to 17.
  elevation = 0;

  // The magic number for the city to hit the gun.
  player_hit_number = 0;

  // The elevation the missile in the air was fired at.
  fired_elevation = 0;

  // Which building the explosion that is showing belongs to, or -1 if the missile simply fell short.
  building_hit = 0;

  // The elevation the city is firing at.  It moves one step nearer to player_hit_number with every shot.  0 means
  // that a new one is to be picked at random.
  city_missile_elevation = 0;

  // Counts down the frames for which the gun is knocked out after the city has hit it.
  player_hit_delay = 0;

  // How many points it costs when the city hits the gun.  This is not in the original, which took none (see the
  // NOTE in pnfMiniGame()), so there was no figure to copy: 50 is half of what a building is worth.
  hit_penalty = 50;

  // Which frame of the explosion is showing, and a counter used to time its frames.
  explosion_frame = 0;
  explosion_frame_delay = 0;

  // Which frame of the missiles is showing (both missiles share it), and a counter used to time the frames.
  missile_frame = 0;
  missile_frame_delay = 0;

  // Which building the player's missile was fired at: 0 to 3.
  missile_building = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`ConquerrorScene.constructor`);

    super(`ConquerrorScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`ConquerrorScene.loadMiniGame()`);

    this.initializeConquerror();

    this.missile_frame = 0;
    this.missile_frame_delay = 0;
    this.explosion_frame = 0;
    this.explosion_frame_delay = 0;

    // NOTE: the original did not do this, and it stopped the game working.  It never said, when a game loaded,
    // that no missile was in the air, so a missile still in flight when one game of Conquerror ended was still in
    // flight when the next began.  The new game took it to have been fired at the first building, whichever one
    // it was really over, so unless it happened to be over that one it never struck anything: it fell for ever,
    // and as only one missile can be in the air at a time, the gun could not be fired again, in that game or any
    // later one, until the program was restarted.  (Most games end with a missile in the air.)  Every game now
    // begins with no missile in flight and no explosion showing.
    this.missile_fired = false;
    this.missile_ascending = false;
    this.building_exploding = false;

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

    // When all four buildings have been destroyed, they are rebuilt.
    if (this.building_destroyed_flag[0] && this.building_destroyed_flag[1] && this.building_destroyed_flag[2] &&
      this.building_destroyed_flag[3]
    ) {
      this.building_destroyed_flag[0] = false;
      this.building_destroyed_flag[1] = false;
      this.building_destroyed_flag[2] = false;
      this.building_destroyed_flag[3] = false;
    }

    // Blit background.
    inBackbuffer.BltFast(xadj, yadj, this.background, null);

    // The rectangle the player's missile is drawn in when it is coming down (it is drawn upside down then, which
    // needs the kind of drawing call that takes a rectangle).
    const rect = CRect(
      xadj + this.missile_pos.x, yadj + this.missile_pos.y,
      xadj + this.missile_pos.x + Surface.GetImageWidth(this.missile[0]),
      yadj + this.missile_pos.y + Surface.GetImageHeight(this.missile[0])
    );

    // If missile is fired and is coming down and its elevation puts it behind the building being drawn, draw the
    // missile first.
    if (this.missile_fired && !this.missile_ascending &&
      this.fired_elevation > this.building_hit_numbers[this.missile_building]
    ) {
      inBackbuffer.Blt(rect, this.missile[this.missile_frame], null, { mirrorUpDown: true });
    }

    // If the city's missile is firing and is ascending and the player delay isn't going, blit the missile now so
    // it's in back.
    if (this.city_missile_fired && this.player_hit_delay === 0 && this.city_missile_ascending) {
      inBackbuffer.BltFast(
        xadj + this.city_missile_pos.x, yadj + this.city_missile_pos.y, this.missile[this.missile_frame], null
      );
    }

    // Blit buildings, each in the correct state.
    for (let i = 0; i < 4; i++) {
      if (!this.building_destroyed_flag[i]) {
        inBackbuffer.BltFast(xadj + this.building_pos[i].x, yadj + this.building_pos[i].y, this.building[i], null);
      } else {
        inBackbuffer.BltFast(
          xadj + this.building_pos[i].x, yadj + this.building_pos[i].y, this.building_destroyed[i], null
        );
      }
    }

    // Player's missile is firing but its elevation is too low or just right, so blit it now in front.
    if (this.missile_fired && !this.missile_ascending &&
      this.fired_elevation <= this.building_hit_numbers[this.missile_building]
    ) {
      inBackbuffer.Blt(rect, this.missile[this.missile_frame], null, { mirrorUpDown: true });
    }

    // Player's missile is firing and is ascending, blit it now so it's in front.
    if (this.missile_fired && this.missile_ascending) {
      inBackbuffer.BltFast(
        xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
      );
    }

    // If the city's missile is firing and is descending and the player delay isn't going, blit the missile now so
    // it's in front.
    if (this.city_missile_fired && this.player_hit_delay === 0 && !this.city_missile_ascending) {
      const cityRect = CRect(
        xadj + this.city_missile_pos.x, yadj + this.city_missile_pos.y,
        xadj + this.city_missile_pos.x + 6, yadj + this.city_missile_pos.y + 12
      );
      inBackbuffer.Blt(cityRect, this.missile[this.missile_frame], null, { mirrorUpDown: true });
    }

    // Animate missile (applies to both player and city missile).
    if (this.missile_fired && !this.building_exploding) {
      this.missile_frame_delay++;
      if (this.missile_frame_delay > 1) {
        this.missile_frame_delay = 0;
        this.missile_frame++;
        if (this.missile_frame > 1) {
          this.missile_frame = 0;
        }
      }
    }

    // Move player's missile.  It climbs until it is off the top of the play area by an amount that depends on the
    // elevation it was fired at, and then turns round.
    if (this.missile_fired && this.missile_ascending) {
      this.missile_pos.y = this.missile_pos.y - 6;
      if (this.missile_pos.y < (((this.fired_elevation * 2) + 12) * -1)) {
        this.missile_ascending = false;
      }
    }
    if (this.missile_fired && !this.missile_ascending) {
      // Missile is coming down.
      this.missile_pos.y = this.missile_pos.y + 6;
      // See whether it is touching the building it was fired at (as it stands, or its ruins).
      let colPoint = null;
      if (!this.building_destroyed_flag[this.missile_building]) {
        colPoint = Surface.Intersect(
          xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null,
          xadj + this.building_pos[this.missile_building].x, yadj + this.building_pos[this.missile_building].y,
          this.building[this.missile_building], null
        );
      } else {
        colPoint = Surface.Intersect(
          xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null,
          xadj + this.building_pos[this.missile_building].x, yadj + this.building_pos[this.missile_building].y,
          this.building_destroyed[this.missile_building], null
        );
      }
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        if (this.fired_elevation === this.building_hit_numbers[this.missile_building]) {
          // If the elevation was correct, start the building exploding.  Nothing stops the missile here: it goes
          // on falling, and on every frame that it is still touching the building while the explosion plays, all
          // of this happens again (which is why the explosion follows the missile down).
          //
          // NOTE: in the original that included the points, so that one hit was worth 100 for each of those
          // frames: 300 to 500 in all, where 100 was plainly meant (the target is 400, and there are four
          // buildings).  The points are now given on the first of those frames only, at Frank's request.  A
          // building that is already exploding because of this same missile has been scored.
          const alreadyScored = this.building_exploding && this.building_hit === this.missile_building;
          this.building_hit = this.missile_building;
          this.building_exploding = true;
          this.explosion_pos = { x: this.missile_pos.x, y: this.missile_pos.y };
          if (!alreadyScored) {
            this.addToScore(100);
          }
          sndObj.playSound(this.sfxExplosion);
        } else {
          // If we hit the horizon and the elevation was too low, do an explosion, but don't kill a building.
          if (this.missile_pos.y > 108 &&
            this.fired_elevation < this.building_hit_numbers[this.missile_building]
          ) {
            this.building_hit = -1;
            this.building_exploding = true;
            this.explosion_pos = { x: this.missile_pos.x, y: this.missile_pos.y };
            sndObj.playSound(this.sfxExplosion);
          }
          // If we hit the horizon and the elevation was too high, just stop missile firing, no explosion to show.
          if (this.missile_pos.y > 108 &&
            this.fired_elevation > this.building_hit_numbers[this.missile_building]
          ) {
            this.missile_fired = false;
            sndObj.playSound(this.sfxExplosion);
          }
        }
      }
    }

    // If building exploding, do that.
    if (this.building_exploding) {
      const destRect = CRect(
        xadj + this.explosion_pos.x - 40, yadj + this.explosion_pos.y - 40,
        xadj + this.explosion_pos.x + 40, yadj + this.explosion_pos.y + 40
      );
      inBackbuffer.Blt(destRect, this.explosion[this.explosion_frame], null);
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
      // Building exploding, not just a short shot: at the explosion's height the building becomes a ruin.
      if (ret_val === 99 && this.building_hit !== -1) {
        this.building_destroyed_flag[this.building_hit] = true;
      }
      // Explosion cycle done: the missile is finished with, and another can be fired.
      if (ret_val === -1) {
        this.missile_ascending = false;
        this.missile_fired = false;
        this.building_exploding = false;
      }
    }

    // If city missile is firing and the player wasn't just hit, deal with it.
    if (this.city_missile_fired && this.player_hit_delay === 0) {
      if (this.city_missile_ascending) {
        this.city_missile_pos.y = this.city_missile_pos.y - 6;
        if (this.city_missile_pos.y < -50) {
          this.city_missile_ascending = false;
        }
      } else {
        // Missile is descending.  When missile reaches bottom of screen, see if the elevation was correct.  If it
        // was, set up to do the temp delay.  If it wasn't, adjust it depending on how it compares to the magic
        // number.  (Where the missile came down has nothing to do with it, nor where the gun is.)
        this.city_missile_pos.y = this.city_missile_pos.y + 6;
        if (this.city_missile_pos.y > 200) {
          sndObj.playSound(this.sfxExplosion);
          this.city_missile_fired = false;
          if (this.city_missile_elevation > this.player_hit_number) {
            this.city_missile_elevation--;
          } else if (this.city_missile_elevation < this.player_hit_number) {
            this.city_missile_elevation++;
          } else if (this.city_missile_elevation === this.player_hit_number) {
            this.city_missile_elevation = 0;
            this.player_hit_delay = 75;
            this.city_missile_fired = false;
            // NOTE: the original took no points here, although its own instructions say that "each hit costs you
            // points".  A hit now costs hit_penalty points, at Frank's request.
            this.subtractFromScore(this.hit_penalty);
            gameState.player_dir_north = false;
            gameState.player_dir_south = false;
            gameState.player_dir_east = false;
            gameState.player_dir_west = false;
          }
        }
      }
    } else {
      // City missile NOT fired, go ahead and fire it (unless the gun has just been hit).
      if (this.player_hit_delay === 0) {
        this.city_missile_fired = true;
        this.city_missile_pos.x = (rand() % 191) + 1;
        this.city_missile_pos.y = 100;
        this.city_missile_ascending = true;
        sndObj.playSound(this.sfxMissileFiring);
        // Missile was not previously fired (or player was hit), so choose a random elevation.
        if (this.city_missile_elevation === 0) {
          this.city_missile_elevation = (rand() % 17) + 1;
          sndObj.playSound(this.sfxMissileFiring);
        }
      }
    }

    // Blit gun and elevation, and handle movement.
    if (this.player_hit_delay === 0) {
      inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + gameState.player_pos.y + 2, this.gun_top, null);
      inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + 175, this.gun_bottom, null);
    } else {
      // Draw the gun in red to denote the just hit delay.
      inBackbuffer.BltFastColorized(
        xadj + gameState.player_pos.x, yadj + gameState.player_pos.y + 2, this.gun_top, RGB(255, 0, 0)
      );
      inBackbuffer.BltFastColorized(xadj + gameState.player_pos.x, yadj + 175, this.gun_bottom, RGB(255, 0, 0));
    }
    // The elevation, always as two digits, in the middle of the gun.  (There is no xadj in the X here, as there is
    // none in the original: the 40 is xadj plus half the gun's width.)
    if (this.elevation >= 1 && this.elevation <= 17) {
      let elevationText = `${this.elevation}`;
      if (this.elevation < 10) {
        elevationText = `0${this.elevation}`;
      }
      inBackbuffer.DrawText(gameState.player_pos.x + 40, yadj + 175, elevationText, font1, GDDRAWTEXT_CENTER);
    }
    if (this.player_hit_delay === 0) {
      // Moving right.
      if (gameState.player_dir_east) {
        gameState.player_pos.x = gameState.player_pos.x + 3;
        // Stop at edge of screen.
        if (gameState.player_pos.x > 160) {
          gameState.player_pos.x = 160;
        }
      }
      // Moving left.
      if (gameState.player_dir_west) {
        gameState.player_pos.x = gameState.player_pos.x - 3;
        // Stop at edge of screen.
        if (gameState.player_pos.x < 0) {
          gameState.player_pos.x = 0;
        }
      }
      // Barrel moving up: one step on every third frame.
      if (gameState.player_dir_north) {
        this.barrel_delay++;
        if (this.barrel_delay > 2) {
          this.barrel_delay = 0;
          gameState.player_pos.y--;
          this.elevation++;
          if (this.elevation > 17) {
            this.elevation = 17;
          }
          if (gameState.player_pos.y < 150) {
            gameState.player_pos.y = 150;
          }
        }
      }
      // Barrel moving down.
      if (gameState.player_dir_south) {
        this.barrel_delay++;
        if (this.barrel_delay > 2) {
          this.barrel_delay = 0;
          gameState.player_pos.y++;
          this.elevation--;
          if (this.elevation < 1) {
            this.elevation = 1;
          }
          if (gameState.player_pos.y > 166) {
            gameState.player_pos.y = 166;
          }
        }
      }
    } else {
      // If the player was hit, we're counting down before they can do anything again.
      this.player_hit_delay--;
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  LEFT and RIGHT start the gun moving, UP and DOWN start the barrel moving, and ACTION fires
   * a missile (only one can be in the air at a time).  Nothing works while the gun is knocked out.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle left movement events.  We'll only do this if the player wasn't just hit.
    if (inKey === gameState.kLeft && this.player_hit_delay === 0) {
      gameState.player_dir_west = true;
      gameState.player_dir_east = false;
    }

    // Handle right movement events.  We'll only do this if the player wasn't just hit.
    if (inKey === gameState.kRight && this.player_hit_delay === 0) {
      gameState.player_dir_east = true;
      gameState.player_dir_west = false;
    }

    // Handle up movement events.  We'll only do this if the player wasn't just hit.  (Setting the delay high makes
    // the barrel move on the very next frame.)
    if (inKey === gameState.kUp && this.player_hit_delay === 0) {
      gameState.player_dir_north = true;
      this.barrel_delay = 99;
    }

    // Handle down movement events.  We'll only do this if the player wasn't just hit.
    if (inKey === gameState.kDown && this.player_hit_delay === 0) {
      gameState.player_dir_south = true;
      this.barrel_delay = 99;
    }

    // Handle keypresses.  We'll only fire if a missile isn't already flying, and if the player wasn't just hit.
    if (inKey === gameState.kAction && !this.missile_fired && this.player_hit_delay === 0) {
      gameState.player_button_down = true;
      this.building_hit = -1;
      this.missile_fired = true;
      this.missile_ascending = true;
      this.building_exploding = false;
      this.fired_elevation = this.elevation;
      this.missile_pos.x = gameState.player_pos.x + 17;
      this.missile_pos.y = gameState.player_pos.y;
      // Determine which building the missile is fired at: the one it is underneath.
      const x = this.missile_pos.x;
      if (x >= 0 && x <= 39) {
        this.missile_building = 0;
      }
      if (x >= 40 && x <= 109) {
        this.missile_building = 1;
      }
      if (x >= 110 && x <= 139) {
        this.missile_building = 2;
      }
      if (x >= 140 && x <= 200) {
        this.missile_building = 3;
      }
      sndObj.playSound(this.sfxMissileFiring);
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of a direction stops
   * the gun or the barrel.
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

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      gameState.player_dir_north = false;
      this.barrel_delay = 0;
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_south = false;
      this.barrel_delay = 0;
    }

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
    }

  } /* End ku(). */


  /**
   * Initialize.  Puts the gun and the city in their starting state, and picks the secret numbers.
   */
  initializeConquerror() {

    // Start gun barrel in right place.
    gameState.player_pos.x = 75;
    gameState.player_pos.y = 150;

    // Set delay for moving barrel up or down.
    this.barrel_delay = 0;

    // Set initial barrel elevation.
    this.elevation = 17;

    // Determine the magic number to hit the gun barrel.
    this.player_hit_number = (rand() % 17) + 1;

    // Determine the magic numbers to hit each building.
    this.building_hit_numbers = [ 0, 0, 0, 0 ];
    this.building_hit_numbers[0] = (rand() % 17) + 1;
    this.building_hit_numbers[1] = (rand() % 17) + 1;
    this.building_hit_numbers[2] = (rand() % 17) + 1;
    this.building_hit_numbers[3] = (rand() % 17) + 1;

    // Start all buildings not destroyed.
    this.building_destroyed_flag = [ false, false, false, false ];

    // Building positions.
    this.building_pos = [ { x: 0, y: 40 }, { x: 40, y: 80 }, { x: 110, y: 20 }, { x: 140, y: 70 } ];

    this.city_missile_fired = false;
    this.city_missile_elevation = 0;
    this.player_hit_delay = 0;
    this.missile_building = 0;

  } /* End initializeConquerror(). */


} /* End class. */
