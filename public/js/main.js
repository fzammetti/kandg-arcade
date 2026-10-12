//noinspection DuplicatedCode

// This file bootstraps Phaser and holds everything that is shared by every screen of the game: the constants, the
// game state, the saved-game handling, the sound helper, and a handful of small utility functions.
//
// K&G Arcade was originally a C/C++ PocketPC game written in 2004.  In that code, a single giant class named CGame
// held practically every variable in the program, and main.cpp held the functions used by every screen.  This file
// is the equivalent of the shared parts of main.h and main.cpp.  As with the Invasion: Trivia! port before it, the
// goal is to stay as close to the original code as is practical, right down to the variable names, so that the two
// codebases can be compared side by side.  That means there are a lot of globals here, which is not how you would
// normally write things, but it is exactly how the original was written!


// ****************************************************************************************************************
// Constants.  Most of these are the #define values from the original main.h, with the same names and values.
// ****************************************************************************************************************

// The size of the PocketPC screen, in pixels.
const screenWidth = 240;
const screenHeight = 320;

// The original game ran at 24 frames per second, and ALL of its animation and timing is counted in frames.  So the
// port must run its game logic at exactly that rate, no matter how fast the browser redraws the screen.
const targetFPS = 24;
const frameInterval = 1000 / targetFPS;

// Volume levels.
const vlNoSound = 0;
const vlLow = 1;
const vlMedium = 2;
const vlHigh = 3;

// The volume each level sets.  The original sound system used a scale of 0 to 64 and the values 0, 22, 42 and 64.
// Phaser uses a scale of 0 to 1, so these are simply those numbers divided by 64.
const vlNoSoundVolumeValue = 0;
const vlLowVolumeValue = 22 / 64;
const vlMediumVolumeValue = 42 / 64;
const vlHighVolumeValue = 1;

// How loud the sounds in a cut scene are played, compared with every other sound in the game (which is 1).  Every
// cut scene script begins with OASIS's "restore default volume" command, and in the original that command set each
// of the scene's sounds to volume 32, on the sound library's scale where 64 is full volume.  So the voices in the
// cut scenes were played at half the level of the game's other sounds.  See CutScene.js.
const oasisDefaultVolume = 32 / 64;

// Screens.  In the original these numbers selected which screen was showing.  In the port each screen is a Phaser
// scene, but the numbers are still needed in places (the mini-game tables use them), so they are kept.
const csFirstTimeInits = 5;
const csIntroOmnytex = 10;
const csIntroCrackhead = 11;
const csTitleSequence = 12;
const csMainMenu = 20;
const csWalkingAroundTheShip = 30;
const csOptions = 42;
const csCredits = 46;
const csNewGameType = 47;
const csInstructions = 48;
const csHighScores = 49;
const csExiting = 50;
const csInMemoria = 101;
const csFlightOfDoom = 102;
const csReluctantHero = 103;
const csRefluxive = 104;
const csCosmicSquirrel = 105;
const csDefendoh = 106;
const csADayInTheStrife = 107;
const csLeparLand = 108;
const csDeathTrap = 109;
const csCopyCat = 110;
const csVirus = 111;
const csGlutton = 112;
const csConquerror = 113;
const csAntigravitator = 114;
const csFarOutFowl = 115;
const csTheEscape = 116;
const csAlienBabble = 117;
const csTheRedeyeOrder = 118;
const csFfopirSirtetPaehc = 119;
const csEngineer = 120;
const csTheBogazDerby = 121;
const csSquishem = 122;
const csTroubleInVectropolis = 123;
const csMuncherDude = 124;
const csSonOfEliminator = 125;
const csFinalScore = 126;
const csPlayerDied = 150;
const csNewAdventure = 151;
const csWin = 152;
const csCharacterInteraction = 160;

// Mini-game states.
const mgsInitialDraw = 1000;
const mgsGetReady = 1001;
const mgsGameRunning = 1002;
const mgsGameOver = 1003;
const mgsInstructions = 1004;
const mgsEnding = 1005;

// Game modes, and the sub-modes of Mini-Game Melee.
const gmMiniGameMelee = 2005;
const gmAdventureGame = 2006;
const gsmTimed = 2010;
const gsmAlaCarte = 2011;

// What the joystick hand (left) and the button hand (right) were doing last frame, on the mini-game console.
const lhNothing = 0;
const lhNorth = 1;
const lhSouth = 2;
const lhEast = 3;
const lhWest = 4;
const lhNorthEast = 5;
const lhNorthWest = 6;
const lhSouthEast = 7;
const lhSouthWest = 8;
const rhNothing = 0;
const rhDown = 1;

// Mini-games are drawn inside a frame, so their play area starts 20 pixels in from the top-left of the screen.
const xadj = 20;
const yadj = 20;

// Text alignment choices for drawing text (named after the original GapiDraw flags).
const GDDRAWTEXT_LEFT = 0;
const GDDRAWTEXT_CENTER = 1;
const GDDRAWTEXT_RIGHT = 2;

// The default keyboard keys for the game's six logical buttons.  A PocketPC had a direction pad and a few hardware
// buttons; on the web we use the keyboard instead.  The values are KeyboardEvent.code strings, which name the
// physical key and so work the same on every keyboard layout.  The player can change these on the Options screen.
const defaultKeyUp = `ArrowUp`;
const defaultKeyDown = `ArrowDown`;
const defaultKeyLeft = `ArrowLeft`;
const defaultKeyRight = `ArrowRight`;
const defaultKeyAction = `Space`;
const defaultKeyCommand = `Escape`;

// The original saved its settings, high scores and saved game in a file named kga.kga.  A web page cannot write
// files, so we store the same information in the browser's localStorage under this name instead.
const kgaStorageKey = `kandg_arcade_kga`;
const kgaFileVersion = 2;

// How many mini-games there are.
const miniGameCount = 25;

// The scene that is started once everything has loaded.
const firstSceneKey = `IntroOmnytexScene`;


// ****************************************************************************************************************
// Globals.
// ****************************************************************************************************************

// The one and only Phaser game object.
let game = null;

// The backbuffer: the 240x320 surface that everything is drawn on, exactly like the original's backbuffer.  It is
// created by the PreloadScene once Phaser is up and running.  See Surface.js.
let backbuffer = null;

// The Phaser texture that puts the backbuffer on the screen.
let backbufferTexture = null;

// The two bitmap fonts.  See BitmapFont.js.
let font1 = null;
let font1_green = null;

// Used by limitFrameRateTo24() to keep track of how much time has built up since the last frame of game logic.
let frameTime = 0;

