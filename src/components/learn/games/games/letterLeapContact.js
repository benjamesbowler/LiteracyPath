import { letterLeapRegisteredPose } from './letterLeapSceneKit.js';

// The crown and lateral head contacts are measured opaque source pixels. Feet
// stay on the established route/controller baseline; art loading cannot alter
// collision shape or make an already saved route behave differently.
export function letterLeapHeadContact(world, player, height, options = {}) {
  const pose = letterLeapRegisteredPose(world, player, {
    x: player.x, y: player.y + player.h / 2, height, mirror: player.face < 0
  }, options);
  const sockets = pose.registration?.sockets;
  if (!sockets?.crown || !sockets.headLeft || !sockets.headRight) throw new Error('Missing measured Letter Leap head contacts');
  return {
    top: sockets.crown.y,
    left: Math.min(sockets.headLeft.x, sockets.headRight.x),
    right: Math.max(sockets.headLeft.x, sockets.headRight.x),
    crown: { ...sockets.crown }, action: pose.action
  };
}

export function letterLeapPlatformHasClearance(player, platform, contact, blocks) {
  const crownAtLanding = platform.y - (player.y + player.h / 2 - contact.top);
  return !blocks.some(block => !block.broken && contact.right > block.x && contact.left < block.x + block.w
    && crownAtLanding < block.y + block.h && platform.y > block.y);
}

export function letterLeapBlockContact(player, previous, block, contact, previousContact) {
  if (block.broken) return null;
  const feet = player.y + player.h / 2;
  const previousFeet = previous.y + previous.h / 2;
  const bottom = block.y + block.h;
  const overlap = contact.right > block.x && contact.left < block.x + block.w;
  if (overlap && player.vy < 0 && contact.top <= bottom && previousContact.top >= bottom - 0.5) {
    return { kind: 'head', y: player.y + bottom - contact.top + 0.5 };
  }
  const footOverlap = player.x + player.w / 2 > block.x && player.x - player.w / 2 < block.x + block.w;
  if (footOverlap && player.vy >= 0 && previousFeet <= block.y + 0.5 && feet >= block.y) {
    return { kind: 'land', y: block.y - player.h / 2 };
  }
  if (!overlap || contact.top >= bottom || feet <= block.y) return null;
  if (previousContact.right <= block.x + 0.5) return { kind: 'side', x: player.x + block.x - contact.right };
  if (previousContact.left >= block.x + block.w - 0.5) return { kind: 'side', x: player.x + block.x + block.w - contact.left };
  return null;
}
