/**
 * The mini-game "Reluctant Hero".  The player flies a little rescue craft around a cave in which six colonists
 * are stranded, waving for help.  Touching a colonist picks them up, for 100 points.  Touching the cave wall
 * blows the craft up and puts it back where it started (it costs nothing but time).  The craft sinks slowly
 * whenever it is not being flown up or down.  When all six colonists have been rescued, six more appear.
 *
 * This is the port of mini_games/reluctant_hero.cpp.  Everything that is the same for every mini-game (the frame,
 * the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class ReluctantHeroScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csReluctantHero;
  game_name = `"Reluctant Hero"`;
  target_score = 600;
  target_score_text = `600`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: two lines of page 1 differ from the original, which read "Your not exactly John" and "colonists, and
  // your the".  Both now say "you're", at Frank's request.  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Reluctant Hero`,
    ``,
    `You're not exactly John`,
    `Wayne here, why not just`,
    `leave them to die?`,
    `Because, SOMEONE has`,
    `to rescue the trapped`,
    `colonists, and you're the`,
    `only one around.  Get`,
    `to it!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Pick up as many of the`,
    `colonists as you can.`,
    `Try not to crash into`,
    `the walls, but if`,
    `you do, you'll come`,
    `right back.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Fly up, down, left or`,
    `right.  Touch colonists`,
    `to save them, touch walls`,
    `to blow up.  Uh, wait,`,
    `that's a bad thing...`,
    ``,
    ``,
    ``
  ];

  // Our background image: the cave.  Its walls are solid and the space inside is see-through, which is what the
  // collision test relies on.
  background = `gfx_reluctant_hero_background`;

  // The animation frames for our player (the craft), and for our people (the colonists).
  player = [ `gfx_reluctant_hero_player_00`, `gfx_reluctant_hero_player_01` ];
  person = [ `gfx_reluctant_hero_person_00`, `gfx_reluctant_hero_person_01` ];

  // The five frames of the explosion's animation.
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // The sounds.  The craft's hum plays continuously while the game is running.
  sfxThankYou = `sfx_thank_you`;
  sfxHover = `sfx_ship`;
  sfxExplosion = `sfx_explosion`;

  // Stores the point a collision occurred at.
  exploding_point = { x: 0, y: 0 };

  // Positions of each of the six people to rescue.
  people_pos = [ ];

  // True while the craft's hum is playing.
  sfxHoverPlaying = false;

  // True when player is being blown up.
  exploding = false;

  // Flag for each person to see if they were picked up yet (true) or not.
  people = [ ];

  // Current animation frame of people.
  person_frame = 0;

  // Current animation frame of player, and a counter used to time its frames.
  player_frame = 0;
  player_frame_delay = 0;

  // Slows down people's arm movements.
  person_delay = 0;

  // Counts frames while the player is not flying up or down; every sixth, the craft sinks one pixel.
  gravity = 0;

  // Which frame of the explosion is showing, and a counter used to time its frames.
  explosion_frame = 0;
  explosion_frame_delay = 0;

  // The hum while it is playing, so that it can be stopped.  (The original kept the number of the sound channel
  // it was playing on, hence the name.)
  sfxHoverhssChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`ReluctantHeroScene.constructor`);

    super(`ReluctantHeroScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`ReluctantHeroScene.loadMiniGame()`);

    this.exploding_point = { x: 0, y: 0 };

    this.initializeReluctantHero();

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

    // Start the hum, if it is not already going.
    if (!this.sfxHoverPlaying) {
      this.sfxHoverPlaying = true;
      this.sfxHoverhssChannel = sndObj.playSound(this.sfxHover, true);
    }

    // Blit the background.
    inBackbuffer.BltFast(xadj + 0, yadj + 0, this.background, null);

    // Blit the people, if applicable (those not yet picked up).  They wave: the picture changes every 16 frames.
    for (let i = 0; i < 6; i++) {
      if (!this.people[i]) {
        inBackbuffer.BltFast(
          xadj + this.people_pos[i].x, yadj + this.people_pos[i].y, this.person[this.person_frame], null
        );
      }
    }
    this.person_delay++;
    if (this.person_delay > 15) {
      this.person_delay = 0;
      this.person_frame++;
      if (this.person_frame > 1) {
        this.person_frame = 0;
      }
    }

    // Blit player.  Its picture faces left; it is flipped over to face right for as long as RIGHT is held.
    if (gameState.player_dir_east) {
      // Mirror if facing east.
      const playerRect = CRect(
        xadj + gameState.player_pos.x, yadj + gameState.player_pos.y,
        xadj + gameState.player_pos.x + 32, yadj + gameState.player_pos.y + 32
      );
      inBackbuffer.Blt(playerRect, this.player[this.player_frame], null, { mirrorLeftRight: true });
    } else {
      // Otherwise blit as-is.
      inBackbuffer.BltFast(
        xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player[this.player_frame], null
      );
    }
    // (The counter is never put back to 0, in the original or here, so after the first two frames of a game the
    // picture changes on every frame.)
    this.player_frame_delay++;
    if (this.player_frame_delay > 1) {
      this.player_frame++;
      if (this.player_frame > 1) {
        this.player_frame = 0;
      }
    }

    // Blit explosion, if applicable.
    if (this.exploding) {
      // Stretch explosion to 40 in all directions around point of collision.
      const destRect = CRect(
        this.exploding_point.x - 40, this.exploding_point.y - 40,
        this.exploding_point.x + 40, this.exploding_point.y + 40
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
      // At the explosion's maximum size, hide the player.
      if (ret_val === 99) {
        gameState.player_pos.x = -200;
      }
      // When the explosion finishes, reposition the player and start again.
      if (ret_val === -1) {
        this.exploding = false;
        gameState.player_pos.x = 160;
        gameState.player_pos.y = 158;
      }
    }

    // Handle player movements, if not exploding.
    if (!this.exploding) {
      if (gameState.player_dir_north) {
        gameState.player_pos.y--;
      }
      if (gameState.player_dir_south) {
        gameState.player_pos.y++;
      }
      if (gameState.player_dir_east) {
        gameState.player_pos.x++;
      }
      if (gameState.player_dir_west) {
        gameState.player_pos.x--;
      }
      // Gravity: when the player is flying neither up nor down, the craft sinks a pixel every sixth frame.
      if (!gameState.player_dir_north && !gameState.player_dir_south) {
        this.gravity++;
        if (this.gravity > 5) {
          this.gravity = 0;
          gameState.player_pos.y++;
        }
      }
    }

    // Check for collision with the walls, if not exploding.
    if (!this.exploding) {
      const colPoint = Surface.Intersect(
        xadj + 0, yadj + 0, this.background, null,
        xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player[this.player_frame], null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        sndObj.playSound(this.sfxExplosion);
        this.exploding = true;
        this.exploding_point = colPoint;
        // Make sure all movements cease too.
        gameState.player_dir_north = false;
        gameState.player_dir_south = false;
        gameState.player_dir_east = false;
        gameState.player_dir_west = false;
      }
    }

    // Check for collision with people, if not exploding.
    if (!this.exploding) {
      for (let i = 0; i < 6; i++) {
        // Only check people who haven't been picked up yet.
        if (!this.people[i]) {
          const colPoint = Surface.Intersect(
            xadj + this.people_pos[i].x, yadj + this.people_pos[i].y, this.person[this.person_frame], null,
            xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.player[this.player_frame], null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            sndObj.playSound(this.sfxThankYou);
            this.people[i] = true;
            this.addToScore(100);
          }
        }
      }
    }

    // If all six people picked up, reset them and the player's position.
    if (this.people[0] && this.people[1] && this.people[2] && this.people[3] && this.people[4] && this.people[5]) {
      this.people[0] = false;
      this.people[1] = false;
      this.people[2] = false;
      this.people[3] = false;
      this.people[4] = false;
      this.people[5] = false;
      gameState.player_pos.x = 160;
      gameState.player_pos.y = 158;
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT start the craft flying that way.  Nothing works while the craft
   * is exploding.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (!this.exploding) {

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

    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of a direction stops
   * the craft flying that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.  The hum is silenced while the popup is up; it starts again by itself on the next frame of
    // the game, if the player chooses to continue.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxHoverhssChannel)) {
        sndObj.stopSound(this.sfxHoverhssChannel);
      }
      this.sfxHoverPlaying = false;
      this.miniGameCommandButtonHandler();
    }

    if (!this.exploding) {

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

    }

  } /* End ku(). */


  /**
   * Initialize.  Puts everything in its starting position.
   */
  initializeReluctantHero() {

    // Start player in the bottom right-hand corner.
    gameState.player_pos.x = 160;
    gameState.player_pos.y = 158;
    this.player_frame = 0;
    this.player_frame_delay = 0;
    this.gravity = 0;

    // Set people to not picked up.
    this.people = [ false, false, false, false, false, false ];
    this.person_delay = 0;
    this.person_frame = 0;

    // Positions of the people.
    this.people_pos = [
      { x: 186, y: 63 }, { x: 105, y: 46 }, { x: 87, y: 138 }, { x: 50, y: 175 }, { x: 20, y: 145 }, { x: 43, y: 38 }
    ];

    // Start off not exploding the player.
    this.exploding = false;

    this.sfxHoverPlaying = false;
    this.sfxHoverhssChannel = null;

  } /* End initializeReluctantHero(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the hum.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxHoverhssChannel)) {
      sndObj.stopSound(this.sfxHoverhssChannel);
    }

  } /* End endMiniGame(). */


} /* End class. */