// If localStorage cannot be used (some browsers block it in private windows), the saved data is kept here instead,
// which means it lasts until the page is closed rather than forever.
let kgaMemoryCopy = null;

// The names of any sounds we have already complained about being missing, so we only complain once per sound.
const missingSoundsReported = [ ];


// ****************************************************************************************************************
// Game state.  These are the member variables of the original CGame class (the ones that are shared between
// screens), with their original names, and a few that the port needed of its own (each says so).
// ****************************************************************************************************************
const gameState = {

  // The horizontal center of the screen.  Used to center text.
  bbCenterPoint: screenWidth / 2,

  // Flag: when true, key and stylus events are processed.  They are ignored when false.
  processEvents: true,

  // Which keys are being held down at this moment, and which of them were already down when the screen now
  // showing was arrived at.  Each has a property named for the key's code (for example Space) for every such
  // key.  Neither is in the original; see keyWentDown() and keyCameUp() in GameScene.js for why they are here.
  keysDown: { },
  keysDownOnArrival: { },

  // Used for the scrolling background of the menu and related screens.
  h_offset: 0,
  v_offset: 0,

  // Used for fading between screens.  fade_function is 0 when no fade is going on, 1 while the current screen is
  // fading out, and 2 while the next one is fading in.  fade_value is the opacity things are drawn at, from 0
  // (invisible) to 255 (fully solid).  next_screen is the name of the scene being faded to.  See screenFader() in
  // GameScene.js.
  fade_function: 0,
  fade_value: 255,
  next_screen: null,

  // Is the theme music currently playing?
  themePlaying: false,

  // Overall volume level (one of the vl constants above).
  volumeLevel: vlMedium,

  // Options: show the frame rate and the frame time?
  show_fps: false,
  show_frame_time: false,

  // The keyboard keys mapped to the six logical buttons.
  kUp: null,
  kDown: null,
  kLeft: null,
  kRight: null,
  kAction: null,
  kCommand: null,

  // Flag: are we currently showing a popup?
  doPopup: false,

  // The popup's two lines of text.
  popupLine1: ``,
  popupLine2: ``,

  // The options the popup offers, and how many of them there are.
  gpOptions: [ ],
  gpOptionsCount: 0,

  // The option currently showing in the popup (0 is the first).
  gpCurrentOption: 0,

  // Which of the popup's arrows is being pressed: 0 = neither, 1 = previous, 2 = next.
  gpButtonPressed: 0,

  // The tinted copy of the screen behind the popup, and whether it has been made yet.
  gpTempBlended: null,
  gpBlendDone: false,

  // Which image of mini-game "fuzz" (television static) is being displayed.
  fuzzIndex: 0,

  // Counters for the hidden "unlock all mini-games" code on the New Game Type screen.
  unlockCornerUL: 0,
  unlockCornerUR: 0,

  // Used during the television-turning-off effect when the player quits.  shutdownStep is 0 normally and counts
  // up through the steps of shutting down.  ExitCounter shrinks the white line and ExitFadeCounter fades the dot.
  // exitFromGame is true if the player quit from inside the game rather than from the main menu.
  // See ExitingScene.js.
  shutdownStep: 0,
  ExitCounter: 0,
  ExitFadeCounter: 0,
  exitFromGame: false,

  // Set to jump back to the New Game Type screen after a mini-game.
  jumpBackToNewGameType: false,

  // For each mini-game: which screen it is, whether it is unlocked in Mini-Game Melee, its name and description,
  // and its high score in each of the two Melee sub-modes.  All five arrays are indexed by the same number.
  melee_selection: [ ],
  game_unlocked: [ ],
  mini_game_info: [ ],
  miniGameHighsTimed: [ ],
  miniGameHighsPUISS: [ ],

  // A small picture of each mini-game, shown on the High Scores and New Game Type screens.  These are image
  // names, in the same order as the mini-game tables above.
  screenshots: [ ],

  // Mode of the game (gmMiniGameMelee or gmAdventureGame).
  game_mode: gmAdventureGame,

  // Sub-mode of mini-game in melee mode (gsmTimed or gsmAlaCarte).
  game_submode: gsmTimed,

  // Tells what mini-game is being played in melee mode (an index into the mini-game tables above).
  current_mini_game: 0,

  // Flag: are we continuing a saved game?
  gameRestarted: false,

  // Flag to tell whether we're starting a new game or not.
  startingNewGame: false,

  // Flag: has the hint for the current level been given by the captive yet?
  levelHintDone: false,

  // The current level of the ship the player is on, and whether that level has been set up yet.
  current_level: 1,
  current_level_initialized: false,

  // Which mini-game on the level (0 to 4) is being played, and which of the level's five have been completed.
  whichGameBeingPlayed: 0,
  games_done: [ false, false, false, false, false ],

  // The current health of the player: 0 is dead, 12 is full health.
  health: 12,

  // Points.
  total_points: 0,
  points_this_level: 0,
  overall_score: 0,

  // Where the player is on the ship.  These echo the values used while walking around the ship so that they can be
  // saved and restored.
  cl_player_position: { x: 0, y: 0 },
  cl_ul_tile: { x: 0, y: 0 },
  cl_horizontal_offset: 0,
  cl_vertical_offset: 0,

  // Which directions the player is currently holding, and whether the action button is down.
  player_dir_north: false,
  player_dir_south: false,
  player_dir_east: false,
  player_dir_west: false,
  player_button_down: false,

  // ----- Everything from here down is used by the mini-games.  See MiniGameScene.js. -----

  // Tells us what the current mini-game is currently doing (one of the mgs constants).
  mini_game_state: 0,

  // The player's score on the currently playing mini-game, and what it was last frame.
  mini_game_score: 0,
  mini_game_score_last: 0,

  // The number of seconds remaining in a timed game, and the time at which the last second was counted.
  countdown_seconds: 0,
  countdown_ticks: 0,

  // Count frames while Get Ready... Get Set... Go and Game Over are being shown.
  get_ready_counter: 0,
  game_over_counter: 0,

  // Set to true to end a game before time runs out.
  force_game_over: false,

  // Set to true to clear the play area with every frame, false to not.
  clear_game_surface: true,

  // Flag: is this the first time through the updateStatusBar method?
  status_first_time: true,

  // Flag to tell us whether we've done the final checks during game over or not, and whether they found that
  // the high score had been beaten.
  game_over_check_done: false,
  new_high_score: false,

  // Used to delay between mini-game frame light changes.
  lightChangeCounter: 0,

  // The action each hand on the console was performing last frame (the lh and rh constants).
  player_left_hand_action: lhNothing,
  player_right_hand_action: rhNothing,

  // Current position of the player.  Most mini-games keep the position of whatever the player controls here.
  player_pos: { x: 0, y: 0 },

  // Used to slow down repeat key events.
  player_dir_delay: 0,

  // The instructions of the current mini-game (30 lines, 10 per page), which page of them is showing, and
  // whether the Previous and Next arrows are being pressed.
  mgInstructions: [ ],
  mgInstructionsPage: 0,
  mgiPrevTapped: false,
  mgiNextTapped: false,

  // Used to make Get Ready... Get Set... Go grow and shrink.  See doGetReady() in MiniGameScene.js.
  grgsg: true,
  grgsg_count: 0,
  gr_x1: 0,
  gr_x2: 0,
  gs_x1: 0,
  gs_x2: 0,
  g_x1: 0,
  g_x2: 0,
  grgsg_y1: 0,
  grgsg_y2: 0

}; /* End gameState. */


