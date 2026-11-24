import { Slide } from '../types';

/**
 * Draws a single slide onto a 2D Canvas context at a given motion progress (0.0 to 1.0)
 */
export function drawSlideFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slide: Slide,
  progress: number,
  width: number,
  height: number
) {
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const { crop, motion } = slide;
  const naturalWidth = img.naturalWidth || width;
  const naturalHeight = img.naturalHeight || height;

  // 1. Draw Blur Background Fill if mode is 'blur-fill'
  if (crop.fitMode === 'blur-fill') {
    ctx.save();
    ctx.filter = 'blur(28px) brightness(0.65)';
    
    // Scale image to cover canvas plus padding to hide blur edge
    const bgScale = Math.max((width / naturalWidth), (height / naturalHeight)) * 1.25;
    const bgW = naturalWidth * bgScale;
    const bgH = naturalHeight * bgScale;
    const bgX = (width - bgW) / 2;
    const bgY = (height - bgH) / 2;
    
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.restore();
  }

  // 2. Compute Ken Burns motion transforms
  const baseScale = crop.scale || 1.0;
  const baseRot = (crop.rotation || 0) * (Math.PI / 180);
  const baseX = ((crop.x || 0) / 100) * (width * 0.35);
  const baseY = ((crop.y || 0) / 100) * (height * 0.35);

  let dynamicScale = baseScale;
  let dynamicX = baseX;
  let dynamicY = baseY;

  const intensity = motion.intensity || 1.2;
  const motionDelta = (intensity - 1.0) * progress;

  switch (motion.type) {
    case 'zoom-in':
      dynamicScale = baseScale * (1.0 + motionDelta);
      break;
    case 'zoom-out':
      dynamicScale = baseScale * (intensity - motionDelta);
      break;
    case 'pan-left':
      dynamicX = baseX - progress * (width * 0.08);
      break;
    case 'pan-right':
      dynamicX = baseX + progress * (width * 0.08);
      break;
    case 'pan-up':
      dynamicY = baseY - progress * (height * 0.08);
      break;
    case 'pan-down':
      dynamicY = baseY + progress * (height * 0.08);
      break;
    case 'none':
    default:
      break;
  }

  // 3. Calculate image base dimensions according to FitMode
  let drawW: number;
  let drawH: number;

  if (crop.fitMode === 'cover') {
    const scale = Math.max(width / naturalWidth, height / naturalHeight);
    drawW = naturalWidth * scale;
    drawH = naturalHeight * scale;
  } else {
    // 'contain' or 'blur-fill' subject
    const scale = Math.min(width / naturalWidth, height / naturalHeight);
    drawW = naturalWidth * scale;
    drawH = naturalHeight * scale;
  }

  // 4. Render main image with rotation, scaling, and panning
  ctx.save();
  ctx.translate(width / 2 + dynamicX, height / 2 + dynamicY);
  ctx.rotate(baseRot);
  ctx.scale(dynamicScale, dynamicScale);

  if (crop.fitMode === 'blur-fill') {
    // Add subtle shadow to foreground image in blur-fill mode
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 24;
  }

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}
