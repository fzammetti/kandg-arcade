/**
 * The mini-game "Far Out Fowl".  A giant space chicken flaps back and forth across the top of the play area, and
 * every time it reaches the spot it was heading for it drops an egg and picks a new spot.  The player slides a
 * catcher left and right along the bottom.  An egg that lands on top of the catcher scores 5 points; one that
 * splats on the deck costs 5.  The better the player does, the faster the chicken flies and the faster its eggs
 * fall.
 *
 * This is the port of mini_games/far_out_fowl.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class FarOutFowlScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csFarOutFowl;
  game_name = `"Far Out Fowl"`;
  target_score = 500;
  target_score_text = `500`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Far Out Fowl`,
    ``,
    `Across the vastness of`,
    `space, from the deepest,`,
    `darkest reaches of the`,
    `known universe comes a`,
    `terror so ghastly, all`,
    `who see it are chilled`,
    `to their core.  It's the`,
    `space chicken of DOOM!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Catch the eggs that the`,
    `evil monster drops on`,
    `you in your magnetic`,
    `egg catcher thingy.`,
    `The fewer you drop,`,
    `the better (DUH!).`,
    `Any that splat on the`,
    `deck costs you points.`,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move left or right to`,
    `catch the eggs.`,
    ``,
    ``,
    ``,
    ``,
    ``,
    ``
  ];

  // The pictures.
  background = `gfx_far_out_fowl_background`;
  catcher = `gfx_far_out_fowl_catcher`;
  egg = `gfx_far_out_fowl_egg`;
  egg_splat = `gfx_far_out_fowl_egg_splat`;

  // The two frames of the chicken's flapping.
  chicken = [ `gfx_far_out_fowl_chicken_00`, `gfx_far_out_fowl_chicken_01` ];

  // The sounds.  The chicken's clucking plays continuously while the game is running.
  sfxSplat = `sfx_splat`;
  sfxCatch = `sfx_far_out_fowl_catch`;
  sfxChicken = `sfx_far_out_fowl_chicken`;

  // Where the chicken is, and the spot it is flying to.
  chicken_pos = { x: 0, y: 0 };
  chicken_new_pos = { x: 0, y: 0 };

  // The eggs: a list of points, of which only the first egg_count mean anything.  An egg's y says what it is
  // doing.  Up to 190 it is falling, and y is how far down the play area it is.  Over 400 it has splatted on the
  // deck, and y is a countdown (from 500 down to 470) of how much longer the splat is shown.  An egg with x and y
  // both 0 is finished with, and is cleared out of the list at the end of the frame.
  //
  // NOTE: the original never emptied this list when a game started, and neither do we (see loadMiniGame()).
  eggs = [ ];

  // A spare list used while clearing finished eggs out of the list above.
  eggs_temp_array = [ ];

  // True while the chicken's clucking is playing.
  chickenSoundPlaying = false;

  // Which frame of the chicken is showing, and a counter used to time its frames.
  chicken_frame = 0;
  chicken_frame_delay = 0;

  // How many pixels the chicken moves, and each egg falls, per frame.  It starts at 3 and only ever goes up.
  chicken_egg_speed = 0;

  // How many eggs there are in the list.
  egg_count = 0;

  // The score the last time the speed went up, or an egg was dropped.
  prev_score = 0;

  // How far the score must rise above prev_score for the speed to go up again.
  score_flip_amount = 0;

  // The clucking while it is playing, so that it can be stopped.  (The original kept the number of the sound
  // channel it was playing on, hence the name.)
  sfxChickenhssChannel = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`FarOutFowlScene.constructor`);

    super(`FarOutFowlScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   *
   * NOTE: the list of eggs and the count of them are deliberately NOT touched here.  The original set them up
   * once, when the program started, and never again, so any eggs that were still in the air (or splatted on the
   * deck) when one game of Far Out Fowl ended are still there when the next one begins.  That is kept as it was.
   */
  loadMiniGame() {

    console.log(`FarOutFowlScene.loadMiniGame()`);

    this.sfxChickenhssChannel = null;

    this.initializeFarOutFowl();

    this.chickenSoundPlaying = false;

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

    // Start the clucking, if it is not already going.
    if (!this.chickenSoundPlaying) {
      this.chickenSoundPlaying = true;
      this.sfxChickenhssChannel = sndObj.playSound(this.sfxChicken, true);
    }

    // Background (so that everything would be in back of non-transparent elements).
    inBackbuffer.BltFast(xadj + 0, yadj + 0, this.background, null);

    // Blit chicken and take care of movements.  Its wings flap every third frame.
    inBackbuffer.BltFast(
      xadj + this.chicken_pos.x, yadj + this.chicken_pos.y, this.chicken[this.chicken_frame], null
    );
    this.chicken_frame_delay++;
    if (this.chicken_frame_delay > 2) {
      this.chicken_frame_delay = 0;
      this.chicken_frame++;
      if (this.chicken_frame > 1) {
        this.chicken_frame = 0;
      }
    }
    // The chicken flies towards the spot it has picked.  When it gets there (or passes it, since it moves several
    // pixels at a time) it drops an egg from that spot and picks somewhere new to go.
    if (this.chicken_pos.x < this.chicken_new_pos.x) {
      this.chicken_pos.x = this.chicken_pos.x + this.chicken_egg_speed;
      if (this.chicken_pos.x >= this.chicken_new_pos.x) {
        const egg_pos = { x: this.chicken_new_pos.x + 22, y: 42 };
        this.eggs[this.egg_count] = egg_pos;
        this.egg_count++;
        this.chicken_new_pos = this.newChickenPosition();
      }
    } else {
      this.chicken_pos.x = this.chicken_pos.x - this.chicken_egg_speed;
      if (this.chicken_pos.x <= this.chicken_new_pos.x) {
        const egg_pos = { x: this.chicken_new_pos.x + 22, y: 42 };
        this.eggs[this.egg_count] = egg_pos;
        this.egg_count++;
        this.chicken_new_pos = this.newChickenPosition();
      }
    }

    // Blit the eggs, check for collision with catcher, clear egg if caught.
    for (let i = 0; i < this.egg_count; i++) {
      if (this.eggs[i].y > 400) {
        // Display splattered egg.
        inBackbuffer.BltFast(xadj + this.eggs[i].x, yadj + 192, this.egg_splat, null);
        // Show it for one second (30 frames).
        this.eggs[i].y--;
        if (this.eggs[i].y < 470) {
          this.eggs[i].x = 0;
          this.eggs[i].y = 0;
        } else {
          // At one less than the high value we set when the egg splats, play the sound.  This will have the effect
          // of only playing once per egg.
          if (this.eggs[i].y === 499) {
            sndObj.playSound(this.sfxSplat);
          }
        }
      } else {
        // This egg is coming down.
        inBackbuffer.BltFast(xadj + this.eggs[i].x, yadj + this.eggs[i].y, this.egg, null);
        // See if it collides with the catcher.
        const colPoint = Surface.Intersect(
          xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.catcher, null,
          xadj + this.eggs[i].x, yadj + this.eggs[i].y, this.egg, null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          // This makes it so you pretty much have to hit the top of the catcher, not much sides.
          if (this.eggs[i].y < gameState.player_pos.y + 2) {
            // Yep, it was caught.
            this.addToScore(5);
            sndObj.playSound(this.sfxCatch);
            // Increase speed if it's time.
            if (gameState.mini_game_score > (this.prev_score + this.score_flip_amount)) {
              this.chicken_egg_speed = this.chicken_egg_speed + 1;
              this.prev_score = gameState.mini_game_score;
              // Increment the speed flip counter so the speed increases slower as we go.
              this.score_flip_amount = this.score_flip_amount + 50;
            }
            this.eggs[i].x = 0;
            this.eggs[i].y = 0;
          }
        }
      }
    }

    // Move the eggs if they are not splattered and not ready to be cleared.
    for (let i = 0; i < this.egg_count; i++) {
      if (!(this.eggs[i].x === 0 && this.eggs[i].y === 0) && (this.eggs[i].y < 400)) {
        this.eggs[i].y = this.eggs[i].y + this.chicken_egg_speed;
        // If the egg reaches the bottom, set the coordinates to 500 so we know we have to display it splattered
        // for a few frames before clearing it.
        if (this.eggs[i].y > 190) {
          this.subtractFromScore(5);
          this.prev_score = gameState.mini_game_score;
          this.eggs[i].y = 500;
        }
      }
    }

    // Clean up the array: copy into a new array any that don't have coordinates 0, 0, reduce the egg_count
    // accordingly, and copy the array back.  (Each egg is copied as a new point, as the original copied the
    // values, so that no two places in a list ever share one point.)
    let j = 0;
    for (let i = 0; i < this.egg_count; i++) {
      if (!(this.eggs[i].x === 0 && this.eggs[i].y === 0)) {
        this.eggs_temp_array[j] = { x: this.eggs[i].x, y: this.eggs[i].y };
        j++;
      }
    }
    // Copy the temp array back over to the real array.
    for (let i = 0; i < j; i++) {
      this.eggs[i] = { x: this.eggs_temp_array[i].x, y: this.eggs_temp_array[i].y };
    }
    this.egg_count = j;

    // Blit paddle and take care of player movements.
    inBackbuffer.BltFast(xadj + gameState.player_pos.x, yadj + gameState.player_pos.y, this.catcher, null);
    // Moving right.
    if (gameState.player_dir_east) {
      gameState.player_pos.x = gameState.player_pos.x + 5;
      // Stop at edge of screen.
      if (gameState.player_pos.x > 155) {
        gameState.player_pos.x = 155;
      }
    }
    // Moving left.
    if (gameState.player_dir_west) {
      gameState.player_pos.x = gameState.player_pos.x - 5;
      // Stop at edge of screen.
      if (gameState.player_pos.x < 1) {
        gameState.player_pos.x = 1;
      }
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  LEFT and RIGHT start the catcher moving.  Nothing else does anything in this game.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

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
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup; letting go of LEFT or RIGHT stops
   * the catcher.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.  The clucking is silenced while the popup is up; it starts again by itself on the next frame
    // of the game, if the player chooses to continue.
    if (inKey === gameState.kCommand) {
      if (sndObj.isPlaying(this.sfxChickenhssChannel)) {
        sndObj.stopSound(this.sfxChickenhssChannel);
      }
      this.chickenSoundPlaying = false;
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

  } /* End ku(). */


  /**
   * Initialize.  Puts everything in its starting position (except the eggs: see loadMiniGame()).
   */
  initializeFarOutFowl() {

    // Start catcher in the middle.
    gameState.player_pos.x = 88;
    gameState.player_pos.y = 184;

    // Start chicken off in middle.
    this.chicken_pos.x = 80;
    this.chicken_pos.y = 2;
    this.chicken_frame = 0;
    this.chicken_frame_delay = 0;

    // Determine the chicken's next position.
    this.chicken_new_pos = this.newChickenPosition();
    this.chicken_egg_speed = 3;

    this.prev_score = 0;
    this.score_flip_amount = 25;

  } /* End initializeFarOutFowl(). */


  /**
   * Ender.  Called once when the mini-game ends, to silence the clucking.
   */
  endMiniGame() {

    if (sndObj.isPlaying(this.sfxChickenhssChannel)) {
      sndObj.stopSound(this.sfxChickenhssChannel);
    }

  } /* End endMiniGame(). */


  /**
   * Picks, at random, the next spot for the chicken to fly to.
   *
   * @return {object} The spot, with x (from 1 to 151) and y (the height the chicken is already at) properties.
   */
  newChickenPosition() {

    const ncp = { x: 0, y: 0 };
    ncp.x = (rand() % 151) + 1;
    ncp.y = this.chicken_pos.y;

    return ncp;

  } /* End newChickenPosition(). */


} /* End class. */
