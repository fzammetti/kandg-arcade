/**
 * The mini-game "Squish'em".  Two groups of four "subspace vortices" circle the play area, opposite one another,
 * with stars streaming past behind.  Each vortex is above, below, left or right of the middle of its group, and
 * now and then an alien pops up out of one, dances for a couple of seconds and goes down again.  The player's gun
 * sits in the middle of one group or the other (ACTION switches it between them) and fires its ray up, down, left
 * or right for as long as that direction is held.  An alien caught by the ray is squished, for 10 points; one that
 * gets away costs 5.
 *
 * This is the port of mini_games/squishem.cpp.  Everything that is the same for every mini-game (the frame, the
 * instructions, the clock, the score and so on) is in MiniGameScene.js.
 */
class SquishemScene extends MiniGameScene {


  // What MiniGameScene needs to know about this mini-game.
  current_screen = csSquishem;
  game_name = `"Squish'em"`;
  target_score = 500;
  target_score_text = `500`;

  // The instructions: three pages of ten lines each.
  instructions = [
    // ----- Page 1.
    `Squish'em`,
    ``,
    `As you fly through space,`,
    `subspace vortices`,
    `appear, circling in front`,
    `of your ship.  From them`,
    `emerge nasty little alien`,
    `dudes.  Fortunately, you`,
    `are armed with your`,
    `special squish'em ray!`,
    // ----- Page 2.
    `The Goal`,
    ``,
    `Squish as many invading`,
    `aliens as you can before`,
    `time runs out.  Any you`,
    `miss will cost you points.`,
    ``,
    ``,
    ``,
    ``,
    // ----- Page 3.
    `How To Play`,
    ``,
    `Press the ACTION button`,
    `to switch between`,
    `groups of subspace`,
    `vertices, then press up,`,
    `down, left or right to`,
    `fire your ray in the`,
    `corresponding direction,`,
    `to squish an alien.`
  ];

  // What an alien can be doing (the values in alienStates below).
  AS_HIDDEN = 0;
  AS_POPPING_UP = 1;
  AS_DANCING = 3;
  AS_GOING_DOWN = 4;
  AS_SQUISHED = 5;

  // The four ways the gun can be facing (the values of facing_dir below).
  FD_NORTH = 10;
  FD_EAST = 11;
  FD_SOUTH = 12;
  FD_WEST = 13;

  // The pictures.  The six pictures of an alien are, in order: the empty vortex, two of the alien coming up, two
  // of it dancing, and the squished one.  The ray has two frames of animation, upright and lying flat.  (The gun
  // is the one from Antigravitator.)
  alienImages = [
    `gfx_squishem_alien_00`, `gfx_squishem_alien_01`, `gfx_squishem_alien_02`, `gfx_squishem_alien_03`,
    `gfx_squishem_alien_04`, `gfx_squishem_alien_05`
  ];
  rayV = [ `gfx_squishem_rayv_00`, `gfx_squishem_rayv_01` ];
  rayH = [ `gfx_squishem_rayh_00`, `gfx_squishem_rayh_01` ];
  gun = `gfx_antigravitator_gun`;

  // The sounds.
  sfxAlienPopup = `sfx_squishem_alien_popup`;
  sfxLaser = `sfx_squishem_laser`;
  sfxSquish = `sfx_squishem_squish`;
  sfxSwitchGroups = `sfx_squishem_switch_groups`;