/**
 * This is where it all begins!
 */
function init() {

  console.log(`main.js -> init()`);

  // Build the Phaser configuration to match the PocketPC-era resolution and plug in every scene we use.
  const config = {
    type: Phaser.AUTO,
    parent: `container`,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: `#000000`,
    scene: [
      PreloadScene,
      IntroOmnytexScene,
      IntroCrackheadScene,
      TitleSequenceScene,
      MainMenuScene,
      NewGameTypeScene,
      InstructionsScene,
      OptionsScene,
      CreditsScene,
      HighScoresScene,
      ExitingScene,
      NewAdventureScene,
      PlayerDiedScene,
      WinScene,
      FinalScoreScene,
      WalkingAroundTheShipScene,
      CharacterInteractionScene,
      FlightOfDoomScene,
      ADayInTheStrifeScene,
      CopyCatScene,
      CosmicSquirrelScene,
      TheRedeyeOrderScene,
      AlienBabbleScene,
      FarOutFowlScene,
      DefendohScene,
      RefluxiveScene,
      DeathTrapScene,
      AntigravitatorScene,
      InMemoriaScene,
      ReluctantHeroScene,
      ConquerrorScene,
      EngineerScene,
      VirusScene,
      FfopirSirtetPaehcScene,
      GluttonScene,
      LeparLandScene,
      TheEscapeScene,
      TheBogazDerbyScene,
      SquishemScene,
      TroubleInVectropolisScene,
      MuncherDudeScene,
      SonOfEliminatorScene,
      TestCardScene
    ]
  };

  //noinspection JSCheckFunctionSignatures
  game = new Phaser.Game(config);

  // Do the one-time setup that the original did when the program started.
  InitInstance();

  // Make the control disc and buttons on the picture of the device work, for playing on a touchscreen.
  deviceControls.init();

  console.log(`STARTING!`);

} /* End init(). */


/**
 * One-time game initialization.  This is the port of CGame::InitInstance() from the original main.cpp.
 */
function InitInstance() {

  console.log(`main.js -> InitInstance()`);

  // Scrolling menu and related screens background.
  gameState.h_offset = 0;
  gameState.v_offset = 0;

  // Some misc setups.
  gameState.exitFromGame = false;
  gameState.current_level = 1;
  gameState.current_level_initialized = false;
  gameState.jumpBackToNewGameType = false;
  gameState.fade_function = 0;
  gameState.fade_value = 255;
  gameState.total_points = 0;
  gameState.points_this_level = 0;
  gameState.health = 12;
  gameState.processEvents = true;
  gameState.volumeLevel = vlMedium;
  gameState.fuzzIndex = 0;
  gameState.doPopup = false;
  gameState.show_fps = false;
  gameState.show_frame_time = false;
  gameState.kUp = null;
  gameState.kDown = null;
  gameState.kLeft = null;
  gameState.kRight = null;
  gameState.kAction = null;
  gameState.kCommand = null;
  gameState.unlockCornerUL = 0;
  gameState.unlockCornerUR = 0;
  gameState.shutdownStep = 0;

  // Mini-game names, descriptions, high scores and locked status.  The order here is alphabetical, which is the
  // order they are shown in on the New Game Type screen.  Only the five mini-games on the first level of the ship
  // start out unlocked.
  gameState.melee_selection = [ ];
  gameState.game_unlocked = [ ];
  gameState.mini_game_info = [ ];
  gameState.miniGameHighsTimed = [ ];
  gameState.miniGameHighsPUISS = [ ];
  addMiniGameInfo(csADayInTheStrife, true, `A Day In The Strife`,
    `Just a normal day of zapping`, `the marauding alien invaders`);
  addMiniGameInfo(csAlienBabble, false, `Alien Babble`,
    `Try to keep up with the aliens`, `babbling away at you`);
  addMiniGameInfo(csAntigravitator, false, `Antigravitator`,
    `Kill the escaping aliens`, `before they reach their ship`);
  addMiniGameInfo(csConquerror, false, `Conquerror`,
    `You go, you see, you`, `destroy an entire city`);
  addMiniGameInfo(csCopyCat, true, `Copycat`,
    `Some worlds call it Simon, but`, `we didn't want to get sued`);
  addMiniGameInfo(csCosmicSquirrel, true, `Cosmic Squirrel`,
    `In space, no one can hear a`, `giant space squirrel buy it`);
  addMiniGameInfo(csDeathTrap, false, `DeathTrap`,
    `Hop on the tiles to escape the`, `chasm without getting cooked`);
  addMiniGameInfo(csDefendoh, false, `Defen'DOH!`,
    `If Homer Simpson flew a space`, `fighter, this is what you'd get`);
  addMiniGameInfo(csEngineer, false, `Engineer`,
    `Route the energy particles`, `to the right injector ports`);
  addMiniGameInfo(csFarOutFowl, false, `Far Out Fowl`,
    `Picture a sadistic chicken from`, `space dropping eggs at you`);
  addMiniGameInfo(csFlightOfDoom, true, `Flight Of Doom`,
    `The weather channel said this`, `was a bad day to fly in space`);
  addMiniGameInfo(csGlutton, false, `Glutton`,
    `The sign said Don't Feed The`, `Garagnack, but did you listen?`);
  addMiniGameInfo(csInMemoria, false, `In Memoria`,
    `If you can't remember your`, `anniversary, your in trouble`);
  addMiniGameInfo(csLeparLand, false, `Lepar Land`,
    `We put them all on one planet.`, `Too bad you landed on it!`);
  addMiniGameInfo(csMuncherDude, false, `Muncher Dude`,
    `Yet another hungry THING`, `stuck in a maze eating dots!`);
  addMiniGameInfo(csFfopirSirtetPaehc, false, `Paehc Sirtet Ffopir`,
    `Read the name correcly and all`, `shall be revealed to you`);
  addMiniGameInfo(csRefluxive, false, `Refluxive`,
    `Who knows what they are, but`, `they have to be kept moving`);
  addMiniGameInfo(csReluctantHero, false, `Reluctant Hero`,
    `No one else would do it, so it's`, `up to you to rescue the people`);
  addMiniGameInfo(csSonOfEliminator, false, `Son Of Eliminator`,
    `What, you didn't buy the`, `original Eliminator?!?  Bleh!`);
  addMiniGameInfo(csSquishem, false, `Squish'em`,
    `Aliens to the left of me!`, `Aliens to the right of me!`);
  addMiniGameInfo(csTheBogazDerby, false, `The Bogaz Derby`,
    `Enter the race, avoid a crash,`, `and above all else, have fun!`);
  addMiniGameInfo(csTheEscape, false, `The Escape`,
    `It's not gonna be easy, but you`, `can't stay in a cave forever`);
  addMiniGameInfo(csTheRedeyeOrder, true, `The Redeye Order`,
    `Use the Farce, and your basic`, `math skills, to order the tiles`);
  addMiniGameInfo(csTroubleInVectropolis, false, `Trouble In Vectropolis`,
    `This seems somehow familiar...`, `Blue Six standing by?!?`);
  addMiniGameInfo(csVirus, false, `Virus`,
    `It's up to you to remove the`, `virus from the ship's memory`);

  // The picture of each mini-game.  The order must match the order the mini-games were added in above.  (The
  // original loaded these along with the main menu.  Note that the picture for Trouble In Vectropolis is named
  // trouble_in_line_world in the original's files, as are that mini-game's other images.)
  gameState.screenshots = [
    `gfx_ss_a_day_in_the_strife`, `gfx_ss_alien_babble`, `gfx_ss_antigravitator`, `gfx_ss_conquerror`,
    `gfx_ss_copycat`, `gfx_ss_cosmic_squirrel`, `gfx_ss_deathtrap`, `gfx_ss_defendoh`, `gfx_ss_engineer`,
    `gfx_ss_far_out_fowl`, `gfx_ss_flight_of_doom`, `gfx_ss_glutton`, `gfx_ss_in_memoria`, `gfx_ss_lepar_land`,
    `gfx_ss_muncher_dude`, `gfx_ss_ffopir_sirtet_paehc`, `gfx_ss_refluxive`, `gfx_ss_reluctant_hero`,
    `gfx_ss_son_of_eliminator`, `gfx_ss_squishem`, `gfx_ss_the_bogaz_derby`, `gfx_ss_the_escape`,
    `gfx_ss_the_redeye_order`, `gfx_ss_trouble_in_line_world`, `gfx_ss_virus`
  ];

  // Read in the saved settings, high scores and saved game.  They will be created if they don't exist yet.
  readKGAFile();

} /* End InitInstance(). */


