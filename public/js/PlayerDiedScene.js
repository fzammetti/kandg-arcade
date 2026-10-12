/**
 * The cut scene "Player Died", shown when the player's health runs out while walking around the ship.  The inside
 * of Krelmac and Gentoo's ship drops into view, just as it does at the start of the adventure, and the two of them
 * talk over what has happened, while the viewscreen behind them shows what has become of poor Henry.  When the
 * scene ends (or is skipped) the player is back at the main menu.
 *
 * This is the port of scenes/player_died.cpp.  How a cut scene works is explained in CutScene.js; all this class
 * does is list the pictures and sounds that the scene's script uses.
 */
class PlayerDiedScene extends CutScene {


  // The script that OASIS plays.
  script_name = `script_player_died`;

  // The pictures, in the order the original put them in its OASIS_Actors array.  The script refers to them by
  // their position in this list (the first is number 0), so the order must not change.
  //
  // Note the two null entries.  The original left positions 6 and 12 of its array empty (this scene was plainly
  // made from a copy of "The Adventure Begins", where those two positions hold pictures that this scene has no use
  // for), and the script never asks for either of them.  They have to stay in the list all the same, because
  // without them every picture that comes afterwards would be one or two places out.  Note also that the Gentoo
  // pictures are NOT in numerical order: 07 and 08 are at the very end, after the pictures of Henry.
  image_actors = [
    `gfx_ship_interior`,
    `gfx_krelmac_01`, `gfx_krelmac_02`, `gfx_krelmac_03`, `gfx_krelmac_04`, `gfx_krelmac_05`,
    null,
    `gfx_gentoo_01`, `gfx_gentoo_02`, `gfx_gentoo_03`, `gfx_gentoo_04`, `gfx_gentoo_05`,
    null,
    `gfx_henry_dead_1`, `gfx_henry_dead_2`, `gfx_henry_dead_3`,
    `gfx_gentoo_07`, `gfx_gentoo_08`
  ];

  // The sounds, in the order the original put them in its OASIS_AudioActors array: a bounce as the picture drops
  // into place, then the four lines of the conversation in the order they are spoken.
  audio_actors = [
    `sfx_bounce_2`,
    `sfx_voice_gentoo_12`, `sfx_voice_krelmac_12`, `sfx_voice_gentoo_13`, `sfx_voice_krelmac_13`
  ];

  // Where the player goes afterwards.
  screen_after = csMainMenu;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`PlayerDiedScene.constructor`);

    super(`PlayerDiedScene`);

  } /* End constructor. */


} /* End class. */
