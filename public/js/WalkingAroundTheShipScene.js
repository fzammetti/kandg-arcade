/**
 * Walking Around The Ship: the heart of an Adventure game.  The player walks around one level of Krelmac and
 * Gentoo's ship, seen from above, while robots teleport from place to place around them.  On each level there are:
 *
 *   - five game consoles.  Standing at one and pressing ACTION plays that console's mini-game;
 *   - a captive, who (once talked to) gives a hint that is needed for the fifth console's mini-game;
 *   - two health pick-ups (walking onto either one restores full health, once per level);
 *   - a teleporter, which takes the player to the next level once all five mini-games have been completed.
 *
 * Touching a robot costs a quarter of the player's health and blows the robot up.  When the health runs out the
 * player has died.  Completing the fifth level wins the game.
 *
 * This is the port of walking_around_the_ship.cpp.
 *
 * HOW THE MAP WORKS.  Each level is a map of 52 by 52 tiles, each tile 20 pixels square.  A map file is simply
 * 2,704 bytes, one per tile, row by row; the value of each byte says what is on that tile (0 is bare floor, 3 to
 * 19 are pieces of wall, 20 is the teleporter and so on: see the tile constants below).  The screen shows a window
 * of 14 by 18 tiles on to the map.  ul_tile says which map tile is in the upper left-hand corner of that window,
 * and horizontal_offset and vertical_offset slide the whole window by up to 19 pixels, which is what makes the
 * scrolling smooth.  The window is drawn starting one tile off the top-left of the screen, so that there is
 * always something to slide in.
 *
 * The player is NOT kept in the middle of the screen.  They walk freely about the middle of it, and the map only
 * scrolls when they get near an edge.
 *
 * A NOTE ON THINGS THAT ARE NOT RESET.  Phaser makes this scene object once and re-uses it.  The original kept
 * its variables the same way, and deliberately did NOT reset some of them each time the ship was shown: where the
 * player is, how far the map has scrolled, and whether the health has been collected.  That is how the player
 * comes back to the same spot after playing a mini-game.  The same is true here: those fields are only set when a
 * level is begun or a saved game is continued.
 */
class WalkingAroundTheShipScene extends GameScene {


  // ----- Things that never change.

  // Number of robots per level.
  ROBOTS_COUNT = 50;

  // Maximum number of tiles a robot can move in one teleportation.
  MAX_ROBOT_MOVE = 3;

  // Number of pixels per frame moved by the player on the screen.
  PLAYERMOVEONSCREEN = 3;

  // Number of pixels per frame the screen scrolls when the player is at the edges.
  PLAYERMOVESCROLLING = 2;

  // Tile values that are used in collision detections.
  tileTeleporter = 20;
  tileConsole_01 = 23;
  tileConsole_02 = 24;
  tileConsole_03 = 25;
  tileConsole_04 = 26;
  tileConsole_05 = 27;
  tileCaptive = 30;
  tileHealth = 32;

  // These are the ranges that are checked to determine collisions and such later.
  tileFloorMin = 0;
  tileFloorMax = 0;
  tileWallMin = 3;
  tileWallMax = 19;

  // Player orientations: the way the player is facing.
  pOrientN = 20;
  pOrientS = 21;
  pOrientE = 22;
  pOrientW = 23;

  // Robot states.  A robot stands still for a while, disappears, waits a second, appears somewhere nearby, and
  // stands still again.  If it is touched while standing still it explodes.  (rsNewTile is not used.)
  rsStill = 30;
  rsDisappearing = 31;
  rsNewTile = 32;
  rsAppearing = 33;
  rsExploding = 34;

  // Number of tiles horizontally and vertically displayed on the screen.
  tiles_across_screen = 14;
  tiles_down_screen = 18;

  // Number of tiles wide and high the map is.
  map_width = 52;
  map_height = 52;

  // ----- The pictures.

  // Images of the player walking north, south, east and west: three frames each.
  player_walking_n = [ `gfx_player_walking_n_00`, `gfx_player_walking_n_01`, `gfx_player_walking_n_02` ];
  player_walking_s = [ `gfx_player_walking_s_00`, `gfx_player_walking_s_01`, `gfx_player_walking_s_02` ];
  player_walking_e = [ `gfx_player_walking_e_00`, `gfx_player_walking_e_01`, `gfx_player_walking_e_02` ];
  player_walking_w = [ `gfx_player_walking_w_00`, `gfx_player_walking_w_01`, `gfx_player_walking_w_02` ];

  // Points to the image of the player currently being displayed.
  current_player_image = `gfx_player_walking_n_00`;

  // The robot's animation sequences.  Each is a list of pictures to show one after another, a frame apiece, and
  // each ends with null, which is how the code knows it has reached the end (as in the original).
  //
  // Standing still: the robot's seven "still" pictures, forwards and then backwards.
  robot_anim_seq_still = [
    `gfx_robot_still_00`, `gfx_robot_still_01`, `gfx_robot_still_02`, `gfx_robot_still_03`, `gfx_robot_still_04`,
    `gfx_robot_still_05`, `gfx_robot_still_06`, `gfx_robot_still_05`, `gfx_robot_still_04`, `gfx_robot_still_03`,
    `gfx_robot_still_02`, `gfx_robot_still_01`, `gfx_robot_still_00`,
    null
  ];

  // Disappearing: seventeen pictures.
  robot_anim_seq_disappearing = [
    `gfx_robot_disappearing_appearing_00`, `gfx_robot_disappearing_appearing_01`,
    `gfx_robot_disappearing_appearing_02`, `gfx_robot_disappearing_appearing_03`,
    `gfx_robot_disappearing_appearing_04`, `gfx_robot_disappearing_appearing_05`,
    `gfx_robot_disappearing_appearing_06`, `gfx_robot_disappearing_appearing_07`,
    `gfx_robot_disappearing_appearing_08`, `gfx_robot_disappearing_appearing_09`,
    `gfx_robot_disappearing_appearing_10`, `gfx_robot_disappearing_appearing_11`,
    `gfx_robot_disappearing_appearing_12`, `gfx_robot_disappearing_appearing_13`,
    `gfx_robot_disappearing_appearing_14`, `gfx_robot_disappearing_appearing_15`,
    `gfx_robot_disappearing_appearing_16`,
    null
  ];

  // Appearing: first a shimmer on the tile the robot is about to arrive on (six "new tile" pictures, forwards,
  // backwards and forwards again), and then the disappearing pictures run backwards.
  robot_anim_seq_appearing = [
    `gfx_robot_new_tile_appearing_00`, `gfx_robot_new_tile_appearing_01`, `gfx_robot_new_tile_appearing_02`,
    `gfx_robot_new_tile_appearing_03`, `gfx_robot_new_tile_appearing_04`, `gfx_robot_new_tile_appearing_05`,
    `gfx_robot_new_tile_appearing_04`, `gfx_robot_new_tile_appearing_03`, `gfx_robot_new_tile_appearing_02`,
    `gfx_robot_new_tile_appearing_01`, `gfx_robot_new_tile_appearing_00`, `gfx_robot_new_tile_appearing_01`,
    `gfx_robot_new_tile_appearing_02`, `gfx_robot_new_tile_appearing_03`, `gfx_robot_new_tile_appearing_04`,
    `gfx_robot_new_tile_appearing_05`,
    `gfx_robot_disappearing_appearing_16`, `gfx_robot_disappearing_appearing_15`,
    `gfx_robot_disappearing_appearing_14`, `gfx_robot_disappearing_appearing_13`,
    `gfx_robot_disappearing_appearing_12`, `gfx_robot_disappearing_appearing_11`,
    `gfx_robot_disappearing_appearing_10`, `gfx_robot_disappearing_appearing_09`,
    `gfx_robot_disappearing_appearing_08`, `gfx_robot_disappearing_appearing_07`,
    `gfx_robot_disappearing_appearing_06`, `gfx_robot_disappearing_appearing_05`,
    `gfx_robot_disappearing_appearing_04`, `gfx_robot_disappearing_appearing_03`,
    `gfx_robot_disappearing_appearing_02`, `gfx_robot_disappearing_appearing_01`,
    `gfx_robot_disappearing_appearing_00`,
    null
  ];

