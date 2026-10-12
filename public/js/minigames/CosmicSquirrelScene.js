/**
 * The mini-game "Cosmic Squirrel".  A giant space squirrel starts at the bottom of the play area and has to cross
 * four lanes of traffic (aliens, ships, tumbling asteroids and comets, all flying from side to side) to reach an
 * acorn at the top.  The player moves the squirrel with UP, DOWN, LEFT and RIGHT.  Reaching the acorn scores 250
 * points and puts a new acorn somewhere else along the top; being hit costs 100 points.  Either way the squirrel
 * goes back to the start.
 *
 * This is the port of mini_games/cosmic_squirrel.cpp.  Everything that is the same for every mini-game (the frame,
 * the instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class CosmicSquirrelScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csCosmicSquirrel;
  game_name = `"Cosmic Squirrel"`;
  target_score = 1000;
  target_score_text = `1,000`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Cosmic Squirrel`,
    ``,
    `What are they feeding`,
    `those things?!?  Here`,
    `you play the part of a`,
    `giant space-born squirrel,`,
    `just trying to get`,
    `across the interstellar`,
    `freeway to get your`,
    `planet-sized acorn.`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Get the acorn as many`,
    `times as you can until`,
    `time runs out.  Each`,
    `time you get hit by`,
    `something, you lose`,
    `points.`,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right to get the squirrel`,
    `safely through the`,
    `obstacles and to the`,
    `giant acorn.`,
    ``,
    ``,
    ``
  ];

  // The two directions an obstacle can be flying in.
  LEFT = 1;
  RIGHT = 2;

  // Our acorn image.
  acorn = `gfx_cosmic_squirrel_acorn`;

  // Our flying alien image, our flying ship image and our comet image.  Each has two frames of animation.  (The
  // ship is borrowed from another mini-game, Defen'DOH!.)
  alien = [ `gfx_cosmic_squirrel_alien_00`, `gfx_cosmic_squirrel_alien_01` ];
  ship = [ `gfx_defendoh_ship_00`, `gfx_defendoh_ship_01` ];
  comet = [ `gfx_cosmic_squirrel_comet_00`, `gfx_cosmic_squirrel_comet_01` ];

  // Frames of animation of our squirrel.
  squirrel = [ `gfx_cosmic_squirrel_squirrel_00`, `gfx_cosmic_squirrel_squirrel_01` ];

  // Stores the images of our eight obstacles as they look right now.  Obstacles 0 and 1 are the aliens, 2 and 3 the
  // ships, 4 and 5 the asteroids (borrowed from Flight Of Doom) and 6 and 7 the comets.  The entries for the
  // aliens, ships and comets are swapped between their two frames as the game runs.
  obstacles = [ ];

  // The sounds.  The walking sound plays continuously while the squirrel is moving.
  sfxChomp = `sfx_chomp`;
  sfxSplat = `sfx_splat`;
  sfxWalking = `sfx_cosmic_squirrel_walking`;

  // Position of the acorn.
  acorn_pos = { x: 0, y: 0 };

  // Stores the positions of our eight obstacles.
  obstacles_pos = [ ];

  // Only generate starfield coordinates once (per game).
  starfield_generated = false;

  // Only position obstacles once (per game).
  obstacles_positioned = false;

  // Set to true when player just died, so that the acorn stays where it is.
  just_died = false;

  // True while the squirrel is on the move and its walking sound is wanted.
  walkingPlaying = false;

  // Starfield X and Y coordinates.
  stars_x = [ ];
  stars_y = [ ];

  // Which frame of each kind of obstacle is showing, and a counter for each that times its frames.
  alien_frame = 0;
  alien_frame_delay = 0;
  ship_frame = 0;
  ship_frame_delay = 0;
  comet_frame = 0;
  comet_frame_delay = 0;

  // Index into squirrel image array, and a counter that times its frames.
  squirrel_frame = 0;
  squirrel_frame_delay = 0;

  // Stores the direction of travel of our eight obstacles (LEFT or RIGHT).
  obstacles_dir = [ ];

  // Stores the speed of our eight obstacles, in pixels a frame.
  obstacles_speed = [ ];

  // The walking sound while it is playing, so that it can be stopped.  (The original kept the number of the sound
  // channel it was playing on, hence the name.)
  walkinghssChannel = null;

  // Used to rotate the asteroids, in hundredths of a degree.
  asteroid_rotation_angle = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`CosmicSquirrelScene.constructor`);

    super(`CosmicSquirrelScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`CosmicSquirrelScene.loadMiniGame()`);

    // Make the lists that hold one entry per obstacle (ten entries, the size the original declared them, although
    // there are only eight obstacles).
    this.obstacles_pos = [ ];
    this.obstacles_dir = [ ];
    this.obstacles_speed = [ ];
    for (let i = 0; i < 10; i++) {
      this.obstacles_pos.push({ x: 0, y: 0 });
      this.obstacles_dir.push(0);
      this.obstacles_speed.push(0);
    }

    // And the lists that hold one entry per star (52 entries declared, 50 used).
    this.stars_x = [ ];
    this.stars_y = [ ];
    for (let i = 0; i < 52; i++) {
      this.stars_x.push(0);
      this.stars_y.push(0);
    }

    this.acorn_pos = { x: 0, y: 0 };
    this.walkinghssChannel = null;
    this.just_died = false;

    // So the starfield will be generated, and the obstacles put in their starting positions, by the call to
    // initializeCosmicSquirrel() below.  (The original did this when the mini-game was unloaded, ready for the next
    // time; doing it here comes to the same thing.)
    this.obstacles_positioned = false;
    this.starfield_generated = false;

    this.initializeCosmicSquirrel();

    // Every obstacle starts on its first frame.  The asteroids have only the one picture.
    this.obstacles = [
      this.alien[0], this.alien[0], this.ship[0], this.ship[0],
      `gfx_flight_of_doom_asteroid`, `gfx_flight_of_doom_asteroid`, this.comet[0], this.comet[0]
    ];

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

    // Starfield.  Each star is a square of four white pixels.
    for (let i = 0; i < 50; i++) {
      inBackbuffer.SetPixel(xadj + this.stars_x[i], yadj + this.stars_y[i], RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i] + 1, yadj + this.stars_y[i], RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i], yadj + this.stars_y[i] + 1, RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + this.stars_x[i] + 1, yadj + this.stars_y[i] + 1, RGB(255, 255, 255));
    }

    // Blit acorn.
    inBackbuffer.BltFast(xadj + this.acorn_pos.x, yadj + this.acorn_pos.y, this.acorn, null);

    // Blit obstacles and update positions.
    for (let i = 0; i < 8; i++) {
      if (i === 4 || i === 5) { // Handle asteroids differently so we can rotate them
        inBackbuffer.Blt(
          CRect(
            xadj + this.obstacles_pos[i].x, yadj + this.obstacles_pos[i].y,
            xadj + this.obstacles_pos[i].x + 32, yadj + this.obstacles_pos[i].y + 32
          ),
          this.obstacles[i], null, { nRotationAngle: this.asteroid_rotation_angle }
        );
        // Rotate 360 degrees in 1/100th of a degree increments.  (This is done once for each of the two asteroids,
        // so they turn 7.2 degrees a frame between them, and the second is always 3.6 degrees ahead of the first.)
        this.asteroid_rotation_angle = this.asteroid_rotation_angle + 360;
        if (this.asteroid_rotation_angle > 36000) {
          this.asteroid_rotation_angle = 0;
        }
      } else { // Other obstacles
        inBackbuffer.BltFast(xadj + this.obstacles_pos[i].x, yadj + this.obstacles_pos[i].y, this.obstacles[i], null);
      }
      if (this.obstacles_dir[i] === this.LEFT) {
        this.obstacles_pos[i].x = this.obstacles_pos[i].x - this.obstacles_speed[i];
      }
      if (this.obstacles_dir[i] === this.RIGHT) {
        this.obstacles_pos[i].x = this.obstacles_pos[i].x + this.obstacles_speed[i];
      }
      // An obstacle that has gone right off one side comes back on at the other.
      if (i !== 6 && i !== 7) { // The comets have to be handled differently because of their size
        if (this.obstacles_pos[i].x < -40) {
          this.obstacles_pos[i].x = 240;
        }
      } else {
        if (this.obstacles_pos[i].x < -70) {
          this.obstacles_pos[i].x = 240;
        }
      }
      if (this.obstacles_pos[i].x > 240) {
        this.obstacles_pos[i].x = -40;
      }
    }

    // Update obstacle animations.
    this.ship_frame_delay++;
    if (this.ship_frame_delay > 1) {
      this.ship_frame_delay = 0;
      this.ship_frame++;
      if (this.ship_frame > 1) {
        this.ship_frame = 0;
      }
      this.obstacles[2] = this.ship[this.ship_frame];
      this.obstacles[3] = this.ship[this.ship_frame];
    }
    this.alien_frame_delay++;
    if (this.alien_frame_delay > 3) {
      this.alien_frame_delay = 0;
      this.alien_frame++;
      if (this.alien_frame > 1) {
        this.alien_frame = 0;
      }
      this.obstacles[0] = this.alien[this.alien_frame];
      this.obstacles[1] = this.alien[this.alien_frame];
    }
    this.comet_frame_delay++;
    if (this.comet_frame_delay > 3) {
      this.comet_frame_delay = 0;
      this.comet_frame++;
      if (this.comet_frame > 1) {
        this.comet_frame = 0;
      }
      this.obstacles[6] = this.comet[this.comet_frame];
      this.obstacles[7] = this.comet[this.comet_frame];
    }

    // Blit squirrel.  The picture of the squirrel faces up the screen, and it is turned to face the way the
    // squirrel is going.  The angles are in hundredths of a degree, measured clockwise.
    const rect = CRect(
      xadj + gameState.player_pos.x, yadj + gameState.player_pos.y,
      xadj + gameState.player_pos.x + 18, yadj + gameState.player_pos.y + 18
    );
    const north = gameState.player_dir_north;
    const south = gameState.player_dir_south;
    const east = gameState.player_dir_east;
    const west = gameState.player_dir_west;
    if (!north && !south && !east && !west) { // No movement
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 0 });
    }
    if (north && !south && !east && !west) { // North
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 0 });
    }
    if (!north && south && !east && !west) { // South
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 18000 });
    }
    if (!north && !south && east && !west) { // East
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 9000 });
    }
    if (!north && !south && !east && west) { // West
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 27000 });
    }
    if (north && !south && east && !west) { // NorthEast
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 4500 });
    }
    if (north && !south && !east && west) { // NorthWest
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 31500 });
    }
    if (!north && south && east && !west) { // SouthEast
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 13500 });
    }
    if (!north && south && !east && west) { // SouthWest
      inBackbuffer.Blt(rect, this.squirrel[this.squirrel_frame], null, { nRotationAngle: 22500 });
    }

    // Handle player movements.  The squirrel moves two pixels a frame and cannot leave the play area.
    let update_frame = false;
    if (gameState.player_dir_north) {
      gameState.player_pos.y = gameState.player_pos.y - 2;
      if (gameState.player_pos.y < 2) {
        gameState.player_pos.y = 2;
      }
      update_frame = true;
    }
    if (gameState.player_dir_south) {
      gameState.player_pos.y = gameState.player_pos.y + 2;
      if (gameState.player_pos.y > 180) {
        gameState.player_pos.y = 180;
      }
      update_frame = true;
    }
    if (gameState.player_dir_east) {
      gameState.player_pos.x = gameState.player_pos.x + 2;
      if (gameState.player_pos.x > 180) {
        gameState.player_pos.x = 180;
      }
      update_frame = true;
    }
    if (gameState.player_dir_west) {
      gameState.player_pos.x = gameState.player_pos.x - 2;
      if (gameState.player_pos.x < 2) {
        gameState.player_pos.x = 2;
      }
      update_frame = true;
    }
    // While it is moving, the squirrel's legs are animated.
    if (update_frame) {
      this.squirrel_frame_delay++;
      if (this.squirrel_frame_delay > 1) {
        this.squirrel_frame_delay = 0;
        this.squirrel_frame++;
        if (this.squirrel_frame > 1) {
          this.squirrel_frame = 0;
        }
      }
    }

    // Check for collision with acorn.  (Note that the collision checks use the picture of the squirrel as it is
    // stored, facing up, whichever way it has been drawn.)
    let colPoint = Surface.Intersect(
      xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.squirrel[this.squirrel_frame], null,
      xadj + this.acorn_pos.x, yadj + this.acorn_pos.y, this.acorn, null
    );
    if (colPoint.x !== -1 || colPoint.y !== -1) {
      if (this.walkingPlaying) {
        this.walkingPlaying = false;
        if (sndObj.isPlaying(this.walkinghssChannel)) {
          sndObj.stopSound(this.walkinghssChannel);
        }
        this.walkinghssChannel = null;
      }
      sndObj.playSound(this.sfxChomp);
      this.addToScore(250);
      // Back to the start, with a new acorn.  The squirrel stands still until a direction is pressed again.
      this.initializeCosmicSquirrel();
      gameState.player_dir_north = false;
      gameState.player_dir_south = false;
      gameState.player_dir_east = false;
      gameState.player_dir_west = false;
    }

    // Check for collisions with obstacles.
    for (let i = 0; i < 8; i++) {
      colPoint = Surface.Intersect(
        xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.squirrel[this.squirrel_frame], null,
        xadj + this.obstacles_pos[i].x, yadj + this.obstacles_pos[i].y, this.obstacles[i], null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        if (this.walkingPlaying) {
          sndObj.stopSound(this.walkinghssChannel);
          this.walkingPlaying = false;
        }
        sndObj.playSound(this.sfxSplat);
        this.subtractFromScore(100);
        // Back to the start.  Setting just_died makes initializeCosmicSquirrel() leave the acorn where it is.
        this.just_died = true;
        this.initializeCosmicSquirrel();
        gameState.player_dir_north = false;
        gameState.player_dir_south = false;
        gameState.player_dir_east = false;
        gameState.player_dir_west = false;
      }
    }

    if (
      gameState.player_dir_north || gameState.player_dir_south || gameState.player_dir_east || gameState.player_dir_west
    ) {
      // See if the walking sound is actually playing.  If it's NOT, then play it and keep hold of it.
      if (!sndObj.isPlaying(this.walkinghssChannel)) {
        this.walkinghssChannel = sndObj.playSound(this.sfxWalking, true);
      }
      this.walkingPlaying = true;
    } else {
      if (this.walkingPlaying) {
        // Player is NOT walking, so if the walking sound is playing, stop it.
        sndObj.stopSound(this.walkinghssChannel);
        this.walkingPlaying = false;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT start the squirrel moving that way.  Two directions can be held
   * at once to move diagonally; pressing a direction cancels its opposite.
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
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of a direction stops
   * the squirrel moving that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.  The walking sound is silenced while the popup is up.
    if (inKey === gameState.kCommand) {
      sndObj.stopSound(this.walkinghssChannel);
      this.walkingPlaying = false;
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
   * Initialize.  Puts the squirrel back at the start.  This is called when the mini-game loads, and again every
   * time the squirrel reaches the acorn or is hit.  Some of what it does is only done the first time it is called
   * in a game (making the starfield and placing the obstacles), and the acorn is only moved if the squirrel was
   * not hit.
   */
  initializeCosmicSquirrel() {

    // Generate initial starfield, if first time through.
    if (!this.starfield_generated) {
      for (let i = 0; i < 50; i++) {
        this.stars_x[i] = (rand() % 199) + 1; // X coordinate (1-199)
        this.stars_y[i] = (rand() % 199) + 1; // Y coordinate (1-199)
      }
      this.starfield_generated = true;
    }

    // Player's initial position and animation frame.
    gameState.player_pos.x = 91;
    gameState.player_pos.y = 180;
    this.squirrel_frame = 0;
    this.squirrel_frame_delay = 0;

    // Acorn's random position.
    if (!this.just_died) { // Don't do this if we just died
      this.acorn_pos.x = (rand() % 180) + 1;
      this.acorn_pos.y = 2;
    }
    this.just_died = false;

    this.walkingPlaying = false;

    this.ship_frame = 0;
    this.ship_frame_delay = 0;
    this.alien_frame = 0;
    this.alien_frame_delay = 0;
    this.comet_frame = 0;
    this.comet_frame_delay = 0;

    // Obstacle positions and speeds, if first time through.  From the top of the screen down there is a lane of
    // two aliens, a lane of two ships, a lane of two asteroids and a lane of two comets.
    if (!this.obstacles_positioned) {
      this.asteroid_rotation_angle = 0;
      this.obstacles_pos[0].x = 170;
      this.obstacles_pos[0].y = 30;
      this.obstacles_dir[0] = this.RIGHT;
      this.obstacles_speed[0] = 5;
      this.obstacles_pos[1].x = 80;
      this.obstacles_pos[1].y = 30;
      this.obstacles_dir[1] = this.RIGHT;
      this.obstacles_speed[1] = 5;
      this.obstacles_pos[2].x = 110;
      this.obstacles_pos[2].y = 60;
      this.obstacles_dir[2] = this.LEFT;
      this.obstacles_speed[2] = 2;
      this.obstacles_pos[3].x = 10;
      this.obstacles_pos[3].y = 60;
      this.obstacles_dir[3] = this.LEFT;
      this.obstacles_speed[3] = 2;
      this.obstacles_pos[4].x = 80;
      this.obstacles_pos[4].y = 90;
      this.obstacles_dir[4] = this.RIGHT;
      this.obstacles_speed[4] = 4;
      this.obstacles_pos[5].x = 140;
      this.obstacles_pos[5].y = 90;
      this.obstacles_dir[5] = this.RIGHT;
      this.obstacles_speed[5] = 4;
      this.obstacles_pos[6].x = 240;
      this.obstacles_pos[6].y = 130;
      this.obstacles_dir[6] = this.LEFT;
      this.obstacles_speed[6] = 3;
      this.obstacles_pos[7].x = 70;
      this.obstacles_pos[7].y = 130;
      this.obstacles_dir[7] = this.LEFT;
      this.obstacles_speed[7] = 3;
      this.obstacles_positioned = true;
    }

  } /* End initializeCosmicSquirrel(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the walking sound.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.walkinghssChannel)) {
      sndObj.stopSound(this.walkinghssChannel);
    }

  } /* End endMiniGame(). */


} /* End class. */
