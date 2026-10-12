/**
 * The mini-game "Antigravitator".  The player is the gunner at an alien prison.  Inmates are floating up out of
 * three "gravity pits" along the bottom of the play area towards a rescue ship hovering across the top.  The
 * player's gun slides up and down the left-hand side, and ACTION fires a laser beam right across the screen, which
 * blows up every inmate it passes through.  While the beam is travelling (about a second) the gun cannot move.
 * Shooting an inmate scores points; each one that reaches the ship costs 50.
 *
 * This is the port of mini_games/antigravitator.cpp.  Everything that is the same for every mini-game (the frame,
 * the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class AntigravitatorScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csAntigravitator;
  game_name = `"Antigravitator"`;
  target_score = 600;
  target_score_text = `600`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Antigravitator`,
    ``,
    `Now you get to play the`,
    `bad guy!  You are the`,
    `gunner at an alien`,
    `prison, and the inmates`,
    `are making a run for it`,
    `with the help of their`,
    `ship-having buddies.`,
    `Give 'em hell, chief!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Shoot as many escaping`,
    `inmates as you can.`,
    `Each alien that makes it`,
    `to the ship costs you`,
    `points.`,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up and down,`,
    `press ACTION to fire.  Each`,
    `time you fire, your gun`,
    `will recharge for a`,
    `second and you will be`,
    `unable to move, so plan`,
    `your shots if you can!`,
    ``
  ];

  // What an enemy (an escaping inmate) can be doing (the values in enemies_status below).  enemyAlive: floating
  // up.  enemyExploding: just hit, and still to be seen behind the start of its explosion.  enemyDead: gone, with
  // only the rest of its explosion showing.
  enemyAlive = 1;
  enemyExploding = 2;
  enemyDead = 3;

  // The pictures of the gun and of the laser beam (which is as wide as the play area and 3 pixels high).
  gun = `gfx_antigravitator_gun`;
  laser = `gfx_antigravitator_laser`;

  // The two frames of a gravity pit's animation, and the two frames of an enemy's.  (The enemies are the little
  // people from another mini-game, Reluctant Hero.)
  gravpit = [ `gfx_antigravitator_gravpit_00`, `gfx_antigravitator_gravpit_01` ];
  enemy = [ `gfx_reluctant_hero_person_00`, `gfx_reluctant_hero_person_01` ];

  // The five frames of the explosion's animation, and the six frames of the rescue ship's.
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];
  ship = [
    `gfx_antigravitator_ship_00`, `gfx_antigravitator_ship_01`, `gfx_antigravitator_ship_02`,
    `gfx_antigravitator_ship_03`, `gfx_antigravitator_ship_04`, `gfx_antigravitator_ship_05`
  ];

  // The sounds.
  sfxExplosion = `sfx_explosion`;
  sfxMissileFiring = `sfx_missile_firing`;

  // Where the laser beam is: the position of its left-hand end.
  //
  // NOTE: the original never put this back anywhere when a game began, only when the gun was fired, and neither do
  // we (see loadMiniGame()).
  laser_pos = { x: 0, y: 0 };

  // Where each of the five enemies is: a list of points.
  enemies_pos = [ ];

  // True while the laser beam is travelling across the screen.
  laser_fired = false;

  // Which frame of the ship is showing, and a counter used to time its frames.
  ship_frame = 0;
  ship_frame_delay = 0;

  // Which frame of the enemies is showing (they all step together), and a counter used to time the frames.
  enemy_frame = 0;
  enemy_frame_delay = 0;

  // Which frame of the gravity pits is showing, and a counter used to time the frames.
  gravpit_frame = 0;
  gravpit_frame_delay = 0;

  // How many pixels each enemy floats up per frame: 1, 2 or 3.
  enemies_speed = [ ];

  // Each enemy can be exploding independently, so there is one of these for each: which frame of the explosion
  // is showing, and a counter of how many frames it has been exploding for.
  enemies_explosion_frame = [ ];
  enemies_explosion_frame_delay = [ ];

  // What each enemy is doing: one of enemyAlive, enemyExploding or enemyDead.
  enemies_status = [ ];


  /**
   * Constructor.
   */
  constructor() {

    console.log(`AntigravitatorScene.constructor`);

    super(`AntigravitatorScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   *
   * NOTE: laser_pos is deliberately NOT touched here.  The original set it only when the gun was fired, so the
   * beam's position is left over from the last shot of the game before (or is the top-left corner, if there has
   * not been one).  It matters because the original looks for enemies touching the beam on every frame, whether
   * or not the beam is showing: see pnfMiniGame().
   */
  loadMiniGame() {

    console.log(`AntigravitatorScene.loadMiniGame()`);

    // Give each of the five enemies a point of its own to hold its position.
    this.enemies_pos = [ ];
    this.enemies_speed = [ ];
    this.enemies_status = [ ];
    this.enemies_explosion_frame = [ ];
    this.enemies_explosion_frame_delay = [ ];
    for (let i = 0; i < 5; i++) {
      this.enemies_pos.push({ x: 0, y: 0 });
      this.enemies_speed.push(0);
      this.enemies_status.push(0);
      this.enemies_explosion_frame.push(0);
      this.enemies_explosion_frame_delay.push(0);
    }

    this.initializeAntigravitator();

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

    // Blit laser, if applicable, and handle movement.  The beam starts wholly off the left-hand side and slides
    // across, 18 pixels a frame, until its left-hand end has gone off the right-hand side.
    if (this.laser_fired) {
      inBackbuffer.BltFast(xadj + this.laser_pos.x, yadj + this.laser_pos.y - 1, this.laser, null);
      this.laser_pos.x = this.laser_pos.x + 18;
      if (this.laser_pos.x > 200) {
        this.laser_fired = false;
      }
    }

    // Blit enemies and deal with them.
    for (let i = 0; i < 5; i++) {

      // Blit any enemy that is alive or exploding.
      if (this.enemies_status[i] === this.enemyAlive || this.enemies_status[i] === this.enemyExploding) {
        inBackbuffer.BltFast(
          xadj + this.enemies_pos[i].x, yadj + this.enemies_pos[i].y, this.enemy[this.enemy_frame], null
        );
        // Check for collision with laser, explode if hit.  (Note two things about this, both as the original has
        // them.  It does not ask whether the beam has been fired, only where it is.  And an enemy that is already
        // exploding is tested as well, so one that is still touching the beam a frame later is hit, and scored,
        // again.)
        const colPoint = Surface.Intersect(
          xadj + this.laser_pos.x, yadj + this.laser_pos.y, this.laser, null,
          xadj + this.enemies_pos[i].x, yadj + this.enemies_pos[i].y, this.enemy[this.enemy_frame], null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          this.enemies_status[i] = this.enemyExploding;
          sndObj.playSound(this.sfxExplosion);
          this.addToScore(10);
        }
      }

      // Update position if alive.  An enemy that gets to the ship costs the player points, and another sets out.
      if (this.enemies_status[i] === this.enemyAlive) {
        this.enemies_pos[i].y = this.enemies_pos[i].y - this.enemies_speed[i];
        if (this.enemies_pos[i].y < 10) {
          this.positionEnemy(i);
          this.subtractFromScore(50);
        }
      }

      // If exploding or dead, blit explosion.  (The counter is never put back to 0, in the original or here, so
      // an enemy's first explosion in a game runs one frame longer than its later ones.)
      if (this.enemies_status[i] === this.enemyExploding || this.enemies_status[i] === this.enemyDead) {
        inBackbuffer.BltFast(
          xadj + (this.enemies_pos[i].x - 14), yadj + (this.enemies_pos[i].y - 10),
          this.explosion[this.enemies_explosion_frame[i]], null
        );
        this.enemies_explosion_frame_delay[i]++;
        if (this.enemies_explosion_frame_delay[i] > 1) {
          this.enemies_explosion_frame[i]++;
          if (this.enemies_explosion_frame[i] === 2) {
            this.enemies_status[i] = this.enemyDead;
          }
          if (this.enemies_explosion_frame[i] > 4) {
            this.enemies_explosion_frame[i] = 0;
            this.positionEnemy(i);
            this.enemies_status[i] = this.enemyAlive;
          }
        }
      }

    } /* End for. */

    // Update enemy frame.
    this.enemy_frame_delay++;
    if (this.enemy_frame_delay > 10) {
      this.enemy_frame_delay = 0;
      this.enemy_frame++;
      if (this.enemy_frame > 1) {
        this.enemy_frame = 0;
      }
    }

    // Blit ship.
    inBackbuffer.BltFast(xadj, yadj, this.ship[this.ship_frame], null);
    this.ship_frame_delay++;
    if (this.ship_frame_delay > 2) {
      this.ship_frame_delay = 0;
      this.ship_frame++;
      if (this.ship_frame > 5) {
        this.ship_frame = 0;
      }
    }

    // Blit gravpits.
    inBackbuffer.BltFast(xadj + 18, yadj + 182, this.gravpit[this.gravpit_frame], null);
    inBackbuffer.BltFast(xadj + 79, yadj + 182, this.gravpit[this.gravpit_frame], null);
    inBackbuffer.BltFast(xadj + 140, yadj + 182, this.gravpit[this.gravpit_frame], null);
    this.gravpit_frame_delay++;
    if (this.gravpit_frame_delay > 2) {
      this.gravpit_frame_delay = 0;
      this.gravpit_frame++;
      if (this.gravpit_frame > 1) {
        this.gravpit_frame = 0;
      }
    }

    // Blit player and handle movements, if applicable.  The gun cannot move while the beam is travelling.
    inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.gun, null);
    if (!this.laser_fired) {
      if (gameState.player_dir_north) {
        gameState.player_pos.y = gameState.player_pos.y - 3;
        if (gameState.player_pos.y < 41) {
          gameState.player_pos.y = 42;
        }
      }
      if (gameState.player_dir_south) {
        gameState.player_pos.y = gameState.player_pos.y + 3;
        if (gameState.player_pos.y > 160) {
          gameState.player_pos.y = 160;
        }
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP and DOWN start the gun moving, and ACTION fires the laser (unless a beam is already on
   * its way across).
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

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

    // Handle keypresses.  The beam starts with its right-hand end at the gun and the rest of it off the screen to
    // the left, level with the gun's muzzle.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
      if (!this.laser_fired) {
        sndObj.playSound(this.sfxMissileFiring);
        this.laser_fired = true;
        this.laser_pos.x = gameState.player_pos.x - 200;
        this.laser_pos.y = gameState.player_pos.y + 11;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of UP or DOWN stops
   * the gun.
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

    // Handle keypresses.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
    }

  } /* End ku(). */


  /**
   * Initialize.  Puts everything in its starting position (except the laser beam: see loadMiniGame()).
   */
  initializeAntigravitator() {

    // Track animation frame for gravpits and the delay of that animation.
    this.gravpit_frame = 0;
    this.gravpit_frame_delay = 0;

    // Start the player in the proper position.
    gameState.player_pos.x = 0;
    gameState.player_pos.y = 42;

    // Make sure we start out not firing.
    this.laser_fired = false;

    // Set up frame variables for enemy animation.
    this.enemy_frame = 0;
    this.enemy_frame_delay = 0;

    // Each enemy can be exploding independently, so we have to have an array element for each to track the
    // explosion animation frame and the delay of it.
    for (let i = 0; i < 5; i++) {
      this.enemies_explosion_frame[i] = 0;
      this.enemies_explosion_frame_delay[i] = 0;
    }

    // Randomly position all the possible enemies.
    this.positionEnemy(0);
    this.positionEnemy(1);
    this.positionEnemy(2);
    this.positionEnemy(3);
    this.positionEnemy(4);

    this.ship_frame_delay = 0;
    this.ship_frame = 0;

  } /* End initializeAntigravitator(). */


  /**
   * Sends an enemy out afresh: alive, over one of the three gravity pits picked at random, somewhere out of sight
   * below the play area, and floating up at a speed picked at random.
   *
   * (The original followed its pick of a gravity pit with a check that the number was in range, going back to pick
   * again if it was not.  The check could never fail, so it is left out here.)
   *
   * @param {number} inEnemyNumber Which enemy: 0 to 4.
   */
  positionEnemy(inEnemyNumber) {

    this.enemies_status[inEnemyNumber] = this.enemyAlive;

    const gravpit = (rand() % 3) + 1;

    // Set X position, add an offset to center it on the gravpit.
    if (gravpit === 1) {
      this.enemies_pos[inEnemyNumber].x = 18 + 17;
    }
    if (gravpit === 2) {
      this.enemies_pos[inEnemyNumber].x = 79 + 17;
    }
    if (gravpit === 3) {
      this.enemies_pos[inEnemyNumber].x = 140 + 17;
    }
    this.enemies_pos[inEnemyNumber].y = (rand() % 100) + 200; // 200-299

    // Randomize speed.
    this.enemies_speed[inEnemyNumber] = (rand() % 3) + 1;

  } /* End positionEnemy(). */


} /* End class. */