  // The explosion shown when a robot is touched: five frames.
  explosion = [ `gfx_explosion_00`, `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04` ];

  // Animation frames for the heart.
  heart = [ `gfx_heart_1`, `gfx_heart_2` ];

  // The lights on the status bar that show which of the level's mini-games have been completed.  (The first was
  // called gdo in the original, which notes "some odd problem when named gameDoneOn".)
  gdo = `gfx_game_done_on`;
  gameDoneOff = `gfx_game_done_off`;

  // The consoles blink between their usual picture (which is in the tiles list below) and this one.
  gfxConsoleFlipped = `gfx_tile_console_01`;

  // Images of the various active tiles: the picture to draw for each tile value in the map.  Entry 0 is the floor,
  // entry 20 the teleporter and so on.  It is filled in each time the ship is shown.  Most entries are never used
  // and stay null.
  tiles = [ ];

  // The two pictures of the captive on the current level, which the captive's tile is animated between.
  captive = [ null, null ];

  // ----- The sounds.

  sfxDeath = `sfx_death`; // Not actually death, but when a robot hits
  sfxBeamMeUp = `sfx_beammeup`; // Teleporting sound
  sfxWalking = `sfx_walking`;
  sfxHeartbeat_1 = `sfx_heartbeat_1`;
  sfxHeartbeat_2 = `sfx_heartbeat_2`;
  sfxAaah = `sfx_aaah`;

  // ----- Where everything is.  (See the notes at the top of this file.)

  // Index into the map array of the upper left-hand tile while walking around the ship.
  ul_tile = { x: 0, y: 0 };

  // Stores the location of the player on the screen, in pixels.
  player_position = { x: 0, y: 0 };

  // Used for scrolling the tiles.
  horizontal_offset = 0;
  vertical_offset = 0;

  // The map data for the current level: 2,704 numbers, one per tile.
  level_map = null;

  // The robots.  Each one is an object with these properties:
  //   tile            - the tile the robot currently inhabits (x and y);
  //   next_tile       - the tile the robot will next move to (x and y);
  //   anim_frame      - the frame of animation the robot is currently doing;
  //   state           - the state the robot is in: one of the rs constants above;
  //   still_counter   - count of how many still animation cycles have occurred;
  //   appearing_delay - delay before the robot appears;
  //   explosion_frame - which frame of the explosion is showing;
  //   explosion_delay - a counter used to time the explosion;
  //   justPositioned  - set to true when a robot has just been positioned by randomlyPositionRobots(), so that we
  //                     can check for a collision with the player on the next frame and avoid the player being
  //                     hurt at once by a robot placed on top of them.
  // The list is made once, in the constructor.
  robots = [ ];

  // ----- The state of play.

  // Flag: have they gotten the health on this level yet?
  got_health = false;

  // Flags: which way the player moved (or the map scrolled) this frame.
  moved_north = false;
  moved_east = false;
  moved_south = false;
  moved_west = false;

  // Has the fire button been pressed?  True for as long as ACTION is held down.
  fire_pressed = false;

  // True while the walking sound is wanted, and the sound itself while it is playing, so that it can be stopped.
  // (The original kept the number of the sound channel it was playing on, hence the name.)
  walkingPlaying = false;
  walkinghsshssChannel = null;

  // The consoles blink: this says which of their two pictures is showing, and a counter that times the blinking.
  consoleFlipped = false;
  console_flip_delay = 0;

  // Used for animating the captive tile.
  captiveFrameDelay = 0;
  captiveFrameCounter = 0;

  // Frame of animation for the player, and a counter that times it.
  player_frame = 0;
  player_frame_delay = 0;

  // Direction the player is currently facing.
  player_orientation = this.pOrientN;

  // Used for animating the heart: a counter that times its beats, and which of its two pictures is showing.
  health_counter = 0;
  health_frame = 0;

  // Counts down after a robot hit.  While it is above zero the player cannot be hurt again.
  health_delay = 0;

  // The red color the teleporter pulses with when it is ready to be used, and which way the pulse is going (0 is
  // getting brighter, 1 is getting darker).
  teleported_rcol = 0;
  teleported_rcol_dir = 0;

  // ----- Used for the level transition, when the screen dissolves away.

  // True while the transition is happening.
  doingTeleportation = false;

  // A 40 by 40 pixel off-screen surface.  It starts off see-through and is filled in with black, a few pixels at a
  // time, in a scrambled order; drawing it over the screen again and again makes the picture dissolve.
  dissolve_surface = null;

  // The scrambled order: 3,200 numbers, being the x and y of each of the 1,600 pixels in turn.
  dissolve_dat = null;

  // How far through dissolve_dat we have got.
  dissolve_data_index = 0;

  // 0 while the picture is dissolving, 1 while the screen is fading from white to black afterwards.
  dissolve_state = 0;

  // Counts down through the fade from white to black.
  dissolve_big_fade = 0;

  // ----- Leaving the screen.

  // The original's doDestroy() did not act on the spot: it set a flag, the rest of the frame carried on as normal,
  // and the screen was left at the start of the next frame.  This screen relies on that (it carries on drawing,
  // and in one place carries on setting things up, after asking to leave).  So here a request to leave is noted
  // in one of these two fields, and acted on when the frame is finished.  See requestDestroy() and pnf().
  //
  // The screen (a cs constant) to go to by the full route, or null if none has been asked for.
  destroy_requested = null;

