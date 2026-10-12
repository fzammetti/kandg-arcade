/**
 * A Surface is a rectangle of pixels that can be drawn on, and that can itself be drawn onto another Surface.
 *
 * The original game was written with a graphics library called GapiDraw, and it drew everything in what is called
 * "immediate mode": every frame, each screen's code said "draw this image here, fill that rectangle there, write
 * this text there", straight onto a surface called the backbuffer, which was then shown on the screen.  Whatever was
 * drawn stayed there until something was drawn over it, and several screens depend on exactly that (the title
 * sequence builds its letters up over many frames, and the mini-games only redraw the parts that change).
 *
 * Phaser normally works the opposite way: you create image objects once and Phaser redraws them all every frame.
 * Rewriting every screen to work that way would have meant redesigning each one.  So instead, this class gives the
 * ported code the same drawing calls the original had - bltFast, blt, fillRect, drawText, drawLine, drawRect,
 * setPixel and setClipper - and each screen's drawing code can be ported nearly line for line.  Underneath, a
 * Surface is just an HTML canvas.  The backbuffer is a Surface whose canvas belongs to a Phaser texture, which is
 * how what we draw ends up on the screen (see GameScene.js).
 *
 * Wherever a method takes an image, you can pass either the name of a loaded image (see assets.js) or another
 * Surface.
 */
class Surface {


  // The HTML canvas that holds this surface's pixels.
  canvas = null;

  // The canvas's 2D drawing context, which is the object that does all the actual drawing.
  context = null;

  // The size of the surface, in pixels.
  width = 0;
  height = 0;

  // True while drawing is restricted to a rectangle by setClipper().
  clipperActive = false;

  // Looking an image up by name takes a little time, and we draw hundreds of images every frame.  So the first time
  // each image is used, we remember it here, and after that we find it instantly.  This is shared by all surfaces.
  static sourceImages = { };

  // For collision detection we need to know which pixels of an image are solid and which are see-through.  Working
  // that out takes a moment, so it is done once per image, the first time it is needed, and kept here.  Each entry
  // has a width, a height, and a solid array holding one number per pixel: 1 for solid, 0 for see-through.
  static solidMasks = { };

  // A small canvas used by BltFastColorized() to make an image's shape in a single color.  It is made the first
  // time it is needed.
  static colorizeCanvas = null;


  /**
   * Constructor.
   *
   * @param {number}            inWidth  The width of the surface, in pixels.
   * @param {number}            inHeight The height of the surface, in pixels.
   * @param {HTMLCanvasElement} inCanvas An existing canvas to draw on.  Leave this out (or pass null) to have a new,
   *                                     off-screen canvas created, which is what you want for a surface that is
   *                                     only ever used as a source image.
   */
  constructor(inWidth, inHeight, inCanvas) {

    this.width = inWidth;
    this.height = inHeight;

    // Use the canvas we were given, or make one of our own.
    if (inCanvas) {
      this.canvas = inCanvas;
    } else {
      this.canvas = document.createElement(`canvas`);
      this.canvas.width = inWidth;
      this.canvas.height = inHeight;
    }
    this.context = this.canvas.getContext(`2d`);

    // When an image is drawn larger or smaller than its real size, or rotated, browsers normally smooth (blur) the
    // result.  The original did no such thing, it simply picked the nearest pixel, so we turn smoothing off to get
    // the same crisp, blocky look.
    this.context.imageSmoothingEnabled = false;

  } /* End constructor. */


  /**
   * Returns the width of the surface.
   *
   * @return {number} The width, in pixels.
   */
  GetWidth() {

    return this.width;

  } /* End GetWidth(). */


  /**
   * Returns the height of the surface.
   *
   * @return {number} The height, in pixels.
   */
  GetHeight() {

    return this.height;

  } /* End GetHeight(). */


  /**
   * Returns the width of an image.  In the original, every image was itself a surface and so you would ask the
   * image for its width; here images are referred to by name, so we ask on their behalf.
   *
   * @param  {string|Surface} inImage The name of a loaded image, or a Surface.
   * @return {number}                 The width of the image, in pixels.
   */
  static GetImageWidth(inImage) {

    return Surface.getSource(inImage).width;

  } /* End GetImageWidth(). */


