/**
 * The mini-game "Lepar Land".  The player runs about a field picking up treasure, 50 points a time (a new one
 * appears somewhere else each time), while three lepars shamble after him.  Trees and dead lepars block the way,
 * for the lepars as well as for the player; patches of mud slow them all down.  If a lepar touches the player the
 * game is over.  The field is laid out afresh, at random, for every game.
 *
 * This is the port of mini_games/lepar_land.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class LeparLandScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csLeparLand;
  game_name = `"Lepar Land"`;
  target_score = 300;
  target_score_text = `300`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: three lines differ from the original, at Frank's request.  On page 1 it read "Who's bright idea was" and
  // "gold, your going to"; these now say "Whose" and "you're".  On page 3 it read "block you path, mud", which
  // now says "your".  Everything else is as the original has it.
  instructions = [
    // ----- Page 1.
    `Lepar Land`,
    ``,
    `Whose bright idea was`,
    `it to put all the sick`,
    `people on one planet?`,
    `Now if you want their`,
    `gold, you're going to`,
    `have to risk infection.`,
    ``,
    ``,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Grab as much of the`,
    `Lepar's gold stash as`,
    `you can without`,
    `getting Lepar-fied`,
    `yourself.`,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right to avoid the lepars`,
    `and get the gold.  Trees`,
    `block your path, mud`,
    `slows you down.`,
    ``,
    ``,
    ``
  ];

  // The pictures.  The live lepars and the player each have two frames of animation, and the player has a third
  // picture for standing still.
  tree = `gfx_lepar_land_tree`;
  mud = `gfx_lepar_land_mud`;
  dead_lepar = `gfx_lepar_land_dead_lepar`;
  treasure = `gfx_lepar_land_treasure`;
  player_still = `gfx_lepar_land_player_still`;
  lepar = [ `gfx_lepar_land_lepar_00`, `gfx_lepar_land_lepar_01` ];
  player = [ `gfx_lepar_land_player_00`, `gfx_lepar_land_player_01` ];

  // The sounds.
  sfxDeath = `sfx_death`;
  sfxCaching = `sfx_caching`;
  sfxMoaning = `sfx_lepar_land_moaning`;

  // Where the treasure is.
  treasure_pos = { x: 0, y: 0 };

  // Where the three patches of mud, the three trees, the three dead lepars and the three live lepars are: a list
  // of points for each.
  mud_pos = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];
  tree_pos = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];
  dead_lepar_pos = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];
  live_lepar_pos = [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ];

  // True while the moaning of the lepars (a sound that goes round and round) is playing, and the sound itself so
  // that it can be stopped.
  moaningPlaying = false;
  sfxMoaningChannel = null;

  // True once the field has been laid out.  (See loadMiniGame().)
  obstacles_positioned = false;

  // Which way each live lepar is facing, for drawing it: one that is facing between two of these (north and east,
  // say) is drawn leaning.
  //
  // NOTE: in the original nothing ever set any of these to true.  They were put to false when the field was laid
  // out and left there, so the code that draws a leaning lepar was never used and a lepar was always upright.
  // At Frank's request they are now set, in pnfMiniGame(): a lepar faces the way it is making for.
  live_lepar_dir_north = [ false, false, false ];
  live_lepar_dir_south = [ false, false, false ];
  live_lepar_dir_east = [ false, false, false ];
  live_lepar_dir_west = [ false, false, false ];

  // For each live lepar, the count of frames it has been waiting in mud, and how slow mud makes a lepar: it moves
  // on one frame in this many while it is touching mud.
  //
  // NOTE: neither is in the original, where mud meant nothing to a lepar; Frank asked for them to be slowed.  The
  // original has no figure to copy, so the player's was taken: mud cuts his 3 pixels a frame to 1, a third.
  live_lepar_mud_delay = [ 0, 0, 0 ];
  lepar_mud_slowness = 3;

  // Which of the lepars' two pictures is showing, the count of frames until it changes, and the count of frames
  // between one move of the lepars and the next (they move on every frame, as it happens).
  live_lepar_frame = 0;
  live_lepar_frame_delay = 0;
  live_lepar_move_delay = 0;

  // Which of the player's two walking pictures is showing, and the count of frames until it changes.
  player_frame = 0;
  player_frame_delay = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`LeparLandScene.constructor`);

    super(`LeparLandScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   *
   * In the original, the routine that cleared the mini-game away when it was finished with also put
   * obstacles_positioned back to false, "so this happens next invocation of this game", and so the field was laid
   * out afresh every time the game was loaded.  There is no clearing away here, so it is put back to false at the
   * start instead, which comes to the same thing.
   */
  loadMiniGame() {

    console.log(`LeparLandScene.loadMiniGame()`);

    this.obstacles_positioned = false;

    this.initializeLeparLand();

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

    // Start the lepars moaning if they are not already.  (They stop while the COMMAND popup is up; see ku().)
    if (!this.moaningPlaying) {
      this.moaningPlaying = true;
      this.sfxMoaningChannel = sndObj.playSound(this.sfxMoaning, true);
    }

    let colPoint;
    let rect;
    let nRotationAngle;

    // Blit mud.
    for (let i = 0; i < 3; i++) {
      inBackbuffer.BltFast(xadj + this.mud_pos[i].x, yadj + this.mud_pos[i].y, this.mud, null);
    }

    // Blit trees.
    for (let i = 0; i < 3; i++) {
      inBackbuffer.BltFast(xadj + this.tree_pos[i].x, yadj + this.tree_pos[i].y, this.tree, null);
    }

    // Blit dead lepars.
    for (let i = 0; i < 3; i++) {
      inBackbuffer.BltFast(xadj + this.dead_lepar_pos[i].x, yadj + this.dead_lepar_pos[i].y, this.dead_lepar, null);
    }

    // Blit treasure.
    inBackbuffer.BltFast(xadj + this.treasure_pos.x, yadj + this.treasure_pos.y, this.treasure, null);

    // Blit live lepars.  One is drawn upright if it is facing north, south, east or west (or no way at all), and
    // leaning 45 degrees one way or the other if it is facing between two of them.
    for (let i = 0; i < 3; i++) {
      const north = this.live_lepar_dir_north[i];
      const south = this.live_lepar_dir_south[i];
      const east = this.live_lepar_dir_east[i];
      const west = this.live_lepar_dir_west[i];
      rect = CRect(
        xadj + this.live_lepar_pos[i].x, yadj + this.live_lepar_pos[i].y,
        xadj + this.live_lepar_pos[i].x + 18, yadj + this.live_lepar_pos[i].y + 18
      );
      // No movement, or north, south, east or west.
      if ((!north && !south && !east && !west) || (north && !south && !east && !west) ||
        (!north && south && !east && !west) || (!north && !south && east && !west) ||
        (!north && !south && !east && west)
      ) {
        nRotationAngle = 0;
        inBackbuffer.Blt(rect, this.lepar[this.live_lepar_frame], null, { nRotationAngle: nRotationAngle });
      }
      // NorthEast.
      if (north && !south && east && !west) {
        nRotationAngle = -4500;
        inBackbuffer.Blt(rect, this.lepar[this.live_lepar_frame], null, { nRotationAngle: nRotationAngle });
      }
      // NorthWest.
      if (north && !south && !east && west) {
        nRotationAngle = 4500;
        inBackbuffer.Blt(rect, this.lepar[this.live_lepar_frame], null, { nRotationAngle: nRotationAngle });
      }
      // SouthEast.
      if (!north && south && east && !west) {
        nRotationAngle = 4500;
        inBackbuffer.Blt(rect, this.lepar[this.live_lepar_frame], null, { nRotationAngle: nRotationAngle });
      }
      // SouthWest.
      if (!north && south && !east && west) {
        nRotationAngle = -4500;
        inBackbuffer.Blt(rect, this.lepar[this.live_lepar_frame], null, { nRotationAngle: nRotationAngle });
      }
    }

    // Blit player: standing still, upright if he is going north, south, east or west, and leaning 45 degrees one
    // way or the other if he is going between two of them.
    const north = gameState.player_dir_north;
    const south = gameState.player_dir_south;
    const east = gameState.player_dir_east;
    const west = gameState.player_dir_west;
    rect = CRect(xadj + player_pos.x, yadj + player_pos.y, xadj + player_pos.x + 18, yadj + player_pos.y + 18);
    // No movement.
    if (!north && !south && !east && !west) {
      inBackbuffer.BltFast(xadj + player_pos.x, yadj + player_pos.y, this.player_still, null);
    }
    // North, south, east or west.
    if ((north && !south && !east && !west) || (!north && south && !east && !west) ||
      (!north && !south && east && !west) || (!north && !south && !east && west)
    ) {
      nRotationAngle = 0;
      inBackbuffer.Blt(rect, this.player[this.player_frame], null, { nRotationAngle: nRotationAngle });
    }
    // NorthEast.
    if (north && !south && east && !west) {
      nRotationAngle = -4500;
      inBackbuffer.Blt(rect, this.player[this.player_frame], null, { nRotationAngle: nRotationAngle });
    }
    // NorthWest.
    if (north && !south && !east && west) {
      nRotationAngle = 4500;
      inBackbuffer.Blt(rect, this.player[this.player_frame], null, { nRotationAngle: nRotationAngle });
    }
    // SouthEast.
    if (!north && south && east && !west) {
      nRotationAngle = 4500;
      inBackbuffer.Blt(rect, this.player[this.player_frame], null, { nRotationAngle: nRotationAngle });
    }
    // SouthWest.
    if (!north && south && !east && west) {
      nRotationAngle = -4500;
      inBackbuffer.Blt(rect, this.player[this.player_frame], null, { nRotationAngle: nRotationAngle });
    }

    // Handle player movements.  The original spelled the same thing out eight times over, once for each way the
    // player can be going; here it is done once, in movePlayer(), which is told which way.
    let do_move = false;
    // North (y-).
    if (north && !south && !east && !west) {
      do_move = this.movePlayer(0, -1);
    }
    // South (y+).
    if (!north && south && !east && !west) {
      do_move = this.movePlayer(0, 1);
    }
    // East (x+).
    if (!north && !south && east && !west) {
      do_move = this.movePlayer(1, 0);
    }
    // West (x-).
    if (!north && !south && !east && west) {
      do_move = this.movePlayer(-1, 0);
    }
    // NorthEast (x+y-).
    if (north && !south && east && !west) {
      do_move = this.movePlayer(1, -1);
    }
    // NorthWest (x-y-).
    if (north && !south && !east && west) {
      do_move = this.movePlayer(-1, -1);
    }
    // SouthEast (x+y+).
    if (!north && south && east && !west) {
      do_move = this.movePlayer(1, 1);
    }
    // SouthWest (x-y+).
    if (!north && south && !east && west) {
      do_move = this.movePlayer(-1, 1);
    }

    // If we moved, do bounds checking and update the animation frame.
    if (do_move) {
      if (player_pos.x < 2) {
        player_pos.x = 2;
      }
      if (player_pos.x > 180) {
        player_pos.x = 180;
      }
      if (player_pos.y < 2) {
        player_pos.y = 2;
      }
      if (player_pos.y > 180) {
        player_pos.y = 180;
      }
      this.player_frame_delay++;
      if (this.player_frame_delay > 1) {
        this.player_frame_delay = 0;
        this.player_frame++;
        if (this.player_frame > 1) {
          this.player_frame = 0;
        }
      }
    }

    // Check for collision with treasure.
    colPoint = Surface.Intersect(
      xadj + this.treasure_pos.x, yadj + this.treasure_pos.y, this.treasure, null,
      xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null
    );
    if (colPoint.x !== -1 || colPoint.y !== -1) {
      sndObj.playSound(this.sfxCaching);
      this.addToScore(50);
      this.placeTreasure(player_pos);
    }

    // Handle live lepar movement.  Is it time to move yet?  (It always is: the count is put back to 0 each time and
    // only has to get past 0.)
    this.live_lepar_move_delay++;
    if (this.live_lepar_move_delay > 0) {
      this.live_lepar_move_delay = 0;
      const prev_pos = { x: 0, y: 0 };
      for (let i = 0; i < 3; i++) {
        const lepar_pos = this.live_lepar_pos[i];
        // Store current position.
        prev_pos.x = lepar_pos.x;
        prev_pos.y = lepar_pos.y;
        // NOTE: this is not in the original.  At Frank's request a lepar that is touching mud is slowed down, as
        // the player is: it moves on one frame in lepar_mud_slowness and stands where it is on the others.
        let may_move = true;
        let in_mud = false;
        for (let j = 0; j < 3; j++) {
          colPoint = Surface.Intersect(
            xadj + this.mud_pos[j].x, yadj + this.mud_pos[j].y, this.mud, null,
            xadj + lepar_pos.x, yadj + lepar_pos.y, this.lepar[this.live_lepar_frame], null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            in_mud = true;
          }
        }
        if (in_mud) {
          this.live_lepar_mud_delay[i]++;
          if (this.live_lepar_mud_delay[i] < this.lepar_mud_slowness) {
            may_move = false;
          } else {
            this.live_lepar_mud_delay[i] = 0;
          }
        } else {
          this.live_lepar_mud_delay[i] = 0;
        }
        if (may_move) {
          // NOTE: nor is this in the original, which never said which way a lepar was facing.  It faces the way it
          // is making for: towards the player, across or up and down or both, if he is less than 50 pixels off
          // that way (the same test the tracking just below makes), and no way in particular otherwise.  So a
          // lepar coming at the player on the diagonal is drawn leaning, and one wandering is drawn upright.
          this.live_lepar_dir_west[i] = lepar_pos.x > player_pos.x && lepar_pos.x - player_pos.x < 50;
          this.live_lepar_dir_east[i] = lepar_pos.x < player_pos.x && player_pos.x - lepar_pos.x < 50;
          this.live_lepar_dir_north[i] = lepar_pos.y > player_pos.y && lepar_pos.y - player_pos.y < 50;
          this.live_lepar_dir_south[i] = lepar_pos.y < player_pos.y && player_pos.y - lepar_pos.y < 50;
          // Basic tracking algorithm: accurately track the player, but only if they are within a certain threshold.
          // If they are outside the threshold, do a random movement.
          //
          // Note that there are two steps across and two steps up or down every time, not one: the first is "if the
          // player is to my left and near, go left, otherwise go either way at random", and the second is "if the
          // player is to my right and near, go right, otherwise go either way at random".  So a lepar near the
          // player takes one step towards him and one at random (two towards him, or none, in the end), and a lepar
          // far from him takes two at random.
          if (lepar_pos.x > player_pos.x && lepar_pos.x - player_pos.x < 50) {
            lepar_pos.x--;
          } else {
            if ((rand() % 10) + 1 <= 5) {
              lepar_pos.x--;
            } else {
              lepar_pos.x++;
            }
          }
          if (lepar_pos.x < player_pos.x && player_pos.x - lepar_pos.x < 50) {
            lepar_pos.x++;
          } else {
            if ((rand() % 10) + 1 <= 5) {
              lepar_pos.x++;
            } else {
              lepar_pos.x--;
            }
          }
          if (lepar_pos.y > player_pos.y && lepar_pos.y - player_pos.y < 50) {
            lepar_pos.y--;
          } else {
            if ((rand() % 10) + 1 <= 5) {
              lepar_pos.y--;
            } else {
              lepar_pos.y++;
            }
          }
          if (lepar_pos.y < player_pos.y && player_pos.y - lepar_pos.y < 50) {
            lepar_pos.y++;
          } else {
            if ((rand() % 10) + 1 <= 5) {
              lepar_pos.y++;
            } else {
              lepar_pos.y--;
            }
          }
          // Bounds checking.
          if (lepar_pos.x < 2) {
            lepar_pos.x = 2;
          }
          if (lepar_pos.x > 180) {
            lepar_pos.x = 180;
          }
          if (lepar_pos.y < 2) {
            lepar_pos.y = 2;
          }
          if (lepar_pos.y > 180) {
            lepar_pos.y = 180;
          }
          // Check for collision with trees, reverse move if one occurs.
          for (let j = 0; j < 3; j++) {
            colPoint = Surface.Intersect(
              xadj + this.tree_pos[j].x, yadj + this.tree_pos[j].y, this.tree, null,
              xadj + lepar_pos.x, yadj + lepar_pos.y, this.lepar[this.live_lepar_frame], null
            );
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              lepar_pos.x = prev_pos.x;
              lepar_pos.y = prev_pos.y;
            }
          }
          // Check for collision with dead lepars, reverse move if one occurs.
          for (let j = 0; j < 3; j++) {
            colPoint = Surface.Intersect(
              xadj + this.dead_lepar_pos[j].x, yadj + this.dead_lepar_pos[j].y, this.dead_lepar, null,
              xadj + lepar_pos.x, yadj + lepar_pos.y, this.lepar[this.live_lepar_frame], null
            );
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              lepar_pos.x = prev_pos.x;
              lepar_pos.y = prev_pos.y;
            }
          }
        }
        // Check for collision with player, end game if one occurs.
        colPoint = Surface.Intersect(
          xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null,
          xadj + lepar_pos.x, yadj + lepar_pos.y, this.lepar[this.live_lepar_frame], null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          sndObj.playSound(this.sfxDeath);
          gameState.force_game_over = true;
        }
      }
    }

    // Update animation frame.
    this.live_lepar_frame_delay++;
    if (this.live_lepar_frame_delay > 3) {
      this.live_lepar_frame_delay = 0;
      this.live_lepar_frame++;
      if (this.live_lepar_frame > 1) {
        this.live_lepar_frame = 0;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * Moves the player one step the way he is going: 3 pixels, or 1 if that would take him into mud.  If the step
   * would take him into a tree or a dead lepar, he is put back where he was.
   *
   * @param  {number}  inX Which way across: -1 for left, 1 for right, 0 for neither.
   * @param  {number}  inY Which way up or down: -1 for up, 1 for down, 0 for neither.
   * @return {boolean}     True if he moved, false if a tree or a dead lepar stopped him.
   */
  movePlayer(inX, inY) {

    const player_pos = gameState.player_pos;
    let do_move = true;
    let move_vector = 3;
    let colPoint;
    const prev_pos = { x: player_pos.x, y: player_pos.y };

    // Check for collision with mud.  If one occurs, slow the player down.
    for (let i = 0; i < 3; i++) {
      colPoint = Surface.Intersect(
        xadj + this.mud_pos[i].x, yadj + this.mud_pos[i].y, this.mud, null,
        xadj + player_pos.x + (inX * move_vector), yadj + player_pos.y + (inY * move_vector),
        this.player[this.player_frame], null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        move_vector = 1;
      }
    }

    // Update player's position.
    player_pos.x = player_pos.x + (inX * move_vector);
    player_pos.y = player_pos.y + (inY * move_vector);

    // Check for collision with trees.  If one occurs, reverse movement.
    for (let i = 0; i < 3; i++) {
      colPoint = Surface.Intersect(
        xadj + this.tree_pos[i].x, yadj + this.tree_pos[i].y, this.tree, null,
        xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        player_pos.x = prev_pos.x;
        player_pos.y = prev_pos.y;
        do_move = false;
      }
    }

    // Check for collision with dead lepars.  If one occurs, reverse movement.
    for (let i = 0; i < 3; i++) {
      colPoint = Surface.Intersect(
        xadj + this.dead_lepar_pos[i].x, yadj + this.dead_lepar_pos[i].y, this.dead_lepar, null,
        xadj + player_pos.x, yadj + player_pos.y, this.player[this.player_frame], null
      );
      if (colPoint.x !== -1 || colPoint.y !== -1) {
        player_pos.x = prev_pos.x;
        player_pos.y = prev_pos.y;
        do_move = false;
      }
    }

    return do_move;

  } /* End movePlayer(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT start the player moving that way.  Two can be held at once, to go
   * on the diagonal.
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
   * A key was released.  COMMAND stops the moaning and brings up the "Continue Game / Quit Game" popup; letting go
   * of a direction stops the player moving that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxMoaningChannel)) {
        sndObj.stopSound(this.sfxMoaningChannel);
      }
      this.moaningPlaying = false;
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
   * Initialize.  Puts the player in the middle and lays out the field: three patches of mud, three trees, three
   * dead lepars, three live ones and the treasure, each somewhere at random.
   *
   * The original did the laying-out with "goto" statements that jumped back to try again whenever something had
   * landed where it should not be.  The loops here try again in exactly the same cases, and so ask for exactly the
   * same random numbers in the same order.
   *
   * Note how "where it should not be" is judged throughout: by whether any of the four CORNERS of the new thing
   * (taken as 24 pixels square, or 24 by 36 for a tree) is inside one of the things already placed.  That misses
   * the case of a thing lying across another with all four of its corners outside it, which a tree, being taller
   * than a patch of mud, can do.  So now and then a tree stands in mud.  That is how the original has it.
   */
  initializeLeparLand() {

    // Position player.
    gameState.player_pos.x = 100;
    gameState.player_pos.y = 100;
    this.player_frame = 0;
    this.player_frame_delay = 0;
    this.moaningPlaying = false;
    this.sfxMoaningChannel = null;

    // Position obstacles.
    if (!this.obstacles_positioned) {

      let again;

      // Position mud: anywhere but the middle of the field, where the player starts.  If any mud overlaps another,
      // redo them all.
      again = true;
      while (again) {
        again = false;
        for (let i = 0; i < 3; i++) {
          let inTheMiddle = true;
          while (inTheMiddle) {
            this.mud_pos[i].x = (rand() % 175) + 1;
            this.mud_pos[i].y = (rand() % 175) + 1;
            inTheMiddle = this.mud_pos[i].x > 75 && this.mud_pos[i].x < 119 &&
              this.mud_pos[i].y > 75 && this.mud_pos[i].y < 119;
          }
        }
        for (let i = 0; i < 3; i++) {
          if (this.cornerInside(this.mud_pos[i], 24, 24, this.mud_pos, 24, 24, i)) {
            again = true;
          }
        }
      }

      // Position trees: anywhere but the middle, and if a tree overlaps any mud, redo that tree.  If any trees
      // overlap another, redo them all.
      again = true;
      while (again) {
        again = false;
        for (let i = 0; i < 3; i++) {
          let badPlace = true;
          while (badPlace) {
            this.tree_pos[i].x = (rand() % 175) + 1;
            this.tree_pos[i].y = (rand() % 163) + 1;
            badPlace = (this.tree_pos[i].x > 75 && this.tree_pos[i].x < 119 &&
              this.tree_pos[i].y > 63 && this.tree_pos[i].y < 119) ||
              this.cornerInside(this.tree_pos[i], 24, 36, this.mud_pos, 24, 24, -1);
          }
        }
        for (let i = 0; i < 3; i++) {
          if (this.cornerInside(this.tree_pos[i], 24, 36, this.tree_pos, 24, 36, i)) {
            again = true;
          }
        }
      }

      // Position dead lepars: anywhere but the middle.  If one overlaps any mud, any tree or another dead lepar,
      // redo them all.
      again = true;
      while (again) {
        again = false;
        for (let i = 0; i < 3 && !again; i++) {
          let inTheMiddle = true;
          while (inTheMiddle) {
            this.dead_lepar_pos[i].x = (rand() % 175) + 1;
            this.dead_lepar_pos[i].y = (rand() % 175) + 1;
            inTheMiddle = this.dead_lepar_pos[i].x > 81 && this.dead_lepar_pos[i].x < 119 &&
              this.dead_lepar_pos[i].y > 81 && this.dead_lepar_pos[i].y < 119;
          }
          if (this.cornerInside(this.dead_lepar_pos[i], 24, 24, this.mud_pos, 24, 24, -1) ||
            this.cornerInside(this.dead_lepar_pos[i], 24, 24, this.tree_pos, 24, 36, -1)
          ) {
            again = true;
          }
        }
        for (let i = 0; i < 3 && !again; i++) {
          if (this.cornerInside(this.dead_lepar_pos[i], 24, 24, this.dead_lepar_pos, 24, 24, i)) {
            again = true;
          }
        }
      }

      // Position live lepars: only round the outside of the field (not within 40 pixels or so of the middle), and
      // if one overlaps any mud, any tree or any dead lepar, redo that one.  If any live lepars overlap another,
      // redo them all.
      again = true;
      while (again) {
        again = false;
        for (let i = 0; i < 3; i++) {
          let badPlace = true;
          while (badPlace) {
            this.live_lepar_pos[i].x = (rand() % 181) + 1;
            this.live_lepar_pos[i].y = (rand() % 181) + 1;
            badPlace = (this.live_lepar_pos[i].x > 40 && this.live_lepar_pos[i].x < 160 &&
              this.live_lepar_pos[i].y > 40 && this.live_lepar_pos[i].y < 160) ||
              this.cornerInside(this.live_lepar_pos[i], 24, 24, this.mud_pos, 24, 24, -1) ||
              this.cornerInside(this.live_lepar_pos[i], 24, 24, this.tree_pos, 24, 36, -1) ||
              this.cornerInside(this.live_lepar_pos[i], 24, 24, this.dead_lepar_pos, 24, 24, -1);
          }
          this.live_lepar_dir_north[i] = false;
          this.live_lepar_dir_south[i] = false;
          this.live_lepar_dir_east[i] = false;
          this.live_lepar_dir_west[i] = false;
          this.live_lepar_mud_delay[i] = 0;
        }
        for (let i = 0; i < 3; i++) {
          if (this.cornerInside(this.live_lepar_pos[i], 24, 24, this.live_lepar_pos, 24, 24, i)) {
            again = true;
          }
        }
      }

      // Miscellaneous setup.
      this.live_lepar_frame = 0;
      this.live_lepar_frame_delay = 0;
      this.live_lepar_move_delay = 0;
      this.obstacles_positioned = true;

      // Position treasure.
      this.placeTreasure(gameState.player_pos);

    }

  } /* End initializeLeparLand(). */


  /**
   * Stops the moaning when the mini-game ends.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxMoaningChannel)) {
      sndObj.stopSound(this.sfxMoaningChannel);
    }

  } /* End endMiniGame(). */


  /**
   * Puts the treasure somewhere at random, trying again for as long as one of its corners is in mud, in a tree, on
   * a dead lepar or on the player.  (It can land on a live lepar.)
   *
   * @param {object} inPlayerPos Where the player is: a point.
   */
  placeTreasure(inPlayerPos) {

    const point = { x: 0, y: 0 };
    const playerList = [ inPlayerPos ];
    let badPlace = true;
    while (badPlace) {
      point.x = (rand() % 175) + 1;
      point.y = (rand() % 175) + 1;
      // If treasure would overlap mud, a tree, a dead lepar or the player, retry.
      badPlace = this.cornerInside(point, 24, 24, this.mud_pos, 24, 24, -1) ||
        this.cornerInside(point, 24, 24, this.tree_pos, 24, 36, -1) ||
        this.cornerInside(point, 24, 24, this.dead_lepar_pos, 24, 24, -1) ||
        this.cornerInside(point, 24, 24, playerList, 18, 18, -1);
    }

    this.treasure_pos.x = point.x;
    this.treasure_pos.y = point.y;

  } /* End placeTreasure(). */


  /**
   * Says whether any of the four corners of a thing is inside any of the things in a list.  This is the test the
   * original wrote out in full, four lines to a pair of things, wherever it placed something.
   *
   * @param  {object}  inPos        Where the thing is: a point (its top-left corner).
   * @param  {number}  inWidth      How wide the thing is taken to be.
   * @param  {number}  inHeight     How tall the thing is taken to be.
   * @param  {Array}   inList       The things already placed: a list of points (their top-left corners).
   * @param  {number}  inListWidth  How wide each of those is taken to be.
   * @param  {number}  inListHeight How tall each of those is taken to be.
   * @param  {number}  inSkip       The number of an entry in the list to leave out (a thing is not tested against
   *                                itself), or -1 to test against them all.
   * @return {boolean}              True if a corner is inside one of them.
   */
  cornerInside(inPos, inWidth, inHeight, inList, inListWidth, inListHeight, inSkip) {

    for (let j = 0; j < inList.length; j++) {
      if (j !== inSkip) {
        const other = CRect(
          inList[j].x, inList[j].y, inList[j].x + inListWidth, inList[j].y + inListHeight
        );
        if (PtInRect(other, { x: inPos.x, y: inPos.y }) ||
          PtInRect(other, { x: inPos.x + inWidth, y: inPos.y }) ||
          PtInRect(other, { x: inPos.x, y: inPos.y + inHeight }) ||
          PtInRect(other, { x: inPos.x + inWidth, y: inPos.y + inHeight })
        ) {
          return true;
        }
      }
    }
    return false;

  } /* End cornerInside(). */


} /* End class. */
