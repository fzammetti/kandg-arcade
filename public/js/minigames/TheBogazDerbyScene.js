/**
 * The mini-game "The Bogaz Derby".  The player drives a hovercar up a three-lane road, seen from above.  Holding
 * ACTION speeds it up and letting go slows it down; LEFT and RIGHT steer.  One other hovercar at a time is on the
 * road ahead, going more slowly: each one overtaken scores 10 points, and running into one costs 50 and ends the
 * game.
 *
 * This is the port of mini_games/the_bogaz_derby.cpp.  Everything that is the same for every mini-game (the frame,
 * the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class TheBogazDerbyScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csTheBogazDerby;
  game_name = `"The Bogaz Derby"`;
  target_score = 200;
  target_score_text = `200`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `The Bogaz Derby`,
    ``,
    `It might not seem like`,
    `it, but racing exotic`,
    `hovercars can be very`,
    `relaxing.`,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Just keep going until`,
    `time runs out,`,
    `avoiding the other`,
    `hovercars.  If you hit`,
    `a hovercar, you lose`,
    `points and the`,
    `game ends.`,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move left and right to`,
    `avoid other hovercars,`,
    `press the ACTION button`,
    `to accelerate, release`,
    `it to slow down.`,
    ``,
    ``,
    ``
  ];

  // The pictures.  The player's car and the other car each have two frames of animation.
  player = [ `gfx_the_bogaz_derby_player_00`, `gfx_the_bogaz_derby_player_01` ];
  enemy = [ `gfx_the_bogaz_derby_enemy_00`, `gfx_the_bogaz_derby_enemy_01` ];
  roadside = `gfx_the_bogaz_derby_side`;
  road = `gfx_the_bogaz_derby_street`;

  // The sounds.
  sfxHonk = `sfx_bogaz_honk`;
  sfxCrash = `sfx_bogaz_crash`;
  sfxCar = `sfx_bogaz_car`;

  // Where the other car is.
  enemy_car = { x: 0, y: 0 };

  // True while ACTION is held.
  accelerate = false;

  // True once the other car has sounded its horn (it does so once, as the player comes up behind it).
  sfxHonkPlaying = false;

  // True while the sound of the player's engine (a sound that goes round and round) is playing, and the sound
  // itself so that it can be stopped.
  //
  // NOTE: the original never cleared its note of the sound when a game began, so neither do we.  It makes no
  // difference: the sound is always stopped when a game ends.
  sfxCarPlaying = false;
  sfxCarhssChannel = null;

  // How far down the road has scrolled, from 0 to 50 pixels, after which it starts again.
  v_offset = 0;

  // How fast the player is going, from 0 (stopped) to 6.
  speed = 0;

  // Which of the two pictures of each car is showing, and the counts of frames until they change.
  player_frame = 0;
  player_frame_delay = 0;
  enemy_frame = 0;
  enemy_frame_delay = 0;

  // Counts the frames between one change of speed and the next.
  speed_change_delay = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`TheBogazDerbyScene.constructor`);

    super(`TheBogazDerbyScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`TheBogazDerbyScene.loadMiniGame()`);

    this.initializeTheBogazDerby();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured from the top-left corner of the play area, which is why
   * xadj and yadj (the position of the play area on the screen) are added whenever something is drawn or tested.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const player_pos = gameState.player_pos;

    // The engine is heard whenever the car is moving.
    if (!this.sfxCarPlaying && this.speed > 0) {
      this.sfxCarPlaying = true;
      this.sfxCarhssChannel = sndObj.playSound(this.sfxCar, true);
    }
    if (this.sfxCarPlaying && this.speed === 0) {
      if (sndObj.isPlaying(this.sfxCarhssChannel)) {
        sndObj.stopSound(this.sfxCarhssChannel);
      }
      this.sfxCarPlaying = false;
    }

    // Deal with collisions.  Note that this comes before anything is drawn, and that nothing at all is drawn on the
    // frame on which the cars are found to have collided.  That is how the original has it.
    const colPoint = Surface.Intersect(
      xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null,
      xadj + this.enemy_car.x, yadj + this.enemy_car.y, this.enemy[this.enemy_frame], null
    );
    if (colPoint.x !== -1 || colPoint.y !== -1) {
      sndObj.playSound(this.sfxCrash);
      this.subtractFromScore(50);
      gameState.force_game_over = true;
      return;
    }

    // Blit roadside and road and move it all, if applicable.  The road is five rows of tiles 50 pixels deep, one
    // row more than fills the play area, drawn a little further down each frame until it has moved a whole tile.
    let y_loc = -50;
    for (let i = 0; i < 5; i++) {
      inBackbuffer.BltFast(xadj + 0, yadj + y_loc + this.v_offset, this.roadside, null);
      inBackbuffer.BltFast(xadj + 25, yadj + y_loc + this.v_offset, this.road, null);
      inBackbuffer.BltFast(xadj + 75, yadj + y_loc + this.v_offset, this.road, null);
      inBackbuffer.BltFast(xadj + 125, yadj + y_loc + this.v_offset, this.road, null);
      inBackbuffer.BltFast(xadj + 175, yadj + y_loc + this.v_offset, this.roadside, null);
      y_loc = y_loc + 50;
    }
    this.v_offset = this.v_offset + this.speed;
    if (this.v_offset > 50) {
      this.v_offset = 0;
    }

    // Blit player and deal with movement and animation.  The car steers faster the faster it is going: one pixel
    // a frame less than its speed, which at the lowest speed is not at all.
    inBackbuffer.BltFast(xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null);
    if (this.accelerate || this.speed > 0) {
      this.player_frame_delay++;
      if (this.player_frame_delay > 1) {
        this.player_frame_delay = 0;
        this.player_frame++;
        if (this.player_frame > 1) {
          this.player_frame = 0;
        }
      }
    }
    if (gameState.player_dir_west && this.speed > 0) {
      player_pos.x = player_pos.x - (this.speed - 1);
      if (player_pos.x < 26) {
        player_pos.x = 26;
      }
    }
    if (gameState.player_dir_east && this.speed > 0) {
      player_pos.x = player_pos.x + (this.speed - 1);
      if (player_pos.x > 124) {
        player_pos.x = 124;
      }
    }

    // Blit enemy car.
    inBackbuffer.BltFast(xadj + this.enemy_car.x, yadj + this.enemy_car.y, this.enemy[this.enemy_frame], null);
    this.enemy_frame_delay++;
    if (this.enemy_frame_delay > 1) {
      this.enemy_frame_delay = 0;
      this.enemy_frame++;
      if (this.enemy_frame > 1) {
        this.enemy_frame = 0;
      }
    }

    // Handle player speed change: one faster every sixth frame while ACTION is held, up to 6, and one slower every
    // sixth frame while it is not, down to 0.
    if (this.accelerate) {
      this.speed_change_delay++;
      if (this.speed_change_delay > 5) {
        this.speed_change_delay = 0;
        this.speed++;
        if (this.speed > 6) {
          this.speed = 6;
        }
      }
    } else {
      this.speed_change_delay++;
      if (this.speed_change_delay > 5) {
        this.speed_change_delay = 0;
        this.speed--;
        if (this.speed < 0) {
          this.speed = 0;
        }
      }
    }

    // Now deal with the enemy car's movement.  It goes up the road at 2 pixels a frame, and the road comes down the
    // screen at the player's speed, so on the screen it comes towards the player only when he is going faster than
    // 2, and draws away from him (off the top, and on and on) when he is going slower.
    // Upward movement of enemy.
    this.enemy_car.y = this.enemy_car.y - 2;
    // Downward movement of enemy.
    this.enemy_car.y = this.enemy_car.y + this.speed;
    if (this.enemy_car.y > 100 && !this.sfxHonkPlaying) {
      this.sfxHonkPlaying = true;
      sndObj.playSound(this.sfxHonk);
    }
    // When the player passes the enemy, reposition it.
    if (this.enemy_car.y > 202) {
      this.sfxHonkPlaying = false;
      this.enemy_car.x = (rand() % 98) + 26;
      this.enemy_car.y = -80;
      this.addToScore(10);
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  ACTION starts the car speeding up; LEFT and RIGHT start it steering.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Action button.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = true;
      this.accelerate = true;
      this.speed_change_delay = 0;
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND takes the player's foot off the accelerator, stops the engine sound and brings up
   * the "Continue Game / Quit Game" popup; letting go of ACTION starts the car slowing down, and letting go of LEFT
   * or RIGHT stops it steering that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.accelerate = false;
      if (sndObj.isPlaying(this.sfxCarhssChannel)) {
        sndObj.stopSound(this.sfxCarhssChannel);
      }
      this.sfxCarPlaying = false;
      this.miniGameCommandButtonHandler();
    }

    // Action button.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
      this.accelerate = false;
      this.speed_change_delay = 0;
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
   * Initialize.  Puts the player's car at rest in the middle lane, and the other car out of sight up the road, in
   * a place across it chosen at random.
   */
  initializeTheBogazDerby() {

    this.v_offset = 0;
    this.speed = 0;
    this.player_frame = 0;
    this.player_frame_delay = 0;
    this.enemy_frame = 0;
    this.enemy_frame_delay = 0;
    gameState.player_pos.x = 75;
    gameState.player_pos.y = 122;
    this.accelerate = false;
    this.speed_change_delay = 0;
    this.enemy_car.x = (rand() % 98) + 26;
    this.enemy_car.y = -80;
    this.sfxHonkPlaying = false;
    this.sfxCarPlaying = false;

  } /* End initializeTheBogazDerby(). */


  /**
   * Stops the engine sound when the mini-game ends.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxCarhssChannel)) {
      sndObj.stopSound(this.sfxCarhssChannel);
    }

  } /* End endMiniGame(). */


} /* End class. */