  /**
   * Returns the height of an image.
   *
   * @param  {string|Surface} inImage The name of a loaded image, or a Surface.
   * @return {number}                 The height of the image, in pixels.
   */
  static GetImageHeight(inImage) {

    return Surface.getSource(inImage).height;

  } /* End GetImageHeight(). */


  /**
   * Makes a copy of an image in which every pixel of one particular color is transparent.  This is the equivalent
   * of the original's SetColorKey() call.
   *
   * Almost none of the game needs this, because nearly every image used the same pink color key, and those were
   * all given real transparency ahead of time by img/convert_images.js.  The exception is the title sequence, whose
   * images use black as their color key instead.
   *
   * As in the original, colors are compared the way the PocketPC's 16-bit screen stored them (5 bits of red, 6 of
   * green, 5 of blue), so colors that are a hair's breadth away from the key color count as the key color too.
   *
   * @param  {string|Surface} inImage The image to copy: an image name or a Surface.
   * @param  {number}         inRed   The red component of the color to make transparent, 0 to 255.
   * @param  {number}         inGreen The green component of the color to make transparent, 0 to 255.
   * @param  {number}         inBlue  The blue component of the color to make transparent, 0 to 255.
   * @return {Surface}                A new off-screen Surface holding the copy.
   */
  static CreateColorKeyed(inImage, inRed, inGreen, inBlue) {

    // Make a surface the same size as the image and draw the image onto it.
    const source = Surface.getSource(inImage);
    const surface = new Surface(source.width, source.height);
    surface.context.drawImage(source, 0, 0);

    // Reduce the key color to 16 bits.  Shifting right throws away the low bits, which is how an 8-bit value is
    // reduced to 5 bits (shift by 3) or to 6 bits (shift by 2).
    const keyRed = inRed >> 3;
    const keyGreen = inGreen >> 2;
    const keyBlue = inBlue >> 3;

    // Get at the surface's pixels.  They come as one long list of numbers, four per pixel: red, green, blue and
    // alpha (alpha being how solid the pixel is: 0 is completely see-through, 255 is completely solid).
    const imageData = surface.context.getImageData(0, 0, surface.width, surface.height);
    const pixels = imageData.data;

    // Look at every pixel, and make the ones that match the key color completely see-through.
    for (let i = 0; i < pixels.length; i = i + 4) {
      if ((pixels[i] >> 3) === keyRed && (pixels[i + 1] >> 2) === keyGreen && (pixels[i + 2] >> 3) === keyBlue) {
        pixels[i + 3] = 0;
      }
    }

    // Put the changed pixels back.
    surface.context.putImageData(imageData, 0, 0);

    return surface;

  } /* End CreateColorKeyed(). */


  /**
   * Turns an image name or a Surface into the object the canvas can actually draw from.
   *
   * @param  {string|Surface} inImage The name of a loaded image, or a Surface.
   * @return {CanvasImageSource}      The underlying HTML image or canvas.
   */
  static getSource(inImage) {

    // A Surface carries its own canvas.
    if (typeof inImage !== `string`) {
      return inImage.canvas;
    }

    // An image name.  If we have used this image before, we already know where it is.
    const remembered = Surface.sourceImages[inImage];
    if (remembered !== undefined) {
      return remembered;
    }

    // First use: ask Phaser for the image that was loaded under this name, and remember it for next time.
    const source = game.textures.get(inImage).getSourceImage();
    Surface.sourceImages[inImage] = source;
    return source;

  } /* End getSource(). */


  /**
   * Works out which pixels of an image are solid, for use by Intersect().
   *
   * @param  {string|Surface} inImage The name of a loaded image, or a Surface.
   * @return {object}                 An object with width and height properties, and a solid property that is an
   *                                  array with one number for every pixel, row by row: 1 if the pixel is solid, 0
   *                                  if it is see-through.
   */
  static getSolidMask(inImage) {

    // If this is a named image that we have already worked out, use the answer we kept.
    const isNamedImage = typeof inImage === `string`;
    if (isNamedImage && Surface.solidMasks[inImage] !== undefined) {
      return Surface.solidMasks[inImage];
    }

    // To look at the pixels of an image it first has to be drawn onto a canvas.
    const source = Surface.getSource(inImage);
    const canvas = document.createElement(`canvas`);
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext(`2d`);
    context.drawImage(source, 0, 0);

    // The pixels come as one long list of numbers, four per pixel: red, green, blue and alpha.  A pixel is solid if
    // its alpha is anything other than 0.  (The pixels that had the original's pink color key are the see-through
    // ones.)
    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    const solid = new Uint8Array(source.width * source.height);
    for (let i = 0; i < solid.length; i++) {
      if (pixels[(i * 4) + 3] !== 0) {
        solid[i] = 1;
      }
    }

    const mask = { width: source.width, height: source.height, solid: solid };
    if (isNamedImage) {
      Surface.solidMasks[inImage] = mask;
    }

    return mask;

  } /* End getSolidMask(). */


