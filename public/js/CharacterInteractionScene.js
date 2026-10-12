/**
 * Character Interaction: a conversation with the captive held on the current level of the ship.  It appears as a
 * panel over the top of the ship when the player stands at the captive and presses ACTION.
 *
 * The captive says something; the player chooses one of five things to say back (LEFT and RIGHT step through
 * them, ACTION says the one showing); and so on.  What the player says can make the captive trust them more, or
 * less, and the captive's expression changes to match.  There are five levels of trust.  The aim is to win the
 * captive's complete trust and then ask for "the secret hint", which is the trick for winning the mini-game on the
 * level's fifth console.  Lose the captive's trust completely, or ask for the hint too soon, and the captive ends
 * the conversation.  The player can also just walk away.
 *
 * This is the port of character_interaction.cpp.
 *
 * HOW THE CONVERSATION IS STORED.  Each captive has a data file (the original files, unaltered) holding a "map" of
 * the conversation, made of numbered "nodes".  A node is one thing the captive can say, together with the three
 * things the player can say in reply; and for each of those three, whether it raises or lowers the captive's trust
 * and which node the conversation moves to next.  Two more replies are the same at every node and are not in the
 * file: walking away, and asking for the hint.
 *
 * HOW THIS SCREEN IS REACHED.  The ship switches to this screen by the quick route (see switchScreen() in
 * GameScene.js) and this screen switches back the same way.  Nothing is set up or cleaned up on the way in or
 * out, so the ship is exactly as it was left.  It also means loadScreen() is not called for this screen: it sets
 * itself up on its first frame instead, as the original did.  The picture of the ship that was last drawn is
 * still on the backbuffer at that point, and is what shows around and (tinted blue) behind the panel.
 */
class CharacterInteractionScene extends GameScene {


  // Trust level defines for our captive.
  // Note: Whenever we adjust the captive's trust level (when a player says a phrase), we check the value after the
  // adjustment.  If it's < tlDistrusting, the captive stops talking to us.  If it's tlTrusting, the player can only
  // then get the proper response to the request for the hint.  (The spelling "Nuetral" is the original's.)
  tlDistrusting = 0;
  tlNuetral = 1;
  tlCautious = 2;
  tlWarmingUp = 3;
  tlTrusting = 4;

  // Our border, and the sunburst that is drawn behind the captive when they are happy.
  popup_border_big = `gfx_popup_border_big`;
  happy_burst = `gfx_happy_burst`;

  // Our temp surface for the blending: a copy of the patch of screen behind the panel, tinted blue.
  ciTempBlended = null;

  // The captive's music while it is playing, or null when it is not.
  music = null;

  // The history of the interaction: the last five lines that were said, which are shown on the panel.  Each entry
  // has history_text (the text of the line) and isCaptive (true if the line is the captive's, false if it's the
  // player's; the two are drawn in different colors).  Made in the constructor.
  history = [ ];

  // Stores all the nodes of our conversation.  Each node has:
  //   captiveResponse       - what the captive says when this node is reached (two lines of text are used);
  //   playerPhrases         - the phrases the player can currently say: five of them, each of two lines;
  //   trustLevelAdjustments - what saying each phrase does to the captive's trust: 1 lowers it, 2 raises it, and
  //                           anything else leaves it alone;
  //   nextNode              - the number of the node that each phrase leads to.
  // Made in the constructor, and filled in from the captive's data file each time a conversation starts.
  conversationMap = [ ];

  // The text of the hint: five lines.
  hint_text = [ ``, ``, ``, ``, ``, ``, `` ];

  // Flag to tell if we've been through pnf() once yet.
  first_time = false;

  // Has the current node's character response been said yet?
  currentNodeDisplayed = false;

  // Set to true when exiting the screen because the captive has ended the conversation.
  exiting = false;

  // Has the initialization of this conversation been done yet?
  initDone = false;

  // Gets set to true when it's time to show the hint.
  show_hint = false;

  // Current trust level of captive.
  captive_trust_level = 0;

  // What button is pressed: 1 for the Previous arrow, 2 for the Next arrow, 0 for neither.
  ciButtonPressed = 0;

