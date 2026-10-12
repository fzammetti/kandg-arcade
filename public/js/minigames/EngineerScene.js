/**
 * The mini-game "Engineer".  A generator in the middle of the play area spits out particles of four kinds, up to
 * three at a time, each in a direction chosen at random.  Around the generator is a square ring of pipe with a
 * "diverter" in the middle of each of its four sides, and beyond each diverter a pipe leads off to an injector
 * port in one of the corners of the play area.  The player cycles the diverters through their six shapes (four
 * bends and two straight pieces) to make paths for the particles.  A particle that reaches the port for its own
 * kind scores 50 points; one that reaches any other port costs 100, and one that finds its way back into the
 * generator costs 250.  A particle that arrives at a diverter which has no opening on the side it arrives at simply
 * vanishes, at no cost.
 *
 * This is one of the "special" mini-games: in an Adventure game, once the captive on the level has given the hint,
 * there is a short cut that wins it on the spot (see the end of pnfMiniGame()).
 *
 * This is the port of mini_games/engineer.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class EngineerScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csEngineer;
  game_name = `"Engineer"`;
  target_score = 500;
  target_score_text = `500`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: one line of page 3 differs from the original, which read "Move up, down left or".  The comma after
  // "down" was missing; it is there now, at Frank's request.  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Engineer`,
    ``,
    `Give the captain more`,
    `power, wrench-monkey!`,
    `Guide the particles`,
    `spitting out of the`,
    `generator into the`,
    `appropriate injector`,
    `ports, and don't let`,
    `them feed back in!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Direct as many particles`,
    `into the appropriate`,
    `injector ports as you`,
    `can.  If any get back`,
    `into the generator, you`,
    `lose points.  Hit the`,
    `wrong injector ports,`,
    `and you lose points.`,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right to cycle the`,
    `corresponding diverter.`,
    `Form paths for particles`,
    `to follow.`,
    ``,
    ``,
    ``
  ];

  // The four ways a particle can be travelling (the values in particlesB[x][3] below).
  DIR_UP = 0;
  DIR_DOWN = 1;
  DIR_LEFT = 2;
  DIR_RIGHT = 3;

  // The two states a particle can be in (the values in particlesB[x][4] below).  A "dead" particle is one that is
  // waiting inside the generator to come out again.
  ST_DEAD = 0;
  ST_ALIVE = 1;

  // The pictures.  First the background.
  background = `gfx_engineer_background`;

  // The six shapes a diverter can have.  The four numbers that say which shape each diverter has at the moment
  // (top_diverter and so on, below) are indexes into this list: 0 joins the top of the diverter to its left side,
  // 1 the top to the right, 2 the bottom to the right, 3 the bottom to the left, 4 goes straight across and 5 goes
  // straight up and down.
  diverters = [
    `gfx_engineer_diverter_up_left`, `gfx_engineer_diverter_up_right`, `gfx_engineer_diverter_down_right`,
    `gfx_engineer_diverter_down_left`, `gfx_engineer_diverter_horizontal`, `gfx_engineer_diverter_vertical`
  ];

  // The particles: a list for each of the four kinds, holding its two frames of animation.
  particleImgs = [
    [ `gfx_engineer_particle1_00`, `gfx_engineer_particle1_01` ],
    [ `gfx_engineer_particle2_00`, `gfx_engineer_particle2_01` ],
    [ `gfx_engineer_particle3_00`, `gfx_engineer_particle3_01` ],
    [ `gfx_engineer_particle4_00`, `gfx_engineer_particle4_01` ]
  ];

  // The eight pictures of the middle of the generator.  One is chosen at random on every frame, which makes it
  // flicker.
  nucleus = [
    `gfx_engineer_nucleus_1`, `gfx_engineer_nucleus_2`, `gfx_engineer_nucleus_3`, `gfx_engineer_nucleus_4`,
    `gfx_engineer_nucleus_5`, `gfx_engineer_nucleus_6`, `gfx_engineer_nucleus_7`, `gfx_engineer_nucleus_8`
  ];

  // The sounds.
  sfxDiverter = `sfx_engineer_diverter`;
  sfxParticleEmerging = `sfx_engineer_particle_emerging`;
  sfxParticleGood = `sfx_engineer_particle_good`;
  sfxParticleBad = `sfx_engineer_particle_bad`;
  sfxMissed = `sfx_missed`;

  // Where each of the three particles is: a list of points.
  particlesA = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];

  // Which shape each of the four diverters has at the moment: an index into the diverters list above.
  top_diverter = 0;
  bottom_diverter = 0;
  left_diverter = 0;
  right_diverter = 0;

  // Everything else about each of the three particles: a list of numbers for each one.
  //   [x][0] = which kind it is (0 to 3).
  //   [x][1] = which of its two frames of animation is showing (0 or 1).
  //   [x][2] = counts the frames until the animation changes.
  //   [x][3] = which way it is travelling (one of the four DIR values).
  //   [x][4] = whether it is alive (ST_ALIVE) or dead (ST_DEAD).
  //   [x][5] = how many frames are left before it emerges from the generator, when it is dead.
  particlesB = [ [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ] ];

  // How many frames it has been since a particle last emerged from the generator, for the short cut.
  //
  // NOTE: the original never put this back to 0 when a game began, so neither do we.  It makes no difference: the
  // first particle always emerges on the first frame of a game, and that puts it back to 0.
  cheat_time = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`EngineerScene.constructor`);

    super(`EngineerScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`EngineerScene.loadMiniGame()`);

    this.initializeEngineer();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured from the top-left corner of the play area, which is why
   * xadj and yadj (the position of the play area on the screen) are added whenever something is drawn.
   *
   * The pipes are not "known" to the code as such.  A particle simply keeps going the way it is going, one pixel a
   * frame, until it reaches one of a set of "magic" positions (a bend in a pipe, a diverter, an injector port or
   * the generator), where something is done to it.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    // Blit background.
    inBackbuffer.BltFast(xadj, yadj, this.background, null);

    // Blit nucleus.
    inBackbuffer.BltFast(xadj + 74, yadj + 73, this.nucleus[rand() % 8], null);

    // Blit diverters.
    inBackbuffer.BltFast(xadj + 91, yadj + 40, this.diverters[this.top_diverter], null);
    inBackbuffer.BltFast(xadj + 91, yadj + 140, this.diverters[this.bottom_diverter], null);
    inBackbuffer.BltFast(xadj + 40, yadj + 90, this.diverters[this.left_diverter], null);
    inBackbuffer.BltFast(xadj + 141, yadj + 90, this.diverters[this.right_diverter], null);

    // Blit particles and deal with them - this is the meat of it.  There are three particles at most at any given
    // time.
    for (let i = 0; i < 3; i++) {

      if (this.particlesB[i][4] === this.ST_ALIVE) {

        inBackbuffer.BltFast(xadj + this.particlesA[i].x, yadj + this.particlesA[i].y,
          this.particleImgs[this.particlesB[i][0]][this.particlesB[i][1]], null
        );

        // Frame change: every third frame, switch to the other picture.
        this.particlesB[i][2]++;
        if (this.particlesB[i][2] > 2) {
          this.particlesB[i][2] = 0;
          this.particlesB[i][1]++;
          if (this.particlesB[i][1] > 1) {
            this.particlesB[i][1] = 0;
          }
        }

        // Movement: one pixel in the direction it is going.
        switch (this.particlesB[i][3]) {
          case this.DIR_UP: {
            this.particlesA[i].y--;
            break;
          }
          case this.DIR_DOWN: {
            this.particlesA[i].y++;
            break;
          }
          case this.DIR_LEFT: {
            this.particlesA[i].x--;
            break;
          }
          case this.DIR_RIGHT: {
            this.particlesA[i].x++;
            break;
          }
        }

        // See if they sent it back into the generator, subtract from score if so.
        if (this.particlesA[i].x === 95 && this.particlesA[i].y === 94) {
          sndObj.playSound(this.sfxMissed);
          this.subtractFromScore(250);
          // Kill the particle.
          this.particlesB[i][4] = this.ST_DEAD;
          // Pick a time before it emerges as a new particle again.
          this.particlesB[i][5] = rand() % 100;
        }

        // Check for magic coordinates: corner pieces: just changes direction appropriately.  First the four bends
        // in the pipes that lead from the diverters to the injector ports: each can only be reached one way.
        // Top.
        if (this.particlesA[i].x === 95 && this.particlesA[i].y === 12) {
          this.particlesB[i][3] = this.DIR_RIGHT;
        }
        // Bottom.
        if (this.particlesA[i].x === 95 && this.particlesA[i].y === 177) {
          this.particlesB[i][3] = this.DIR_LEFT;
        }
        // Left.
        if (this.particlesA[i].x === 12 && this.particlesA[i].y === 94) {
          this.particlesB[i][3] = this.DIR_UP;
        }
        // Right.
        if (this.particlesA[i].x === 177 && this.particlesA[i].y === 94) {
          this.particlesB[i][3] = this.DIR_DOWN;
        }
        // Then the four corners of the ring, each of which can be reached from either of its two sides.
        // Upper left, moving up.
        if (this.particlesA[i].x === 44 && this.particlesA[i].y === 44 && this.particlesB[i][3] === this.DIR_UP) {
          this.particlesB[i][3] = this.DIR_RIGHT;
        }
        // Upper left, moving left.
        if (this.particlesA[i].x === 44 && this.particlesA[i].y === 44 && this.particlesB[i][3] === this.DIR_LEFT) {
          this.particlesB[i][3] = this.DIR_DOWN;
        }
        // Upper right, moving up.
        if (this.particlesA[i].x === 145 && this.particlesA[i].y === 44 && this.particlesB[i][3] === this.DIR_UP) {
          this.particlesB[i][3] = this.DIR_LEFT;
        }
        // Upper right, moving right.
        if (this.particlesA[i].x === 145 && this.particlesA[i].y === 44 &&
          this.particlesB[i][3] === this.DIR_RIGHT
        ) {
          this.particlesB[i][3] = this.DIR_DOWN;
        }
        // Lower left, moving down.
        if (this.particlesA[i].x === 44 && this.particlesA[i].y === 144 &&
          this.particlesB[i][3] === this.DIR_DOWN
        ) {
          this.particlesB[i][3] = this.DIR_RIGHT;
        }
        // Lower left, moving left.
        if (this.particlesA[i].x === 44 && this.particlesA[i].y === 144 &&
          this.particlesB[i][3] === this.DIR_LEFT
        ) {
          this.particlesB[i][3] = this.DIR_UP;
        }
        // Lower right, moving down.
        if (this.particlesA[i].x === 145 && this.particlesA[i].y === 144 &&
          this.particlesB[i][3] === this.DIR_DOWN
        ) {
          this.particlesB[i][3] = this.DIR_LEFT;
        }
        // Lower right, moving right.
        if (this.particlesA[i].x === 145 && this.particlesA[i].y === 144 &&
          this.particlesB[i][3] === this.DIR_RIGHT
        ) {
          this.particlesB[i][3] = this.DIR_UP;
        }

        // Check for magic coordinates: diverters: change direction accordingly when we hit one.
        // Top diverter.
        if (this.particlesA[i].x === 95 && this.particlesA[i].y === 44) {
          this.particlesB[i][3] = this.changeDir(0, this.particlesB[i][3]);
          // Diverter state not valid when particle arrived, kill it.
          if (this.particlesB[i][3] === -1) {
            // Kill the particle.
            this.particlesB[i][4] = this.ST_DEAD;
            // Pick a time before it emerges as a new particle again.
            this.particlesB[i][5] = rand() % 100;
          }
        }
        // Bottom diverter.
        if (this.particlesA[i].x === 95 && this.particlesA[i].y === 144) {
          this.particlesB[i][3] = this.changeDir(1, this.particlesB[i][3]);
          // Diverter state not valid when particle arrived, kill it.
          if (this.particlesB[i][3] === -1) {
            // Kill the particle.
            this.particlesB[i][4] = this.ST_DEAD;
            // Pick a time before it emerges as a new particle again.
            this.particlesB[i][5] = rand() % 100;
          }
        }
        // Left diverter.
        if (this.particlesA[i].x === 44 && this.particlesA[i].y === 94) {
          this.particlesB[i][3] = this.changeDir(2, this.particlesB[i][3]);
          // Diverter state not valid when particle arrived, kill it.
          if (this.particlesB[i][3] === -1) {
            // Kill the particle.
            this.particlesB[i][4] = this.ST_DEAD;
            // Pick a time before it emerges as a new particle again.
            this.particlesB[i][5] = rand() % 100;
          }
        }
        // Right diverter.
        if (this.particlesA[i].x === 145 && this.particlesA[i].y === 94) {
          this.particlesB[i][3] = this.changeDir(3, this.particlesB[i][3]);
          // Diverter state not valid when particle arrived, kill it.
          if (this.particlesB[i][3] === -1) {
            // Kill the particle.
            this.particlesB[i][4] = this.ST_DEAD;
            // Pick a time before it emerges as a new particle again.
            this.particlesB[i][5] = rand() % 100;
          }
        }

        // Check for magic coordinates: injector ports: if correct one, add to score, otherwise subtract.
        // Top left: the port for particles of kind 0.
        if (this.particlesA[i].x === 12 && this.particlesA[i].y === 12) {
          if (this.particlesB[i][0] === 0) {
            this.addToScore(50);
            sndObj.playSound(this.sfxParticleGood);
          } else {
            this.subtractFromScore(100);
            sndObj.playSound(this.sfxParticleBad);
          }
          // Kill the particle.
          this.particlesB[i][4] = this.ST_DEAD;
          // Pick a time before it emerges as a new particle again.
          this.particlesB[i][5] = rand() % 100;
        }
        // Bottom left: the port for particles of kind 3.
        if (this.particlesA[i].x === 12 && this.particlesA[i].y === 177) {
          if (this.particlesB[i][0] === 3) {
            this.addToScore(50);
            sndObj.playSound(this.sfxParticleGood);
          } else {
            this.subtractFromScore(100);
            sndObj.playSound(this.sfxParticleBad);
          }
          // Kill the particle.
          this.particlesB[i][4] = this.ST_DEAD;
          // Pick a time before it emerges as a new particle again.
          this.particlesB[i][5] = rand() % 100;
        }
        // Top right: the port for particles of kind 1.
        if (this.particlesA[i].x === 177 && this.particlesA[i].y === 12) {
          if (this.particlesB[i][0] === 1) {
            this.addToScore(50);
            sndObj.playSound(this.sfxParticleGood);
          } else {
            this.subtractFromScore(100);
            sndObj.playSound(this.sfxParticleBad);
          }
          // Kill the particle.
          this.particlesB[i][4] = this.ST_DEAD;
          // Pick a time before it emerges as a new particle again.
          this.particlesB[i][5] = rand() % 100;
        }
        // Bottom right: the port for particles of kind 2.
        if (this.particlesA[i].x === 177 && this.particlesA[i].y === 177) {
          if (this.particlesB[i][0] === 2) {
            this.addToScore(50);
            sndObj.playSound(this.sfxParticleGood);
          } else {
            this.subtractFromScore(100);
            sndObj.playSound(this.sfxParticleBad);
          }
          // Kill the particle.
          this.particlesB[i][4] = this.ST_DEAD;
          // Pick a time before it emerges as a new particle again.
          this.particlesB[i][5] = rand() % 100;
        }

      } else {

        // Particle is currently dead.  Count down to the time for it to emerge from the generator.
        this.particlesB[i][5]--;
        if (this.particlesB[i][5] < 0) {
          sndObj.playSound(this.sfxParticleEmerging);
          this.cheat_time = 0;
          this.particlesA[i].x = 95;
          this.particlesA[i].y = 94;
          // It lives!
          this.particlesB[i][4] = this.ST_ALIVE;
          // Time to emerge from the generator.
          this.particlesB[i][5] = 0;
          // Frame change delay.
          this.particlesB[i][2] = 0;
          // Type.
          this.particlesB[i][0] = rand() % 4;
          // State (which frame of the animation it begins on).  Note that the remainder of dividing by 1 is always
          // 0, so every particle begins on its first frame.  That is how the original has it, and the random
          // number is still asked for, as it was there.
          this.particlesB[i][1] = rand() % 1;
          // Direction.
          this.particlesB[i][3] = rand() % 4;
        }

      }

    } /* End for. */

    // Check for a cheat win: three particles going around a closed loop for 10 seconds.  What is actually tested is
    // that the four diverters are set to close the ring (straight across at the top and bottom, straight up and
    // down at the sides) and that no particle has emerged from the generator for 250 frames.  With the ring closed
    // every particle that emerges vanishes at the first diverter it meets and soon emerges again, so that can
    // only be true if all three are going round the ring (or, with a great deal of luck, if the ring was closed
    // only at the last moment).  This only counts in an Adventure game in which the captive has given the hint.
    this.cheat_time++;
    if (gameState.game_mode === gmAdventureGame && gameState.levelHintDone &&
      this.top_diverter === 4 && this.bottom_diverter === 4 && this.left_diverter === 5 &&
      this.right_diverter === 5 && this.cheat_time >= 250
    ) {
      this.addToScore(500);
      gameState.force_game_over = true;
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  Each of UP, DOWN, LEFT and RIGHT changes the diverter on that side of the generator to its
   * next shape, going back to the first after the sixth.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      sndObj.playSound(this.sfxDiverter);
      gameState.player_dir_north = true;
      this.top_diverter++;
      if (this.top_diverter > 5) {
        this.top_diverter = 0;
      }
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      sndObj.playSound(this.sfxDiverter);
      gameState.player_dir_south = true;
      this.bottom_diverter++;
      if (this.bottom_diverter > 5) {
        this.bottom_diverter = 0;
      }
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      sndObj.playSound(this.sfxDiverter);
      gameState.player_dir_west = true;
      this.left_diverter++;
      if (this.left_diverter > 5) {
        this.left_diverter = 0;
      }
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      sndObj.playSound(this.sfxDiverter);
      gameState.player_dir_east = true;
      this.right_diverter++;
      if (this.right_diverter > 5) {
        this.right_diverter = 0;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.
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
   * Initialize.  Puts the four diverters back to their first shape, and puts all three particles inside the
   * generator: the first to emerge at once, the second after 60 frames and the third after 120.
   */
  initializeEngineer() {

    this.top_diverter = 0;
    this.bottom_diverter = 0;
    this.left_diverter = 0;
    this.right_diverter = 0;

    this.particlesB[0][4] = this.ST_DEAD;
    this.particlesB[0][5] = 0;
    this.particlesB[1][4] = this.ST_DEAD;
    this.particlesB[1][5] = 60;
    this.particlesB[2][4] = this.ST_DEAD;
    this.particlesB[2][5] = 120;

  } /* End initializeEngineer(). */


  /**
   * Works out which way a particle goes on from a diverter it has just arrived at.
   *
   * @param  {number} inDiverter Which diverter: 0 for the top one, 1 for the bottom, 2 for the left, 3 for the
   *                             right.
   * @param  {number} inCurrDir  The way the particle is travelling as it arrives: one of the four DIR values.
   * @return {number}            The way it travels on (one of the four DIR values), or -1 if the diverter, in the
   *                             shape it has at the moment, has no opening on the side the particle arrived at.
   */
  changeDir(inDiverter, inCurrDir) {

    let retVal = 0;
    let diverter_state = 0;

    // Get the current state of the appropriate diverter.
    switch (inDiverter) {
      case 0: {
        diverter_state = this.top_diverter;
        break;
      }
      case 1: {
        diverter_state = this.bottom_diverter;
        break;
      }
      case 2: {
        diverter_state = this.left_diverter;
        break;
      }
      case 3: {
        diverter_state = this.right_diverter;
        break;
      }
    }

    // Depending on which direction the particle is moving and the state of the diverter, change the direction
    // appropriately.  A particle moving up arrives at the bottom of the diverter, one moving left arrives at its
    // right side, and so on.
    switch (inCurrDir) {

      case this.DIR_UP: {
        switch (diverter_state) {
          case 0: {
            retVal = -1;
            break;
          }
          case 1: {
            retVal = -1;
            break;
          }
          case 2: {
            retVal = this.DIR_RIGHT;
            break;
          }
          case 3: {
            retVal = this.DIR_LEFT;
            break;
          }
          case 4: {
            retVal = -1;
            break;
          }
          case 5: {
            retVal = this.DIR_UP;
            break;
          }
        }
        break;
      }

      case this.DIR_DOWN: {
        switch (diverter_state) {
          case 0: {
            retVal = this.DIR_LEFT;
            break;
          }
          case 1: {
            retVal = this.DIR_RIGHT;
            break;
          }
          case 2: {
            retVal = -1;
            break;
          }
          case 3: {
            retVal = -1;
            break;
          }
          case 4: {
            retVal = -1;
            break;
          }
          case 5: {
            retVal = this.DIR_DOWN;
            break;
          }
        }
        break;
      }

      case this.DIR_LEFT: {
        switch (diverter_state) {
          case 0: {
            retVal = -1;
            break;
          }
          case 1: {
            retVal = this.DIR_UP;
            break;
          }
          case 2: {
            retVal = this.DIR_DOWN;
            break;
          }
          case 3: {
            retVal = -1;
            break;
          }
          case 4: {
            retVal = this.DIR_LEFT;
            break;
          }
          case 5: {
            retVal = -1;
            break;
          }
        }
        break;
      }

      case this.DIR_RIGHT: {
        switch (diverter_state) {
          case 0: {
            retVal = this.DIR_UP;
            break;
          }
          case 1: {
            retVal = -1;
            break;
          }
          case 2: {
            retVal = -1;
            break;
          }
          case 3: {
            retVal = this.DIR_DOWN;
            break;
          }
          case 4: {
            retVal = this.DIR_RIGHT;
            break;
          }
          case 5: {
            retVal = -1;
            break;
          }
        }
        break;
      }

    }

    return retVal;

  } /* End changeDir(). */


} /* End class. */