  /**
   * Pixel-perfect collision detection.  Given two images and where each one is on the screen, this says whether
   * any SOLID pixel of the first lies on top of a solid pixel of the second.  See-through pixels do not count, so
   * two sprites whose rectangles overlap, but whose actual shapes do not touch, have not collided.
   *
   * The mini-games use this for almost all of their collisions (a missile hitting an asteroid, for example).  The
   * original called GapiDraw's CGapiSurface::Intersect(), and this takes the same arguments in the same order.
   *
   * NOTE: the original gave back the point at which the collision was found, and the games use that point (to
   * center an explosion on it, say).  GapiDraw's documentation was not available to confirm WHICH of the touching
   * pixels it reported when there were several.  This looks through the overlapping area a row at a time from the
   * top, and along each row from the left, and reports the first one it comes to.
   *
   * @param  {number}         inX1     The X coordinate of the first image on the screen.
   * @param  {number}         inY1     The Y coordinate of the first image on the screen.
   * @param  {string|Surface} inImage1 The first image: an image name or a Surface.
   * @param  {object}         inRect1  The part of the first image that is in play, as made by CRect(), or null for
   *                                   all of it.
   * @param  {number}         inX2     The X coordinate of the second image on the screen.
   * @param  {number}         inY2     The Y coordinate of the second image on the screen.
   * @param  {string|Surface} inImage2 The second image: an image name or a Surface.
   * @param  {object}         inRect2  The part of the second image that is in play, as made by CRect(), or null
   *                                   for all of it.
   * @return {object}                  A point, with x and y properties, in screen coordinates: where the collision
   *                                   was found, or x = -1 and y = -1 if the images have not collided.
   */
  static Intersect(inX1, inY1, inImage1, inRect1, inX2, inY2, inImage2, inRect2) {

    const mask1 = Surface.getSolidMask(inImage1);
    const mask2 = Surface.getSolidMask(inImage2);

    // Work out which part of each image is in play.
    let source1 = CRect(0, 0, mask1.width, mask1.height);
    if (inRect1) {
      source1 = inRect1;
    }
    let source2 = CRect(0, 0, mask2.width, mask2.height);
    if (inRect2) {
      source2 = inRect2;
    }

    // Work out the rectangle of the screen where the two overlap.  If its left edge is not to the left of its right
    // edge, or its top is not above its bottom, then they do not overlap at all and cannot have collided.
    const left = Math.max(inX1, inX2);
    const top = Math.max(inY1, inY2);
    const right = Math.min(inX1 + (source1.right - source1.left), inX2 + (source2.right - source2.left));
    const bottom = Math.min(inY1 + (source1.bottom - source1.top), inY2 + (source2.bottom - source2.top));
    if (left >= right || top >= bottom) {
      return { x: -1, y: -1 };
    }

    // Look at every pixel of the overlap.  For each, find the matching pixel in each image and see if both are
    // solid.
    for (let y = top; y < bottom; y++) {
      const row1 = ((y - inY1) + source1.top) * mask1.width;
      const row2 = ((y - inY2) + source2.top) * mask2.width;
      for (let x = left; x < right; x++) {
        const solid1 = mask1.solid[row1 + (x - inX1) + source1.left];
        const solid2 = mask2.solid[row2 + (x - inX2) + source2.left];
        if (solid1 === 1 && solid2 === 1) {
          return { x: x, y: y };
        }
      }
    }

    return { x: -1, y: -1 };

  } /* End Intersect(). */


