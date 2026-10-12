/**
 * The mini-game "Muncher Dude".  A maze, with a white dot in every square of it that is not wall.  The player is a
 * blob that eats the dots, for 10 points each; three aliens wander the maze, turning a way chosen at random each
 * time they bump into something, and take no notice of the player at all.  Touching one of them ends the game.
 * When every dot has been eaten the maze is filled again and the aliens go back to where they began.
 *
 * This is the port of mini_games/muncher_dude.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class MuncherDudeScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csMuncherDude;
  game_name = `"Muncher Dude"`;
  target_score = 750;
  target_score_text = `750`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: three lines of page 1 differ from the original, at Frank's request.  It read "Your hungry, your",
  // "starving, your a" and "a blob of some sort!"; these now say "You're" each time, and the "a" that was there
  // twice is there once.  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Muncher Dude`,
    ``,
    `You're hungry, you're`,
    `starving, you're a`,
    `blob of some sort!`,
    `And what does a`,
    `blob of some sort`,
    `eat?  Why, the typical`,
    `plain white dot of`,
    `course, what else?!?`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Eat as many dots as you`,
    `can while avoiding the`,
    `brain-dead aliens.  They`,
    `are slow and just kinda`,
    `wander around, oblivious`,
    `to your presence, but`,
    `a single touch kills, so`,
    `don't take them lightly!`,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left and`,
    `right, avoiding the`,
    `stupid aliens and eating`,
    `up all the dots.`,
    ``,
    ``,
    ``,
    ``
  ];

  // The four ways an alien can be going (the values of an alien's direction below).
  D_NORTH = 0;
  D_SOUTH = 1;
  D_WEST = 2;
  D_EAST = 3;

  // The pictures.  The maze is one picture the size of the play area, see-through wherever there is no wall.  The
  // player and the aliens have two frames of animation each.
  background = `gfx_muncher_dude_background`;
  pellet = `gfx_muncher_dude_pellet`;
  player = [ `gfx_muncher_dude_player_00`, `gfx_muncher_dude_player_01` ];
  imgAliens = [ `gfx_muncher_dude_alien_00`, `gfx_muncher_dude_alien_01` ];

  // The sounds.  The sound of the aliens goes round and round for as long as the game is being played.
  sfxBite = `sfx_muncher_dude_bite`;
  sfxAliens = `sfx_muncher_dude_aliens`;

  // The three aliens.  For each: where it is in the play area, which way it is going (one of the four D values),
  // which of its two pictures is showing, and the count of frames until that changes.  (The original also kept,
  // for each alien, a state and counts for being eaten and for reappearing, and never used any of them.)
  aliens = [
    { position: { x: 0, y: 0 }, direction: 0, frame: 0, frameDelay: 0 },
    { position: { x: 0, y: 0 }, direction: 0, frame: 0, frameDelay: 0 },
    { position: { x: 0, y: 0 }, direction: 0, frame: 0, frameDelay: 0 }
  ];

  // Whether the player is facing west (the player's pictures face east, and are flipped over when this is set).
  facing_west = false;

  // Whether the sound of the aliens has been started, and the playing sound itself, so that it can be stopped.
  alien_sound_playing = false;
  sfxAlienshssChannel = null;

  // Which of the player's two pictures is showing, and the count of frames until it changes.
  player_frame = 0;
  player_frame_delay = 0;

  // The dots: ten rows of ten, one for each 20-pixel square of the play area.  0 = covered by wall (or eaten),
  // 1 = still there.
  pellet_array = this.newPelletArray();


  /**
   * Constructor.
   */
  constructor() {

    console.log(`MuncherDudeScene.constructor`);

    super(`MuncherDudeScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`MuncherDudeScene.loadMiniGame()`);

    this.initializeMuncherDude();

    // The player begins in the top left corner, facing east.
    gameState.player_pos.x = 0;
    gameState.player_pos.y = 0;
    this.player_frame = 0;
    this.player_frame_delay = 0;
    this.facing_west = false;

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const aliens = this.aliens;
    const pellet_array = this.pellet_array;
    const player_pos = gameState.player_pos;

    // Start the sound of the aliens if it is not already going.  (It stops while the COMMAND popup is up.)
    //
    // NOTE: initializeMuncherDude() says the sound is not going, and it is called again each time the maze is
    // emptied.  So from then on a second copy of the sound plays on top of the first (and a third after the next
    // maze, and so on), and COMMAND stops only the newest.  That is how the original has it.
    if (!this.alien_sound_playing) {
      this.alien_sound_playing = true;
      this.sfxAlienshssChannel = sndObj.playSound(this.sfxAliens, true);
    }

    // Blit background.
    inBackbuffer.BltFast(xadj, yadj, this.background, null);

    // Blit grid of pellets.
    let colPoint;
    let xVal;
    let yVal;
    for (let y = 0; y < 10; y++) {
      yVal = yadj + (y * 20);
      for (let x = 0; x < 10; x++) {
        xVal = xadj + (x * 20);
        // See if the pellet would be hidden by a wall.
        colPoint = Surface.Intersect(xVal, yVal, this.pellet, null, xadj, yadj, this.background, null);
        if (colPoint.x === -1 && colPoint.y === -1) {
          // Nope, we can draw it, but only if it's still there.
          if (pellet_array[y][x] === 1) {
            inBackbuffer.BltFast(xadj + (x * 20), yVal, this.pellet, null);
          }
        } else {
          // Pellet is covered by a wall, set the value so we know later.
          pellet_array[y][x] = 0;
        }
      }
    }

    // Blit player and animate it.  (It is only ever the picture that is flipped over: what the player is taken to
    // be touching, further down, is worked out from the picture as it is when facing east.)
    const playerRect = CRect(
      xadj + player_pos.x, yadj + player_pos.y, xadj + player_pos.x + 20, yadj + player_pos.y + 20
    );
    if (this.facing_west) {
      inBackbuffer.Blt(playerRect, this.player[this.player_frame], null, { mirrorLeftRight: true });
    } else {
      inBackbuffer.Blt(playerRect, this.player[this.player_frame], null);
    }

    if (
      gameState.player_dir_north || gameState.player_dir_south || gameState.player_dir_east ||
      gameState.player_dir_west
    ) {
      this.player_frame_delay++;
      if (this.player_frame_delay > 2) {
        this.player_frame_delay = 0;
        this.player_frame++;
        if (this.player_frame > 1) {
          this.player_frame = 0;
        }
      }
    }

    // Blit aliens and animate them, also check for collision with player and end game if one occurs.
    for (let i = 0; i < 3; i++) {
      const alien = aliens[i];
      const alienRect = CRect(
        xadj + alien.position.x, yadj + alien.position.y, xadj + alien.position.x + 20, yadj + alien.position.y + 20
      );
      if (alien.direction === this.D_EAST) {
        inBackbuffer.Blt(alienRect, this.imgAliens[alien.frame], null);
      } else {
        inBackbuffer.Blt(alienRect, this.imgAliens[alien.frame], null, { mirrorLeftRight: true });
      }
      // Animate alien.
      alien.frameDelay++;
      if (alien.frameDelay > 2) {
        alien.frameDelay = 0;
        alien.frame++;
        if (alien.frame > 1) {
          alien.frame = 0;
        }
      }
      // Move alien: one pixel the way it is going.  If that takes it off the edge of the play area or into a wall
      // it is put back, and picks a way to go at random (which may be the way it was going already, or straight
      // back into the same wall).
      let changeDir = false;
      switch (alien.direction) {
        case this.D_EAST: {
          // A move MIGHT be valid, see if we'll hit a wall.  If not, go ahead and move.
          changeDir = false;
          alien.position.x++;
          if (alien.position.x > 180) {
            alien.position.x = 180;
            changeDir = true;
          }
          colPoint = Surface.Intersect(
            xadj + alien.position.x, yadj + alien.position.y, this.imgAliens[alien.frame], null,
            xadj, yadj, this.background, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            alien.position.x--;
            changeDir = true;
          }
          if (changeDir) {
            alien.direction = rand() % 4;
          }
          break;
        }
        case this.D_WEST: {
          // A move MIGHT be valid, see if we'll hit a wall.  If not, go ahead and move.
          changeDir = false;
          alien.position.x--;
          if (alien.position.x < 0) {
            alien.position.x = 0;
            changeDir = true;
          }
          colPoint = Surface.Intersect(
            xadj + alien.position.x, yadj + alien.position.y, this.imgAliens[alien.frame], null,
            xadj, yadj, this.background, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            alien.position.x++;
            changeDir = true;
          }
          if (changeDir) {
            alien.direction = rand() % 4;
          }
          break;
        }
        case this.D_SOUTH: {
          // A move MIGHT be valid, see if we'll hit a wall.  If not, go ahead and move.
          changeDir = false;
          alien.position.y++;
          if (alien.position.y > 180) {
            alien.position.y = 180;
            changeDir = true;
          }
          colPoint = Surface.Intersect(
            xadj + alien.position.x, yadj + alien.position.y, this.imgAliens[alien.frame], null,
            xadj, yadj, this.background, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            alien.position.y--;
            changeDir = true;
          }
          if (changeDir) {
            alien.direction = rand() % 4;
          }
          break;
        }
        case this.D_NORTH: {
          // A move MIGHT be valid, see if we'll hit a wall.  If not, go ahead and move.
          changeDir = false;
          alien.position.y--;
          if (alien.position.y < 0) {
            alien.position.y = 0;
            changeDir = true;
          }
          colPoint = Surface.Intersect(
            xadj + alien.position.x, yadj + alien.position.y, this.imgAliens[alien.frame], null,
            xadj, yadj, this.background, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            alien.position.y++;
            changeDir = true;
          }
          if (changeDir) {
            alien.direction = rand() % 4;
          }
          break;
        }
      }
      // A single touch kills.
      colPoint = Surface.Intersect(
        xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null,
        xadj + alien.position.x, yadj + alien.position.y, this.imgAliens[alien.frame], null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        gameState.force_game_over = true;
      }
    }

    // Move player: two pixels each way that is held, so long as that does not put it in a wall.
    if (gameState.player_dir_east && player_pos.x < 180) {
      colPoint = Surface.Intersect(
        xadj + player_pos.x + 2, yadj + player_pos.y, this.player[this.player_frame], null,
        xadj, yadj, this.background, null
      );
      if (colPoint.x === -1 && colPoint.y === -1) {
        player_pos.x = player_pos.x + 2;
      }
    }
    if (gameState.player_dir_west && player_pos.x > 0) {
      colPoint = Surface.Intersect(
        xadj + player_pos.x - 2, yadj + player_pos.y, this.player[this.player_frame], null,
        xadj, yadj, this.background, null
      );
      if (colPoint.x === -1 && colPoint.y === -1) {
        player_pos.x = player_pos.x - 2;
      }
    }
    if (gameState.player_dir_south && player_pos.y < 180) {
      colPoint = Surface.Intersect(
        xadj + player_pos.x, yadj + player_pos.y + 2, this.player[this.player_frame], null,
        xadj, yadj, this.background, null
      );
      if (colPoint.x === -1 && colPoint.y === -1) {
        player_pos.y = player_pos.y + 2;
      }
    }
    if (gameState.player_dir_north && player_pos.y > 0) {
      colPoint = Surface.Intersect(
        xadj + player_pos.x, yadj + player_pos.y - 2, this.player[this.player_frame], null,
        xadj, yadj, this.background, null
      );
      if (colPoint.x === -1 && colPoint.y === -1) {
        player_pos.y = player_pos.y - 2;
      }
    }

    // Check for collision with pellet, eat it if it happens.
    let still_pellets_left = false;
    for (let y = 0; y < 10; y++) {
      yVal = yadj + (y * 20);
      for (let x = 0; x < 10; x++) {
        if (pellet_array[y][x] === 1) { // Only check pellets that are still there
          still_pellets_left = true;
          colPoint = Surface.Intersect(
            xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null,
            xadj + (x * 20), yVal, this.pellet, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            sndObj.playSound(this.sfxBite);
            pellet_array[y][x] = 0;
            this.addToScore(10);
          }
        }
      }
    }
    // Reset if all the pellets are gone.  (This is found out on the frame AFTER the last one is eaten.  The aliens
    // go back to where they began; the player stays where it is.)
    if (!still_pellets_left) {
      this.initializeMuncherDude();
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  The direction keys set the player moving, and LEFT and RIGHT turn it to face that way.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (inKey === gameState.kUp) {
      gameState.player_dir_north = true;
    }

    if (inKey === gameState.kDown) {
      gameState.player_dir_south = true;
    }

    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
      this.facing_west = true;
    }

    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
      this.facing_west = false;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND stops the sound of the aliens and brings up the "Continue Game / Quit Game"
   * popup.  Letting go of a direction stops the player moving that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxAlienshssChannel)) {
        sndObj.stopSound(this.sfxAlienshssChannel);
      }
      this.alien_sound_playing = false;
      this.miniGameCommandButtonHandler();
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
   * Initialize.  Fills the maze with dots and puts the three aliens where they begin.  This is called when the
   * mini-game is set up and again each time the maze is emptied.  It puts a dot in every one of the hundred
   * squares: the ones under a wall are taken out again by pnfMiniGame() before anything can eat them.
   */
  initializeMuncherDude() {

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        this.pellet_array[y][x] = 1;
      }
    }

    this.aliens[0].position.x = 120;
    this.aliens[0].position.y = 20;
    this.aliens[0].direction = this.D_WEST;
    this.aliens[0].frame = 0;
    this.aliens[0].frameDelay = 0;

    this.aliens[1].position.x = 180;
    this.aliens[1].position.y = 180;
    this.aliens[1].direction = this.D_NORTH;
    this.aliens[1].frame = 0;
    this.aliens[1].frameDelay = 0;

    this.aliens[2].position.x = 0;
    this.aliens[2].position.y = 180;
    this.aliens[2].direction = this.D_EAST;
    this.aliens[2].frame = 0;
    this.aliens[2].frameDelay = 0;

    this.alien_sound_playing = false;

    this.sfxAlienshssChannel = null;

  } /* End initializeMuncherDude(). */


  /**
   * Stops the sound of the aliens when the mini-game ends.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxAlienshssChannel)) {
      sndObj.stopSound(this.sfxAlienshssChannel);
    }

  } /* End endMiniGame(). */


  /**
   * Makes the list of dots: ten rows of ten, all 0.
   *
   * @return {Array} The list.
   */
  newPelletArray() {

    const rows = [ ];
    for (let y = 0; y < 10; y++) {
      const row = [ ];
      for (let x = 0; x < 10; x++) {
        row.push(0);
      }
      rows.push(row);
    }
    return rows;

  } /* End newPelletArray(). */


} /* End class. */