/**
 * Adds one mini-game to the tables that describe the mini-games.  The original code set these up with three or four
 * lines per mini-game, repeated 25 times; this little helper does the same job.
 *
 * @param {number}  inScreen       The mini-game's screen constant (for example csGlutton).
 * @param {boolean} inUnlocked     True if the mini-game is available in Mini-Game Melee from the very start.
 * @param {string}  inName         The name of the mini-game.
 * @param {string}  inDescription1 The first line of its description.
 * @param {string}  inDescription2 The second line of its description.
 */
function addMiniGameInfo(inScreen, inUnlocked, inName, inDescription1, inDescription2) {

  gameState.melee_selection.push(inScreen);
  gameState.game_unlocked.push(inUnlocked);
  gameState.mini_game_info.push([ inName, inDescription1, inDescription2 ]);
  gameState.miniGameHighsTimed.push(0);
  gameState.miniGameHighsPUISS.push(0);

} /* End addMiniGameInfo(). */


/**
 * Called to set the overall volume from the current volume level (the Options screen changes the level).
 */
function setVolumeLevel() {

  let soundVolume = vlNoSoundVolumeValue;
  switch (gameState.volumeLevel) {
    case vlNoSound: {
      soundVolume = vlNoSoundVolumeValue;
    break; }
    case vlLow: {
      soundVolume = vlLowVolumeValue;
    break; }
    case vlMedium: {
      soundVolume = vlMediumVolumeValue;
    break; }
    case vlHigh: {
      soundVolume = vlHighVolumeValue;
    break; }
  }
  game.sound.volume = soundVolume;

} /* End setVolumeLevel(). */


/**
 * Called to initialize a new game.
 */
function setupForNewGame() {

  gameState.levelHintDone = false;
  gameState.gameRestarted = false;
  gameState.game_mode = gmAdventureGame;
  gameState.whichGameBeingPlayed = 0;
  gameState.games_done[0] = false;
  gameState.games_done[1] = false;
  gameState.games_done[2] = false;
  gameState.games_done[3] = false;
  gameState.games_done[4] = false;
  gameState.health = 12;
  gameState.total_points = 0;
  gameState.points_this_level = 0;
  gameState.current_level = 1;
  gameState.current_level_initialized = false;
  gameState.player_dir_north = false;
  gameState.player_dir_south = false;
  gameState.player_dir_east = false;
  gameState.player_dir_west = false;
  gameState.player_button_down = false;
  gameState.overall_score = 0;

} /* End setupForNewGame(). */


/**
 * Called in each scene to limit the game logic to 24 frames per second, since the original PocketPC version ran at
 * that rate and all of its animation is counted in frames.
 *
 * The browser calls us much more often than 24 times a second (typically 60).  Each time, we add the time that has
 * gone by to a running total.  When the total reaches one 24th of a second, it is time for a frame of game logic,
 * and we SUBTRACT one frame's worth of time rather than resetting to zero.  Keeping the leftover is what makes the
 * average rate exactly 24: simply resetting to zero would throw the leftover away every frame and the game would
 * run noticeably slow (20 frames per second on a typical 60Hz display).
 *
 * @param  {number} inDelta The time that has elapsed since the browser last called us, in milliseconds.
 * @return {boolean}        True if it is time to run a frame of game logic, false if not.
 */