  // What player phrase is currently being shown: 0 to 4.
  currentPlayerPhrase = 0;

  // Index to the current interaction node we're on.
  currentINode = 0;

  // Pause when exiting: a count of frames.
  exiting_delay = 0;


  /**
   * Constructor.
   */
  constructor() {

    console.log(`CharacterInteractionScene.constructor`);

    super(`CharacterInteractionScene`);

    // Make the history lines (seven, as the original declared, though five are used).
    for (let i = 0; i < 7; i++) {
      this.history.push({ history_text: ``, isCaptive: true });
    }

    // Make the nodes of the conversation map, all empty to begin with (54, as the original declared).
    for (let i = 0; i < 54; i++) {
      const node = {
        captiveResponse: [ ``, ``, ``, `` ],
        playerPhrases: [ ],
        trustLevelAdjustments: [ 0, 0, 0, 0, 0, 0, 0 ],
        nextNode: [ 0, 0, 0, 0, 0, 0, 0 ]
      };
      for (let j = 0; j < 7; j++) {
        node.playerPhrases.push([ ``, ``, ``, `` ]);
      }
      this.conversationMap.push(node);
    }

  } /* End constructor. */


  /**
   * Gets this screen ready for the next conversation.  The original did this as the last step of loading the ship,
   * so WalkingAroundTheShipScene calls it from its loadScreen().
   */
  loadCharacterInteraction() {

    this.music = null;
    this.first_time = true;

  } /* End loadCharacterInteraction(). */