  /**
   * Draws an image at a location, at its natural size.  This is by far the most used drawing call.
   *
   * Note that the original took a flag saying whether the image's pink "color key" should be see-through.  That is
   * not needed here because the images now have real transparency built in, so it always applies.
   *
   * @param {number}         inX          The X coordinate to draw the left edge of the image at.
   * @param {number}         inY          The Y coordinate to draw the top edge of the image at.
   * @param {string|Surface} inImage      The image to draw: an image name or a Surface.
   * @param {object}         inSourceRect The part of the image to draw, as made by CRect(), or null to draw all of
   *                                      it.
   * @param {number}         inOpacity    How solid to draw the image, from 0 (invisible) to 255 (fully solid).
   *                                      Leave this out to draw fully solid.
   */
  BltFast(inX, inY, inImage, inSourceRect, inOpacity) {

    const source = Surface.getSource(inImage);
    const context = this.context;

    // Apply the opacity, if one was given.  The canvas wants a value from 0 to 1 rather than 0 to 255.
    if (inOpacity !== undefined) {
      context.globalAlpha = inOpacity / 255;
    }

    if (inSourceRect) {
      // Just a part of the image.
      const sourceWidth = inSourceRect.right - inSourceRect.left;
      const sourceHeight = inSourceRect.bottom - inSourceRect.top;
      context.drawImage(
        source, inSourceRect.left, inSourceRect.top, sourceWidth, sourceHeight, inX, inY, sourceWidth, sourceHeight
      );
    } else {
      // The whole image.
      context.drawImage(source, inX, inY);
    }

    // Put the opacity back to fully solid so that it does not affect whatever is drawn next.
    if (inOpacity !== undefined) {
      context.globalAlpha = 1;
    }

  } /* End BltFast(). */


  /**
   * Draws an image at a location, at its natural size, but in a single solid color: every pixel of the image that
   * is not see-through is drawn in that color, so what appears is the image's shape, filled in.  This is the port
   * of calling the original's BltFast() with its GDBLTFASTFX_COLORIZE effect, which the game uses to make things
   * flash or pulse.
   *
   * NOTE: the documentation for the original's graphics library was not to hand, so exactly what its "colorize"
   * did is an assumption: that it replaced the image's pixels with the color (rather than tinting them).
   *
   * @param {number} inX     The X coordinate to draw the left edge of the image at.
   * @param {number} inY     The Y coordinate to draw the top edge of the image at.
   * @param {string} inImage The name of the image to draw.
   * @param {string} inColor The color to draw it in, in #RRGGBB form.
   */
  BltFastColorized(inX, inY, inImage, inColor) {

    const source = Surface.getSource(inImage);

    // The shape is made on a small canvas of its own, kept for the purpose.  Make that canvas the first time it is
    // needed, and whenever it is the wrong size for the image.
    if (
      Surface.colorizeCanvas === null || Surface.colorizeCanvas.width !== source.width ||
      Surface.colorizeCanvas.height !== source.height
    ) {
      Surface.colorizeCanvas = document.createElement(`canvas`);
      Surface.colorizeCanvas.width = source.width;
      Surface.colorizeCanvas.height = source.height;
    }
    const shape = Surface.colorizeCanvas.getContext(`2d`);

    // Draw the image on it.  Then fill the whole canvas with the color, using a drawing mode ("source-in") in
    // which the new color only lands where something has been drawn already.  That leaves the image's shape in
    // the color, with everything around it still see-through.
    shape.globalCompositeOperation = `source-over`;
    shape.clearRect(0, 0, source.width, source.height);
    shape.drawImage(source, 0, 0);
    shape.globalCompositeOperation = `source-in`;
    shape.fillStyle = inColor;
    shape.fillRect(0, 0, source.width, source.height);

    // And draw the shape on this surface.
    this.context.drawImage(Surface.colorizeCanvas, inX, inY);

  } /* End BltFastColorized(). */