function limitFrameRateTo24(inDelta) {

  frameTime = frameTime + inDelta;

  // Not time for the next frame yet.
  if (frameTime < frameInterval) {
    return false;
  }

  // Use up one frame's worth of the time, keeping any leftover for next time.
  frameTime = frameTime - frameInterval;

  // If there is STILL a whole frame or more left over, the browser paused us for a while (this happens when the tab
  // is in the background).  We do not want to play catch-up by racing through the missed frames, so we just forget
  // about the backlog.
  if (frameTime >= frameInterval) {
    frameTime = 0;
  }

  return true;

} /* End limitFrameRateTo24(). */


/**
 * Reads in the settings, high scores and saved game, creating them first if they do not exist yet.  This is the
 * port of CGame::readKGAFile(), which read the file kga.kga.
 *
 * @return {boolean} Always true.
 */
function readKGAFile() {

  console.log(`main.js -> readKGAFile()`);

  // Get the saved data.  If there isn't any (or it is damaged), create a brand new set and read that back.
  let kgaFile = loadKGAFromStorage();
  if (kgaFile === null) {
    writeKGAFile(false, true);
    kgaFile = loadKGAFromStorage();
  }

  // Copy everything out of the saved data into the game state.
  gameState.volumeLevel = kgaFile.volumeLevel;
  setVolumeLevel();
  gameState.kUp = kgaFile.kUp;
  gameState.kDown = kgaFile.kDown;
  gameState.kLeft = kgaFile.kLeft;
  gameState.kRight = kgaFile.kRight;
  gameState.kAction = kgaFile.kAction;
  gameState.kCommand = kgaFile.kCommand;
  for (let i = 0; i < miniGameCount; i++) {
    gameState.game_unlocked[i] = kgaFile.miniGameLockFlags[i];
    gameState.miniGameHighsTimed[i] = kgaFile.miniGameHighsTimed[i];
    gameState.miniGameHighsPUISS[i] = kgaFile.miniGameHighsPUISS[i];
  }
  // Games from the first level are always unlocked regardless.
  gameState.game_unlocked[0] = true;
  gameState.game_unlocked[4] = true;
  gameState.game_unlocked[5] = true;
  gameState.game_unlocked[10] = true;
  gameState.game_unlocked[22] = true;
  gameState.gameRestarted = kgaFile.gameSavedFlag;
  gameState.current_level = kgaFile.currentLevel;
  gameState.health = kgaFile.playerHealth;
  for (let i = 0; i < 5; i++) {
    gameState.games_done[i] = kgaFile.miniGamesCompletedFlags[i];
  }
  gameState.cl_ul_tile = { x: kgaFile.ulTile.x, y: kgaFile.ulTile.y };
  gameState.cl_horizontal_offset = kgaFile.tileOffsetH;
  gameState.cl_vertical_offset = kgaFile.tileOffsetV;
  gameState.cl_player_position = { x: kgaFile.playerPosition.x, y: kgaFile.playerPosition.y };
  gameState.levelHintDone = kgaFile.levelHintDone;
  gameState.overall_score = kgaFile.overall_score;

  return true;

} /* End readKGAFile(). */


/**
 * Writes out the settings, high scores and saved game.  This is the port of CGame::writeKGAFile().
 *
 * @param  {boolean} inHasGameStarted   True if there is an adventure in progress that should be saved, false if
 *                                      there is no saved game (in which case the saved game details are blanked).
 * @param  {boolean} inInitialCreation  True if the saved data is being created for the very first time, in which
 *                                      case everything is set to its starting value.
 * @return {boolean}                    Always true.
 */
function writeKGAFile(inHasGameStarted, inInitialCreation) {

  console.log(`main.js -> writeKGAFile()`, inHasGameStarted, inInitialCreation);

  // The original only filled in the key mappings the first time a frame was drawn, because it had to ask the device
  // what its buttons were.  We know our defaults up front, so we can fill them in right here if they are not set.
  if (gameState.kUp === null && gameState.kDown === null && gameState.kLeft === null &&
    gameState.kRight === null && gameState.kAction === null && gameState.kCommand === null
  ) {
    gameState.kUp = defaultKeyUp;
    gameState.kDown = defaultKeyDown;
    gameState.kLeft = defaultKeyLeft;
    gameState.kRight = defaultKeyRight;
    gameState.kAction = defaultKeyAction;
    gameState.kCommand = defaultKeyCommand;
  }

  // Settings, unlocked mini-games and high scores are always saved.
  const kgaFile = { };
  kgaFile.kgaFileVersion = kgaFileVersion;
  kgaFile.volumeLevel = gameState.volumeLevel;
  kgaFile.kUp = gameState.kUp;
  kgaFile.kDown = gameState.kDown;
  kgaFile.kLeft = gameState.kLeft;
  kgaFile.kRight = gameState.kRight;
  kgaFile.kAction = gameState.kAction;
  kgaFile.kCommand = gameState.kCommand;
  kgaFile.miniGameLockFlags = [ ];
  kgaFile.miniGameHighsTimed = [ ];
  kgaFile.miniGameHighsPUISS = [ ];
  for (let i = 0; i < miniGameCount; i++) {
    kgaFile.miniGameLockFlags.push(gameState.game_unlocked[i]);
    kgaFile.miniGameHighsTimed.push(gameState.miniGameHighsTimed[i]);
    kgaFile.miniGameHighsPUISS.push(gameState.miniGameHighsPUISS[i]);
  }

  // When creating the saved data for the first time, the first-level games are unlocked and there are no scores.
  if (inInitialCreation) {
    gameState.game_unlocked[0] = true;
    kgaFile.miniGameLockFlags[0] = true;
    gameState.game_unlocked[4] = true;
    kgaFile.miniGameLockFlags[4] = true;
    gameState.game_unlocked[5] = true;
    kgaFile.miniGameLockFlags[5] = true;
    gameState.game_unlocked[10] = true;
    kgaFile.miniGameLockFlags[10] = true;
    gameState.game_unlocked[22] = true;
    kgaFile.miniGameLockFlags[22] = true;
    for (let i = 0; i < miniGameCount; i++) {
      kgaFile.miniGameHighsTimed[i] = 0;
      kgaFile.miniGameHighsPUISS[i] = 0;
    }
  }

  // The saved adventure is only written if there is one in progress.  Otherwise it is blanked out.
  kgaFile.gameSavedFlag = inHasGameStarted;
  kgaFile.miniGamesCompletedFlags = [ ];
  if (inHasGameStarted) {
    kgaFile.currentLevel = gameState.current_level;
    kgaFile.playerHealth = gameState.health;
    for (let i = 0; i < 5; i++) {
      kgaFile.miniGamesCompletedFlags.push(gameState.games_done[i]);
    }
    kgaFile.ulTile = { x: gameState.cl_ul_tile.x, y: gameState.cl_ul_tile.y };
    kgaFile.tileOffsetH = gameState.cl_horizontal_offset;
    kgaFile.tileOffsetV = gameState.cl_vertical_offset;
    kgaFile.playerPosition = { x: gameState.cl_player_position.x, y: gameState.cl_player_position.y };
    kgaFile.levelHintDone = gameState.levelHintDone;
    kgaFile.overall_score = gameState.overall_score;
  } else {
    kgaFile.currentLevel = 0;
    kgaFile.playerHealth = 0;
    for (let i = 0; i < 5; i++) {
      kgaFile.miniGamesCompletedFlags.push(false);
    }
    kgaFile.ulTile = { x: 0, y: 0 };
    kgaFile.tileOffsetH = 0;
    kgaFile.tileOffsetV = 0;
    kgaFile.playerPosition = { x: 0, y: 0 };
    kgaFile.levelHintDone = false;
    kgaFile.overall_score = 0;
  }

  saveKGAToStorage(kgaFile);

  return true;

} /* End writeKGAFile(). */