  /**
   * Draws one frame.  This is the port of pnfCharacterInteraction().
   *
   * The first three frames are different from the rest.  On the first, the conversation is set up and nothing is
   * drawn.  On the second, the patch of screen behind the panel is tinted blue and a copy of it is kept.  On the
   * third, the captive's music starts, and from then on the panel is drawn every frame.
   *
   * @param {Surface} inBackbuffer The surface to draw on.
   */
  pnf(inBackbuffer) {

    if (this.initDone) { // Initialization IS done

      if (this.first_time) { // It's the first time through

        // Do the first time inits: tint the area the panel will cover (the ship is still showing there) with
        // half-strength blue, and keep a copy of the result to draw the panel on top of each frame.
        this.ciTempBlended = new Surface(208, 288);
        const rect = CRect(15, 15, 223, 303);
        inBackbuffer.FillRect(rect, RGB(0, 0, 200), 128);
        this.ciTempBlended.BltFast(0, 0, inBackbuffer, rect);
        this.first_time = false;

      } else { // NOT the first time through

        // Start the captive's music, if it is not already playing.  Each captive has their own tune.
        if (this.music === null) {
          switch (gameState.current_level) {
            case 1: {
              this.music = sndObj.playSound(`sfx_music_eeger`, true);
              break;
            }
            case 2: {
              this.music = sndObj.playSound(`sfx_music_fred`, true);
              break;
            }
            case 3: {
              this.music = sndObj.playSound(`sfx_music_catrina`, true);
              break;
            }
            case 4: {
              this.music = sndObj.playSound(`sfx_music_brenda`, true);
              break;
            }
            case 5: {
              this.music = sndObj.playSound(`sfx_music_sully`, true);
              break;
            }
            default: {
              break;
            }
          }
        }

        // The captive's picture shows how far they trust the player: expression 1 is distrusting, 5 is trusting.
        const captiveImage = `gfx_captive_${gameState.current_level}_expression_${this.captive_trust_level + 1}`;

        if (this.show_hint) { // We're showing the hint and waiting for the player to exit

          // Blit Blended area.
          inBackbuffer.BltFast(15, 15, this.ciTempBlended, null);
          // Blit Border.
          inBackbuffer.BltFast(9, 9, this.popup_border_big, null);
          // Sunburst when happy.
          inBackbuffer.BltFast(39, 23, this.happy_burst, null);
          // Captive.
          inBackbuffer.BltFast(39, 23, captiveImage, null);
          // Hint text.
          let j = 168;
          for (let i = 0; i < 5; i++) {
            inBackbuffer.DrawText(20, j, this.hint_text[i], font1_green, GDDRAWTEXT_LEFT);
            j = j + 18;
          }
          // Notice to click Command to exit.
          inBackbuffer.DrawText(gameState.bbCenterPoint, 280, `COMMAND/Click To Exit`, font1, GDDRAWTEXT_CENTER);

        } else {

          const node = this.conversationMap[this.currentINode];

          // If the current node's character response hasn't been said yet, add it to the history now.
          if (!this.currentNodeDisplayed) {
            this.currentNodeDisplayed = true;
            // Shift the history text up appropriately, depending on whether the response is one or two lines, and
            // put the new text in.
            if (node.captiveResponse[1] === ``) { // One line
              this.copyHistoryLine(1, 0);
              this.copyHistoryLine(2, 1);
              this.copyHistoryLine(3, 2);
              this.copyHistoryLine(4, 3);
              this.history[4].history_text = node.captiveResponse[0];
              this.history[4].isCaptive = true;
            } else { // Two lines
              this.copyHistoryLine(2, 0);
              this.copyHistoryLine(3, 1);
              this.copyHistoryLine(4, 2);
              this.history[3].history_text = node.captiveResponse[0];
              this.history[4].history_text = node.captiveResponse[1];
              this.history[3].isCaptive = true;
              this.history[4].isCaptive = true;
            }
          }

          // Blit Blended area.
          inBackbuffer.BltFast(15, 15, this.ciTempBlended, null);
          // Blit Border.
          inBackbuffer.BltFast(9, 9, this.popup_border_big, null);
          // Sunburst when happy.
          if (this.captive_trust_level === 4) {
            inBackbuffer.BltFast(39, 23, this.happy_burst, null);
          }
          // Captive.
          inBackbuffer.BltFast(39, 23, captiveImage, null);
          // Blit History text: the captive's lines in green, the player's in yellow.
          let j = 168;
          for (let i = 0; i < 5; i++) {
            if (this.history[i].isCaptive) {
              inBackbuffer.DrawText(20, j, this.history[i].history_text, font1_green, GDDRAWTEXT_LEFT);
            } else {
              inBackbuffer.DrawText(20, j, this.history[i].history_text, font1, GDDRAWTEXT_LEFT);
            }
            j = j + 18;
          }
          // Blit Arrows.
          if (this.ciButtonPressed === 1) {
            inBackbuffer.BltFast(15, 270, `gfx_ins_prev_1`, null);
          } else {
            inBackbuffer.BltFast(15, 270, `gfx_ins_prev_0`, null);
          }
          if (this.ciButtonPressed === 2) {
            inBackbuffer.BltFast(198, 270, `gfx_ins_next_1`, null);
          } else {
            inBackbuffer.BltFast(198, 270, `gfx_ins_next_0`, null);
          }
          // Phrase text: the thing the player would say if they pressed ACTION now.
          inBackbuffer.DrawText(
            gameState.bbCenterPoint, 264, node.playerPhrases[this.currentPlayerPhrase][0], font1, GDDRAWTEXT_CENTER
          );
          inBackbuffer.DrawText(
            gameState.bbCenterPoint, 280, node.playerPhrases[this.currentPlayerPhrase][1], font1, GDDRAWTEXT_CENTER
          );
          // If we're in the process of exiting, handle that.  The captive's parting words are left on the screen
          // for two seconds (48 frames), and then it is back to the ship.
          if (this.exiting) {
            this.exiting_delay++;
            if (this.exiting_delay > 48) {
              sndObj.stopSounds();
              this.music = null;
              this.exiting = false;
              this.initDone = false;
              this.exiting_delay = 0;
              this.first_time = true;
              this.currentNodeDisplayed = false;
              this.switchScreen(getSceneKeyForScreen(csWalkingAroundTheShip));
            }
          }

        } // End if (show_hint)

      } // End if (first_time)

    } else { // Initialization NOT yet done

      this.initCharacterInteraction(gameState.current_level);

    }

  } /* End pnf(). */