  // The path the middle of each group follows round the play area: a list of points, taken out of the original by a
  // script, not typed.  The original filled it in by number from 1 to 341 and never used number 0, which is why
  // the first point here is a blank one.  (As it happens only every other point is ever used.)
  circPnts = [
    { x: 0, y: 0 }, { x: 100, y: 44 }, { x: 101, y: 44 }, { x: 102, y: 44 }, { x: 103, y: 44 },
    { x: 104, y: 44 }, { x: 105, y: 44 }, { x: 106, y: 44 }, { x: 107, y: 44 }, { x: 108, y: 44 },
    { x: 109, y: 44 }, { x: 110, y: 44 }, { x: 111, y: 44 }, { x: 112, y: 44 }, { x: 113, y: 44 },
    { x: 114, y: 44 }, { x: 115, y: 44 }, { x: 116, y: 44 }, { x: 117, y: 45 }, { x: 118, y: 45 },
    { x: 119, y: 45 }, { x: 120, y: 45 }, { x: 121, y: 45 }, { x: 122, y: 45 }, { x: 123, y: 46 },
    { x: 124, y: 46 }, { x: 125, y: 46 }, { x: 126, y: 47 }, { x: 127, y: 47 }, { x: 128, y: 48 },
    { x: 129, y: 48 }, { x: 130, y: 49 }, { x: 131, y: 49 }, { x: 132, y: 49 }, { x: 133, y: 50 },
    { x: 134, y: 51 }, { x: 135, y: 51 }, { x: 136, y: 52 }, { x: 137, y: 53 }, { x: 138, y: 53 },
    { x: 139, y: 54 }, { x: 140, y: 55 }, { x: 141, y: 56 }, { x: 142, y: 57 }, { x: 143, y: 58 },
    { x: 144, y: 59 }, { x: 145, y: 60 }, { x: 146, y: 61 }, { x: 146, y: 62 }, { x: 146, y: 63 },
    { x: 147, y: 64 }, { x: 148, y: 65 }, { x: 149, y: 66 }, { x: 150, y: 67 }, { x: 150, y: 67 },
    { x: 150, y: 68 }, { x: 150, y: 69 }, { x: 151, y: 70 }, { x: 151, y: 71 }, { x: 152, y: 72 },
    { x: 152, y: 73 }, { x: 153, y: 74 }, { x: 153, y: 75 }, { x: 153, y: 76 }, { x: 154, y: 77 },
    { x: 154, y: 78 }, { x: 154, y: 79 }, { x: 154, y: 80 }, { x: 155, y: 81 }, { x: 155, y: 82 },
    { x: 155, y: 83 }, { x: 155, y: 84 }, { x: 155, y: 85 }, { x: 155, y: 86 }, { x: 155, y: 87 },
    { x: 155, y: 88 }, { x: 155, y: 89 }, { x: 155, y: 90 }, { x: 155, y: 91 }, { x: 155, y: 92 },
    { x: 155, y: 93 }, { x: 155, y: 94 }, { x: 155, y: 95 }, { x: 155, y: 96 }, { x: 155, y: 97 },
    { x: 155, y: 98 }, { x: 155, y: 99 }, { x: 155, y: 100 }, { x: 155, y: 101 }, { x: 155, y: 102 },
    { x: 155, y: 103 }, { x: 155, y: 104 }, { x: 155, y: 105 }, { x: 155, y: 106 }, { x: 155, y: 107 },
    { x: 155, y: 108 }, { x: 155, y: 109 }, { x: 155, y: 110 }, { x: 155, y: 111 }, { x: 155, y: 112 },
    { x: 155, y: 113 }, { x: 155, y: 114 }, { x: 155, y: 115 }, { x: 155, y: 116 }, { x: 155, y: 117 },
    { x: 155, y: 118 }, { x: 154, y: 119 }, { x: 154, y: 120 }, { x: 154, y: 121 }, { x: 154, y: 122 },
    { x: 153, y: 123 }, { x: 153, y: 124 }, { x: 153, y: 125 }, { x: 152, y: 126 }, { x: 152, y: 127 },
    { x: 151, y: 128 }, { x: 151, y: 129 }, { x: 150, y: 130 }, { x: 150, y: 131 }, { x: 150, y: 132 },
    { x: 149, y: 133 }, { x: 148, y: 134 }, { x: 147, y: 135 }, { x: 146, y: 136 }, { x: 146, y: 137 },
    { x: 146, y: 138 }, { x: 145, y: 139 }, { x: 144, y: 140 }, { x: 143, y: 141 }, { x: 142, y: 142 },
    { x: 141, y: 143 }, { x: 140, y: 144 }, { x: 139, y: 145 }, { x: 138, y: 146 }, { x: 137, y: 146 },
    { x: 136, y: 147 }, { x: 135, y: 148 }, { x: 134, y: 148 }, { x: 133, y: 149 }, { x: 132, y: 150 },
    { x: 131, y: 150 }, { x: 130, y: 150 }, { x: 129, y: 151 }, { x: 128, y: 151 }, { x: 127, y: 152 },
    { x: 126, y: 152 }, { x: 125, y: 153 }, { x: 124, y: 153 }, { x: 123, y: 153 }, { x: 122, y: 154 },
    { x: 121, y: 154 }, { x: 120, y: 154 }, { x: 119, y: 154 }, { x: 118, y: 154 }, { x: 117, y: 154 },
    { x: 116, y: 155 }, { x: 115, y: 155 }, { x: 114, y: 155 }, { x: 113, y: 155 }, { x: 112, y: 155 },
    { x: 111, y: 155 }, { x: 110, y: 155 }, { x: 109, y: 155 }, { x: 108, y: 155 }, { x: 107, y: 155 },
    { x: 106, y: 155 }, { x: 105, y: 155 }, { x: 104, y: 155 }, { x: 103, y: 155 }, { x: 102, y: 155 },
    { x: 101, y: 155 }, { x: 100, y: 155 }, { x: 99, y: 155 }, { x: 98, y: 155 }, { x: 97, y: 155 },
    { x: 96, y: 155 }, { x: 95, y: 155 }, { x: 94, y: 155 }, { x: 93, y: 155 }, { x: 92, y: 155 },
    { x: 91, y: 155 }, { x: 90, y: 155 }, { x: 89, y: 155 }, { x: 88, y: 155 }, { x: 87, y: 155 },
    { x: 86, y: 155 }, { x: 85, y: 155 }, { x: 84, y: 155 }, { x: 83, y: 155 }, { x: 82, y: 154 },
    { x: 81, y: 154 }, { x: 80, y: 154 }, { x: 79, y: 154 }, { x: 78, y: 154 }, { x: 77, y: 154 },
    { x: 76, y: 153 }, { x: 75, y: 153 }, { x: 74, y: 153 }, { x: 73, y: 152 }, { x: 72, y: 152 },
    { x: 71, y: 151 }, { x: 70, y: 151 }, { x: 69, y: 150 }, { x: 68, y: 150 }, { x: 67, y: 150 },
    { x: 66, y: 149 }, { x: 65, y: 148 }, { x: 64, y: 148 }, { x: 63, y: 147 }, { x: 62, y: 146 },
    { x: 61, y: 146 }, { x: 60, y: 145 }, { x: 59, y: 144 }, { x: 58, y: 143 }, { x: 57, y: 142 },
    { x: 56, y: 141 }, { x: 55, y: 140 }, { x: 54, y: 139 }, { x: 53, y: 138 }, { x: 53, y: 137 },
    { x: 53, y: 136 }, { x: 52, y: 135 }, { x: 51, y: 134 }, { x: 50, y: 133 }, { x: 49, y: 132 },
    { x: 49, y: 131 }, { x: 49, y: 130 }, { x: 48, y: 129 }, { x: 48, y: 128 }, { x: 47, y: 127 },
    { x: 47, y: 126 }, { x: 46, y: 125 }, { x: 46, y: 124 }, { x: 46, y: 123 }, { x: 45, y: 122 },
    { x: 45, y: 121 }, { x: 45, y: 120 }, { x: 45, y: 119 }, { x: 44, y: 118 }, { x: 44, y: 117 },
    { x: 44, y: 116 }, { x: 44, y: 115 }, { x: 44, y: 114 }, { x: 44, y: 113 }, { x: 44, y: 112 },
    { x: 44, y: 111 }, { x: 44, y: 110 }, { x: 44, y: 109 }, { x: 44, y: 108 }, { x: 44, y: 107 },
    { x: 44, y: 106 }, { x: 44, y: 105 }, { x: 44, y: 104 }, { x: 44, y: 103 }, { x: 44, y: 102 },
    { x: 44, y: 101 }, { x: 44, y: 100 }, { x: 44, y: 99 }, { x: 44, y: 98 }, { x: 44, y: 97 },
    { x: 44, y: 96 }, { x: 44, y: 95 }, { x: 44, y: 94 }, { x: 44, y: 93 }, { x: 44, y: 92 },
    { x: 44, y: 91 }, { x: 44, y: 90 }, { x: 44, y: 89 }, { x: 44, y: 88 }, { x: 44, y: 87 },
    { x: 44, y: 86 }, { x: 44, y: 85 }, { x: 44, y: 84 }, { x: 44, y: 83 }, { x: 44, y: 82 },
    { x: 44, y: 81 }, { x: 45, y: 80 }, { x: 45, y: 79 }, { x: 45, y: 78 }, { x: 45, y: 77 },
    { x: 46, y: 76 }, { x: 46, y: 75 }, { x: 46, y: 74 }, { x: 47, y: 73 }, { x: 47, y: 72 },
    { x: 48, y: 71 }, { x: 48, y: 70 }, { x: 49, y: 69 }, { x: 49, y: 68 }, { x: 49, y: 67 },
    { x: 50, y: 66 }, { x: 51, y: 65 }, { x: 52, y: 64 }, { x: 53, y: 63 }, { x: 53, y: 62 },
    { x: 53, y: 61 }, { x: 54, y: 60 }, { x: 55, y: 59 }, { x: 56, y: 58 }, { x: 57, y: 57 },
    { x: 58, y: 56 }, { x: 59, y: 55 }, { x: 60, y: 54 }, { x: 61, y: 53 }, { x: 62, y: 53 },
    { x: 63, y: 52 }, { x: 64, y: 51 }, { x: 65, y: 51 }, { x: 66, y: 50 }, { x: 67, y: 49 },
    { x: 68, y: 49 }, { x: 69, y: 49 }, { x: 70, y: 48 }, { x: 71, y: 48 }, { x: 72, y: 47 },
    { x: 73, y: 47 }, { x: 74, y: 46 }, { x: 75, y: 46 }, { x: 76, y: 46 }, { x: 77, y: 45 },
    { x: 78, y: 45 }, { x: 79, y: 45 }, { x: 80, y: 45 }, { x: 81, y: 45 }, { x: 82, y: 45 },
    { x: 83, y: 44 }, { x: 84, y: 44 }, { x: 85, y: 44 }, { x: 86, y: 44 }, { x: 87, y: 44 },
    { x: 88, y: 44 }, { x: 89, y: 44 }, { x: 90, y: 44 }, { x: 91, y: 44 }, { x: 92, y: 44 },
    { x: 93, y: 44 }, { x: 94, y: 44 }, { x: 95, y: 44 }, { x: 96, y: 44 }, { x: 97, y: 44 },
    { x: 98, y: 44 }, { x: 99, y: 44 }
  ];