  /**
   * Draws an image into a rectangle, stretching or shrinking it to fit, and optionally rotating or mirroring it.
   *
   * @param {object}         inDestRect   The rectangle to draw the image into, as made by CRect(), or null to fill
   *                                      the whole surface.
   * @param {string|Surface} inImage      The image to draw: an image name or a Surface.
   * @param {object}         inSourceRect The part of the image to draw, as made by CRect(), or null to draw all of
   *                                      it.
   * @param {object}         inEffects    Optional special effects.  Leave this out for none.  It may have any of
   *                                      these properties:
   *                                        nRotationAngle: how far to rotate the image clockwise about the center
   *                                          of the rectangle, in hundredths of a degree (so 9000 is a quarter
   *                                          turn), as in the original.
   *                                        mirrorLeftRight: true to flip the image left-to-right.
   *                                        mirrorUpDown: true to flip the image top-to-bottom.
   *                                        dwOpacity: 0 (invisible) to 255 (fully solid).
   *                                        dwRotationScale: the size to draw the image at, as a percentage of the
   *                                          size of the rectangle (100 is full size, 50 is half), as in the
   *                                          original.  The image shrinks or grows about the center of the
   *                                          rectangle.  At 0 nothing is drawn.
   *
   * NOTE: the documentation for the original's graphics library was not to hand, so that dwRotationScale is a
   * percentage, and that the scaling is done about the center of the rectangle (as its rotation is), are
   * assumptions.  The one place the game uses it counts the value down from 100 to 0, which fits.
   */
  Blt(inDestRect, inImage, inSourceRect, inEffects) {

    const source = Surface.getSource(inImage);
    const context = this.context;

    // Work out where we are drawing to.
    let destLeft = 0;
    let destTop = 0;
    let destWidth = this.width;
    let destHeight = this.height;
    if (inDestRect) {
      destLeft = inDestRect.left;
      destTop = inDestRect.top;
      destWidth = inDestRect.right - inDestRect.left;
      destHeight = inDestRect.bottom - inDestRect.top;
    }

    // Work out which part of the image we are drawing from.
    let sourceLeft = 0;
    let sourceTop = 0;
    let sourceWidth = source.width;
    let sourceHeight = source.height;
    if (inSourceRect) {
      sourceLeft = inSourceRect.left;
      sourceTop = inSourceRect.top;
      sourceWidth = inSourceRect.right - inSourceRect.left;
      sourceHeight = inSourceRect.bottom - inSourceRect.top;
    }

    // The simple case: no special effects, just draw the image stretched into the rectangle.
    if (!inEffects) {
      context.drawImage(
        source, sourceLeft, sourceTop, sourceWidth, sourceHeight, destLeft, destTop, destWidth, destHeight
      );
      return;
    }

    // Special effects.  Rotating and mirroring are done by temporarily changing the canvas's coordinate system:
    // we move the origin (the 0,0 point) to the center of the destination rectangle, rotate and/or flip the whole
    // coordinate system about that point, and then draw the image centered on the origin.  The save() and
    // restore() calls put the coordinate system back exactly how it was afterwards.
    context.save();
    context.translate(destLeft + (destWidth / 2), destTop + (destHeight / 2));
    if (inEffects.nRotationAngle) {
      // Hundredths of a degree to radians, which is what the canvas wants.
      context.rotate((inEffects.nRotationAngle / 100) * (Math.PI / 180));
    }
    let scaleX = 1;
    let scaleY = 1;
    if (inEffects.mirrorLeftRight) {
      scaleX = -1;
    }
    if (inEffects.mirrorUpDown) {
      scaleY = -1;
    }
    if (inEffects.dwRotationScale !== undefined) {
      // Scaled down to nothing, there is nothing to draw.  (Put the coordinate system back before leaving.)
      if (inEffects.dwRotationScale <= 0) {
        context.restore();
        return;
      }
      scaleX = scaleX * (inEffects.dwRotationScale / 100);
      scaleY = scaleY * (inEffects.dwRotationScale / 100);
    }
    context.scale(scaleX, scaleY);
    if (inEffects.dwOpacity !== undefined) {
      context.globalAlpha = inEffects.dwOpacity / 255;
    }
    context.drawImage(
      source, sourceLeft, sourceTop, sourceWidth, sourceHeight,
      -(destWidth / 2), -(destHeight / 2), destWidth, destHeight
    );
    context.restore();

  } /* End Blt(). */


  /**
   * Fills a rectangle with a solid color.
   *
   * @param {object} inRect    The rectangle to fill, as made by CRect(), or null to fill the whole surface.
   * @param {string} inColor   The color, in #RRGGBB form (see the RGB() function in main.js).
   * @param {number} inOpacity How solid to make the color, from 0 (invisible) to 255 (fully solid).  Leave this out
   *                           to fill fully solid.
   */
  FillRect(inRect, inColor, inOpacity) {

    const context = this.context;

    if (inOpacity !== undefined) {
      context.globalAlpha = inOpacity / 255;
    }

    context.fillStyle = inColor;
    if (inRect) {
      context.fillRect(inRect.left, inRect.top, inRect.right - inRect.left, inRect.bottom - inRect.top);
    } else {
      context.fillRect(0, 0, this.width, this.height);
    }

    if (inOpacity !== undefined) {
      context.globalAlpha = 1;
    }

  } /* End FillRect(). */