  // The screen to go to by the quick route (see switchScreen() in GameScene.js), or null.
  switch_requested = null;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`WalkingAroundTheShipScene.constructor`);

    super(`WalkingAroundTheShipScene`);

    // Make the robots.  (Two more than are used, as the original declared them.)
    for (let i = 0; i < this.ROBOTS_COUNT + 2; i++) {
      this.robots.push({
        tile: { x: 0, y: 0 }, next_tile: { x: 0, y: 0 }, anim_frame: 0, state: 0, still_counter: 0,
        appearing_delay: 0, explosion_frame: 0, explosion_delay: 0, justPositioned: false
      });
    }

  } /* End constructor. */


  /**
   * Sets the screen up.  This is the port of loadWalkingAroundTheShip().  It is called every time the ship is
   * shown by the full route: when an Adventure game begins or is continued, on coming back from a mini-game, and on
   * arriving at a new level.
   */
  loadScreen() {

    console.log(`WalkingAroundTheShipScene.loadScreen()`);

    // The original showed its loading screen first, which cleared the screen to black.
    backbuffer.FillRect(null, RGB(0, 0, 0));

    this.destroy_requested = null;
    this.switch_requested = null;

    // Start with no tile pictures at all, then put in the ones that are the same on every level.  All five
    // consoles look alike.
    this.tiles = [ ];
    for (let i = 0; i < 52; i++) {
      this.tiles.push(null);
    }
    this.tiles[20] = `gfx_tile_teleporter_00`;
    this.tiles[32] = `gfx_health`;
    this.tiles[23] = `gfx_tile_console_00`;
    this.tiles[24] = `gfx_tile_console_00`;
    this.tiles[25] = `gfx_tile_console_00`;
    this.tiles[26] = `gfx_tile_console_00`;
    this.tiles[27] = `gfx_tile_console_00`;

    // The captive's tile.  NOTE: at this point in the original the captive's pictures had not yet been chosen, so
    // this set the tile to "no picture".  It only gets its picture when the animation code at the end of pnf()
    // first acts, which is at the end of the third frame.  So for the first three frames after the ship is shown, a
    // captive who is in view is not drawn.  That is kept as it was.
    this.captive = [ null, null ];
    this.tiles[30] = this.captive[0];

    // And the dissolve surface, and the order in which it is filled in.
    this.dissolve_surface = new Surface(40, 40);
    this.dissolve_dat = this.cache.binary.get(`dissolve`);

    // General initialization.
    this.walkingPlaying = false;
    this.walkinghsshssChannel = null;
    gameState.player_dir_east = false;
    gameState.player_dir_west = false;
    gameState.player_dir_south = false;
    gameState.player_dir_north = false;
    this.moved_north = false;
    this.moved_east = false;
    this.moved_south = false;
    this.moved_west = false;
    this.player_frame = 0;
    this.player_frame_delay = 0;
    this.fire_pressed = false;
    this.doingTeleportation = false;
    gameState.current_level_initialized = true;
    this.captiveFrameDelay = 0;
    this.captiveFrameCounter = 0;
    this.health_counter = 0;
    this.health_frame = 0;
    this.health_delay = 0;
    this.initializeLevel(gameState.current_level);

    // Do this if we're restarting a saved game: put the player back where they were when it was saved.
    if (gameState.gameRestarted) {
      this.ul_tile.x = gameState.cl_ul_tile.x;
      this.ul_tile.y = gameState.cl_ul_tile.y;
      this.horizontal_offset = gameState.cl_horizontal_offset;
      this.vertical_offset = gameState.cl_vertical_offset;
      this.player_position.x = gameState.cl_player_position.x;
      this.player_position.y = gameState.cl_player_position.y;
      gameState.gameRestarted = false;
      // The saved game comes from the browser's storage, which anybody can edit.  If what was stored could not
      // be a real position (it would have us reading tiles that are not on the map), start the level afresh
      // instead.  The original trusted its save file and had no such check.
      if (!this.isPositionUsable()) {
        this.startNewLevel(gameState.current_level);
      }
    }

    // Do this if we're starting a new game, and do it only once!
    if (gameState.startingNewGame) {
      gameState.startingNewGame = false;
      this.startNewLevel(1);
    }

    this.randomlyPositionRobots();

    // Echo these values so we can easily get at them for saving, and save the game.  (So the game is saved every
    // time the ship is shown: at the start, after every mini-game and on every new level.)
    this.echoPositionForSaving();
    writeKGAFile(true, false);
    gameState.processEvents = true;

    // Call the loader for the character interaction screen.  (That screen, where the player talks to the captive,
    // is reached from this one by the quick route, so it never gets a loadScreen() of its own.  The original got
    // it ready as the last step of loading the ship, and so do we.)
    this.scene.get(`CharacterInteractionScene`).loadCharacterInteraction();

  } /* End loadScreen(). */


  /**
   * Cleans up when the ship is left by the full route.  This is the port of destroyWalkingAroundTheShip().
   */
  destroyScreen() {

    console.log(`WalkingAroundTheShipScene.destroyScreen()`);

    sndObj.stopSounds();

  } /* End destroyScreen(). */


  /**
   * Notes that the screen should be left, by the full route, when the current frame is finished.  This stands in
   * for the original's doDestroy(), for the reason given where destroy_requested is declared.  If it is called
   * more than once in a frame, the last call wins, as in the original.
   *
   * @param {number} inScreen The screen to go to: one of the cs constants in main.js.
   */
  requestDestroy(inScreen) {

    this.destroy_requested = inScreen;

  } /* End requestDestroy(). */


  /**
   * Copies where the player is, and how far the map has scrolled, to where writeKGAFile() looks for them when it
   * saves the game.  (The original did this in several places with the same six lines each time.)
   */
  echoPositionForSaving() {

    gameState.cl_ul_tile.x = this.ul_tile.x;
    gameState.cl_ul_tile.y = this.ul_tile.y;
    gameState.cl_horizontal_offset = this.horizontal_offset;
    gameState.cl_vertical_offset = this.vertical_offset;
    gameState.cl_player_position.x = this.player_position.x;
    gameState.cl_player_position.y = this.player_position.y;

  } /* End echoPositionForSaving(). */


  /**
   * Says whether the position we have (the map window, how far it has scrolled, and where the player is) is one
   * that could really occur.  This is not part of the original; it is here to check a saved game that has been
   * read back from the browser's storage.
   *
   * @return {boolean} True if the position is usable, false if it is not.
   */
  isPositionUsable() {

    // The map window must lie wholly on the map.
    if (this.ul_tile.x < 0 || this.ul_tile.x > this.map_width - this.tiles_across_screen) {
      return false;
    }
    if (this.ul_tile.y < 0 || this.ul_tile.y > this.map_height - this.tiles_down_screen) {
      return false;
    }

    // It can be scrolled by up to 19 pixels either way, never more.
    if (this.horizontal_offset < -19 || this.horizontal_offset > 19) {
      return false;
    }
    if (this.vertical_offset < -19 || this.vertical_offset > 19) {
      return false;
    }

    // And the player must be somewhere on the screen.
    if (this.player_position.x < 0 || this.player_position.x > 220) {
      return false;
    }
    if (this.player_position.y < 0 || this.player_position.y > 300) {
      return false;
    }

    return true;

  } /* End isPositionUsable(). */


  /**
   * Draws one frame, and does one frame's worth of the game's logic.  This is the port of
   * pnfWalkingAroundTheShip().
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    // Echo these values so we can easily get at them for saving.
    this.echoPositionForSaving();

    if (this.doingTeleportation) { // We're dissolving for a level transition

      this.pnfTeleportation(inBackbuffer);

    } else { // NOT dissolving, go as usual

      this.pnfWalking(inBackbuffer);

    }

    // If anything above asked to leave this screen, the frame is now finished, so go.
    if (this.destroy_requested !== null) {
      const screen = this.destroy_requested;
      this.destroy_requested = null;
      this.switch_requested = null;
      this.doDestroy(getSceneKeyForScreen(screen));
    } else if (this.switch_requested !== null) {
      const screen = this.switch_requested;
      this.switch_requested = null;
      this.switchScreen(getSceneKeyForScreen(screen));
    }

  } /* End pnf(). */


  /**
   * One frame of the level transition.  First the picture that was on the screen dissolves away to black, a few
   * pixels at a time; then the screen flashes white and fades to black; and then the next level begins (or, after
   * the fifth level, the game is won).  In the original this was the first half of pnfWalkingAroundTheShip().
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfTeleportation(inBackbuffer) {

    if (this.dissolve_state === 0) {

      // Fill in another 35 pixels of the dissolve surface with black, in the scrambled order.
      const pixel_color = RGB(0, 0, 0);
      for (let i = 0; i < 35; i++) {
        const x = this.dissolve_dat[this.dissolve_data_index];
        this.dissolve_data_index++;
        const y = this.dissolve_dat[this.dissolve_data_index];
        this.dissolve_data_index++;
        // (The very last batch runs 20 numbers past the end of the data, as it did in the original, where it read
        // whatever happened to be in memory there.  Here there is simply nothing to read, so nothing is drawn.)
        if (x !== undefined && y !== undefined) {
          this.dissolve_surface.SetPixel(x, y, pixel_color);
        }
      }

      // Draw the dissolve surface all over the screen: six across and eight down.  Nothing else is drawn, so the
      // last picture of the ship is still there underneath, with more of it blacked out every frame.
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 6; x++) {
          inBackbuffer.BltFast((x * 40), (y * 40), this.dissolve_surface, null);
        }
      }

      // When every pixel has been filled in, move on to the fade.
      if (this.dissolve_data_index > 3200) {
        this.dissolve_state = 1;
        this.dissolve_big_fade = 31;
      }

    } else {

      if (this.dissolve_big_fade > -1) {

        // The whole screen goes from nearly white down to black in 32 steps.
        const colr = 8 * this.dissolve_big_fade;
        inBackbuffer.FillRect(null, RGB(colr, colr, colr));
        this.dissolve_big_fade--;

      } else {

        if (gameState.current_level === 5) { // THEY WON!!

          // Echo these values so we can easily get at them for saving.
          this.echoPositionForSaving();
          writeKGAFile(false, false);
          this.requestDestroy(csWin);

        } else {

          // On to the next level.  We ask for this same screen to be shown again, by the full route, and get
          // everything ready for it in the meantime.
          this.requestDestroy(csWalkingAroundTheShip);
          this.doingTeleportation = false;
          gameState.player_dir_east = false;
          gameState.player_dir_west = false;
          gameState.player_dir_south = false;
          gameState.player_dir_north = false;
          this.moved_north = false;
          this.moved_east = false;
          this.moved_south = false;
          this.moved_west = false;
          this.player_frame = 0;
          this.player_frame_delay = 0;
          this.fire_pressed = false;
          gameState.games_done[0] = false;
          gameState.games_done[1] = false;
          gameState.games_done[2] = false;
          gameState.games_done[3] = false;
          gameState.games_done[4] = false;
          gameState.processEvents = true;
          gameState.current_level_initialized = true;
          gameState.current_level++;
          this.initializeLevel(gameState.current_level);
          this.startNewLevel(gameState.current_level);
          gameState.levelHintDone = false;
          // Echo these values so we can easily get at them for saving.
          this.echoPositionForSaving();
          writeKGAFile(true, false);

        }

      }

    }

  } /* End pnfTeleportation(). */


  /**
   * One frame of walking around the ship.  In the original this was the second half of
   * pnfWalkingAroundTheShip().
   *
   * It does these things, in this order: draws the map; draws the player; draws the robots and moves them on;
   * draws the status bar and makes the heart beat; moves the player; and then looks at every tile on the screen to
   * see whether the player has walked into a wall, onto a health pick-up, or is using a console, the captive or
   * the teleporter.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnfWalking(inBackbuffer) {

    // Should avoid that rare super-fast heartbeat and subsequent crash.  (Note that the rest of the frame still
    // happens.)
    if (gameState.health <= 0) {
      this.requestDestroy(csPlayerDied);
    }

    let colPoint = { x: -1, y: -1 };

    // ----- Blit tiles.  locX and locY are where on the screen the tile goes, before the scroll offsets are
    // added.  They start one tile off the top-left of the screen.
    let locX = 0;
    let locY = -20;
    let tile = 1;
    for (let y = 0; y < this.tiles_down_screen; y++) {
      locX = -20;
      for (let x = 0; x < this.tiles_across_screen; x++) {
        tile = this.level_map[((this.ul_tile.y + y) * this.map_width) + (this.ul_tile.x + x)];
        // First, always lay down a floor tile.
        inBackbuffer.BltFast(locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[0], null);
        // If it's a teleporter and all games are finished, pulsate the teleporter.
        if (
          tile === this.tileTeleporter && gameState.games_done[0] && gameState.games_done[1] &&
          gameState.games_done[2] && gameState.games_done[3] && gameState.games_done[4]
        ) {
          const color = RGB(this.teleported_rcol, 32, 32);
          if (this.teleported_rcol_dir === 0) {
            this.teleported_rcol = this.teleported_rcol + 10;
            if (this.teleported_rcol > 245) {
              this.teleported_rcol_dir = 1;
            }
          } else {
            this.teleported_rcol = this.teleported_rcol - 10;
            if (this.teleported_rcol < 35) {
              this.teleported_rcol_dir = 0;
            }
          }
          inBackbuffer.BltFastColorized(
            locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], color
          );
        } else if (
          tile === this.tileConsole_01 || tile === this.tileConsole_02 || tile === this.tileConsole_03 ||
          tile === this.tileConsole_04 || tile === this.tileConsole_05
        ) {
          // A console: draw whichever of its two pictures is showing at the moment.
          if (this.consoleFlipped) {
            inBackbuffer.BltFast(
              locX + this.horizontal_offset, locY + this.vertical_offset, this.gfxConsoleFlipped, null
            );
          } else {
            inBackbuffer.BltFast(locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null);
          }
        } else {
          // Now, if it's not actually a floor tile, lay down the correct image.
          if (tile > this.tileFloorMax) {
            // If it's a health tile, only lay it down if the player hasn't gotten it yet this level; if it's NOT a
            // health tile, lay it down.  (The check for "no picture" is for the captive: see loadScreen().)
            if (tile !== this.tileHealth || (tile === this.tileHealth && !this.got_health)) {
              if (this.tiles[tile] !== null) {
                inBackbuffer.BltFast(
                  locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null
                );
              }
            }
          }
        }
        locX = locX + 20;
      }
      locY = locY + 20;
    }

    // ----- Flip consoles.
    this.console_flip_delay++;
    if (this.console_flip_delay > 3) {
      this.console_flip_delay = 0;
      this.consoleFlipped = !this.consoleFlipped;
    }

    // ----- Determine which player orientation to use and blit player.
    switch (this.player_orientation) {
      case this.pOrientN: {
        this.current_player_image = this.player_walking_n[this.player_frame];
        break;
      }
      case this.pOrientS: {
        this.current_player_image = this.player_walking_s[this.player_frame];
        break;
      }
      case this.pOrientE: {
        this.current_player_image = this.player_walking_e[this.player_frame];
        break;
      }
      case this.pOrientW: {
        this.current_player_image = this.player_walking_w[this.player_frame];
        break;
      }
      default: {
        break;
      }
    }
    inBackbuffer.BltFast(this.player_position.x, this.player_position.y, this.current_player_image, null);
    if (this.health_delay > 0) { // Count down timer after a hit
      this.health_delay--;
    }

    // ----- Blit robots, if applicable.
    //
    // A robot's tile is counted from one tile further up and to the left than the map's tiles are, which is why
    // no -20 appears in the sums below: a robot whose tile is (x, y) is drawn over the map's tile (x + 1, y + 1).
    //
    // NOTE: locX and locY are only worked out for a robot that is in view.  An exploding robot is drawn using
    // them without that check, so if the player has scrolled it out of view before its explosion has finished,
    // the explosion is drawn wherever locX and locY were left by the last robot that was in view.  That is the
    // original's behaviour, and is why these two variables are shared with the tile loop above.
    let show_robot = false;
    for (let i = 0; i < this.ROBOTS_COUNT; i++) {
      const robot = this.robots[i];
      if (robot.justPositioned) {
        robot.justPositioned = false;
        // Check for a collision with the player.  If it occurs, reposition the robot and set the flag to do this
        // check again next frame.  (repositionRobot() only chooses where the robot will go NEXT, so the robot
        // stays where it is, unseen and harmless, until the player has moved off it.)
        locX = (robot.tile.x - this.ul_tile.x) * 20;
        locY = (robot.tile.y - this.ul_tile.y) * 20;
        colPoint = Surface.Intersect(
          locX + this.horizontal_offset, locY + this.vertical_offset, this.robot_anim_seq_still[robot.anim_frame],
          null, this.player_position.x, this.player_position.y, this.current_player_image, null
        );
        if (colPoint.x !== -1 || colPoint.y !== -1) {
          this.repositionRobot(i);
          robot.justPositioned = true;
        }
      } else {
        // Is the robot in the part of the map that is on the screen?  If so, work out where to draw it.
        show_robot = false;
        if (
          robot.tile.x >= this.ul_tile.x && robot.tile.x <= this.ul_tile.x + this.tiles_across_screen &&
          robot.tile.y >= this.ul_tile.y && robot.tile.y <= this.ul_tile.y + this.tiles_down_screen
        ) {
          show_robot = true;
          locX = (robot.tile.x - this.ul_tile.x) * 20;
          locY = (robot.tile.y - this.ul_tile.y) * 20;
        }
        switch (robot.state) {

          // Standing still.  This is the only state in which a robot can hurt the player.
          case this.rsStill: {
            if (show_robot) {
              inBackbuffer.BltFast(
                locX + this.horizontal_offset, locY + this.vertical_offset,
                this.robot_anim_seq_still[robot.anim_frame], null
              );
              // Check for collision with player, reduce health or kill as applicable.
              colPoint = Surface.Intersect(
                locX + this.horizontal_offset, locY + this.vertical_offset,
                this.robot_anim_seq_still[robot.anim_frame], null,
                this.player_position.x, this.player_position.y, this.current_player_image, null
              );
              if (colPoint.x !== -1 || colPoint.y !== -1) {
                if (this.health_delay <= 0) {
                  robot.explosion_delay = 0;
                  robot.explosion_frame = 0;
                  robot.state = this.rsExploding;
                  sndObj.playSound(this.sfxDeath);
                  this.health_delay = 25;
                  gameState.health = gameState.health - 3;
                }
              }
            }
            // On to the next frame of the animation.  After it has run through three times, the robot starts to
            // disappear, and where it will reappear is chosen.
            robot.anim_frame++;
            if (this.robot_anim_seq_still[robot.anim_frame] === null) {
              robot.anim_frame = 0;
              robot.still_counter++;
              if (robot.still_counter > 2) {
                robot.state = this.rsDisappearing;
                this.repositionRobot(i);
              }
            }
            break;
          }

          // Disappearing.  When the animation ends the robot moves to its new tile.
          case this.rsDisappearing: {
            if (show_robot) {
              inBackbuffer.BltFast(
                locX + this.horizontal_offset, locY + this.vertical_offset,
                this.robot_anim_seq_disappearing[robot.anim_frame], null
              );
            }
            robot.anim_frame++;
            if (this.robot_anim_seq_disappearing[robot.anim_frame] === null) {
              robot.anim_frame = 0;
              robot.tile.x = robot.next_tile.x;
              robot.tile.y = robot.next_tile.y;
              robot.appearing_delay = 0;
              robot.state = this.rsAppearing;
            }
            break;
          }

          // Appearing.  Nothing is seen for the first 24 frames (a second), and then the animation plays.
          case this.rsAppearing: {
            robot.appearing_delay++;
            if (robot.appearing_delay > 24) {
              if (show_robot) {
                inBackbuffer.BltFast(
                  locX + this.horizontal_offset, locY + this.vertical_offset,
                  this.robot_anim_seq_appearing[robot.anim_frame], null
                );
              }
              robot.anim_frame++;
              if (this.robot_anim_seq_appearing[robot.anim_frame] === null) {
                robot.anim_frame = 0;
                robot.state = this.rsStill;
              }
            }
            break;
          }

          // Exploding, having been touched by the player.  (See the note above about locX and locY.)
          case this.rsExploding: {
            inBackbuffer.BltFast(
              locX + this.horizontal_offset - 10, locY + this.vertical_offset - 10,
              this.explosion[robot.explosion_frame], null
            );
            let ret_val = 0;
            robot.explosion_delay++;
            if (robot.explosion_delay > 0) {
              robot.explosion_delay = 0;
              robot.explosion_frame++;
              if (robot.explosion_frame > 4) {
                ret_val = -1;
              } else {
                ret_val = robot.explosion_frame;
              }
            }
            if (robot.explosion_frame === 2) {
              ret_val = 99;
            }
            // The explosion has finished.
            if (ret_val === -1) {
              // Kill player if no more health.
              if (gameState.health <= 0) {
                this.requestDestroy(csPlayerDied);
              } else { // Otherwise, just put the robot somewhere new (health already reduced at time of collision)
                // Keep picking a place at random until one is found that is a floor tile and not too near the
                // edge of the map.
                let x = 0;
                let y = 0;
                let found = false;
                while (!found) {
                  x = rand() % this.map_width;
                  y = rand() % this.map_height;
                  tile = this.level_map[((y + 1) * this.map_width) + x + 1];
                  found = true;
                  if (tile < this.tileFloorMin || tile > this.tileFloorMin) {
                    found = false;
                  } else if (x < 3 || y < 3 || x > this.map_width - 3 || y > this.map_height - 3) {
                    found = false;
                  }
                }
                robot.tile.x = x;
                robot.tile.y = y;
                robot.anim_frame = rand() % 12;
                robot.state = this.rsStill;
                robot.appearing_delay = 0;
                robot.still_counter = rand() % 4;
              }
            }
            break;
          }

          default: {
            break;
          }

        } // End switch
      } // End if
    } // End for

    // ----- Status: which level this is, at the bottom right...
    if (gameState.current_level >= 1 && gameState.current_level <= 5) {
      inBackbuffer.DrawText(238, 296, `Level ${gameState.current_level}`, font1, GDDRAWTEXT_RIGHT);
    }

    // ...a light for each of the level's five mini-games, lit if it has been completed...
    for (let i = 0; i < 5; i++) {
      if (gameState.games_done[i]) {
        inBackbuffer.BltFast(42 + (i * 30), 297, this.gdo, null);
      } else {
        inBackbuffer.BltFast(42 + (i * 30), 297, this.gameDoneOff, null);
      }
    }

    // ...and the beating heart.  It beats faster the less health the player has: the count of frames between
    // beats is taken from the health itself (12 at full health, down to 3).  Each beat makes one of two sounds.
    this.health_counter--;
    if (this.health_counter <= 0) {
      if (this.health_frame === 0) {
        if (gameState.health < 6) {
          this.health_counter = gameState.health;
        } else {
          this.health_counter = 6;
        }
      } else {
        this.health_counter = gameState.health;
      }
      this.health_frame++;
      if (this.health_frame > 1) {
        this.health_frame = 0;
      }
      if (this.health_frame === 0) {
        sndObj.playSound(this.sfxHeartbeat_1);
      } else {
        sndObj.playSound(this.sfxHeartbeat_2);
      }
    }
    inBackbuffer.BltFast(0, 288, this.heart[this.health_frame], null);

    // The number on the heart is how many more hits the player can take: in green while things are all right, in
    // yellow when they are not.
    switch (gameState.health) {
      case 12: {
        inBackbuffer.DrawText(16, 293, `3`, font1_green, GDDRAWTEXT_CENTER);
        break;
      }
      case 9: {
        inBackbuffer.DrawText(16, 293, `2`, font1_green, GDDRAWTEXT_CENTER);
        break;
      }
      case 6: {
        inBackbuffer.DrawText(16, 293, `1`, font1, GDDRAWTEXT_CENTER);
        break;
      }
      case 3: {
        inBackbuffer.DrawText(16, 293, `0`, font1, GDDRAWTEXT_CENTER);
        break;
      }
      default: {
        break;
      }
    }

    // ----- Move player.
    this.moved_north = false;
    this.moved_east = false;
    this.moved_south = false;
    this.moved_west = false;
    if (gameState.player_dir_north) {
      this.player_position = this.moveNorth(this.player_position);
    }
    if (gameState.player_dir_east) {
      this.player_position = this.moveEast(this.player_position);
    }
    if (gameState.player_dir_south) {
      this.player_position = this.moveSouth(this.player_position);
    }
    if (gameState.player_dir_west) {
      this.player_position = this.moveWest(this.player_position);
    }
    // If the player is moving...
    if (
      gameState.player_dir_north || gameState.player_dir_south || gameState.player_dir_east || gameState.player_dir_west
    ) {
      // If the walking sound is not currently playing, go ahead and play it.
      if (!this.walkingPlaying) {
        this.walkingPlaying = true;
        this.walkinghsshssChannel = sndObj.playSound(this.sfxWalking, true);
      }
    } else {
      // Player is NOT walking, so if the walking sound is playing, stop it.
      if (this.walkingPlaying) {
        this.walkingPlaying = false;
        sndObj.stopSound(this.walkinghsshssChannel);
      }
    }

    // ----- Handle player animation, if applicable.
    if (
      gameState.player_dir_north || gameState.player_dir_south || gameState.player_dir_east || gameState.player_dir_west
    ) {
      this.player_frame_delay++;
      if (this.player_frame_delay > 1) {
        this.player_frame_delay = 0;
        this.player_frame++;
        if (this.player_frame > 2) {
          this.player_frame = 0;
        }
      }
    }

    // ----- Go through the tiles currently displayed and look for any non-floor tiles, check for player collision.
    locX = 0;
    locY = -20;
    tile = 1;
    for (let y = 0; y < this.tiles_down_screen; y++) {
      locX = -20;
      for (let x = 0; x < this.tiles_across_screen; x++) {
        tile = this.level_map[((this.ul_tile.y + y) * this.map_width) + (this.ul_tile.x + x)];

        // If it's a wall, check for a collision.  If there is one, the player is pushed back 5 pixels the way they
        // came.  (That is more than the 3 they moved, so they bounce off the wall a little.)
        if (tile >= this.tileWallMin && tile <= this.tileWallMax) {
          colPoint = Surface.Intersect(
            locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null,
            this.player_position.x, this.player_position.y, this.current_player_image, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            if (this.moved_north) {
              this.player_position.y = this.player_position.y + 5;
            }
            if (this.moved_south) {
              this.player_position.y = this.player_position.y - 5;
            }
            if (this.moved_east) {
              this.player_position.x = this.player_position.x - 5;
            }
            if (this.moved_west) {
              this.player_position.x = this.player_position.x + 5;
            }
          }
        }

        // Deal with it if a health-up and they haven't gotten it yet this level (player does NOT have to hit the
        // button for this).
        if (tile === this.tileHealth && !this.got_health) {
          colPoint = Surface.Intersect(
            locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null,
            this.player_position.x, this.player_position.y, this.current_player_image, null
          );
          if (colPoint.x !== -1 || colPoint.y !== -1) {
            sndObj.playSound(this.sfxAaah);
            this.got_health = true;
            gameState.health = 12;
            writeKGAFile(true, false);
          }
        }

        // If fire is pressed...
        if (this.fire_pressed) {

          // Deal with it if it's a console: play its mini-game.
          if (
            tile === this.tileConsole_01 || tile === this.tileConsole_02 || tile === this.tileConsole_03 ||
            tile === this.tileConsole_04 || tile === this.tileConsole_05
          ) {
            colPoint = Surface.Intersect(
              locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null,
              this.player_position.x, this.player_position.y, this.current_player_image, null
            );
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              gameState.player_dir_north = false;
              gameState.player_dir_south = false;
              gameState.player_dir_east = false;
              gameState.player_dir_west = false;
              this.fire_pressed = false;
              if (this.walkingPlaying) {
                this.walkingPlaying = false;
                sndObj.stopSound(this.walkinghsshssChannel);
              }
              // Mini-games played from the ship are always against the clock.
              gameState.game_submode = gsmTimed;
              gameState.whichGameBeingPlayed = tile - 23; // tile - the literal number here should be in the range 0-4
              gameState.processEvents = false;
              this.requestDestroy(this.startMiniGame(gameState.current_level, tile));
            }
          }

          // Deal with it if it's a captive: talk to them.  (This is the quick route: the ship is not cleaned up,
          // and everything is just as it was left when the conversation is over.)
          if (tile === this.tileCaptive && this.tiles[tile] !== null) {
            colPoint = Surface.Intersect(
              locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null,
              this.player_position.x, this.player_position.y, this.current_player_image, null
            );
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              gameState.player_dir_north = false;
              gameState.player_dir_south = false;
              gameState.player_dir_east = false;
              gameState.player_dir_west = false;
              this.fire_pressed = false;
              gameState.player_button_down = false;
              if (this.walkingPlaying) {
                this.walkingPlaying = false;
                sndObj.stopSound(this.walkinghsshssChannel);
              }
              this.switch_requested = csCharacterInteraction;
            }
          }

          // Deal with it if it's a teleporter.
          if (tile === this.tileTeleporter) {
            colPoint = Surface.Intersect(
              locX + this.horizontal_offset, locY + this.vertical_offset, this.tiles[tile], null,
              this.player_position.x, this.player_position.y, this.current_player_image, null
            );
            if (colPoint.x !== -1 || colPoint.y !== -1) {
              // Advance to next level if all mini-games on this level are complete.
              if (
                gameState.games_done[0] && gameState.games_done[1] && gameState.games_done[2] &&
                gameState.games_done[3] && gameState.games_done[4]
              ) {
                gameState.player_dir_north = false;
                gameState.player_dir_south = false;
                gameState.player_dir_east = false;
                gameState.player_dir_west = false;
                this.fire_pressed = false;
                gameState.processEvents = false;
                if (this.walkingPlaying) {
                  this.walkingPlaying = false;
                  sndObj.stopSound(this.walkinghsshssChannel);
                }
                // Start the dissolve, with its surface wiped clean.
                this.doingTeleportation = true;
                this.dissolve_data_index = 0;
                this.dissolve_state = 0;
                this.dissolve_surface.ClearToTransparent();
                sndObj.playSound(this.sfxBeamMeUp);
              }
            }
          }

        }

        locX = locX + 20;
      }
      locY = locY + 20;
    }

    // ----- Update animated tiles: the captive changes picture every third frame.
    this.captiveFrameDelay++;
    if (this.captiveFrameDelay > 2) {
      this.captiveFrameDelay = 0;
      this.captiveFrameCounter++;
      if (this.captiveFrameCounter > 1) {
        this.captiveFrameCounter = 0;
      }
      this.tiles[30] = this.captive[this.captiveFrameCounter];
    }

  } /* End pnfWalking(). */


  /**
   * A key was pressed.  ACTION is the "fire" button, used at consoles, the captive and the teleporter.  UP, DOWN,
   * LEFT and RIGHT turn the player to face that way and start them walking.  Only one direction counts at a time:
   * pressing a new one cancels the others.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (inKey === gameState.kAction) {
      this.fire_pressed = true;
    }

    if (inKey === gameState.kRight) {
      this.player_frame_delay = 100; // Assure animation next frame
      this.player_orientation = this.pOrientE;
      gameState.player_dir_north = false;
      gameState.player_dir_east = true;
      gameState.player_dir_south = false;
      gameState.player_dir_west = false;
    }

    if (inKey === gameState.kLeft) {
      this.player_frame_delay = 100; // Assure animation next frame
      this.player_orientation = this.pOrientW;
      gameState.player_dir_north = false;
      gameState.player_dir_east = false;
      gameState.player_dir_south = false;
      gameState.player_dir_west = true;
    }

    if (inKey === gameState.kUp) {
      this.player_frame_delay = 100; // Assure animation next frame
      this.player_orientation = this.pOrientN;
      gameState.player_dir_north = true;
      gameState.player_dir_east = false;
      gameState.player_dir_south = false;
      gameState.player_dir_west = false;
    }

    if (inKey === gameState.kDown) {
      this.player_frame_delay = 100; // Assure animation next frame
      this.player_orientation = this.pOrientS;
      gameState.player_dir_north = false;
      gameState.player_dir_east = false;
      gameState.player_dir_south = true;
      gameState.player_dir_west = false;
    }

  } /* End kd(). */


  /**
   * A key was released.  COMMAND brings up the "Continue Game / Save Game / Quit Game" popup; letting go of a
   * direction stops the player walking that way.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // Command button.
    //
    // NOTE: the original handled COMMAND twice in this function.  This first time it set up a popup with only two
    // options (Continue Game and Quit Game), which the second time, further down, straight away replaced with the
    // proper three.  The only thing the player could notice is that the popup's sound is started twice at the
    // same moment.  That is kept as it was.
    if (inKey === gameState.kCommand) {
      if (this.walkingPlaying) {
        this.walkingPlaying = false;
        sndObj.stopSound(this.walkinghsshssChannel);
      }
      // Do a popup...
      // Popup callback.
      this.popupCallback = this.popupCallbackWalkingAroundTheShip;
      // Popup options.
      gameState.gpOptionsCount = 2;
      gameState.gpOptions[0] = `Continue Game`;
      gameState.gpOptions[1] = `Quit Game`;
      // Start popup.
      this.startPopup(`What would you`, `like to do?`);
    }

    if (inKey === gameState.kAction) {
      this.fire_pressed = false;
    }

    if (inKey === gameState.kRight) {
      gameState.player_dir_east = false;
    }

    if (inKey === gameState.kLeft) {
      gameState.player_dir_west = false;
    }

    if (inKey === gameState.kUp) {
      gameState.player_dir_north = false;
    }

    if (inKey === gameState.kDown) {
      gameState.player_dir_south = false;
    }

    // Command button (the second time: see the note above).
    if (inKey === gameState.kCommand) {
      // Do a popup...
      // Popup callback.
      this.popupCallback = this.popupCallbackWalkingAroundTheShip;
      // Popup options.
      gameState.gpOptions[0] = `Continue Game`;
      gameState.gpOptions[1] = `Save Game`;
      gameState.gpOptions[2] = `Quit Game`;
      gameState.gpOptionsCount = 3;
      // Start popup.
      this.startPopup(`What would you`, `like to do?`);
    }

  } /* End ku(). */


  /**
   * Called when the player picks an option in the popup.  Option 0, Continue Game, needs nothing doing.
   *
   * @param {number} inOption The number of the option that was picked.
   */
  popupCallbackWalkingAroundTheShip(inOption) {

    if (inOption === 1) { // Save game
      // Echo these values so we can easily get at them for saving.
      this.echoPositionForSaving();
      writeKGAFile(true, false);
    }

    if (inOption === 2) { // Quit game
      this.doDestroy(`MainMenuScene`);
    }

  } /* End popupCallbackWalkingAroundTheShip(). */


  /**
   * Called to start a new level (called just once to start a new level).  Starts the map in the right place, and
   * initially positions our player.
   *
   * @param {number} inCurrentLevel The level being started, 1 to 5.
   */
  startNewLevel(inCurrentLevel) {

    this.got_health = false;
    gameState.levelHintDone = false;
    gameState.games_done[0] = false;
    gameState.games_done[1] = false;
    gameState.games_done[2] = false;
    gameState.games_done[3] = false;
    gameState.games_done[4] = false;

    switch (inCurrentLevel) {
      case 1: {
        this.ul_tile.x = 0;
        this.ul_tile.y = 0;
        this.horizontal_offset = 0;
        this.vertical_offset = 0;
        this.player_position.x = 160;
        this.player_position.y = 160;
        break;
      }
      case 2: {
        this.ul_tile.x = 38;
        this.ul_tile.y = 34;
        this.horizontal_offset = 0;
        this.vertical_offset = 0;
        this.player_position.x = 160;
        this.player_position.y = 160;
        break;
      }
      case 3: {
        this.ul_tile.x = 37;
        this.ul_tile.y = 34;
        this.horizontal_offset = 0;
        this.vertical_offset = 0;
        this.player_position.x = 160;
        this.player_position.y = 240;
        break;
      }
      case 4: {
        this.ul_tile.x = 28;
        this.ul_tile.y = 8;
        this.horizontal_offset = 0;
        this.vertical_offset = 0;
        this.player_position.x = 60;
        this.player_position.y = 80;
        break;
      }
      case 5: {
        this.ul_tile.x = 0;
        this.ul_tile.y = 0;
        this.horizontal_offset = 0;
        this.vertical_offset = 0;
        this.player_position.x = 80;
        this.player_position.y = 80;
        break;
      }
      default: {
        break;
      }
    }

  } /* End startNewLevel(). */


  /**
   * Called to initialize the current level (called every time the ship is shown by the full route).  Chooses the
   * level's map, the pictures of its floor and walls, and the pictures of its captive.
   *
   * Every level has its own floor and its own nine basic pieces of wall.  Levels 3 and 4 have one more piece of
   * wall, and level 5 has seven more.
   *
   * @param {number} inCurrentLevel The level, 1 to 5.
   */
  initializeLevel(inCurrentLevel) {

    this.teleported_rcol = 0;
    this.teleported_rcol_dir = 0;

    // The map.  The five maps were loaded, with everything else, by PreloadScene.
    this.level_map = this.cache.binary.get(`level_${inCurrentLevel}`);

    // The floor and the walls that every level has.  The pictures are named after the level.
    const prefix = `gfx_tile_level_${inCurrentLevel}_`;
    this.tiles[0] = `${prefix}floor_01`;
    this.tiles[3] = `${prefix}wall_block`;
    this.tiles[4] = `${prefix}wall_n`;
    this.tiles[5] = `${prefix}wall_e`;
    this.tiles[6] = `${prefix}wall_s`;
    this.tiles[7] = `${prefix}wall_w`;
    this.tiles[8] = `${prefix}wall_nw`;
    this.tiles[9] = `${prefix}wall_ne`;
    this.tiles[10] = `${prefix}wall_sw`;
    this.tiles[11] = `${prefix}wall_se`;

    // The extra walls of the later levels.
    if (inCurrentLevel >= 3) {
      this.tiles[12] = `${prefix}wall_alone`;
    }
    if (inCurrentLevel === 5) {
      this.tiles[13] = `${prefix}wall_n_tjoint`;
      this.tiles[14] = `${prefix}wall_e_tjoint`;
      this.tiles[15] = `${prefix}wall_s_tjoint`;
      this.tiles[16] = `${prefix}wall_w_tjoint`;
      this.tiles[17] = `${prefix}wall_horizontal`;
      this.tiles[18] = `${prefix}wall_vertical`;
    }

    // The captive.
    switch (inCurrentLevel) {
      case 1: {
        this.captive[0] = `gfx_captive_eeger_00`;
        this.captive[1] = `gfx_captive_eeger_01`;
        break;
      }
      case 2: {
        this.captive[0] = `gfx_captive_frederick_j_smiley_00`;
        this.captive[1] = `gfx_captive_frederick_j_smiley_01`;
        break;
      }
      case 3: {
        this.captive[0] = `gfx_captive_catrina_00`;
        this.captive[1] = `gfx_captive_catrina_01`;
        break;
      }
      case 4: {
        this.captive[0] = `gfx_captive_brenda_bubey_00`;
        this.captive[1] = `gfx_captive_brenda_bubey_01`;
        break;
      }
      case 5: {
        this.captive[0] = `gfx_captive_sully_00`;
        this.captive[1] = `gfx_captive_sully_01`;
        break;
      }
      default: {
        break;
      }
    }

  } /* End initializeLevel(). */


  /**
   * Now randomly position our robots.  Each is put on a floor tile, not too near the edge of the map and not on
   * top of another robot, and is started at a random point in its standing-still animation so that they do not
   * all teleport at once.
   */
  randomlyPositionRobots() {

    for (let i = 0; i < this.ROBOTS_COUNT; i++) {

      // Keep picking a place at random until one is found that will do.
      let x = 0;
      let y = 0;
      let found = false;
      while (!found) {
        x = rand() % this.map_width;
        y = rand() % this.map_height;
        // (Remember that a robot at (x, y) stands on the map's tile (x + 1, y + 1).)
        const tile = this.level_map[((y + 1) * this.map_width) + x + 1];
        found = true;
        if (tile < this.tileFloorMin || tile > this.tileFloorMin) {
          // Not a floor tile.
          found = false;
        } else if (x < 3 || y < 3 || x > this.map_width - 3 || y > this.map_height - 3) {
          // Out of bounds.
          found = false;
        } else {
          // No robots on top of each other.
          for (let j = 0; j < this.ROBOTS_COUNT; j++) {
            if (i !== j && x === this.robots[j].tile.x && y === this.robots[j].tile.y) {
              found = false;
            }
          }
        }
      }

      this.robots[i].justPositioned = true;
      this.robots[i].tile.x = x;
      this.robots[i].tile.y = y;
      this.robots[i].anim_frame = rand() % 12;
      this.robots[i].state = this.rsStill;
      this.robots[i].appearing_delay = 0;
      this.robots[i].still_counter = rand() % 4;

    }

  } /* End randomlyPositionRobots(). */


  /**
   * Chooses where a robot will teleport to next: one, two or three tiles away from where it is now, straight up,
   * down, left or right.  The place must be on the map, a floor tile, and not where another robot is standing.
   * (Only the place it lands on is looked at, so a robot can teleport straight through a wall.)
   *
   * @param {number} inI Which robot: its position in the robots list.
   */
  repositionRobot(inI) {

    const robot = this.robots[inI];

    // Keep picking a place at random until one is found that will do.
    let x = 0;
    let y = 0;
    let found = false;
    while (!found) {
      x = robot.tile.x;
      y = robot.tile.y;
      const z = (rand() % this.MAX_ROBOT_MOVE) + 1; // Number of tiles to move robot
      const d = rand() % 4;
      switch (d) {
        case 0: {
          x = robot.tile.x + z;
          break;
        }
        case 1: {
          x = robot.tile.x - z;
          break;
        }
        case 2: {
          y = robot.tile.y + z;
          break;
        }
        case 3: {
          y = robot.tile.y - z;
          break;
        }
        default: {
          break;
        }
      }
      found = true;
      if (x < 2 || y < 2 || x > this.map_width - 2 || y > this.map_height - 2) {
        // Out of bounds.
        found = false;
      } else {
        const tile = this.level_map[((y + 1) * this.map_width) + x + 1];
        if (tile < this.tileFloorMin || tile > this.tileFloorMin) {
          // Not a floor tile.
          found = false;
        } else {
          // No robots on top of each other.
          for (let j = 0; j < this.ROBOTS_COUNT; j++) {
            if (inI !== j && x === this.robots[j].tile.x && y === this.robots[j].tile.y) {
              found = false;
            }
          }
        }
      }
    }

    robot.next_tile.x = x;
    robot.next_tile.y = y;
    robot.anim_frame = 0;
    robot.still_counter = 0;
    robot.explosion_delay = 0;
    robot.explosion_frame = 0;

  } /* End repositionRobot(). */


  /**
   * Says which mini-game a console starts.  Each level has its own five mini-games; the fifth console's is the
   * "special" one, which needs the captive's hint.
   *
   * @param  {number} inCurrentLevel The level, 1 to 5.
   * @param  {number} inTile         The console's tile value: tileConsole_01 to tileConsole_05.
   * @return {number}                The mini-game's screen: one of the cs constants in main.js.
   */
  startMiniGame(inCurrentLevel, inTile) {

    // One row per level, one entry per console.
    const miniGames = [
      [ csADayInTheStrife, csCopyCat, csCosmicSquirrel, csFlightOfDoom, csTheRedeyeOrder ],
      [ csAlienBabble, csFarOutFowl, csDefendoh, csRefluxive, csDeathTrap ],
      [ csAntigravitator, csInMemoria, csReluctantHero, csConquerror, csEngineer ],
      [ csVirus, csFfopirSirtetPaehc, csGlutton, csLeparLand, csTheEscape ],
      [ csTheBogazDerby, csSquishem, csTroubleInVectropolis, csMuncherDude, csSonOfEliminator ]
    ];

    return miniGames[inCurrentLevel - 1][inTile - this.tileConsole_01];

  } /* End startMiniGame(). */


  /**
   * Moves the player north for one frame.  If they are in the middle of the screen (or the map cannot scroll any
   * further that way) the player moves up the screen; if they are near the top edge, the map scrolls instead.
   * The other three move functions work the same way.
   *
   * @param  {object} inPlayerPosition Where the player is on the screen, with x and y properties.
   * @return {object}                  Where the player is now.
   */
  moveNorth(inPlayerPosition) {

    if (inPlayerPosition.y > 40 || (this.ul_tile.y === 0 && this.vertical_offset === 0)) {
      this.moved_north = true;
      inPlayerPosition.y = inPlayerPosition.y - this.PLAYERMOVEONSCREEN;
    } else {
      if (this.ul_tile.y >= 0) {
        this.moved_north = true;
        this.vertical_offset = this.vertical_offset + this.PLAYERMOVESCROLLING;
        // When the map has slid a whole tile, move the window on to the next tile and start the slide again.
        if (this.vertical_offset > 19) {
          this.vertical_offset = 0;
          this.ul_tile.y--;
        }
      }
    }

    return inPlayerPosition;

  } /* End moveNorth(). */


  /**
   * Moves the player east for one frame.  See moveNorth().
   *
   * @param  {object} inPlayerPosition Where the player is on the screen, with x and y properties.
   * @return {object}                  Where the player is now.
   */
  moveEast(inPlayerPosition) {

    if (
      inPlayerPosition.x < 180 ||
      (this.ul_tile.x === this.map_width - this.tiles_across_screen && this.horizontal_offset === 0)
    ) {
      this.moved_east = true;
      inPlayerPosition.x = inPlayerPosition.x + this.PLAYERMOVEONSCREEN;
    } else {
      if (this.ul_tile.x <= this.map_width - this.tiles_across_screen) {
        this.moved_east = true;
        this.horizontal_offset = this.horizontal_offset - this.PLAYERMOVESCROLLING;
        if (this.horizontal_offset < -19) {
          this.horizontal_offset = 0;
          this.ul_tile.x++;
        }
      }
    }

    return inPlayerPosition;

  } /* End moveEast(). */


  /**
   * Moves the player south for one frame.  See moveNorth().
   *
   * @param  {object} inPlayerPosition Where the player is on the screen, with x and y properties.
   * @return {object}                  Where the player is now.
   */
  moveSouth(inPlayerPosition) {

    if (
      inPlayerPosition.y < 260 ||
      (this.ul_tile.y === this.map_height - this.tiles_down_screen && this.vertical_offset === 0)
    ) {
      this.moved_south = true;
      inPlayerPosition.y = inPlayerPosition.y + this.PLAYERMOVEONSCREEN;
    } else {
      if (this.ul_tile.y <= this.map_height - this.tiles_down_screen) {
        this.moved_south = true;
        this.vertical_offset = this.vertical_offset - this.PLAYERMOVESCROLLING;
        if (this.vertical_offset < -19) {
          this.vertical_offset = 0;
          this.ul_tile.y++;
        }
      }
    }

    return inPlayerPosition;

  } /* End moveSouth(). */


  /**
   * Moves the player west for one frame.  See moveNorth().
   *
   * @param  {object} inPlayerPosition Where the player is on the screen, with x and y properties.
   * @return {object}                  Where the player is now.
   */
  moveWest(inPlayerPosition) {

    if (inPlayerPosition.x > 40 || (this.ul_tile.x === 0 && this.horizontal_offset === 0)) {
      this.moved_west = true;
      inPlayerPosition.x = inPlayerPosition.x - this.PLAYERMOVEONSCREEN;
    } else {
      if (this.ul_tile.x >= 0) {
        this.moved_west = true;
        this.horizontal_offset = this.horizontal_offset + this.PLAYERMOVESCROLLING;
        if (this.horizontal_offset > 19) {
          this.horizontal_offset = 0;
          this.ul_tile.x--;
        }
      }
    }

    return inPlayerPosition;

  } /* End moveWest(). */


} /* End class. */