  // Where each group is on that path: an index into the list above.
  circIndx1 = 0;
  circIndx2 = 0;

  // Which group the gun is in (1 or 2), and which way it is facing (one of the four FD values).
  gun_group = 0;
  facing_dir = 0;

  // Which of the ray's two pictures is showing, and the count of frames until it changes.
  ray_frame = 0;
  ray_frame_delay = 0;

  // Which way round the groups are going (1 or 2), and how many aliens have been squished since they last changed
  // direction.
  rotDir = 0;
  rotDirChangeCount = 0;

  // The sound of the ray (a sound that goes round and round), so that it can be stopped; -1 when it is not
  // playing.
  laser_channel = -1;

  // The eight aliens: numbers 0 to 3 are the first group's (top, bottom, left, right) and 4 to 7 the second
  // group's, in the same order.  For each: what it is doing (one of the AS values), a count of frames until it
  // does the next thing, which of the six pictures is showing, and a count of frames between dance steps.
  //
  // NOTE: initializeSquishem() sets up only the first six of the eight, in the original and here.  The last two
  // (the left and right aliens of the second group) begin as these lists have them, which makes them pop up on
  // the first frame of the first game; and in every game after that they begin as the game before left them.
  alienStates = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
  alienDelays = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
  alienFrames = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
  alienDancingDelays = [ 0, 0, 0, 0, 0, 0, 0, 0 ];