  /**
   * Copies one line of the history over another.  (In the original this was a single assignment of one structure
   * to another.)
   *
   * @param {number} inFrom The number of the line to copy.
   * @param {number} inTo   The number of the line to copy it over.
   */
  copyHistoryLine(inFrom, inTo) {

    this.history[inTo].history_text = this.history[inFrom].history_text;
    this.history[inTo].isCaptive = this.history[inFrom].isCaptive;

  } /* End copyHistoryLine(). */


  /**
   * A key was pressed.  LEFT and RIGHT show their arrow pressed in, and ACTION is noted.  Nothing happens until
   * the key is let go (see ku()).  Keys do nothing while the captive is ending the conversation or the hint is
   * showing.
   *
   * @param {string} inKey The code of the key.
   */
  kd(inKey) {

    if (this.currentNodeDisplayed && !this.exiting && !this.show_hint) {
      if (inKey === gameState.kLeft) {
        this.ciButtonPressed = 1;
      }
      if (inKey === gameState.kRight) {
        this.ciButtonPressed = 2;
      }
      if (inKey === gameState.kAction) {
        gameState.player_button_down = true;
      }
    }

  } /* End kd(). */


  /**
   * A key was released.  This is where everything happens: LEFT and RIGHT step through the things the player can
   * say, ACTION says the one that is showing, and COMMAND leaves once the hint has been given.
   *
   * @param {string} inKey The code of the key.
   */
  ku(inKey) {

    // If we're showing the hint, just exit if they click Command.  The hint counts as given, and the game is saved.
    if (this.show_hint && inKey === gameState.kCommand) {
      sndObj.stopSounds();
      this.music = null;
      gameState.levelHintDone = true;
      this.exiting = false;
      this.initDone = false;
      writeKGAFile(true, false);
      this.exiting_delay = 0;
      this.first_time = true;
      this.currentNodeDisplayed = false;
      this.switchScreen(getSceneKeyForScreen(csWalkingAroundTheShip));
    }

    // We're still doing the interaction...
    if (this.currentNodeDisplayed && !this.exiting && !this.show_hint) {

      // Deal with the left and right buttons.  Going off either end of the five phrases comes round to the other.
      this.ciButtonPressed = 0;
      if (inKey === gameState.kLeft) {
        sndObj.playSound(`sfx_ins_arrow`);
        this.currentPlayerPhrase--;
        if (this.currentPlayerPhrase < 0) {
          this.currentPlayerPhrase = 4;
        }
      }
      if (inKey === gameState.kRight) {
        sndObj.playSound(`sfx_ins_arrow`);
        this.currentPlayerPhrase++;
        if (this.currentPlayerPhrase > 4) {
          this.currentPlayerPhrase = 0;
        }
      }

      // They hit the Action button...
      if (inKey === gameState.kAction && gameState.player_button_down) {

        const node = this.conversationMap[this.currentINode];

        // What we do depends on what phrase they selected.
        switch (this.currentPlayerPhrase) {

          // Exit interaction: the player walks away.
          case 0: {
            sndObj.stopSounds();
            this.music = null;
            this.initDone = false; // For next time
            this.switchScreen(getSceneKeyForScreen(csWalkingAroundTheShip));
            break;
          }

          // Ask for the hint.
          case 4: {
            // You'll only get the answer if the captive fully trusts you.
            if (this.captive_trust_level === this.tlTrusting) {
              this.show_hint = true;
            } else { // If the character doesn't fully trust you, you blew it!
              this.currentINode = 51;
              this.exiting_delay = 0;
              this.currentNodeDisplayed = false;
              this.exiting = true;
            }
            break;
          }

          // Any of the other phrases.
          default: {
            this.currentNodeDisplayed = false;
            // Shift the history text up appropriately, depending on whether the phrase is one or two lines, and
            // put the new text in.  (NOTE: to decide, the original looked at whether the FIRST line of the phrase
            // was empty, where for the captive's lines it looked at the second.  Every phrase in the data has two
            // lines, so it makes no difference, and it is kept as it was.)
            if (node.playerPhrases[this.currentPlayerPhrase][0] === ``) { // One line
              this.copyHistoryLine(1, 0);
              this.copyHistoryLine(2, 1);
              this.copyHistoryLine(3, 2);
              this.copyHistoryLine(4, 3);
              this.history[4].history_text = node.playerPhrases[this.currentPlayerPhrase][0];
              this.history[4].isCaptive = false;
            } else { // Two lines
              this.copyHistoryLine(2, 0);
              this.copyHistoryLine(3, 1);
              this.copyHistoryLine(4, 2);
              this.history[3].history_text = node.playerPhrases[this.currentPlayerPhrase][0];
              this.history[4].history_text = node.playerPhrases[this.currentPlayerPhrase][1];
              this.history[3].isCaptive = false;
              this.history[4].isCaptive = false;
            }
            // Adjust trust level.
            if (node.trustLevelAdjustments[this.currentPlayerPhrase] === 1) {
              this.captive_trust_level--;
            }
            if (node.trustLevelAdjustments[this.currentPlayerPhrase] === 2) {
              this.captive_trust_level++;
            }
            if (this.captive_trust_level > this.tlTrusting) { // To avoid bounds overflow
              this.captive_trust_level = this.tlTrusting;
            }
            // Next node.
            this.currentINode = node.nextNode[this.currentPlayerPhrase];
            // Start us off on the first phrase.
            this.currentPlayerPhrase = 1;
            // See if the player blew it, and end if so.
            if (this.captive_trust_level < this.tlDistrusting) {
              writeKGAFile(true, false);
              // We want to show the distrusting image, not number -1, which does not exist!
              this.captive_trust_level = this.tlDistrusting;
              this.currentINode = 51;
              this.exiting_delay = 0;
              this.currentNodeDisplayed = false;
              this.exiting = true;
            }
            break;
          }

        } // End switch

      } // End action if

    }

  } /* End ku(). */


