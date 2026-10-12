/**
 * The mini-game "Glutton".  A creature made of segments slithers about the play area, which is 20 squares by 20,
 * moving one square every third frame and never stopping.  The player steers it up, down, left and right to eat
 * the energy pellet, which is worth 25 points; each pellet eaten makes the creature one segment longer, and a new
 * pellet appears somewhere else.  Going out of the play area or running into its own body ends the game and costs
 * 2,000 points (which in practice means all of them).
 *
 * This is the port of mini_games/glutton.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class GluttonScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csGlutton;
  game_name = `"Glutton"`;
  target_score = 500;
  target_score_text = `500`;

  // The instructions: three pages of ten lines each.
  //
  // NOTE: three lines differ from the original, at Frank's request.  On page 1 it read "day but sliver around" and
  // "the group eating small"; these now say "slither" and "the ground" (the second being a guess at what was
  // meant).  On page 2 it read "East as many energy", which now says "Eat".  Everything else is as the original
  // has it.
  instructions = [
    // ----- Page 1.
    `Glutton`,
    ``,
    `On the planet Trigamop`,
    `there is a small creature`,
    `called a Garagnack`,
    `that does nothing all`,
    `day but slither around`,
    `the ground eating small`,
    `energy pellets getting`,
    `ever larger.  Gross!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Eat as many energy`,
    `pellets as you can`,
    `without eating yourself.`,
    ``,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Move up, down, left or`,
    `right.  Avoid eating`,
    `yourself or going out`,
    `of bounds, which ends`,
    `the game.`,
    ``,
    ``,
    ``
  ];

  // The pictures.
  head = `gfx_glutton_head`;
  body = `gfx_glutton_body`;
  food = `gfx_glutton_food`;
  background = `gfx_glutton_background`;

  // The sounds.
  sfxChomp = `sfx_chomp`;
  sfxSplat = `sfx_splat`;
  sfxMove = `sfx_move`;

  // Where the pellet is: its column and its row, counted in squares from the top-left corner of the play area.
  food_pos = { x: 0, y: 0 };

  // Where each segment of the creature is, in squares: a list of points.  The first is the head.  Only the first
  // segment_count of them are in use.
  //
  // NOTE: the original's list had room for 102 segments and no more, so the hundred-and-first pellet of a game
  // would have written past the end of it.  That takes far longer than a timed game lasts.  This list simply
  // grows.
  segments = [ { x: 0, y: 0 }, { x: 0, y: 0 } ];

  // How many segments the creature has.
  segment_count = 0;

  // Counts the frames between one move and the next.
  move_delay = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`GluttonScene.constructor`);

    super(`GluttonScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`GluttonScene.loadMiniGame()`);

    this.initializeGlutton();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * Note that every position in this mini-game is measured in squares of 10 pixels from the top-left corner of the
   * play area, which is why they are multiplied by 10, and xadj and yadj (the position of the play area on the
   * screen) added, whenever something is drawn.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const segments = this.segments;

    // Blit background: one picture, 40 pixels square, laid five across and five down.
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        inBackbuffer.BltFast(xadj + (x * 40), yadj + (y * 40), this.background, null);
      }
    }

    // Blit snake.  The head is turned to face the way the creature is going.
    //
    // NOTE: until a direction key has been pressed, no direction is set at all (the creature goes up the screen
    // all the same: see below).  In the original the angle was then whatever happened to be in a variable that
    // had not been given a value, so there is no knowing which way the head was drawn.  Here it faces up, the way
    // it is moving.
    const rect = CRect(
      xadj + (segments[0].x * 10), yadj + (segments[0].y * 10),
      (xadj + (segments[0].x * 10)) + 10, (yadj + (segments[0].y * 10)) + 10
    );
    let nRotationAngle = 0;
    if (gameState.player_dir_north) {
      nRotationAngle = 0;
    }
    if (gameState.player_dir_south) {
      nRotationAngle = 18000;
    }
    if (gameState.player_dir_east) {
      nRotationAngle = 9000;
    }
    if (gameState.player_dir_west) {
      nRotationAngle = 27000;
    }
    inBackbuffer.Blt(rect, this.head, null, { nRotationAngle: nRotationAngle });
    for (let i = 1; i < this.segment_count; i++) {
      inBackbuffer.BltFast(xadj + (segments[i].x * 10), yadj + (segments[i].y * 10), this.body, null);
    }

    // Blit food.
    inBackbuffer.BltFast(xadj + (this.food_pos.x * 10), yadj + (this.food_pos.y * 10), this.food, null);

    // Move snake: every third frame, each segment takes the place of the one in front of it, and the head moves
    // one square the way the creature is going (which is up the screen until a key has been pressed).
    this.move_delay++;
    if (this.move_delay > 2) {
      sndObj.playSound(this.sfxMove);
      this.move_delay = 0;
      const new_head = { x: segments[0].x, y: segments[0].y };
      for (let i = this.segment_count - 1; i > 0; i--) {
        segments[i].x = segments[i - 1].x;
        segments[i].y = segments[i - 1].y;
      }
      if (gameState.player_dir_north ||
        (!gameState.player_dir_north && !gameState.player_dir_south && !gameState.player_dir_east &&
        !gameState.player_dir_west)
      ) {
        new_head.y--;
        segments[0].x = new_head.x;
        segments[0].y = new_head.y;
      }
      if (gameState.player_dir_south) {
        new_head.y++;
        segments[0].x = new_head.x;
        segments[0].y = new_head.y;
      }
      if (gameState.player_dir_west) {
        new_head.x--;
        segments[0].x = new_head.x;
        segments[0].y = new_head.y;
      }
      if (gameState.player_dir_east) {
        new_head.x++;
        segments[0].x = new_head.x;
        segments[0].y = new_head.y;
      }
    }

    // Check for out of bounds, end game if hit.
    if (segments[0].x < 0 || segments[0].x > 19 || segments[0].y < 0 || segments[0].y > 19) {
      this.subtractFromScore(2000);
      sndObj.playSound(this.sfxSplat);
      gameState.force_game_over = true;
    }

    // Check for collision with body, end game if hit.
    for (let i = 1; i < this.segment_count; i++) {
      if (segments[0].x === segments[i].x && segments[0].y === segments[i].y) {
        this.subtractFromScore(2000);
        sndObj.playSound(this.sfxSplat);
        gameState.force_game_over = true;
      }
    }

    // Check for food.  Grow snake if it hits and replace it.
    if (segments[0].x === this.food_pos.x && segments[0].y === this.food_pos.y) {
      sndObj.playSound(this.sfxChomp);
      this.addToScore(25);
      const tail = { x: segments[this.segment_count - 1].x, y: segments[this.segment_count - 1].y };
      const pre_tail = { x: segments[this.segment_count - 2].x, y: segments[this.segment_count - 2].y };
      // The new segment.  One of the four cases below always applies, because the last two segments are always
      // side by side when a pellet is eaten.
      //
      // Note what "tail.y++" and the like do here: they give the value as it was BEFORE one is added to it (and
      // tail is only a copy, so the adding changes nothing).  So in every case the new segment is put exactly
      // where the last one already is, not beyond it as the comments say.  It does no harm: when the creature
      // next moves, the new segment stays behind and the creature is one longer.  That is how the original has
      // it.
      const new_tail = { x: tail.x, y: tail.y };
      // Adding segment on bottom.
      if (tail.x === pre_tail.x && tail.y > pre_tail.y) {
        new_tail.x = tail.x;
        new_tail.y = tail.y++;
      }
      // Adding segment on top.
      if (tail.x === pre_tail.x && tail.y < pre_tail.y) {
        new_tail.x = tail.x;
        new_tail.y = tail.y--;
      }
      // Adding segment on left.
      if (tail.x < pre_tail.x && tail.y === pre_tail.y) {
        new_tail.x = tail.x--;
        new_tail.y = tail.y;
      }
      // Adding segment on right.
      if (tail.x > pre_tail.x && tail.y === pre_tail.y) {
        new_tail.x = tail.x++;
        new_tail.y = tail.y;
      }
      segments[this.segment_count] = new_tail;
      this.segment_count++;
      this.placeFood();
    }

  } /* End pnfMiniGame(). */


  /**
   * A key was pressed.  UP, DOWN, LEFT and RIGHT turn the creature that way, unless it is going the opposite way.
   *
   * Note that "going the opposite way" is judged by the last key pressed, not by the last move made.  The creature
   * only moves every third frame, so two quick turns between moves (LEFT and then DOWN, say, while it is going up)
   * are both accepted, and the creature turns back on itself and eats its own neck.  And before any key has been
   * pressed at all, every direction is accepted, DOWN included, though the creature is going up.  All of this is
   * how the original has it.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Handle up movement events.
    if (inKey === gameState.kUp && !gameState.player_dir_south) {
      gameState.player_dir_north = true;
      gameState.player_dir_south = false;
      gameState.player_dir_east = false;
      gameState.player_dir_west = false;
    }

    // Handle down movement events.
    if (inKey === gameState.kDown && !gameState.player_dir_north) {
      gameState.player_dir_north = false;
      gameState.player_dir_south = true;
      gameState.player_dir_east = false;
      gameState.player_dir_west = false;
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft && !gameState.player_dir_east) {
      gameState.player_dir_north = false;
      gameState.player_dir_south = false;
      gameState.player_dir_east = false;
      gameState.player_dir_west = true;
    }

    // Handle right movement events.
    if (inKey === gameState.kRight && !gameState.player_dir_west) {
      gameState.player_dir_north = false;
      gameState.player_dir_south = false;
      gameState.player_dir_east = true;
      gameState.player_dir_west = false;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.  Letting go of a direction does
   * nothing: the creature keeps going.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

  } /* End ku(). */


  /**
   * Initialize.  Puts the creature, two segments long, in the middle of the play area, and a pellet somewhere.
   */
  initializeGlutton() {

    this.segment_count = 2;
    this.move_delay = 0;
    this.segments[0].x = 9;
    this.segments[0].y = 9;
    this.segments[1].x = 9;
    this.segments[1].y = 10;
    this.placeFood();

  } /* End initializeGlutton(). */


  /**
   * Puts the pellet on a square chosen at random, choosing again for as long as the square chosen has a segment of
   * the creature on it.
   *
   * Note that the column and the row are each chosen from 0 to 18, though the play area has columns and rows 0 to
   * 19.  So a pellet never appears in the last column or the bottom row.  That is how the original has it.
   */
  placeFood() {

    let onSnake = true;
    while (onSnake) {
      this.food_pos.x = rand() % 19;
      this.food_pos.y = rand() % 19;
      // Make sure food is not placed on the snake.
      onSnake = false;
      for (let i = 0; i < this.segment_count; i++) {
        if (this.food_pos.x === this.segments[i].x && this.food_pos.y === this.segments[i].y) {
          onSnake = true;
        }
      }
    }

  } /* End placeFood(). */


} /* End class. */
