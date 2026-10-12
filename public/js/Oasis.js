/**
 * OASIS stands for Omnytex Action Scene Interpretation System.  This is a bit of code I wrote in early 2002 for the
 * specific purpose of playing cinematic cut scenes in PocketPC games (back when Etherient was Omnytex).  It reads in a
 * binary file which is generated from an Excel spreadsheet (believe it or not, and I still have the scene editor
 * spreadsheet I wrote back then too!).  Each byte (or combination of bytes) in the file has a specific meaning to
 * OASIS, whether that be moving an actor (or a sprite in other words) around, hiding them, playing a sound, etc.
 * It was done this way because PocketPC devices were very resource-constrained, so memory was at a premium.  In fact,
 * Invasion: Trivia! had trouble running on some devices due to low memory, and the user would have to go play with the
 * memory slider in system settings to try and free enough memory for it to run.  So, scene script size was at a
 * premium for sure.  Interestingly, OASIS depended on the frame rate being static because the timing of the animations
 * and sounds were synced up based on actual frames.  A very simple approach that worked well enough back then, and
 * actually still does when converted to Phaser.  I have to say, OASIS and the scene editor have always been something
 * I take a bit of pride in.  While not very advanced, it worked extremely well and met a need that was tough to
 * come by back than any other way.  After all, you couldn't just embed a video file and play it on those early devices!
 * The scene script files that OASIS plays are completely unaltered from their original form, and it was quite an
 * adventure getting this to work with web technologies!
 */
class Oasis {


  OASIS_PLAYER = function() {
    console.log(`Oasis.js -> OASIS_PLAYER()`);
    return {
      actorID: null, /* ID matching the ID in the OASIS_ImageActors array of this player. */
      image: null /* The current Phaser image for this player. */
    };
  };


  OASIS_ImageActors = [ ]; // Array of actors (texture names) available for use in the scene.
  OASIS_AudioActors = [ ]; // Array of audio actors (loaded audio assets) available for use in the scene.
  OASIS_Players = [ ]; // Array of players currently used in the scene.
  Pointer	= 0; // Pointer to the current position in the script.
  Script = 0; // Pointer to the current position in the script.
  OASIS_NumberOfPlayers	= 0; // Number of players currently involved in the scene.
  OASIS_NumberOfAudioActors = 0; // Total number of audio actors loaded for this scene.


  // Every time we load an image, add it here so that we can clean up at the end.
  loadImages = [ ];


  /**
   * Constructor.
   */
  constructor() {

    console.log(`Oasis.constructor`);

  } /* End constructor. */


  /**
   * OASIS_StartScene - Called once at the beginning of a new scene.
   *
   * @param inScript      The script for the scene.
   * @param inActorImages The names of the image assets for the scene.
   * @param inAudioActors The loaded audio assets for the scene.
   */
  OASIS_StartScene(inScript, inActorImages, inAudioActors) {

    console.log(`Oasis.js -> OASIS_StartScene()\n` +
      `inScript=${inScript}\n` +
      `inActorImages=${inActorImages}\n` +
      `inAudioActors=${inAudioActors}`
    );

    // Point to the start of the script for this scene
    this.Pointer = 0;
    this.Script	= inScript;
    this.OASIS_NumberOfPlayers = 0;
    this.OASIS_NumberOfAudioActors = 0;
    // Load the Actors array with the data from the array passed in (texture names)
    this.OASIS_ImageActors = inActorImages;
    // Load the Audio Actors array with the data from the array passed in (loaded audio)
    this.OASIS_AudioActors = inAudioActors;

  } /* End OASIS_StartScene(). */