/**
 * Fetches the saved data from the browser and checks it thoroughly.
 *
 * Anything sitting in localStorage could have been edited by hand or damaged, so we never trust it.  Every single
 * value is checked, and anything that is not what it should be is replaced with a safe value.  If the data is so
 * wrong that it cannot be used at all, null is returned and the caller creates a fresh set.
 *
 * @return {object} The saved data with every field present and valid, or null if there is no usable saved data.
 */
function loadKGAFromStorage() {

  // Get the raw text.  Reading localStorage can throw an error if the browser has blocked it, in which case we fall
  // back on the copy we keep in memory.
  let rawText = kgaMemoryCopy;
  try {
    const storedText = window.localStorage.getItem(kgaStorageKey);
    if (storedText !== null) {
      rawText = storedText;
    }
  } catch (inError) {
    console.warn(`main.js -> loadKGAFromStorage(): localStorage is not available`, inError);
  }
  if (rawText === null) {
    return null;
  }

  // Turn the text back into an object.  Damaged text makes JSON.parse() throw an error.
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (inError) {
    console.warn(`main.js -> loadKGAFromStorage(): saved data is damaged, starting fresh`, inError);
    return null;
  }

  // It must be an object, and it must be the version of the saved data that we understand.
  if (parsed === null || typeof parsed !== `object` || parsed.kgaFileVersion !== kgaFileVersion) {
    return null;
  }

  // Now build a clean copy, checking each value as we go.
  const kgaFile = { };
  kgaFile.kgaFileVersion = kgaFileVersion;
  kgaFile.volumeLevel = cleanInteger(parsed.volumeLevel, vlNoSound, vlHigh, vlMedium);
  kgaFile.kUp = cleanKeyCode(parsed.kUp, defaultKeyUp);
  kgaFile.kDown = cleanKeyCode(parsed.kDown, defaultKeyDown);
  kgaFile.kLeft = cleanKeyCode(parsed.kLeft, defaultKeyLeft);
  kgaFile.kRight = cleanKeyCode(parsed.kRight, defaultKeyRight);
  kgaFile.kAction = cleanKeyCode(parsed.kAction, defaultKeyAction);
  kgaFile.kCommand = cleanKeyCode(parsed.kCommand, defaultKeyCommand);
  kgaFile.miniGameLockFlags = [ ];
  kgaFile.miniGameHighsTimed = [ ];
  kgaFile.miniGameHighsPUISS = [ ];
  for (let i = 0; i < miniGameCount; i++) {
    kgaFile.miniGameLockFlags.push(cleanArrayItem(parsed.miniGameLockFlags, i) === true);
    kgaFile.miniGameHighsTimed.push(
      cleanInteger(cleanArrayItem(parsed.miniGameHighsTimed, i), 0, Number.MAX_SAFE_INTEGER, 0)
    );
    kgaFile.miniGameHighsPUISS.push(
      cleanInteger(cleanArrayItem(parsed.miniGameHighsPUISS, i), 0, Number.MAX_SAFE_INTEGER, 0)
    );
  }
  kgaFile.gameSavedFlag = parsed.gameSavedFlag === true;
  kgaFile.currentLevel = cleanInteger(parsed.currentLevel, 0, 5, 0);
  kgaFile.playerHealth = cleanInteger(parsed.playerHealth, 0, 12, 0);
  kgaFile.miniGamesCompletedFlags = [ ];
  for (let i = 0; i < 5; i++) {
    kgaFile.miniGamesCompletedFlags.push(cleanArrayItem(parsed.miniGamesCompletedFlags, i) === true);
  }
  kgaFile.ulTile = cleanPoint(parsed.ulTile);
  kgaFile.tileOffsetH = cleanInteger(parsed.tileOffsetH, -10000, 10000, 0);
  kgaFile.tileOffsetV = cleanInteger(parsed.tileOffsetV, -10000, 10000, 0);
  kgaFile.playerPosition = cleanPoint(parsed.playerPosition);
  kgaFile.levelHintDone = parsed.levelHintDone === true;
  kgaFile.overall_score = cleanInteger(parsed.overall_score, 0, Number.MAX_SAFE_INTEGER, 0);

  // A saved game that claims to be on level 0 makes no sense, so treat it as there being no saved game.
  if (kgaFile.gameSavedFlag && kgaFile.currentLevel === 0) {
    kgaFile.gameSavedFlag = false;
  }

  return kgaFile;

} /* End loadKGAFromStorage(). */


/**
 * Stores the saved data in the browser.
 *
 * @param {object} inKGAFile The saved data to store.
 */
function saveKGAToStorage(inKGAFile) {

  const text = JSON.stringify(inKGAFile);

  // Always keep a copy in memory, so that the game still works for this visit if localStorage is blocked.
  kgaMemoryCopy = text;

  try {
    window.localStorage.setItem(kgaStorageKey, text);
  } catch (inError) {
    console.warn(`main.js -> saveKGAToStorage(): localStorage is not available`, inError);
  }

} /* End saveKGAToStorage(). */


/**
 * Checks that a value read from the saved data is a whole number within a given range.
 *
 * @param  {*}      inValue    The value to check.  It could be anything at all.
 * @param  {number} inMinimum  The smallest acceptable value.
 * @param  {number} inMaximum  The largest acceptable value.
 * @param  {number} inFallback The value to use if inValue is not acceptable.
 * @return {number}            inValue if it is a whole number in the range, otherwise inFallback.
 */
function cleanInteger(inValue, inMinimum, inMaximum, inFallback) {

  if (Number.isInteger(inValue) && inValue >= inMinimum && inValue <= inMaximum) {
    return inValue;
  }

  return inFallback;

} /* End cleanInteger(). */