  /**
   * Wipes the whole surface, leaving it completely see-through (rather than filled with a color, which is what
   * FillRect() does).  The original had no call like this, because nothing was ever shown behind its backbuffer.
   * Here it is used while a cut scene is playing, when OASIS's pictures are shown behind the backbuffer and must be
   * seen through it.  See CutScene.js.
   */
  ClearToTransparent() {

    this.context.clearRect(0, 0, this.width, this.height);

  } /* End ClearToTransparent(). */


  /**
   * Draws the outline of a rectangle, one pixel thick.
   *
   * @param {object} inRect    The rectangle to outline, as made by CRect().
   * @param {string} inColor   The color, in #RRGGBB form.
   * @param {number} inOpacity How solid to draw the outline, from 0 (invisible) to 255 (fully solid).  Leave this
   *                           out to draw fully solid.
   */
  DrawRect(inRect, inColor, inOpacity) {

    const context = this.context;
    const width = inRect.right - inRect.left;
    const height = inRect.bottom - inRect.top;

    if (inOpacity !== undefined) {
      context.globalAlpha = inOpacity / 255;
    }

    // An outline is just four thin filled rectangles: top, bottom, left and right.  Drawing it this way (rather than
    // with the canvas's own outline function) gives sharp one-pixel edges with no blurring.  The left and right
    // sides are fitted BETWEEN the top and bottom ones rather than overlapping them, so that no pixel is drawn
    // twice.  That matters when the outline is partly see-through: a pixel drawn twice would come out more solid
    // than its neighbors, leaving a bright dot at each corner.
    context.fillStyle = inColor;
    context.fillRect(inRect.left, inRect.top, width, 1);
    context.fillRect(inRect.left, inRect.bottom - 1, width, 1);
    context.fillRect(inRect.left, inRect.top + 1, 1, height - 2);
    context.fillRect(inRect.right - 1, inRect.top + 1, 1, height - 2);

    if (inOpacity !== undefined) {
      context.globalAlpha = 1;
    }

  } /* End DrawRect(). */


  /**
   * Sets a single pixel to a color.
   *
   * @param {number} inX     The X coordinate of the pixel.
   * @param {number} inY     The Y coordinate of the pixel.
   * @param {string} inColor The color, in #RRGGBB form.
   */
  SetPixel(inX, inY, inColor) {

    this.context.fillStyle = inColor;
    this.context.fillRect(inX, inY, 1, 1);

  } /* End SetPixel(). */


  /**
   * Draws a straight line, one pixel thick, from one point to another (both end points are drawn).
   *
   * The canvas can draw lines by itself, but it smooths their edges, which makes them look soft and slightly
   * see-through.  The original drew hard-edged lines where every pixel was either fully drawn or not drawn at all.
   * To match that, we work out which pixels the line passes through ourselves, using a classic method known as
   * Bresenham's line algorithm, and set them one at a time.
   *
   * @param {number} inX1      The X coordinate of the start of the line.
   * @param {number} inY1      The Y coordinate of the start of the line.
   * @param {number} inX2      The X coordinate of the end of the line.
   * @param {number} inY2      The Y coordinate of the end of the line.
   * @param {string} inColor   The color, in #RRGGBB form.
   * @param {number} inOpacity How solid to draw the line, from 0 (invisible) to 255 (fully solid).  Leave this out
   *                           to draw fully solid.
   */
  DrawLine(inX1, inY1, inX2, inY2, inColor, inOpacity) {

    const context = this.context;

    if (inOpacity !== undefined) {
      context.globalAlpha = inOpacity / 255;
    }
    context.fillStyle = inColor;

    // Pixels only exist at whole-number positions.
    let x = Math.round(inX1);
    let y = Math.round(inY1);
    const endX = Math.round(inX2);
    const endY = Math.round(inY2);

    // How far the line travels in each direction, and which way (+1 or -1) it steps along each axis.
    const distanceX = Math.abs(endX - x);
    const distanceY = Math.abs(endY - y);
    let stepX = 1;
    if (x > endX) {
      stepX = -1;
    }
    let stepY = 1;
    if (y > endY) {
      stepY = -1;
    }

    // Bresenham's trick: keep a running "error" that tracks how far the pixels drawn so far have drifted away from
    // the true line.  Each time around, the error tells us whether to step horizontally, vertically, or both.
    let error = distanceX - distanceY;
    let finished = false;
    while (!finished) {
      context.fillRect(x, y, 1, 1);
      if (x === endX && y === endY) {
        finished = true;
      } else {
        const doubleError = error * 2;
        if (doubleError > -distanceY) {
          error = error - distanceY;
          x = x + stepX;
        }
        if (doubleError < distanceX) {
          error = error + distanceX;
          y = y + stepY;
        }
      }
    }

    if (inOpacity !== undefined) {
      context.globalAlpha = 1;
    }

  } /* End DrawLine(). */


