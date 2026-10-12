# K&G Arcade

## A game by Frank Zammetti and Anthony Volpe.

K&G Arcade was a game I and my friend Anthony Volpe made back in 2004 for the Microsoft
PocketPC platform.  It was originally written in C/C++, but in October 2026, I decided to port it to web technologies using
Phaser, and this repo is the result of that effort.

You can actually play the game by visiting https://www.zammetti.com/kandg_arcade.

And the device image you see there was the actual device I had at the time we made the game, a Casio E-125 PocketPC.

A few notes about this port:

* The code was ported in as close to its original form as possible, which very much includes all the warts that were
definitely in the original code!  As you can imagine, though, porting from an old handheld platform to the web
absolutely did require a lot of change, but it's reasonably close, at least if you don't squint too hard!  Note,
however, that I DID fix a few bugs that would have lead to outright crashes, and very likely did nearly 25 years
ago too, so that seemed like fair game to update.

I think that's about it.  Well, that, and the fact that this was 100% ported by Claude, a complete vibe-coding.  Like,
literally, I don't think I've ever bothered to look at the code at all.  That's NOT the way I generally use AI,
but for what this project is it seems perfectly fair.  I wrote a little more about this on the page you'll see if you
actually try the game.

I don't hold this project up as anything special or any sort of achievement.  I don't expect it to get me a job
writing control software for SpaceX rockets or anything like that!  For me, this project was ultimately a bit of a
passion thing just because I have fond memories of creating this game, and it has over the years become harder and
harder to run the original.  While I DO still have a PocketPC device (that I drove several hours to get last year),
I've annoyingly been unsuccessful trying to re-compile the original source code targeting the CPU it has.  That's
because it was one of the "special" - hehe - and uncommon ones.  So at this point, the only consistent way I have to
run it is in a Windows 98 VM with Microsoft eMbedded Tools 3.0 and the PocketPC emulator it contains, which is far
from convenient.  Well, that, and as I just remembered: there's a Window version!  If you want that instead, which
will provide you an absolutely 100% faithful version,
you can <a href="https://etherient.com/products_kgarcade.htm">grab that here</a>.

The /public directory is where all the actual source for the game is, and this is what
gets served at runtime.
