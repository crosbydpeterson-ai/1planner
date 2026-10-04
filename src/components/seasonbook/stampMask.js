// Real perforated postage-stamp mask.
// Five mask layers are unioned (default composite): four thin edge bands whose
// radial gradients are transparent inside each notch, plus a solid center.
// Transparent gradient pixels genuinely subtract alpha, so the notches are real holes.
// "round" repetition keeps whole notches along each edge; radii stay circular.
export function getStampMaskStyle(r = 7, step = 26) {
  const hole = (pos) => `radial-gradient(circle ${r}px at ${pos}, #0000 ${r - 0.5}px, #000 ${r}px)`;
  const image = [
    hole('50% 0'),
    hole('50% 100%'),
    hole('0 50%'),
    hole('100% 50%'),
    'linear-gradient(#000, #000)',
  ].join(', ');
  const position = `0 0, 0 100%, 0 0, 100% 0, ${r}px ${r}px`;
  const size = `${step}px ${r}px, ${step}px ${r}px, ${r}px ${step}px, ${r}px ${step}px, calc(100% - ${r * 2}px) calc(100% - ${r * 2}px)`;
  const repeat = 'round no-repeat, round no-repeat, no-repeat round, no-repeat round, no-repeat';

  return {
    WebkitMaskImage: image,
    maskImage: image,
    WebkitMaskPosition: position,
    maskPosition: position,
    WebkitMaskSize: size,
    maskSize: size,
    WebkitMaskRepeat: repeat,
    maskRepeat: repeat,
  };
}