  /**
   * The stylus touched the screen.  Touching the Previous arrow, the Next arrow or the phrase between them is the
   * same as pressing LEFT, RIGHT or ACTION.
   *
   * @param {object} inPoint Where on the screen it touched, with x and y properties.
   */
  sd(inPoint) {

    if (PtInRect(CRect(15, 270, 39, 294), inPoint)) { // Previous
      this.kd(gameState.kLeft);
      return;
    }

    if (PtInRect(CRect(198, 270, 222, 294), inPoint)) { // Next
      this.kd(gameState.kRight);
      return;
    }

    if (PtInRect(CRect(43, 264, 194, 300), inPoint)) { // Select
      this.kd(gameState.kAction);
    }

  } /* End sd(). */


  /**
   * The stylus was lifted.  If it is lifted over the thing it was pressed on, that is the same as letting go of
   * the matching key.  If it has been slid off, the press is cancelled.
   *
   * @param {object} inPoint Where on the screen it was lifted, with x and y properties.
   */
  su(inPoint) {

    // NOTE: in the original this test came last, after the one for the phrase area below, and that stopped the
    // words "COMMAND/Click To Exit" from working when tapped.  Asking for the hint leaves player_button_down set,
    // and the phrase area lies across the middle of the words, so a tap there was always taken to be a tap on a
    // phrase (which does nothing while the hint is showing) and never got as far as this test.  Only the very ends
    // of the words worked.  While the hint is showing nothing else on the panel can be used anyway, so the test is
    // now made first, at Frank's request.
    if (this.show_hint && PtInRect(CRect(15, 280, 222, 300), inPoint)) { // Exit showing hint
      this.ku(gameState.kCommand);
      return;
    }

    if (this.ciButtonPressed === 1 && PtInRect(CRect(15, 270, 39, 294), inPoint)) { // Previous
      this.ku(gameState.kLeft);
      return;
    }

    if (this.ciButtonPressed === 2 && PtInRect(CRect(198, 270, 222, 294), inPoint)) { // Next
      this.ku(gameState.kRight);
      return;
    }

    if (gameState.player_button_down && PtInRect(CRect(43, 264, 194, 300), inPoint)) { // Select
      this.ku(gameState.kAction);
      return;
    }

    this.ciButtonPressed = 0;
    gameState.player_button_down = false;

  } /* End su(). */