/**
 * Checks that a value read from the saved data looks like a keyboard key code (a short piece of text such as
 * ArrowUp or KeyA).
 *
 * @param  {*}      inValue    The value to check.  It could be anything at all.
 * @param  {string} inFallback The key code to use if inValue is not acceptable.
 * @return {string}            inValue if it is acceptable, otherwise inFallback.
 */
function cleanKeyCode(inValue, inFallback) {

  if (typeof inValue === `string` && inValue.length > 0 && inValue.length <= 32) {
    return inValue;
  }

  return inFallback;

} /* End cleanKeyCode(). */


/**
 * Safely gets one item out of something that is supposed to be an array, but might not be.
 *
 * @param  {*}      inArray The value that should be an array.
 * @param  {number} inIndex The index of the item wanted.
 * @return {*}              The item, or undefined if inArray is not an array or has no such item.
 */
function cleanArrayItem(inArray, inIndex) {

  if (Array.isArray(inArray) && inIndex < inArray.length) {
    return inArray[inIndex];
  }

  return undefined;

} /* End cleanArrayItem(). */


/**
 * Checks that a value read from the saved data is a point (an object with whole-number x and y values).
 *
 * @param  {*}      inValue The value to check.  It could be anything at all.
 * @return {object}         A new point with x and y properties.  Any part that was not acceptable is 0.
 */
function cleanPoint(inValue) {

  const point = { x: 0, y: 0 };

  if (inValue !== null && typeof inValue === `object`) {
    point.x = cleanInteger(inValue.x, -10000, 10000, 0);
    point.y = cleanInteger(inValue.y, -10000, 10000, 0);
  }

  return point;

} /* End cleanPoint(). */


// ****************************************************************************************************************
// Sound.  The original used a sound library called HSS, through an object named sndObj.  This object stands in for
// it, offering the handful of things the game actually did with sound.
// ****************************************************************************************************************
const sndObj = {

  // Every sound that is currently playing, so that they can all be stopped at once.
  activeSounds: [ ],

  /**
   * Plays a sound.  The same sound can be played several times at once (for example, rapid-fire laser shots), just
   * as it could in the original.
   *
   * @param  {string}  inKey  The name of the sound, for example `sfx_misc_1`.  See assets.js.
   * @param  {boolean} inLoop True to keep repeating the sound until it is stopped, false (or left out) to play it
   *                          once.  In the original this was a setting on the sound itself, made when it was loaded.
   * @param  {number}  inVolume How loud to play this sound, from 0 (silent) to 1 (its normal level).  Leave this out
   *                          to play it at its normal level.  This is on top of the volume chosen on the Options
   *                          screen, which applies to every sound.
   * @return {object}         The playing sound, which can be handed to stopSound() later, or null if the sound could
   *                          not be played.
   */
  playSound: function(inKey, inLoop, inVolume) {

    // If the sound file was never loaded there is nothing to play.  Say so once, and carry on without it rather
    // than letting a missing sound stop the game.
    if (!game.cache.audio.exists(inKey)) {
      if (!missingSoundsReported.includes(inKey)) {
        missingSoundsReported.push(inKey);
        console.warn(`sndObj.playSound(): sound not loaded: ${inKey}`);
      }
      return null;
    }

    // Create a fresh instance of the sound each time, so that playing it again does not cut off one that is
    // already playing.
    const sound = game.sound.add(inKey);
    sndObj.activeSounds.push(sound);

    // A sound that plays once tidies itself away when it finishes.  A looping sound never finishes on its own.
    const loop = inLoop === true;
    if (!loop) {
      sound.once(`complete`, function() {
        sndObj.forgetSound(sound);
      });
    }

    let volume = 1;
    if (inVolume !== undefined) {
      volume = inVolume;
    }
    sound.play({ loop: loop, volume: volume });

    return sound;

  }, /* End playSound(). */

  /**
   * Stops one particular sound.
   *
   * @param {object} inSound The sound to stop, as returned by playSound().  May be null, in which case nothing
   *                         happens.
   */
  stopSound: function(inSound) {

    if (inSound === null || !sndObj.activeSounds.includes(inSound)) {
      return;
    }

    inSound.stop();
    sndObj.forgetSound(inSound);

  }, /* End stopSound(). */

  /**
   * Says whether one particular sound is still playing.  (The original asked this of the sound's "channel".)
   *
   * @param  {object} inSound The sound to ask about, as returned by playSound().  May be null.
   * @return {boolean}        True if the sound is playing, false if it has finished, been stopped, or is null.
   */
  isPlaying: function(inSound) {

    if (inSound === null || !sndObj.activeSounds.includes(inSound)) {
      return false;
    }

    return inSound.isPlaying;

  }, /* End isPlaying(). */

  /**
   * Stops every sound that is playing.
   */
  stopSounds: function() {

    // Work from a copy of the list, because stopping a sound removes it from the real list as we go.
    const sounds = sndObj.activeSounds.slice();
    for (const sound of sounds) {
      sound.stop();
      sndObj.forgetSound(sound);
    }

  }, /* End stopSounds(). */

  /**
   * Removes a sound from the list of playing sounds and releases the resources it was using.
   *
   * @param {object} inSound The sound to forget about.
   */
  forgetSound: function(inSound) {

    const index = sndObj.activeSounds.indexOf(inSound);
    if (index !== -1) {
      sndObj.activeSounds.splice(index, 1);
    }
    inSound.destroy();

  } /* End forgetSound(). */

}; /* End sndObj. */


/**
 * Makes a rectangle.  Named after the Windows CRect class that the original code used everywhere, so that ported
 * code reads the same as the original.  As in Windows, the right and bottom edges are NOT part of the rectangle:
 * CRect(0, 0, 240, 320) is 240 pixels wide and 320 pixels high.
 *
 * @param  {number} inLeft   The X coordinate of the left edge.
 * @param  {number} inTop    The Y coordinate of the top edge.
 * @param  {number} inRight  The X coordinate just past the right edge.
 * @param  {number} inBottom The Y coordinate just past the bottom edge.
 * @return {object}          The rectangle, with left, top, right and bottom properties.
 */
function CRect(inLeft, inTop, inRight, inBottom) {

  return { left: inLeft, top: inTop, right: inRight, bottom: inBottom };

} /* End CRect(). */


/**
 * Determines whether a point is inside a rectangle.  Named after the Windows function the original code used.
 *
 * @param  {object} inRect  The rectangle, as made by CRect().
 * @param  {object} inPoint The point, with x and y properties.
 * @return {boolean}        True if the point is inside the rectangle, false if not.
 */
