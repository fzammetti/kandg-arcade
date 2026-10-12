/**
 * The cut scene "Win", shown when the player steps into the teleporter on the fifth and last level of the ship with
 * all of its mini-games done.  The inside of Krelmac and Gentoo's ship drops into view, just as it does at the
 * start of the adventure, and the two of them talk over what has happened, while the viewscreen behind them shows
 * Henry jumping for joy.  When the scene ends (or is skipped) the player is shown their final score.
 *
 * This is the port of scenes/win.cpp.  How a cut scene works is explained in CutScene.js; all this class does is
 * list the pictures and sounds that the scene's script uses.
 */
class WinScene extends CutScene {


  // The script that OASIS plays.
  script_name = `script_win`;

  // The pictures, in the order the original put them in its OASIS_Actors array.  The script refers to them by
  // their position in this list (the first is number 0), so the order must not change.
  //
  // Note the five null entries.  The original left positions 2, 3, 9, 11 and 14 of its array empty (this scene was
  // plainly made from a copy of "The Adventure Begins", where those positions hold pictures that this scene has no
  // use for), and the script never asks for any of them.  They have to stay in the list all the same, because
  // without them every picture that comes afterwards would be out of place.  Note also that the Krelmac pictures
  // are NOT in numerical order: 07 and 09 come in the middle of the Gentoo pictures, and 10 and 11 at the very end.
  //
  // Note, too, the two pictures of Henry.  The original's code names them GFX_HENRY_JUMPING_1 and then
  // GFX_HENRY_JUMPING_2, but those two names were swapped in the original's list of files (see assets.js), so the
  // first of them is the file numbered 2 and the second the file numbered 1.  That is not a mistake here.
  image_actors = [
    `gfx_ship_interior`,
    `gfx_krelmac_01`,
    null,
    null,
    `gfx_krelmac_04`, `gfx_krelmac_05`, `gfx_krelmac_06`,
    `gfx_henry_jumping_2`, `gfx_henry_jumping_1`,
    null,
    `gfx_gentoo_04`,
    null,
    `gfx_gentoo_06`,
    `gfx_krelmac_07`,
    null,
    `gfx_krelmac_09`,
    `gfx_gentoo_07`, `gfx_gentoo_08`, `gfx_gentoo_09`,
    `gfx_krelmac_10`, `gfx_krelmac_11`
  ];

  // The sounds, in the order the original put them in its OASIS_AudioActors array: a bounce as the picture drops
  // into place, then the four lines of the conversation.
  audio_actors = [
    `sfx_bounce_2`,
    `sfx_voice_gentoo_15`, `sfx_voice_krelmac_15`, `sfx_voice_gentoo_17`, `sfx_voice_krelmac_16`
  ];

  // Where the player goes afterwards.
  screen_after = csFinalScore;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`WinScene.constructor`);

    super(`WinScene`);

  } /* End constructor. */


} /* End class. */
