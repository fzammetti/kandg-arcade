/**
 * A bitmap font: a font where every character is a little picture, all stored side by side in one image.
 *
 * The original game drew all of its text this way (through GapiDraw's CGapiBitmapFont), using two font images:
 * font1.png, a yellow-to-orange gradient, and font1_green.png, the same lettering in green.  Using the very same
 * images here means the text looks exactly as it did on a PocketPC, which ordinary browser text never would.
 *
 * A font image is laid out like this:
 *   - The characters run left to right in a single row, in ASCII order, starting with the space character (ASCII
 *     32) and ending at ASCII 127.  That is 96 characters in all.
 *   - The characters are NOT all the same width (an "i" is much narrower than a "W").  To say where each one is,
 *     the very top row of pixels in the image (row 0) is not part of any character.  Instead it holds a series of
 *     white marker lines: there is one white line above each character, and that line is exactly as wide as the
 *     character is.  Between the white lines are gaps of transparent pixels.
 *   - Everything below row 0 is the characters themselves.
 *
 * So, to find all the characters, we only need to walk along row 0 and note where each white line starts and how
 * long it is.
 */
class BitmapFont {


  // The name of the font's image (see assets.js).
  imageName = null;

  // The height of the characters, in pixels.  This is the height of the image, less the marker row at the top.
  height = 0;

  // One entry per character, in ASCII order starting from the space character.  Each entry has an x property (where
  // the character starts in the image) and a width property (how wide it is).
  glyphs = [ ];

  // The ASCII code of the first character in the font image, which is the space character.
  static firstCharacterCode = 32;


  /**
   * Constructor.  Works out where every character is in the font image.
   *
   * @param {string} inImageName The name of the font's image, which must already have been loaded.
   */
  constructor(inImageName) {

    console.log(`BitmapFont.constructor`, inImageName);

    this.imageName = inImageName;

    const image = game.textures.get(inImageName).getSourceImage();
    this.height = image.height - 1;

    // To look at the pixels of an image, it first has to be drawn onto a canvas.  We only care about the top row,
    // so the canvas only needs to be one pixel high.
    const canvas = document.createElement(`canvas`);
    canvas.width = image.width;
    canvas.height = 1;
    const context = canvas.getContext(`2d`);
    context.drawImage(image, 0, 0);

    // Get the pixels of that row.  They come back as one long list of numbers, four per pixel: red, green, blue and
    // alpha (alpha being how solid the pixel is: 0 is completely see-through, 255 is completely solid).
    const pixels = context.getImageData(0, 0, image.width, 1).data;

    // Walk along the row.  A marker pixel is solid and a gap pixel is see-through, so we only need to look at each
    // pixel's alpha value.  Each time we step from a gap onto a marker, a new character starts; each time we step
    // off a marker (or run out of image), the character we were on ends.
    let markerStart = -1;
    for (let x = 0; x <= image.width; x++) {
      let isMarker = false;
      if (x < image.width) {
        isMarker = pixels[(x * 4) + 3] > 0;
      }
      if (isMarker && markerStart === -1) {
        markerStart = x;
      } else if (!isMarker && markerStart !== -1) {
        this.glyphs.push({ x: markerStart, width: x - markerStart });
        markerStart = -1;
      }
    }

    console.log(`BitmapFont.constructor`, inImageName, `characters found:`, this.glyphs.length);

  } /* End constructor. */


  /**
   * Finds a character in the font.
   *
   * @param  {number} inCharCode The character's code, as returned by charCodeAt().
   * @return {object}            An object with x and width properties saying where the character is in the font
   *                             image, or null if the font has no such character (in which case nothing is drawn
   *                             for it).
   */
  getGlyph(inCharCode) {

    const index = inCharCode - BitmapFont.firstCharacterCode;
    if (index < 0 || index >= this.glyphs.length) {
      return null;
    }

    return this.glyphs[index];

  } /* End getGlyph(). */


  /**
   * Measures how wide a piece of text will be when drawn in this font.  Needed to center or right-align text.
   *
   * @param  {string} inText The text to measure.
   * @return {number}        The width of the text, in pixels.
   */
  getTextWidth(inText) {

    let width = 0;
    for (let i = 0; i < inText.length; i++) {
      const glyph = this.getGlyph(inText.charCodeAt(i));
      if (glyph !== null) {
        width = width + glyph.width;
      }
    }

    return width;

  } /* End getTextWidth(). */


} /* End class. */