  // The stars: a list of 195, of which number 0 is not used.  For each: where it is in space (across, up and down,
  // and how far away), and then where that puts it on the screen (across, and up and down).
  //
  // NOTE: only the first three numbers of each star are set when a game begins, so on the first frame of a game
  // the stars are drawn where the game before left them (or all in one corner, the first time).
  stars = this.newStars();


  /**
   * Constructor.
   */
  constructor() {

    console.log(`SquishemScene.constructor`);

    super(`SquishemScene`);

  } /* End constructor. */


  /**
   * Sets the mini-game up.
   */
  loadMiniGame() {

    console.log(`SquishemScene.loadMiniGame()`);

    this.initializeSquishem();

  } /* End loadMiniGame(). */


  /**
   * Draws one frame of the mini-game, and does one frame's worth of its game logic.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfMiniGame(inBackbuffer) {

    const circPnts = this.circPnts;
    const stars = this.stars;

    // Draw the stars in their new positions.  Each is a square of four white pixels.
    //
    // Note that xadj is added to where a star is across, but yadj is NOT added to where it is up and down, so the
    // whole field of stars is 20 pixels higher than the play area it belongs to (the stars stream out from a point
    // 20 pixels above the middle).  That is how the original has it.  See also toUnsignedShort().
    for (let j = 1; j < 195; j++) {
      const star_x = this.toUnsignedShort(stars[j][3]);
      const star_y = this.toUnsignedShort(stars[j][4]);
      inBackbuffer.SetPixel(xadj + star_x, star_y, RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + star_x + 1, star_y, RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + star_x, star_y + 1, RGB(255, 255, 255));
      inBackbuffer.SetPixel(xadj + star_x + 1, star_y + 1, RGB(255, 255, 255));
    }

    // First group: the aliens (or empty vortices) above, below, left and right of its middle.
    const first = circPnts[this.circIndx1];
    inBackbuffer.BltFast(xadj + (first.x - 12), yadj + (first.y - 40), this.alienImages[this.alienFrames[0]], null);
    inBackbuffer.BltFast(xadj + (first.x - 12), yadj + (first.y + 16), this.alienImages[this.alienFrames[1]], null);
    inBackbuffer.BltFast(xadj + (first.x - 40), yadj + (first.y - 12), this.alienImages[this.alienFrames[2]], null);
    inBackbuffer.BltFast(xadj + (first.x + 16), yadj + (first.y - 12), this.alienImages[this.alienFrames[3]], null);

    // Second group.
    const second = circPnts[this.circIndx2];
    inBackbuffer.BltFast(xadj + (second.x - 12), yadj + (second.y - 40), this.alienImages[this.alienFrames[4]], null);
    inBackbuffer.BltFast(xadj + (second.x - 12), yadj + (second.y + 16), this.alienImages[this.alienFrames[5]], null);
    inBackbuffer.BltFast(xadj + (second.x - 40), yadj + (second.y - 12), this.alienImages[this.alienFrames[6]], null);
    inBackbuffer.BltFast(xadj + (second.x + 16), yadj + (second.y - 12), this.alienImages[this.alienFrames[7]], null);

    // Blit gun and ray (if applicable), and see if we need to alter an alien.
    let pathIndx;
    if (this.gun_group === 1) {
      pathIndx = this.circIndx1;
    } else {
      pathIndx = this.circIndx2;
    }
    // Note that yadj is not added to the top of this rectangle though it is added to the bottom, so the gun is
    // drawn stretched to 44 pixels deep instead of 24 (and then turned to face the way it is facing).  That is how
    // the original has it.  The rectangle's middle is where it should be, in the middle of the group.
    const rect = CRect(
      xadj + (circPnts[pathIndx].x - 12), (circPnts[pathIndx].y - 2),
      xadj + (circPnts[pathIndx].x + 12), yadj + (circPnts[pathIndx].y + 22)
    );
    // Facing north.
    if (this.facing_dir === this.FD_NORTH) {
      inBackbuffer.Blt(rect, this.gun, null, { nRotationAngle: 27000 });
      // Firing in this direction.
      if (gameState.player_dir_north) {
        inBackbuffer.BltFast(xadj + rect.left - 10, yadj + rect.top - 16, this.rayV[this.ray_frame], null);
        // Whichever group we're in, if there is an alien above us that is NOT hidden or squished, squish'em.
        if (this.gun_group === 1) {
          this.squishIfThere(0);
        }
        if (this.gun_group === 2) {
          this.squishIfThere(4);
        }
      }
    }
    // Facing east.
    if (this.facing_dir === this.FD_EAST) {
      inBackbuffer.Blt(rect, this.gun, null, { nRotationAngle: 0 });
      if (gameState.player_dir_east) {
        inBackbuffer.BltFast(xadj + rect.left, yadj + rect.top, this.rayH[this.ray_frame], null);
        if (this.gun_group === 1) {
          this.squishIfThere(3);
        }
        if (this.gun_group === 2) {
          this.squishIfThere(7);
        }
      }
    }
    // Facing south.
    if (this.facing_dir === this.FD_SOUTH) {
      inBackbuffer.Blt(rect, this.gun, null, { nRotationAngle: 9000 });
      if (gameState.player_dir_south) {
        inBackbuffer.BltFast(xadj + rect.left - 10, yadj + rect.top + 10, this.rayV[this.ray_frame], null);
        if (this.gun_group === 1) {
          this.squishIfThere(1);
        }
        if (this.gun_group === 2) {
          this.squishIfThere(5);
        }
      }
    }
    // Facing west.
    if (this.facing_dir === this.FD_WEST) {
      inBackbuffer.Blt(rect, this.gun, null, { nRotationAngle: 18000 });
      if (gameState.player_dir_west) {
        inBackbuffer.BltFast(xadj + rect.left - 26, yadj + rect.top, this.rayH[this.ray_frame], null);
        if (this.gun_group === 1) {
          this.squishIfThere(2);
        }
        if (this.gun_group === 2) {
          this.squishIfThere(6);
        }
      }
    }

    // Update ray animation.
    this.ray_frame_delay++;
    if (this.ray_frame_delay > 1) {
      this.ray_frame_delay = 0;
      if (this.ray_frame === 0) {
        this.ray_frame = 1;
      } else {
        this.ray_frame = 0;
      }
    }

    // Move the groups along, two points at a time, one way round or the other.
    if (this.rotDir === 1) {
      this.circIndx1 = this.circIndx1 + 2;
      if (this.circIndx1 > 341) {
        this.circIndx1 = 1;
      }
      this.circIndx2 = this.circIndx2 + 2;
      if (this.circIndx2 > 341) {
        this.circIndx2 = 1;
      }
    } else {
      this.circIndx1 = this.circIndx1 - 2;
      if (this.circIndx1 < 1) {
        this.circIndx1 = 341;
      }
      this.circIndx2 = this.circIndx2 - 2;
      if (this.circIndx2 < 1) {
        this.circIndx2 = 341;
      }
    }

    // Update aliens.
    for (let i = 0; i < 8; i++) {
      this.alienDelays[i]--;
      switch (this.alienStates[i]) {
        // If we're hidden...
        case this.AS_HIDDEN: {
          // See if it's time to pop up.
          if (this.alienDelays[i] < 0) {
            // It is time to pop up!
            sndObj.playSound(this.sfxAlienPopup);
            this.alienStates[i] = this.AS_POPPING_UP;
            this.alienFrames[i]++;
            this.alienDelays[i] = 2;
          }
        break; }
        // If we're popping up...
        case this.AS_POPPING_UP: {
          // See if it's time to change frames.
          if (this.alienDelays[i] < 0) {
            // It is time to change frames!
            this.alienFrames[i]++;
            if (this.alienFrames[i] > 2) {
              // If we're now really displaying the first dancing frame, change states.
              this.alienStates[i] = this.AS_DANCING;
              this.alienDelays[i] = 48;
              this.alienDancingDelays[i] = 2;
            } else {
              // No, we're now displaying the second popup frame, so reset the delay.
              this.alienDelays[i] = 2;
            }
          }
        break; }
        // If we're dancing...
        case this.AS_DANCING: {
          // See if it's time to go down.
          if (this.alienDelays[i] < 0) {
            this.alienStates[i] = this.AS_GOING_DOWN;
          } else {
            // No, it's NOT time to go down...  Only swap if the delay between dancing frames is up.
            this.alienDancingDelays[i]--;
            if (this.alienDancingDelays[i] < 0) {
              this.alienDancingDelays[i] = 2;
              // Swap frames.
              if (this.alienFrames[i] === 3) {
                this.alienFrames[i] = 4;
              } else {
                this.alienFrames[i] = 3;
              }
            }
          }
        break; }
        // If we're going down...
        case this.AS_GOING_DOWN: {
          // See if it's time to change frames.
          if (this.alienDelays[i] < 0) {
            this.alienFrames[i]--;
            if (this.alienFrames[i] < 1) {
              // If we're now really displaying the hidden frame, change states.  It got away: that costs points.
              this.alienStates[i] = this.AS_HIDDEN;
              this.alienDelays[i] = rand() % 120;
              this.subtractFromScore(5);
            } else {
              // No, we're displaying the next going down frame, so reset the delay.
              this.alienDelays[i] = 2;
            }
          }
        break; }
        // If we're squished...
        case this.AS_SQUISHED: {
          // See if we've been squished a while.
          if (this.alienDelays[i] < 0) {
            // Yep, been squished a while, so reset for the next time.
            this.alienFrames[i] = 0;
            this.alienStates[i] = this.AS_HIDDEN;
            this.alienDelays[i] = rand() % 120;
          }
        break; }
      }
    }

    // Move the stars: each comes 3 nearer every frame, and one that has reached us is put back out in space
    // somewhere at random.  Then work out where each one is on the screen: the nearer it is, the further from the
    // middle.
    //
    // The original kept all of these as "float" numbers, which hold fewer digits than JavaScript's numbers do.
    // Math.fround() rounds a number to what a float can hold, so that the sums come out the same.
    for (let k = 1; k < 195; k++) {
      stars[k][2] = Math.fround(stars[k][2] - 3);
      // Re-initialize if star is too close.
      if (stars[k][2] <= 0) {
        stars[k][0] = (rand() % 70) - 35;
        stars[k][1] = (rand() % 70) - 35;
        stars[k][2] = (rand() % 100) + 1;
      }
      stars[k][3] = Math.fround(Math.fround(Math.fround(stars[k][0] / stars[k][2]) * 200) + (200 >> 1));
      stars[k][4] = Math.fround(Math.fround(Math.fround(stars[k][1] / stars[k][2]) * 200) + (200 >> 1));
    }

  } /* End pnfMiniGame(). */