function PtInRect(inRect, inPoint) {

  return inPoint.x >= inRect.left && inPoint.x < inRect.right &&
    inPoint.y >= inRect.top && inPoint.y < inRect.bottom;

} /* End PtInRect(). */


/**
 * Takes in red, green, and blue color value components and returns a hex string for that color (so pass in
 * 255, 0, 0 and get #FF0000 back).  Named after the Windows RGB macro that the original code used.
 *
 * @param  {number} inRed   The red component, 0 to 255.
 * @param  {number} inGreen The green component, 0 to 255.
 * @param  {number} inBlue  The blue component, 0 to 255.
 * @return {string}         A hex-formatted color string.
 */
function RGB(inRed, inGreen, inBlue) {

  // Pack the individual color components into a single 24-bit number, then convert to a padded hex string.
  return `#` + ((1 << 24) + (inRed << 16) + (inGreen << 8) + inBlue).toString(16).slice(1).toUpperCase();

} /* End RGB(). */


/**
 * Returns the number of milliseconds that have gone by since the page was opened.  This is a stand-in for the
 * Windows GetTickCount() function, which the original used to count off the seconds of a timed mini-game.  (That
 * is the one piece of timing in the game that goes by the clock rather than by counting frames.)
 *
 * @return {number} A whole number of milliseconds.
 */
function GetTickCount() {

  return Math.floor(performance.now());

} /* End GetTickCount(). */


/**
 * Returns a random whole number from 0 to 32767.  This is a stand-in for the C rand() function, which the original
 * code used all over the place, nearly always in the form rand() % n to get a number from 0 to n - 1.  Having the
 * same function here means that code can be ported exactly as it was written.
 *
 * @return {number} A random whole number from 0 to 32767.
 */
function rand() {

  return Math.floor(Math.random() * 32768);

} /* End rand(). */


/**
 * Gives the name of the Phaser scene for one of the original's screen numbers.
 *
 * The original identified every screen by a number (the cs constants near the top of this file), and in a few
 * places the screen to go to is looked up in a table of those numbers rather than being named outright.  The
 * list of mini-games is the main one: it says which screen each mini-game is.  Phaser identifies scenes by name
 * instead, so this is where the one is turned into the other.
 *
 * @param  {number} inScreen One of the cs constants, for example csGlutton.
 * @return {string}          The name of the scene to start.
 */
function getSceneKeyForScreen(inScreen) {

  let sceneKey = null;

  switch (inScreen) {
    case csMainMenu: {
      sceneKey = `MainMenuScene`;
    break; }
    case csNewAdventure: {
      sceneKey = `NewAdventureScene`;
    break; }
    case csWalkingAroundTheShip: {
      sceneKey = `WalkingAroundTheShipScene`;
    break; }
    case csCharacterInteraction: {
      sceneKey = `CharacterInteractionScene`;
    break; }
    case csPlayerDied: {
      sceneKey = `PlayerDiedScene`;
    break; }
    case csWin: {
      sceneKey = `WinScene`;
    break; }
    case csFinalScore: {
      sceneKey = `FinalScoreScene`;
    break; }
    case csInMemoria: {
      sceneKey = `InMemoriaScene`;
    break; }
    case csFlightOfDoom: {
      sceneKey = `FlightOfDoomScene`;
    break; }
    case csReluctantHero: {
      sceneKey = `ReluctantHeroScene`;
    break; }
    case csRefluxive: {
      sceneKey = `RefluxiveScene`;
    break; }
    case csCosmicSquirrel: {
      sceneKey = `CosmicSquirrelScene`;
    break; }
    case csDefendoh: {
      sceneKey = `DefendohScene`;
    break; }
    case csADayInTheStrife: {
      sceneKey = `ADayInTheStrifeScene`;
    break; }
    case csLeparLand: {
      sceneKey = `LeparLandScene`;
    break; }
    case csDeathTrap: {
      sceneKey = `DeathTrapScene`;
    break; }
    case csCopyCat: {
      sceneKey = `CopyCatScene`;
    break; }
    case csVirus: {
      sceneKey = `VirusScene`;
    break; }
    case csGlutton: {
      sceneKey = `GluttonScene`;
    break; }
    case csConquerror: {
      sceneKey = `ConquerrorScene`;
    break; }
    case csAntigravitator: {
      sceneKey = `AntigravitatorScene`;
    break; }
    case csFarOutFowl: {
      sceneKey = `FarOutFowlScene`;
    break; }
    case csTheEscape: {
      sceneKey = `TheEscapeScene`;
    break; }
    case csAlienBabble: {
      sceneKey = `AlienBabbleScene`;
    break; }
    case csTheRedeyeOrder: {
      sceneKey = `TheRedeyeOrderScene`;
    break; }
    case csFfopirSirtetPaehc: {
      sceneKey = `FfopirSirtetPaehcScene`;
    break; }
    case csEngineer: {
      sceneKey = `EngineerScene`;
    break; }
    case csTheBogazDerby: {
      sceneKey = `TheBogazDerbyScene`;
    break; }
    case csSquishem: {
      sceneKey = `SquishemScene`;
    break; }
    case csTroubleInVectropolis: {
      sceneKey = `TroubleInVectropolisScene`;
    break; }
    case csMuncherDude: {
      sceneKey = `MuncherDudeScene`;
    break; }
    case csSonOfEliminator: {
      sceneKey = `SonOfEliminatorScene`;
    break; }
  }

  return sceneKey;

} /* End getSceneKeyForScreen(). */


/**
 * Works out which scene to start once loading has finished.
 *
 * Normally that is the first screen of the game.  As a development aid, though, the page address can name a scene
 * to jump straight to, for example index.html?scene=TestCardScene, which saves playing through the whole game to
 * reach the screen being worked on.  The name is only accepted if it is one of the game's own scenes.
 *
 * @return {object} An object with two properties: key is the name of the scene to start, and requested is true if
 *                  that scene was asked for in the page address.
 */
function getStartingScene() {

  const requestedKey = new URLSearchParams(window.location.search).get(`scene`);

  // Only accept names of scenes that really exist (and not the preloader, which has already run).
  if (requestedKey !== null && requestedKey !== `PreloadScene` &&
    Object.prototype.hasOwnProperty.call(game.scene.keys, requestedKey)
  ) {
    return { key: requestedKey, requested: true };
  }

  return { key: firstSceneKey, requested: false };

} /* End getStartingScene(). */


// Kick off the fun!
window.addEventListener(`DOMContentLoaded`, init);
