/**
 * The mini-game "A Day In The Strife".  Rows of aliens march from side to side across the top of the play area,
 * dropping lower each time they reach an edge and speeding up as their numbers thin.  The player's tank sits at the
 * bottom, moving left and right behind three shields, and ACTION fires a missile straight up.  Two aliens are
 * always shooting back.  Each alien destroyed scores 25 points; being hit costs 50 and starts the wave over.
 *
 * This is the port of mini_games/a_day_in_the_strife.cpp.  Everything that is the same for every mini-game (the
 * frame, the instructions, the clock, the score and so on) is in MiniGameScene.js.
 *
 * A note for anyone comparing this with the original: the original is full of small oddities (for instance, it
 * counts 30 aliens when there are only 18, and it decides when the whole formation should turn round by looking
 * only at the first alien).  These are all part of how the game plays, and they have been kept exactly as they were.
 */
class ADayInTheStrifeScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csADayInTheStrife;
  game_name = `"A Day In The Strife"`;
  target_score = 1000;
  target_score_text = `1,000`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `A Day In The Strife`,
    ``,
    `Pesky hordes of aliens`,
    `keep coming down on you `,
    `in never-ending waves.`,
    `You must fire back and`,
    `destroy them, hiding`,
    `under your shields as`,
    `long as possible.  Don't`,
    `let them touch you!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Blow up as many bad`,
    `guys as you can.  Each`,
    `time you get hit will`,
    `cost you points, but`,
    `you will instantly `,
    `come back for`,
    `more punishment.`,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move left or right, hit`,
    `the ACTION button to fire.`,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``
  ];

  // The states a shield can be in.  The first four are also the number of the picture used to draw it.  (The
  // spellings SEVER and SHIED are the original's.)
  SHIELD_OK = 0;
  SHIELD_MINOR_DAMAGE = 1;
  SHIELD_MEDIUM_DAMAGE = 2;
  SHIELD_SEVER_DAMAGE = 3;
  SHIED_GONE = 4;

  // The directions the aliens can be marching in.
  ALIEN_H_DIR_LEFT = 5;
  ALIEN_H_DIR_RIGHT = 6;

  // The states an alien can be in.
  ALIEN_ALIVE = 7;
  ALIEN_DEAD = 8;
  ALIEN_EXPLODING = 9;

  // The colors an alien can be.  Each row of aliens is a different color.
  ALIEN_RED = 10;
  ALIEN_YELLOW = 11;
  ALIEN_GREEN = 12;

  // The pictures.  Each of the ship and the aliens has two frames of animation.
  background = `gfx_a_day_in_the_strife_background`;
  ship = [ `gfx_a_day_in_the_strife_ship_00`, `gfx_a_day_in_the_strife_ship_01` ];
  green_alien = [ `gfx_a_day_in_the_strife_green_alien_00`, `gfx_a_day_in_the_strife_green_alien_01` ];
  yellow_alien = [ `gfx_a_day_in_the_strife_yellow_alien_00`, `gfx_a_day_in_the_strife_yellow_alien_01` ];
  red_alien = [ `gfx_a_day_in_the_strife_red_alien_00`, `gfx_a_day_in_the_strife_red_alien_01` ];

  // Various versions of the shield, from undamaged to nearly destroyed.
  shield = [
    `gfx_a_day_in_the_strife_shield_00`, `gfx_a_day_in_the_strife_shield_01`,
    `gfx_a_day_in_the_strife_shield_02`, `gfx_a_day_in_the_strife_shield_03`
  ];

  // The two frames of the missile's animation, and the five frames of the explosion's.
  missile = [ `gfx_missile_00`, `gfx_missile_01` ];
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // The sounds.  The tank's engine plays continuously while the game is running.
  sfxTank = `sfx_tank`;
  sfxExplosion = `sfx_explosion`;
  sfxMissileFiring = `sfx_missile_firing`;

  // Where a shield was hit by the player's missile.
  shield_explosion_pos = { x: 0, y: 0 };

  // Coordinates of the player's missile.
  missile_pos = { x: 0, y: 0 };

  // Where the ship was hit.
  ship_explosion_pos = { x: 0, y: 0 };

  // Positions of all our aliens, where each one was hit, and the position of each one's shot.  These, and the other
  // per-alien arrays below, are grids: the first number is the row and the second the column.  Only 3 rows of 6 are
  // actually used, but the grids are made 5 by 8, the size the original declared them.
  alien_pos = [ ];
  alien_explosion_pos = [ ];
  alien_firing_pos = [ ];

  // Positions of the three shields.
  shield_pos = [ ];

  // True while the tank's engine sound is playing.
  tank_sound_playing = false;

  // True while an explosion is showing on a shield.
  shield_exploding = false;

  // True when ship is being blown up.
  ship_exploding = false;

  // True if the missile has been fired.
  missile_fired = false;

  // For each alien, true if its shot is in flight.
  alien_firing = [ ];

  // Which frame of the ship is showing, and a counter used to time its frames.
  ship_frame = 0;
  ship_frame_delay = 0;

  // Index to tell which alien frame to display.
  alien_frame = 0;

  // Slows down the speed of our alien's frame changes (and their marching, which happens when this is zero).
  alien_frame_delay = 0;

  // What horizontal direction the aliens are moving in.
  alien_move_h_dir = 0;

  // Which frame of an alien's explosion is showing.  (There is only the one counter, shared by all the aliens.)
  alien_explosion_frame = 0;

  // How many aliens are left, as the original counted them (see the note at the top of this file).
  aliens_alive = 0;

  // How many alien shots are in flight.
  aliens_firing = 0;

  // Which frame of the ship's (or a shield's) explosion is showing, and a counter that goes with it.
  explosion_frame = 0;
  explosion_frame_delay = 0;

  // Which frame of the missile is showing, and a counter used to time its frames.
  missile_frame = 0;
  missile_frame_delay = 0;

  // The state each alien is in, and the color each alien is.
  alien_states = [ ];
  alien_colors = [ ];

  // The states of the three shields.
  shield_states = [ ];

  // The tank's engine sound while it is playing, so that it can be stopped.  (The original kept the number of the
  // sound channel it was playing on, hence the name.)
  sfxTankhssChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`ADayInTheStrifeScene.constructor`);

    super(`ADayInTheStrifeScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`ADayInTheStrifeScene.loadMiniGame()`);

    // Make the grids that hold one entry per alien: 5 rows of 8, as the original declared them.
    this.alien_pos = [ ];
    this.alien_explosion_pos = [ ];
    this.alien_firing_pos = [ ];
    this.alien_firing = [ ];
    this.alien_states = [ ];
    this.alien_colors = [ ];
    for (let y = 0; y < 5; y++) {
      this.alien_pos.push([ ]);
      this.alien_explosion_pos.push([ ]);
      this.alien_firing_pos.push([ ]);
      this.alien_firing.push([ ]);
      this.alien_states.push([ ]);
      this.alien_colors.push([ ]);
      for (let x = 0; x < 8; x++) {
        this.alien_pos[y].push({ x: 0, y: 0 });
        this.alien_explosion_pos[y].push({ x: 0, y: 0 });
        this.alien_firing_pos[y].push({ x: 0, y: 0 });
        this.alien_firing[y].push(false);
        this.alien_states[y].push(0);
        this.alien_colors[y].push(0);
      }
    }

    // And the lists that hold one entry per shield.
    this.shield_pos = [ ];
    this.shield_states = [ ];
    for (let i = 0; i < 5; i++) {
      this.shield_pos.push({ x: 0, y: 0 });
      this.shield_states.push(0);
    }

    this.shield_explosion_pos = { x: 0, y: 0 };
    this.ship_explosion_pos = { x: 0, y: 0 };
    this.missile_pos = { x: 0, y: 0 };
    this.sfxTankhssChannel = null;

    this.initializeADayInTheStrife();

    this.tank_sound_playing = false;

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

    // Start the tank's engine sound, if it is not already going.
    if (!this.tank_sound_playing) {
      this.tank_sound_playing = true;
      this.sfxTankhssChannel = sndObj.playSound(this.sfxTank, true);
    }

    let destRect = null;
    let colPoint = { x: -1, y: -1 };

    inBackbuffer.BltFast(xadj + 0, yadj + 0, this.background, null);

    // Blit the shields in the correct states.
    for (let i = 0; i < 3; i++) {
      if (this.shield_states[i] !== this.SHIED_GONE) {
        inBackbuffer.BltFast(
          xadj + this.shield_pos[i].x, yadj + this.shield_pos[i].y, this.shield[this.shield_states[i]], null
        );
      }
    }

    // Blit ship and take care of player movements (if not exploding).
    inBackbuffer.BltFast(
      xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
    );
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
      // While it is moving, the ship's tracks are animated.
      if (gameState.player_dir_east || gameState.player_dir_west) {
        this.ship_frame_delay++;
        if (this.ship_frame_delay > 1) {
          this.ship_frame_delay = 0;
          this.ship_frame++;
          if (this.ship_frame > 1) {
            this.ship_frame = 0;
          }
        }
      }
    } else { // Ship is exploding, do that
      // Stretch explosion to 40 in all directions around point of collision.
      destRect = CRect(
        this.ship_explosion_pos.x - 40, this.ship_explosion_pos.y - 40,
        this.ship_explosion_pos.x + 40, this.ship_explosion_pos.y + 40
      );
      inBackbuffer.Blt(destRect, this.explosion[this.explosion_frame], null);
      this.explosion_frame++;
      // When the explosion finishes, get on with the game: everything starts over.
      if (this.explosion_frame > 4) {
        this.initializeADayInTheStrife();
      }
    }

    // Blit missile, update animation frame and stop it if off the screen.
    if (this.missile_fired) {
      inBackbuffer.BltFast(
        xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
      );
      this.missile_pos.y = this.missile_pos.y - 4;
      if (this.missile_pos.y < -16) {
        this.missile_fired = false;
        this.missile_pos.y = 162;
      }
      // Check for collision with shields, destroy it a little if it hits.  (Yes: the player can shoot their own
      // shields to pieces from underneath.)
      for (let j = 0; j < 3; j++) {
        if (this.shield_states[j] !== this.SHIED_GONE) { // Only check shields that are still there
          colPoint = Surface.Intersect(
            xadj + this.shield_pos[j].x, yadj + this.shield_pos[j].y, this.shield[this.shield_states[j]], null,
            xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            sndObj.playSound(this.sfxExplosion);
            this.missile_fired = false;
            this.missile_pos.y = 162;
            this.shield_explosion_pos = colPoint;
            this.shield_exploding = true;
            this.shield_states[j]++;
            if (this.shield_states[j] > this.SHIED_GONE) {
              this.shield_states[j] = this.SHIED_GONE;
            }
          }
        }
      }
    }

    // If a shield is exploding, blit the explosion.
    if (this.shield_exploding) {
      // Stretch explosion to 40 in all directions around point of collision.
      destRect = CRect(
        this.shield_explosion_pos.x - 40, this.shield_explosion_pos.y - 40,
        this.shield_explosion_pos.x + 40, this.shield_explosion_pos.y + 40
      );
      inBackbuffer.Blt(destRect, this.explosion[this.explosion_frame], null);
      this.explosion_frame++;
      // When the explosion finishes, get on with the game.
      if (this.explosion_frame > 4) {
        this.shield_exploding = false;
        this.explosion_frame = 0;
      }
    }

    // Blit and move the aliens.
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 6; x++) {

        if (this.alien_states[y][x] === this.ALIEN_ALIVE) {
          if (this.alien_pos[y][x].y > 180) { // Alien reached the bottom, reset
            this.initializeADayInTheStrife();
            return;
          }
          if (this.alien_colors[y][x] === this.ALIEN_YELLOW) {
            inBackbuffer.BltFast(
              xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.yellow_alien[this.alien_frame], null
            );
          }
          if (this.alien_colors[y][x] === this.ALIEN_GREEN) {
            inBackbuffer.BltFast(
              xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.green_alien[this.alien_frame], null
            );
          }
          if (this.alien_colors[y][x] === this.ALIEN_RED) {
            inBackbuffer.BltFast(
              xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.red_alien[this.alien_frame], null
            );
          }
          // Check for a collision with missile, if applicable.
          if (this.missile_fired) {
            if (this.alien_colors[y][x] === this.ALIEN_YELLOW) {
              colPoint = Surface.Intersect(
                xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.yellow_alien[this.alien_frame], null,
                xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
              );
            }
            if (this.alien_colors[y][x] === this.ALIEN_GREEN) {
              colPoint = Surface.Intersect(
                xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.green_alien[this.alien_frame], null,
                xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
              );
            }
            if (this.alien_colors[y][x] === this.ALIEN_RED) {
              colPoint = Surface.Intersect(
                xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.red_alien[this.alien_frame], null,
                xadj + this.missile_pos.x, yadj + this.missile_pos.y, this.missile[this.missile_frame], null
              );
            }
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              sndObj.playSound(this.sfxExplosion);
              this.alien_explosion_pos[y][x] = colPoint;
              this.alien_states[y][x] = this.ALIEN_EXPLODING;
              this.addToScore(25);
              this.missile_fired = false;
              this.missile_pos.y = 162;
              // Check if all aliens dead.  If so, restart.
              let all_dead = true;
              for (let y1 = 0; y1 < 3; y1++) {
                for (let x1 = 0; x1 < 6; x1++) {
                  if (this.alien_states[y1][x1] === this.ALIEN_ALIVE) {
                    all_dead = false;
                  }
                }
              }
              if (all_dead) {
                this.initializeADayInTheStrife();
              }
            }
          }
        }

        // If alien is exploding, do that.
        if (this.alien_states[y][x] === this.ALIEN_EXPLODING) {
          destRect = CRect(
            this.alien_explosion_pos[y][x].x - 40, this.alien_explosion_pos[y][x].y - 40,
            this.alien_explosion_pos[y][x].x + 40, this.alien_explosion_pos[y][x].y + 40
          );
          inBackbuffer.Blt(destRect, this.explosion[this.alien_explosion_frame], null);
          this.alien_explosion_frame++;
          // When the explosion finishes, get rid of the alien.
          if (this.alien_explosion_frame > 4) {
            this.alien_states[y][x] = this.ALIEN_DEAD;
            this.alien_explosion_frame = 0;
            this.aliens_alive--;
          }
        }

        // Move either left or right.  The aliens only march on the frames when this counter is zero, and the fewer
        // of them are left the further they go each time.
        if (this.alien_frame_delay === 0) {
          let inc_val = 0;
          if (this.aliens_alive >= 1 && this.aliens_alive < 5) {
            inc_val = 6;
          }
          if (this.aliens_alive >= 5 && this.aliens_alive < 10) {
            inc_val = 5;
          }
          if (this.aliens_alive >= 10 && this.aliens_alive < 15) {
            inc_val = 4;
          }
          if (this.aliens_alive >= 15 && this.aliens_alive < 20) {
            inc_val = 3;
          }
          if (this.aliens_alive >= 20 && this.aliens_alive < 25) {
            inc_val = 2;
          }
          if (this.aliens_alive >= 25 && this.aliens_alive <= 30) {
            inc_val = 1;
          }
          if (this.alien_move_h_dir === this.ALIEN_H_DIR_LEFT) {
            this.alien_pos[y][x].x = this.alien_pos[y][x].x - inc_val;
          } else {
            this.alien_pos[y][x].x = this.alien_pos[y][x].x + inc_val;
          }
          // If we reach a bounds on either side, change directions and move them down a bit.  (Note that it is
          // always the position of the FIRST alien, top-left, that is looked at, whichever alien is being moved.)
          if (this.alien_pos[0][0].x < 2) {
            this.alien_move_h_dir = this.ALIEN_H_DIR_RIGHT;
            this.alien_pos[y][x].y = this.alien_pos[y][x].y + 12;
          }
          if (this.alien_pos[0][0].x > 22) {
            this.alien_move_h_dir = this.ALIEN_H_DIR_LEFT;
            this.alien_pos[y][x].y = this.alien_pos[y][x].y + 12;
          }
          // Check for collision with shield.  If a hit, completely destroy shield.
          for (let k = 0; k < 3; k++) {
            // Only check shields that are still there and aliens that are still there.
            if (this.shield_states[k] !== this.SHIED_GONE && this.alien_states[y][x] !== this.ALIEN_DEAD) {
              if (this.alien_colors[y][x] === this.ALIEN_YELLOW) {
                colPoint = Surface.Intersect(
                  xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y,
                  this.yellow_alien[this.alien_frame], null,
                  xadj + this.shield_pos[k].x, yadj + this.shield_pos[k].y, this.shield[this.shield_states[k]], null
                );
              }
              if (this.alien_colors[y][x] === this.ALIEN_GREEN) {
                colPoint = Surface.Intersect(
                  xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y,
                  this.green_alien[this.alien_frame], null,
                  xadj + this.shield_pos[k].x, yadj + this.shield_pos[k].y, this.shield[this.shield_states[k]], null
                );
              }
              if (this.alien_colors[y][x] === this.ALIEN_RED) {
                colPoint = Surface.Intersect(
                  xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y,
                  this.red_alien[this.alien_frame], null,
                  xadj + this.shield_pos[k].x, yadj + this.shield_pos[k].y, this.shield[this.shield_states[k]], null
                );
              }
              if (colPoint.x !== -1 || colPoint.y !== -1) {
                sndObj.playSound(this.sfxExplosion);
                this.shield_states[k] = this.SHIED_GONE;
              }
            }
          }
          // Check for collision with ship.
          if (!this.ship_exploding && this.alien_states[y][x] !== this.ALIEN_DEAD) {
            if (this.alien_colors[y][x] === this.ALIEN_YELLOW) {
              colPoint = Surface.Intersect(
                xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.yellow_alien[this.alien_frame], null,
                xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
              );
            }
            if (this.alien_colors[y][x] === this.ALIEN_GREEN) {
              colPoint = Surface.Intersect(
                xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.green_alien[this.alien_frame], null,
                xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
              );
            }
            if (this.alien_colors[y][x] === this.ALIEN_RED) {
              colPoint = Surface.Intersect(
                xadj + this.alien_pos[y][x].x, yadj + this.alien_pos[y][x].y, this.red_alien[this.alien_frame], null,
                xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
              );
            }
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              sndObj.playSound(this.sfxExplosion);
              this.ship_explosion_pos = colPoint;
              this.ship_exploding = true;
              gameState.player_dir_east = false;
              gameState.player_dir_west = false;
              this.explosion_frame = 0;
              this.subtractFromScore(50);
            }
          }
        }

      }
    }

    // Slow down the frame change.  (The original divided two whole numbers here, which throws away any remainder,
    // and Math.trunc() does the same.)
    this.alien_frame_delay = this.alien_frame_delay + 3;
    if (this.alien_frame_delay > Math.trunc(this.aliens_alive / 2)) {
      this.alien_frame_delay = 0;
      this.alien_frame++;
      if (this.alien_frame > 1) {
        this.alien_frame = 0;
      }
    }

    // For each alien, check if it's firing.  If so, blit it and check for collision with ship.
    for (let y1 = 0; y1 < 3; y1++) {
      for (let x1 = 0; x1 < 6; x1++) {
        if (this.alien_states[y1][x1] !== this.ALIEN_DEAD && this.alien_firing[y1][x1]) {
          // An alien's shot is the missile picture drawn upside down.
          inBackbuffer.Blt(
            CRect(
              xadj + this.alien_firing_pos[y1][x1].x, yadj + this.alien_firing_pos[y1][x1].y,
              xadj + this.alien_firing_pos[y1][x1].x + 6, yadj + this.alien_firing_pos[y1][x1].y + 12
            ),
            this.missile[this.missile_frame], null, { mirrorUpDown: true }
          );
          this.alien_firing_pos[y1][x1].y = this.alien_firing_pos[y1][x1].y + 3;
          if (this.alien_firing_pos[y1][x1].y > 216) {
            this.alien_firing[y1][x1] = false;
            this.aliens_firing--;
          }
          // Check for collision with shields.  A shot that hits a shield is stopped by it (the shield is not
          // damaged).
          for (let j1 = 0; j1 < 3; j1++) {
            if (this.shield_states[j1] !== this.SHIED_GONE) { // Only check shields that are still there
              colPoint = Surface.Intersect(
                xadj + this.shield_pos[j1].x, yadj + this.shield_pos[j1].y, this.shield[this.shield_states[j1]], null,
                xadj + this.alien_firing_pos[y1][x1].x, yadj + this.alien_firing_pos[y1][x1].y,
                this.missile[this.missile_frame], null
              );
              if (colPoint.x !== -1 || colPoint.y !== -1) {
                this.alien_firing[y1][x1] = false;
                this.aliens_firing--;
              }
            }
          }
          // Check for collision with ship.
          if (!this.ship_exploding) {
            colPoint = Surface.Intersect(
              xadj + this.alien_firing_pos[y1][x1].x, yadj + this.alien_firing_pos[y1][x1].y,
              this.missile[this.missile_frame], null,
              xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.ship[this.ship_frame], null
            );
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              sndObj.playSound(this.sfxExplosion);
              this.ship_explosion_pos = colPoint;
              this.ship_exploding = true;
              gameState.player_dir_east = false;
              gameState.player_dir_west = false;
              this.explosion_frame = 0;
              this.subtractFromScore(50);
            }
          }
        }
      }
    }

    // Make sure there's always two aliens firing.
    while (this.aliens_firing < 2) {

      // NOTE: this check is the one place where this mini-game deliberately differs from the original.  Below, an
      // alien is picked at random, over and over, until one is found that is not dead.  But the picking only ever
      // chooses from the first five columns of aliens (the original's "rand() % 5"), and there are six columns.  So
      // if the player destroyed every alien in the first five columns while any in the sixth survived, the original
      // went on picking for ever and the game froze solid.  Here that would freeze the whole browser page.  So we
      // look first: if there is no alien that could be picked, we stop trying, and the survivors simply do not
      // shoot.  In every other situation this makes no difference at all.
      let anyPickable = false;
      for (let y2 = 0; y2 < 3; y2++) {
        for (let x2 = 0; x2 < 5; x2++) {
          if (this.alien_states[y2][x2] !== this.ALIEN_DEAD) {
            anyPickable = true;
          }
        }
      }
      if (!anyPickable) {
        break;
      }

      this.aliens_firing++;
      let x = 0;
      let y = 0;
      let picked = false;
      while (!picked) {
        y = rand() % 3;
        x = rand() % 5;
        if (this.alien_states[y][x] !== this.ALIEN_DEAD) {
          picked = true;
        }
      }
      this.alien_firing[y][x] = true;
      this.alien_firing_pos[y][x].x = this.alien_pos[y][x].x + 12;
      this.alien_firing_pos[y][x].y = this.alien_pos[y][x].y + 20;

    }

    this.missile_frame_delay++;
    if (this.missile_frame_delay > 1) {
      this.missile_frame_delay = 0;
      this.missile_frame++;
      if (this.missile_frame > 1) {
        this.missile_frame = 0;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  LEFT and RIGHT start the ship moving, and ACTION fires the missile.  (Firing again while a
   * missile is still in flight starts it again from the ship.)  Nothing works while the ship is exploding.
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
        sndObj.playSound(this.sfxMissileFiring);
        this.missile_fired = true;
        this.missile_pos.x = gameState.player_pos.x + 14;
        this.missile_pos.y = 162;
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

    // Command button.  The engine sound is silenced while the popup is up; it starts again by itself on the next
    // frame of the game, if the player chooses to continue.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxTankhssChannel)) {
        sndObj.stopSound(this.sfxTankhssChannel);
      }
      this.tank_sound_playing = false;
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
   * Initialize.  Puts everything in its starting position.  This is called when the mini-game loads, and again
   * every time a wave starts over: when the ship has been destroyed, when the aliens reach the bottom, and when the
   * last alien has been shot.
   */
  initializeADayInTheStrife() {

    // Start ship in the middle.
    gameState.player_pos.x = 84;
    gameState.player_pos.y = 166;
    this.ship_frame = 0;

    // Missile setup.
    this.missile_fired = false;
    this.missile_pos.y = 162;

    // Start off with the ship not exploding.
    this.ship_exploding = false;

    // Start shields off at full strength and positioned properly.
    this.shield_states[0] = this.SHIELD_OK;
    this.shield_states[1] = this.SHIELD_OK;
    this.shield_states[2] = this.SHIELD_OK;
    this.shield_pos[0].x = 25;
    this.shield_pos[0].y = 120;
    this.shield_pos[1].x = 85;
    this.shield_pos[1].y = 120;
    this.shield_pos[2].x = 145;
    this.shield_pos[2].y = 120;
    this.shield_exploding = false;

    // Initial positions of our aliens: three rows of six, each row a different color.
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 6; x++) {
        this.alien_pos[y][x].x = 12 + (x * 30);
        this.alien_pos[y][x].y = 4 + (y * 30);
        this.alien_states[y][x] = this.ALIEN_ALIVE;
        this.alien_firing[y][x] = false;
        if (y === 0) {
          this.alien_colors[y][x] = this.ALIEN_YELLOW;
        }
        if (y === 1) {
          this.alien_colors[y][x] = this.ALIEN_GREEN;
        }
        if (y === 2) {
          this.alien_colors[y][x] = this.ALIEN_RED;
        }
      }
    }

    this.alien_frame = 0;
    this.alien_frame_delay = 0;
    this.alien_move_h_dir = this.ALIEN_H_DIR_LEFT;
    this.aliens_alive = 30;
    this.alien_explosion_frame = 0;
    this.aliens_firing = 0;
    this.ship_frame_delay = 0;
    this.missile_frame = 0;
    this.missile_frame_delay = 0;
    this.explosion_frame = 0;
    this.explosion_frame_delay = 0;

  } /* End initializeADayInTheStrife(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the tank's engine.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxTankhssChannel)) {
      sndObj.stopSound(this.sfxTankhssChannel);
    }

  } /* End endMiniGame(). */


} /* End class. */