  /**
   * Squishes one of the aliens, if it is there to be squished (that is, if it is neither hidden nor squished
   * already): 10 points, and one more towards the groups changing the way they go round.
   *
   * The original wrote this out eight times over in pnfSquishem(), once for each alien.
   *
   * @param {number} inAlien Which alien: 0 to 7.
   */
  squishIfThere(inAlien) {

    if (this.alienStates[inAlien] !== this.AS_HIDDEN && this.alienStates[inAlien] !== this.AS_SQUISHED) {
      sndObj.playSound(this.sfxSquish);
      this.alienStates[inAlien] = this.AS_SQUISHED;
      this.alienFrames[inAlien] = 5;
      this.alienDelays[inAlien] = 24;
      this.addToScore(10);
      this.checkDirChange();
    }

  } /* End squishIfThere(). */


  /**
   * A key was pressed.  ACTION moves the gun to the other group, but only when no direction is being held.  UP,
   * DOWN, LEFT and RIGHT start the ray firing that way (and its sound), and turn the gun to face that way if no
   * other direction is being held.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    // Action button.
    if (inKey === gameState.kAction && !gameState.player_dir_north && !gameState.player_dir_south &&
      !gameState.player_dir_east && !gameState.player_dir_west
    ) {
      sndObj.playSound(this.sfxSwitchGroups);
      gameState.player_button_down = true;
      if (this.gun_group === 1) {
        this.gun_group = 2;
      } else {
        this.gun_group = 1;
      }
    }

    if (inKey === gameState.kUp || inKey === gameState.kDown || inKey === gameState.kLeft ||
      inKey === gameState.kRight
    ) {
      if (this.laser_channel === -1) {
        this.laser_channel = sndObj.playSound(this.sfxLaser, true);
      }
    }

    // Handle up movement events.
    if (inKey === gameState.kUp) {
      gameState.player_dir_north = true;
      this.determineGunDir();
    }

    // Handle down movement events.
    if (inKey === gameState.kDown) {
      gameState.player_dir_south = true;
      this.determineGunDir();
    }

    // Handle left movement events.
    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = true;
      this.determineGunDir();
    }

    // Handle right movement events.
    if (inKey === gameState.kRight) {
      gameState.player_dir_east = true;
      this.determineGunDir();
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Quit Game" popup.  Letting go of any direction
   * stops the sound of the ray (even if another direction is still held), and stops the ray firing that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    if (inKey === gameState.kCommand) {
      this.miniGameCommandButtonHandler();
    }

    // Action button.
    if (inKey === gameState.kAction) {
      gameState.player_button_down = false;
    }

    if (inKey === gameState.kUp || inKey === gameState.kDown || inKey === gameState.kLeft ||
      inKey === gameState.kRight
    ) {
      if (this.laser_channel !== -1) {
        sndObj.stopSound(this.laser_channel);
        this.laser_channel = -1;
      }
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
   * Initialize.  Puts the two groups at opposite points of their path with the gun in the first, hides the aliens
   * (the first six of them: see the NOTE on alienStates) for a time chosen at random, and scatters the stars.
   *
   * (The original also filled in the path here, by calling setupPath().  The path is a field of this class
   * instead.)
   */
  initializeSquishem() {

    // Setup the starting positions for each group within our path.
    this.circIndx1 = 1;
    this.circIndx2 = 171;

    this.gun_group = 1;
    this.facing_dir = this.FD_EAST;
    this.ray_frame = 0;
    this.ray_frame_delay = 0;
    this.rotDir = 1;
    this.rotDirChangeCount = 0;

    // Initialize our aliens.
    for (let i = 0; i < 6; i++) {
      this.alienStates[i] = this.AS_HIDDEN;
    }
    for (let i = 0; i < 6; i++) {
      this.alienDelays[i] = rand() % 120;
    }
    for (let i = 0; i < 6; i++) {
      this.alienFrames[i] = 0;
    }
    for (let i = 0; i < 6; i++) {
      this.alienDancingDelays[i] = 0;
    }

    // Initialize stars for 3-D starfield.
    for (let i = 1; i < 195; i++) {
      this.stars[i][0] = (rand() % 70) - 35;
      this.stars[i][1] = (rand() % 70) - 35;
      this.stars[i][2] = (rand() % 100) + 1;
    }

    this.laser_channel = -1;

  } /* End initializeSquishem(). */


