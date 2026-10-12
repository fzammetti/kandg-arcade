/**
 * The cut scene "The Adventure Begins", shown when the player starts a new Adventure game.  The inside of Krelmac
 * and Gentoo's ship drops into view, and the two of them talk.  On the viewscreen behind them Henry is seen
 * wandering about, then being beamed up, and finally as a captive.  When the scene ends (or is skipped) the player
 * finds themselves walking around the ship.
 *
 * This is the port of scenes/new_adventure.cpp.  How a cut scene works is explained in CutScene.js; all this class
 * does is list the pictures and sounds that the scene's script uses.
 */
class NewAdventureScene extends CutScene {


  // The script that OASIS plays.
  script_name = `script_the_adventure_begins`;

  // The pictures, in the order the original put them in its OASIS_Actors array.  The script refers to them by
  // their position in this list (the first is number 0), so the order must not change.  Note that the Krelmac
  // pictures are NOT in numerical order: 11 comes in the middle, and 10 and 08 are at the very end.
  image_actors = [
    `gfx_ship_interior`,
    `gfx_krelmac_01`, `gfx_krelmac_02`, `gfx_krelmac_03`, `gfx_krelmac_06`, `gfx_krelmac_07`, `gfx_krelmac_09`,
    `gfx_gentoo_01`, `gfx_gentoo_02`, `gfx_gentoo_03`,
    `gfx_krelmac_11`,
    `gfx_gentoo_05`, `gfx_gentoo_06`,
    `gfx_henry_wandering_1`, `gfx_henry_wandering_2`, `gfx_henry_wandering_3`, `gfx_henry_wandering_4`,
    `gfx_henry_wandering_5`, `gfx_henry_wandering_6`,
    `gfx_henry_beamingup_1`, `gfx_henry_beamingup_2`, `gfx_henry_beamingup_3`, `gfx_henry_beamingup_4`,
    `gfx_henry_beamingup_5`,
    `gfx_viewscreen_static1`, `gfx_viewscreen_static2`, `gfx_viewscreen_static3`,
    `gfx_henry_captive_1`, `gfx_henry_captive_2`, `gfx_henry_captive_3`, `gfx_henry_captive_4`,
    `gfx_krelmac_10`, `gfx_krelmac_08`
  ];

  // The sounds, in the order the original put them in its OASIS_AudioActors array: a bounce as the picture drops
  // into place, then the lines of the conversation in the order they are spoken, and lastly the beaming-up sound
  // (which is last in this list, although it is heard early on in the scene).
  audio_actors = [
    `sfx_bounce_2`,
    `sfx_voice_gentoo_01`, `sfx_voice_krelmac_01`, `sfx_voice_krelmac_04`, `sfx_voice_gentoo_05`,
    `sfx_voice_krelmac_05`, `sfx_voice_gentoo_06`, `sfx_voice_krelmac_06`, `sfx_voice_gentoo_20`,
    `sfx_voice_krelmac_07`, `sfx_voice_gentoo_07`, `sfx_voice_krelmac_08`, `sfx_voice_gentoo_08`,
    `sfx_voice_gentoo_09`,
    `sfx_beammeup`
  ];

  // Where the player goes afterwards.
  screen_after = csWalkingAroundTheShip;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`NewAdventureScene.constructor`);

    super(`NewAdventureScene`);

  } /* End constructor. */


} /* End class. */