  /**
   * Method to initialize a character: gets a conversation with the captive of the given level ready to begin.  It
   * sets everything back to the start, chooses the level's hint, and reads the captive's conversation map from
   * their data file.
   *
   * THE DATA FILE is a string of bytes.  Most of them are simply the letters of the text.  A few have a special
   * meaning: the character ~ (byte 126) ends one line of a text and starts the next; the character ` (byte 96)
   * ends a text; and byte 255 ends the file.  The file is one node after another, and each node is:
   *
   *   what the captive says, ending with `
   *   then, three times over, for the three things the player can say back:
   *     the phrase, ending with `
   *     one byte: what it does to the captive's trust (1 lowers it, 2 raises it, 0 leaves it alone)
   *     one byte: the number of the node it leads to
   *
   * The nodes are numbered from 1 in the order they come in the file.
   *
   * Two of the bytes that turn up in the text are swapped for other characters as it is read: see
   * textForByte().
   *
   * @param {number} inLevel The level, 1 to 5.
   */
  initCharacterInteraction(inLevel) {

    // General inits.  The captive starts out distrusting; the player starts on phrase 0; the conversation starts
    // at node 1.
    this.first_time = true;
    this.ciButtonPressed = 0;
    this.currentINode = 1;
    this.captive_trust_level = this.tlDistrusting;
    this.currentPlayerPhrase = 0;
    this.currentNodeDisplayed = false;
    this.exiting = false;
    this.exiting_delay = 0;
    this.show_hint = false;

    // Clear out history.
    for (let i = 0; i < 5; i++) {
      this.history[i].history_text = ``;
      this.history[i].isCaptive = true;
    }

    // Do setups based on what level we're on: which data file, and the text of the hint.
    let dataName = ``;
    switch (inLevel) {

      // Captive for level 1: Eeger.
      case 1: {
        dataName = `eeger`;
        this.hint_text[0] = `In The Redeye Order, just`;
        this.hint_text[1] = `put the 1, 2, 3 and 4`;
        this.hint_text[2] = `tiles in the corners going`;
        this.hint_text[3] = `clockwise, and you'll win!`;
        this.hint_text[4] = `You got that?`;
        break;
      }

      // Captive for level 2: Frederick J. Smiley.
      case 2: {
        dataName = `frederick_j_smiley`;
        this.hint_text[0] = `In DeathTrap, just hop`;
        this.hint_text[1] = `back and forth between`;
        this.hint_text[2] = `the starting tile and`;
        this.hint_text[3] = `the one on the right ten`;
        this.hint_text[4] = `times. Easy! Good luck!`;
        break;
      }

      // Captive for level 3: Catrina.
      case 3: {
        dataName = `catrina`;
        this.hint_text[0] = `In Engineer, get three`;
        this.hint_text[1] = `particles moving around`;
        this.hint_text[2] = `a closed loop for 10`;
        this.hint_text[3] = `seconds and you've got`;
        this.hint_text[4] = `it beat!`;
        break;
      }

      // Captive for level 4: Brenda Bubey.
      case 4: {
        dataName = `brenda_bubey`;
        this.hint_text[0] = `In The Escape, clear the`;
        this.hint_text[1] = `first level, then on the`;
        this.hint_text[2] = `second, just push on the`;
        this.hint_text[3] = `wall where it is`;
        this.hint_text[4] = `different and you win!`;
        break;
      }

      // Captive for level 5: Sully.
      case 5: {
        dataName = `sully`;
        this.hint_text[0] = `In Son Of Eliminator,`;
        this.hint_text[1] = `raise each exactly once`;
        this.hint_text[2] = `without lowering it or`;
        this.hint_text[3] = `doing anything`;
        this.hint_text[4] = `else, and you win!`;
        break;
      }

      default: {
        break;
      }

    }

    // Load and parse interaction data.  The data files were loaded, with everything else, by PreloadScene.
    // dataPointer is how far through the data we have got.
    const data = this.cache.binary.get(dataName);
    let dataPointer = 0;
    let node = 0;

    // (The checks against data.length in these loops are not in the original.  They are there so that a data file
    // that arrived incomplete over the network cannot leave us reading for ever.)
    while (dataPointer < data.length && data[dataPointer] !== 255) {

      node++;
      const mapNode = this.conversationMap[node];

      // ********** Parse the character response.
      let whichLine = 0;
      let line = ``;
      while (dataPointer < data.length && data[dataPointer] !== 96) { // The ` character is the end of the response
        if (data[dataPointer] === 126) { // The ~ character: next line
          mapNode.captiveResponse[whichLine] = line;
          whichLine = 1;
          line = ``;
        } else {
          line = line + this.textForByte(data[dataPointer]);
        }
        dataPointer++;
      } // End character response while loop
      mapNode.captiveResponse[whichLine] = line;
      dataPointer++;

      // ********** Parse the player phrases, trust adjustments and next nodes.

      // These are the two special hard-coded phrases, which are the same at every node.
      mapNode.playerPhrases[0][0] = `See you later`;
      mapNode.playerPhrases[0][1] = `you weirdo!`;
      mapNode.trustLevelAdjustments[0] = 0;
      mapNode.nextNode[0] = 0;
      mapNode.playerPhrases[4][0] = `Please tell me`;
      mapNode.playerPhrases[4][1] = `the secret hint!`;
      mapNode.trustLevelAdjustments[4] = 0;
      mapNode.nextNode[4] = 0;

      // And these are the three from the file.
      for (let j = 1; j < 4; j++) {
        whichLine = 0;
        line = ``;
        while (dataPointer < data.length && data[dataPointer] !== 96) { // The ` character is the end of the phrase
          if (data[dataPointer] === 126) { // The ~ character: next line
            mapNode.playerPhrases[j][whichLine] = line;
            whichLine = 1;
            line = ``;
          } else {
            line = line + this.textForByte(data[dataPointer]);
          }
          dataPointer++;
        } // End player phrase while loop
        mapNode.playerPhrases[j][whichLine] = line;
        dataPointer++;
        mapNode.trustLevelAdjustments[j] = data[dataPointer]; // Get the trust level adjustment
        dataPointer++;
        mapNode.nextNode[j] = data[dataPointer]; // Get the next node
        dataPointer++;
      } // End three-iteration player phrase for loop

    } // End main data while loop

    // Our special node for when you blow it.  The player is given nothing to say.
    const lastNode = this.conversationMap[51];
    lastNode.captiveResponse[0] = `Argh!  I don't trust`;
    lastNode.captiveResponse[1] = `you!  Get away!`;
    lastNode.trustLevelAdjustments[0] = 0;
    for (let j = 0; j < 5; j++) {
      lastNode.playerPhrases[j][0] = ``;
      lastNode.playerPhrases[j][1] = ``;
      lastNode.nextNode[j] = 0;
    }

    // We're done.
    this.initDone = true;

  } /* End initCharacterInteraction(). */


  /**
   * Gives the text that one byte of a conversation file stands for.  For nearly every byte that is simply the
   * character with that number.
   *
   * NOTE: this differs from the original, at Frank's request.  The conversations were evidently written in a word
   * processor, which swapped some of what was typed for fancier characters: 9 apostrophes became the "curly"
   * apostrophe (byte 146) and 33 runs of three full stops became the single "ellipsis" character (byte 133).  The
   * game's font has neither, so nothing was drawn for them: "you're" came out as "youre", and "Uhh... yeah..." as
   * "Uhh yeah".  Here they are turned back into a plain apostrophe and three full stops, which the font does have.
   *
   * @param  {number} inByte The byte, 0 to 255.
   * @return {string}        The text it stands for.
   */
  textForByte(inByte) {

    // The curly apostrophe.
    if (inByte === 146) {
      return `'`;
    }

    // The ellipsis.
    if (inByte === 133) {
      return `...`;
    }

    return String.fromCharCode(inByte);

  } /* End textForByte(). */


} /* End class. */
