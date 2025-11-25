import React, {useEffect, useRef, useState} from "react";

const getRandomValues = (min: number, max: number): number => {
    const range = max - min + 1;
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return min + (randomBuffer[0] % range);
};

const getSecureRandom = (min: number, max: number): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        return getRandomValues(min, max);
    } else {
        // Fallback на Math.random() если crypto API не доступен
        console.warn('Crypto API not available, using Math.random() as fallback');
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

function setCanvasSize(canvas: HTMLCanvasElement, w: number, h: number) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {ctx, dpr};
}

function distortPoint(
    x: number, y: number, w: number, h: number,
    barrel: number, curveX: number, curveY: number
) {
    const hx = w / 2;
    const hy = h / 2;
    const ux = (x - hx) / hx;
    const uy = (y - hy) / hy;
    const r2 = ux * ux + uy * uy;

    const scale = 1 + barrel * r2;
    let dx = hx + scale * (x - hx);
    let dy = hy + scale * (y - hy);

    dx += curveX * (uy * uy * uy) * hx;
    dy += curveY * (ux * ux * ux) * hy;

    return {x: dx, y: dy};
}

function drawRays(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rays: number,
    maxRadius: number,
    mirrorCurveX: number,
    mirrorCurveY: number,
    mirrorBarrel: number,
    mirrorSegments: number,
    spreadFactor: number,
    canvasW: number,
    canvasH: number,
    fillStyle: string
) {
    const angleStep = (2 * Math.PI) / rays;

    for (let i = 0; i < rays; i++) {
        const angle0 = i * angleStep;
        const angle1 = (i + 1) * angleStep;

        ctx.beginPath();
        ctx.moveTo(cx, cy);

        for (let s = 0; s <= mirrorSegments; s++) {
            const t = s / mirrorSegments;
            const r = t * maxRadius;
            const spread = r * spreadFactor;

            const x0 = cx + (r + spread) * Math.cos(angle0);
            const y0 = cy + (r + spread) * Math.sin(angle0);

            const p0 = distortPoint(x0, y0, canvasW, canvasH, mirrorBarrel, mirrorCurveX, mirrorCurveY);
            ctx.lineTo(p0.x, p0.y);
        }

        for (let s = mirrorSegments; s >= 0; s--) {
            const t = s / mirrorSegments;
            const r = t * maxRadius;
            const spread = r * spreadFactor;

            const x1 = cx + (r + spread) * Math.cos(angle1);
            const y1 = cy + (r + spread) * Math.sin(angle1);

            const p1 = distortPoint(x1, y1, canvasW, canvasH, mirrorBarrel, mirrorCurveX, mirrorCurveY);
            ctx.lineTo(p1.x, p1.y);
        }

        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? fillStyle : "rgba(0,0,0,0)";
        ctx.fill();
    }
}

function rotateAroundCenter(px: number, py: number, cx: number, cy: number, angleStep: number) {
    const dx = px - cx;
    const dy = py - cy;
    const cosA = Math.cos(angleStep);
    const sinA = Math.sin(angleStep);
    return {
        x: cx + dx * cosA - dy * sinA,
        y: cy + dx * sinA + dy * cosA
    };
}

