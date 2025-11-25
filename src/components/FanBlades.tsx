import React, {useEffect, useRef} from "react";

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

const FanBlades: React.FC<{
    rays?: number;
    rotationSpeed?: number;
    mirrorCurveX?: number;
    mirrorCurveY?: number;
    mirrorBarrel?: number;
    mirrorSegments?: number;
    spreadFactor?: number;
    gapX?: number;
    gapY?: number;
    phaseShift?: number;
}> = ({
          rays = 8,
          rotationSpeed = 0.5,
          mirrorCurveX = 0.25,
          mirrorCurveY = -0.1,
          mirrorBarrel = 0.12,
          mirrorSegments = 32,
          spreadFactor = 0.15,
          gapX = 40,
          gapY = 0,
          phaseShift = Math.PI / 4 // смещение по умолчанию
      }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const angleRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeObserver = new ResizeObserver(() => {
            const rect = container.getBoundingClientRect();
            setCanvasSize(canvas, rect.width, rect.height);
        });
        resizeObserver.observe(container);

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

            const cx = rect.width / 2;
            const cy = rect.height / 2;

            // первый центр (+gapX/+gapY)
            ctx.save();
            ctx.translate(cx + gapX, cy + gapY);
            ctx.rotate(angleRef.current);
            ctx.translate(-(cx + gapX), -(cy + gapY));
            drawRays(
                ctx,
                cx + gapX,
                cy + gapY,
                rays,
                Math.max(rect.width, rect.height) / 2,
                mirrorCurveX,
                mirrorCurveY,
                mirrorBarrel,
                mirrorSegments,
                spreadFactor,
                rect.width,
                rect.height,
                '#000'
            );
            ctx.restore();

            // второй центр (-gapX/-gapY) с фазовым смещением
            ctx.save();
            ctx.translate(cx - gapX, cy - gapY);
            ctx.rotate(angleRef.current + phaseShift);
            ctx.translate(-(cx - gapX), -(cy - gapY));
            drawRays(
                ctx,
                cx - gapX,
                cy - gapY,
                rays,
                Math.max(rect.width, rect.height) / 2,
                mirrorCurveX,
                mirrorCurveY,
                mirrorBarrel,
                mirrorSegments,
                spreadFactor,
                rect.width,
                rect.height,
                '#fff'
            );
            ctx.restore();

            frameId = requestAnimationFrame(render);
        };

        frameId = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
        };
    }, [rays, rotationSpeed, mirrorCurveX, mirrorCurveY, mirrorBarrel, mirrorSegments, spreadFactor, gapX, gapY, phaseShift]);

    return (
        <div ref={containerRef} style={{width: "100%", height: "100%"}}>
            <canvas ref={canvasRef} style={{display: "block", width: "100%", height: "100%"}}/>
        </div>
    );
};

export default FanBlades;