  /**
   * Makes the list of stars: 195 lists of five zeros.
   *
   * @return {Array} The list.
   */
  newStars() {

    const stars = [ ];
    for (let i = 0; i < 195; i++) {
      stars.push([ 0, 0, 0, 0, 0 ]);
    }
    return stars;

  } /* End newStars(). */


  /**
   * Turns a number into what the original got when it stored it in an "unsigned short" (a whole number from 0 to
   * 65,535), as it did with a star's place on the screen before drawing it: the part after the decimal point is
   * dropped, and a number below 0 wraps round to a very large one.
   *
   * NOTE: what the original's compiler really did with a number below 0 here is not laid down by the language,
   * and could not be tested.  Wrapping round is what such compilers usually do, and it puts those stars far off
   * the screen, where they are not seen, which is what one would expect of a star that has gone off the left or
   * the top.
   *
   * @param  {number} inValue The number.
   * @return {number}         The whole number from 0 to 65,535.
   */
  toUnsignedShort(inValue) {

    return Math.trunc(inValue) & 0xFFFF;

  } /* End toUnsignedShort(). */


  /**
   * Turns the gun to face the way of the direction key that is held, if exactly one is.  With two or more held it
   * stays facing as it was.
   */
  determineGunDir() {

    const north = gameState.player_dir_north;
    const south = gameState.player_dir_south;
    const east = gameState.player_dir_east;
    const west = gameState.player_dir_west;

    // North.
    if (north && !south && !east && !west) {
      this.facing_dir = this.FD_NORTH;
    }
    // South.
    if (!north && south && !east && !west) {
      this.facing_dir = this.FD_SOUTH;
    }
    // East.
    if (!north && !south && east && !west) {
      this.facing_dir = this.FD_EAST;
    }
    // West.
    if (!north && !south && !east && west) {
      this.facing_dir = this.FD_WEST;
    }

  } /* End determineGunDir(). */


  /**
   * Counts an alien squished, and on every eleventh one sends the groups round the other way.
   */
  checkDirChange() {

    this.rotDirChangeCount++;
    if (this.rotDirChangeCount > 10) {
      this.rotDirChangeCount = 0;
      if (this.rotDir === 1) {
        this.rotDir = 2;
      } else {
        this.rotDir = 1;
      }
    }

  } /* End checkDirChange(). */


} /* End class. */