const FanBlades: React.FC<{
    rays?: number;
    rotationSpeed?: number;
    mirrorCurveX?: number;
    mirrorCurveY?: number;
    mirrorBarrel?: number;
    mirrorSegments?: number;
    spreadFactor?: number;
    teleportLimit?: number;
    gapX?: number;
    gapY?: number;
    phaseShift?: number;
    distancingStep?: number;
}> = ({
          rays = 8,
          rotationSpeed = 0.5,
          mirrorCurveX = 0.25,
          mirrorCurveY = -0.1,
          mirrorBarrel = 0.12,
          mirrorSegments = 32,
          spreadFactor = 0.15,
          teleportLimit = 10,
          gapX = 40,
          gapY = 0,
          phaseShift = Math.PI / 4,
          distancingStep = 1.0
      }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const angleRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);

    const centersRef = useRef<{ x1: number, y1: number, x2: number, y2: number }>({x1: 0, y1: 0, x2: 0, y2: 0});
    const cursorPos = useRef<{ x: number, y: number } | null>(null);

    const [invertColors, setInvertColors] = useState<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        centersRef.current = {x1: cx + gapX, y1: cy + gapY, x2: cx - gapX, y2: cy - gapY};

        const resizeObserver = new ResizeObserver(() => {
            const rect = container.getBoundingClientRect();
            setCanvasSize(canvas, rect.width, rect.height);
        });
        resizeObserver.observe(container);

        const handleMouseMove = (e: MouseEvent) => {
            const cRect = canvas.getBoundingClientRect();
            cursorPos.current = {x: e.clientX - cRect.left, y: e.clientY - cRect.top};
        };
        canvas.addEventListener("mousemove", handleMouseMove);

        let frameId: number;
        const render = (now: number) => {
            const rect = container.getBoundingClientRect();
            const {ctx} = setCanvasSize(canvas, rect.width, rect.height);
            if (!ctx) return;

            if (lastTimeRef.current == null) lastTimeRef.current = now;
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;
            angleRef.current += rotationSpeed * dt;

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, rect.width, rect.height);

            let {x1, y1, x2, y2} = centersRef.current;
            const maxDist = Math.min(rect.width, rect.height) / 2;

            if (cursorPos.current) {
                const {x, y} = cursorPos.current;
                const dxC = x2 - x1;
                const dyC = y2 - y1;
                const distCenters = Math.sqrt(dxC * dxC + dyC * dyC);

                if (distCenters > 1e-6) {
                    // проверка "между центрами"
                    const ux = x - x1;
                    const uy = y - y1;
                    const denom = distCenters * distCenters;
                    let t = (ux * dxC + uy * dyC) / denom;
                    const isProjectionInside = t > 0 && t < 1;
                    const clx = x1 + t * dxC;
                    const cly = y1 + t * dyC;
                    const dxSeg = x - clx;
                    const dySeg = y - cly;
                    const distToSegment = Math.sqrt(dxSeg * dxSeg + dySeg * dySeg);
                    const cursorBetween = isProjectionInside && distToSegment < 20;

                    const ux12 = dxC / distCenters;
                    const uy12 = dyC / distCenters;

                    if (cursorBetween) {
                        // приоритет: сближаем, вращение останавливается
                        x1 += ux12 * distancingStep;
                        y1 += uy12 * distancingStep;
                        x2 -= ux12 * distancingStep;
                        y2 -= uy12 * distancingStep;
                    } else if (distCenters < maxDist) {
                        // раздвигаем
                        x1 -= ux12 * distancingStep;
                        y1 -= uy12 * distancingStep;
                        x2 += ux12 * distancingStep;
                        y2 += uy12 * distancingStep;
                    } else {
                        // вращаем вокруг центра экрана
                        const cx = rect.width / 2;
                        const cy = rect.height / 2;
                        const angleStep = 0.001 * distancingStep;
                        const p1 = rotateAroundCenter(x1, y1, cx, cy, angleStep);
                        const p2 = rotateAroundCenter(x2, y2, cx, cy, angleStep);
                        x1 = p1.x;
                        y1 = p1.y;
                        x2 = p2.x;
                        y2 = p2.y;
                    }
                }
            }

            // телепортация при слишком малой дистанции
            const dx = x1 - x2;
            const dy = y1 - y2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < teleportLimit) {
                const cx = getSecureRandom(0.3 * rect.width, 0.7 * rect.width);
                const cy = getSecureRandom(0.3 * rect.height, 0.7 * rect.height);

                x1 = cx + gapX
                y1 = cy + gapY
                x2 = cx - gapX
                y2 = cy - gapY

                setInvertColors((getSecureRandom(-10000, 10000) / 10000) > 0.5 ? !invertColors : invertColors);
            }

            centersRef.current = {x1, y1, x2, y2};

            // увеличенная длина лучей
            const rayLength = Math.max(rect.width, rect.height);

            // рисуем первый центр
            ctx.save();
            ctx.translate(x1, y1);
            ctx.rotate(angleRef.current);
            ctx.translate(-x1, -y1);
            drawRays(ctx, x1, y1, rays, rayLength,
                mirrorCurveX, mirrorCurveY, mirrorBarrel, mirrorSegments, spreadFactor,
                rect.width, rect.height, !invertColors ? '#000' : '#fff');
            ctx.restore();

            // рисуем второй центр
            ctx.save();
            ctx.translate(x2, y2);
            ctx.rotate(angleRef.current + phaseShift);
            ctx.translate(-x2, -y2);
            drawRays(ctx, x2, y2, rays, rayLength,
                mirrorCurveX, mirrorCurveY, mirrorBarrel, mirrorSegments, spreadFactor,
                rect.width, rect.height, invertColors ? '#000' : '#fff');
            ctx.restore();

            frameId = requestAnimationFrame(render);
        };
        frameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, [rays, rotationSpeed, mirrorCurveX, mirrorCurveY, mirrorBarrel, mirrorSegments, spreadFactor, teleportLimit, gapX, gapY, phaseShift, distancingStep, invertColors]);

    return (
        <div ref={containerRef} style={{width: "100%", height: "100%"}}>
            <canvas ref={canvasRef} style={{display: "block", width: "100%", height: "100%"}}/>
        </div>
    );
};

export default FanBlades;