  /**
   * Draws a line of text using one of the game's bitmap fonts.
   *
   * @param {number}     inX       The X coordinate.  What it means depends on inAlign: the left edge of the text
   *                               for GDDRAWTEXT_LEFT, the middle for GDDRAWTEXT_CENTER, the right edge for
   *                               GDDRAWTEXT_RIGHT.
   * @param {number}     inY       The Y coordinate of the top of the text.
   * @param {string}     inText    The text to draw.
   * @param {BitmapFont} inFont    The font to draw it in (font1 or font1_green).
   * @param {number}     inAlign   One of GDDRAWTEXT_LEFT, GDDRAWTEXT_CENTER or GDDRAWTEXT_RIGHT.
   * @param {number}     inOpacity How solid to draw the text, from 0 (invisible) to 255 (fully solid).  Leave this
   *                               out to draw fully solid.
   */
  DrawText(inX, inY, inText, inFont, inAlign, inOpacity) {

    // Work out where the left edge of the text goes.
    let x = inX;
    if (inAlign === GDDRAWTEXT_CENTER) {
      x = inX - Math.floor(inFont.getTextWidth(inText) / 2);
    } else if (inAlign === GDDRAWTEXT_RIGHT) {
      x = inX - inFont.getTextWidth(inText);
    }

    // Apply the opacity, if one was given.  The canvas wants a value from 0 to 1 rather than 0 to 255.
    if (inOpacity !== undefined) {
      this.context.globalAlpha = inOpacity / 255;
    }

    // Draw the characters one after another, moving along by the width of each.
    const source = Surface.getSource(inFont.imageName);
    for (let i = 0; i < inText.length; i++) {
      const glyph = inFont.getGlyph(inText.charCodeAt(i));
      if (glyph !== null) {
        // Row 0 of a font image holds the markers that say where each character is, so the character itself starts
        // on row 1.
        this.context.drawImage(source, glyph.x, 1, glyph.width, inFont.height, x, inY, glyph.width, inFont.height);
        x = x + glyph.width;
      }
    }

    // Put the opacity back to fully solid so that it does not affect whatever is drawn next.
    if (inOpacity !== undefined) {
      this.context.globalAlpha = 1;
    }

  } /* End DrawText(). */


  /**
   * Restricts all drawing to a rectangle, or removes the restriction.  While a clipper is set, anything drawn
   * outside the rectangle simply does not appear.  The mini-games use this to stop sprites that are half-way off
   * the edge of the play area from being drawn over the frame around it.
   *
   * @param {object} inRect The rectangle to restrict drawing to, as made by CRect(), or null to allow drawing
   *                        anywhere again.
   */
  SetClipper(inRect) {

    const context = this.context;

    // The canvas can only ever shrink its clipping area, never grow it, unless we restore a saved state.  So,
    // whenever a clipper is already active, the first thing to do is go back to the unrestricted state we saved
    // when it was set.
    if (this.clipperActive) {
      context.restore();
      this.clipperActive = false;
    }

    if (inRect) {
      // Save the unrestricted state, then restrict drawing to the rectangle.
      context.save();
      context.beginPath();
      context.rect(inRect.left, inRect.top, inRect.right - inRect.left, inRect.bottom - inRect.top);
      context.clip();
      this.clipperActive = true;
    }

  } /* End SetClipper(). */


} /* End class. */