  /**
   * OASIS_DoScene - Called for each frame of animation for a scene
   *
   * @param  inScene The Phaser scene object that is running the current Oasis script.
   * @return         A value of 1 when the end of the script is reached, 0 otherwise.
   */
  OASIS_DoScene(inScene) {

    // If the pointer currently points to the end of the script, exit now indicating this condition (@ 0x40).
    if (this.Script[this.Pointer] === 64) {
      return 1;
    }

    // Not at the end of the script, so we must be about to process a frame.
    // Process until the end-of-frame indicator is found (! 0x21).
    while (this.Script[this.Pointer] !== 33) {

      const nextCmd = this.Script[this.Pointer];
      this.Pointer++;

      // 0x21 33 !    0x40 64 @    0x41 65 A    0x43 67 C    0x45 69 E    0x46 70 F    0x48 72 H    0x49 73 I
      // 0x4c 76 L    0x4d 77 M    0x50 80 P    0x52 82 R    0x53 83 S    0x54 84 T    0x55 85 U    0x58 88 X

      switch (nextCmd) {

        // Add Player To Scene (A 0x41).
        case 65: {
          // Get the ID of the actor.
          const actorID = this.Script[this.Pointer];
          this.Pointer++;
          // Add the actor to the array of players.
          this.OASIS_Players[this.OASIS_NumberOfPlayers] = this.OASIS_PLAYER();
          this.OASIS_Players[this.OASIS_NumberOfPlayers].actorID = actorID;
          this.OASIS_Players[this.OASIS_NumberOfPlayers].image =
            inScene.add.image(-1000, -1000, this.OASIS_ImageActors[actorID]);
          // Warning: here be a very ugly hack!  There is a bug that keeps these three images from appearing like
          // they're supposed to.  And, I couldn't figure out why it was happening.  I THINK it has to do with the way
          // the code had to be changed to make everything work when porting to Phaser.  But regardless, I got to a
          // point where I had sunk enough time into it and more wasn't worth it.  So, I implemented this ugly hack,
          // which simply ensures these three images are always on top of everything else.  It solves the problem, and
          // since these are only used in the one Zumbugwa scene, it's a safe hack.  I feel bad about it, but such
          // in life, sometimes you just do what you must!
          if (this.OASIS_ImageActors[actorID] === `imgBrelnarWordsPitifulBrelnar` ||
            this.OASIS_ImageActors[actorID] === `imgBrelnarWordsChooseAnAnswer` ||
            this.OASIS_ImageActors[actorID] === `imgBrelnarWordsThankYouNowGetOut`
          ) {
            this.OASIS_Players[this.OASIS_NumberOfPlayers].image.setDepth(9999);
          }
          this.loadImages.push(this.OASIS_Players[this.OASIS_NumberOfPlayers].image);
          this.OASIS_Players[this.OASIS_NumberOfPlayers].image.setOrigin(0, 0);
          this.OASIS_Players[this.OASIS_NumberOfPlayers].image.setVisible(false);
          // Increase our player count
          this.OASIS_NumberOfPlayers++;
        break; }

        // Change Actor ID Of Player (I 0x49).
        case 73: {
          // Get the ID of the Player.
          const playerID = this.Script[this.Pointer];
          this.Pointer++;
          // Get the ID of the actor to replace the old player's actor with.
          const newActorID  = this.Script[this.Pointer];
          this.Pointer++;
          // Get reference to the player we're changing.
          const player = this.OASIS_Players[playerID];
          // Get reference to the old actor the player is showing.
          const oldImage = player.image;
          const wasVisible = oldImage.visible;
          const oldDepth = oldImage.depth;
          // Get reference to the new actor the player will be showing.
          const newImage = inScene.add.image(-1000, -1000, this.OASIS_ImageActors[newActorID]);
          this.loadImages.push(newImage);
          newImage.setOrigin(0, 0);
          // Hide the old image actor this player is referencing.
          oldImage.setVisible(false);
          // Position the new image actor where the old one was.
          newImage.x = oldImage.x;
          newImage.y = oldImage.y;
          // Preserve depth/visibility from the previous actor.
          newImage.setDepth(oldDepth);
          newImage.setVisible(wasVisible);
          // Update the player's current actor.
          player.image = newImage;
          // Update the image actor this player is referencing.
          player.actorID = newActorID;
        break; }

        // Hide All Players (E 0x45).
        case 69: {
          // Set hidden to true for all players.
          for (let i = 0; i < this.OASIS_NumberOfPlayers; i++) {
            this.OASIS_Players[i].image.setVisible(false);
          }
        break; }

        // Hide Player (H 0x48).
        case 72: {
          // Get the ID of the Player.
          const playerID = this.Script[this.Pointer];
          this.Pointer++;
          // Toggle player's hidden state.
          this.OASIS_Players[playerID].image.setVisible(false);
        break; }

        // Unhide Player (U 0x55).
        case 85: {
          // Get the ID of the Player.
          const playerID = this.Script[this.Pointer];
          this.Pointer++;
          // Toggle player's hidden state.
          this.OASIS_Players[playerID].image.setVisible(true);
        break; }

        // Put Player To Screen Location (P 0x50).
        case 80: {
          // Get the ID of the player.
          const playerID = this.Script[this.Pointer];
          this.Pointer++;
          // Get the X coordinate to put the player at (2 bytes).
          const negativeXIndicator = this.Script[this.Pointer];
          this.Pointer++;
          const locX = (this.Script[this.Pointer] << 8) + this.Script[this.Pointer + 1];
          this.Pointer = this.Pointer + 2;
          // Get the Y coordinate to put the player at (2 bytes).
          const negativeYIndicator = this.Script[this.Pointer];
          this.Pointer++;
          const locY = (this.Script[this.Pointer] << 8) + this.Script[this.Pointer + 1];
          this.Pointer = this.Pointer + 2;
          // Update the player's coordinates.
          if (negativeXIndicator === 1) {
            this.OASIS_Players[playerID].image.x = locX * -1;
          } else {
            this.OASIS_Players[playerID].image.x = locX;
          }
          if (negativeYIndicator === 1) {
            this.OASIS_Players[playerID].image.y = locY * -1;
          } else {
            this.OASIS_Players[playerID].image.y = locY;
          }
        break; }

        // Move Player On Screen (M 0x4d).
        case 77: {
          // Get the ID of the player.
          const playerID = this.Script[this.Pointer];
          this.Pointer++;
          // Get the number of pixels to move (2 bytes).
          const numPixels = ((this.Script[this.Pointer] << 8) + this.Script[this.Pointer + 1]);
          this.Pointer = this.Pointer + 2;
          // Get the direction to move.
          const dirMove = this.Script[this.Pointer];
          this.Pointer++;
          // Update the player's coordinates.
          switch (dirMove) {
            case 85: { // U Up.
              this.OASIS_Players[playerID].image.y = this.OASIS_Players[playerID].image.y - numPixels;
            break; }
            case 68: { // D Down.
              this.OASIS_Players[playerID].image.y = this.OASIS_Players[playerID].image.y + numPixels;
            break; }
            case 76: { // L Left.
              this.OASIS_Players[playerID].image.x = this.OASIS_Players[playerID].image.x - numPixels;
            break; }
            case 82: { // R Right.
              this.OASIS_Players[playerID].image.x = this.OASIS_Players[playerID].image.x + numPixels;
            break; }
          }
        break; }

        // Play Sound FX (X 0x58).
        case 88: {
  				// Get the ID of the Audio Actor.
  				const audioactorID = this.Script[this.Pointer];
          this.Pointer++;
  				// Get the loop flag.
  				const loopFlag = this.Script[this.Pointer];
          this.Pointer++;
  				// Play the Sound FX.
	  			let lf = false;
  				if (loopFlag === 1) { lf = true; }
  				this.OASIS_AudioActors[audioactorID].play({ loop: lf, volume: 1 });
        break; }

        // Clear screen (C 0x43).
        // Not needed in any scene in the port, but still have to move the pointer properly, so has to be here.
        case 67: {
          this.Pointer++; // Red.
          this.Pointer++; // Green.
          this.Pointer++;  // Blue.
        break; }

        // Stop Sound FX (S 0x53).
        // Not needed in any scene in the port, but still have to move the pointer properly, so has to be here.
        case 83: {
          this.Pointer++; // Audio Actor ID.
          this.Pointer++; // Volume.
        break; }

        // Change Sound FX Volume (F 0x46).
        // Not needed in any scene in the port, but still have to move the pointer properly, so has to be here.
        case 70: {
          this.Pointer++; // Audio Actor ID.
          this.Pointer++; // Volume.
        break; }

        // Show Text (T 0x54).
        case 84: {
          // Another hack: this command is used exactly once, in the Beam A Brelnar scene, to show one piece of text.
          // Because of that, rather than properly implement this command, I'll just move the pointer appropriately
          // to keep things moving, and then hardcode that one piece of text.  Yes, it's another cheat, but no point
          // going through additional effort I don't need.  If I ever want to use OASIS outside of this game, I'll
          // worry about doing it for real then since it'll be the least of my tasks at that point!
          const actorID = this.Script[this.Pointer];
          this.Pointer++; // Text Actor ID.
          this.Pointer++; // Red.
          this.Pointer++; // Green.
          this.Pointer++; // Blue.
          this.Pointer = this.Pointer + 2; // X.
          this.Pointer = this.Pointer + 2; // Y.
          this.Pointer++; // Align Setting.
          // Now we need to add the actor, just like we do for the A command, but of course it's not an image in this
          // case, it's text.  Fortunately, the API for text in Phaser is similar to an image, at least as far as
          // needed here (namely the setOrigin() and setVisible() methods), so OASIS won't care.
          this.OASIS_Players[this.OASIS_NumberOfPlayers] = this.OASIS_PLAYER();
          this.OASIS_Players[this.OASIS_NumberOfPlayers].actorID = actorID;
          const x = inScene.cameras.main.width / 2;
          const y = inScene.cameras.main.height / 2;
          this.OASIS_Players[this.OASIS_NumberOfPlayers].image = inScene.add.text(x, y, `Meanwhile...`, {
            fill: `#ffffff`, fontSize: defaultFontSize, fontStyle: defaultFontStyle
          });
          this.loadImages.push(this.OASIS_Players[this.OASIS_NumberOfPlayers].image);
          this.OASIS_Players[this.OASIS_NumberOfPlayers].image.setOrigin(0.5, 0);
        break; }

        default: {
          console.log(`Unknown (or unneeded/unimplemented) command: ${nextCmd}`);
        break; }

      } /* End switch. */

    } /* End while. */

    // Move on after a frame ends.
    this.Pointer++;

    // Exit normally
    return 0;

  } /* End OASIS_DoScene(). */


  /**
   * OASIS_EndScene - Called once at the end of a scene to clean up.
   */
  OASIS_EndScene() {

    console.log(`Oasis.js -> OASIS_EndScene()`);

    for (const image of this.loadImages) {
      image.destroy();
    }
    for (const audio of this.OASIS_AudioActors) {
      audio.destroy();
    }

  } /* End OASIS_EndScene(). */


} /* End class. */
