import React, {useEffect, useRef, useState} from "react";

function setCanvasSize(canvas: HTMLCanvasElement, w: number, h: number) {
    const dpr = 1 // Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {ctx, dpr};
}

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

function distortPoint(
    x: number, y: number, w: number, h: number,
    barrel: number, curveX: number, curveY: number
) {
    const hx = w / 2;
    const hy = h / 2;
    const ux = x / hx;  // нормализовано к [-1,1]
    const uy = y / hy;
    const r2 = ux * ux + uy * uy;

    const scale = 1 + barrel * r2;
    let dx = scale * x;
    let dy = scale * y;

    dx += curveX * (uy * uy * uy) * hx;
    dy += curveY * (ux * ux * ux) * hy;

    return {x: dx, y: dy};
}

function drawDiamondFunhouse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    angleRad: number,
    fill: string,
    mirrorCurveX: number,
    mirrorCurveY: number,
    mirrorBarrel: number,
    segments: number
) {
    const seg = Math.max(4, segments | 0);

    // diamond vertices in local coords
    const top = {x: 0, y: -h / 2};
    const right = {x: w / 2, y: 0};
    const bottom = {x: 0, y: h / 2};
    const left = {x: -w / 2, y: 0};
    const corners = [top, right, bottom, left, top];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    ctx.beginPath();
    for (let e = 0; e < 4; e++) {
        const a = corners[e];
        const b = corners[e + 1];

        for (let s = 0; s <= seg; s++) {
            const t = s / seg;
            const x = a.x + (b.x - a.x) * t;
            const y = a.y + (b.y - a.y) * t;

            const p = distortPoint(x, y, w, h, mirrorBarrel, mirrorCurveX, mirrorCurveY);
            if (e === 0 && s === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
    }

    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
}

type DiamondsOnRaysProps = {
    printIndex?: boolean;
    rays?: number;
    diamondsPerRay?: number; // если 0 — рассчитывается автоматически
    startRadius?: number;
    spacing?: number;
    diamondWidth?: number;
    diamondHeight?: number;
    rotation?: "radial" | number;
    color?: string;
    background?: string;
    rotationSpeed?: number;
    spaghettiFactorWidth?: number;
    spaghettiFactorHeight?: number;
    spaghettiFactorSpacing?: number;
    maxStretch?: number;
    minWidth?: number;
    decayMode?: "linear" | "quadratic" | "exponential";
    inwardSpeed?: number;
    mirrorCurveX?: number;
    mirrorCurveY?: number;
    mirrorBarrel?: number;
    mirrorSegments?: number;
    gapX?: number;
    gapY?: number;
    splitAngle?: number; // радианы
};

const DiamondsOnRaysCanvas: React.FC<DiamondsOnRaysProps> = (
    {
        printIndex = false,
        rays = 8,
        diamondsPerRay = 0,
        startRadius = 0,
        spacing = 20,
        diamondWidth = 20,
        diamondHeight = 28,
        rotation = "radial",
        color = "#2e7af7",
        background = "#fff",
        rotationSpeed = 0.5,
        spaghettiFactorWidth = 2.0,
        spaghettiFactorHeight = 3.0,
        spaghettiFactorSpacing = 1.5,
        maxStretch = 120,
        minWidth = 2,
        decayMode = "quadratic",
        inwardSpeed = 10,
        mirrorCurveX = 0.25,
        mirrorCurveY = -0.1,
        mirrorBarrel = 0.12,
        mirrorSegments = 16,
        gapX = 15,
        gapY = 0,
        splitAngle = Math.PI / 6
    }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const angleRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);
    const inwardOffsetRef = useRef(0);

    // состояние интерактивного второго центра (чёрной дыры справа)
    const [holeCenter, setHoleCenter] = useState<{ x: number, y: number } | null>(null);
    const [invertColors, setInvertColors] = useState<boolean>(false);

    // инициализируем второй центр и вешаем обработчик клика
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        if (!holeCenter) {
            setHoleCenter({x: cx + gapX, y: cy + gapY});
        }

        const handleClick = (e: MouseEvent) => {
            if (!holeCenter) return;
            const cRect = canvas.getBoundingClientRect();
            const clickX = e.clientX - cRect.left;
            const clickY = e.clientY - cRect.top;

            const dx = clickX - holeCenter.x;
            const dy = clickY - holeCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= 10) {
                // случайное смещение в пределах ±20% от размеров блока (от центра)
                const maxShiftX = rect.width * 0.2;
                const maxShiftY = rect.height * 0.2;
                const newX = cx + (getSecureRandom(-10000, 10000) / 10000) * maxShiftX;
                const newY = cy + (getSecureRandom(-10000, 10000) / 10000) * maxShiftY;

                setInvertColors((getSecureRandom(-10000, 10000) / 10000) > 0.5 ? !invertColors : invertColors);

                setHoleCenter({x: newX, y: newY});
            }
        };

        canvas.addEventListener("click", handleClick);
        return () => {
            canvas.removeEventListener("click", handleClick);
        };
    }, [holeCenter, gapX, gapY, containerRef]);

    useEffect(() => {
        let frameId: number;

        const render = (now: number) => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container || !holeCenter) return;

            const rect = container.getBoundingClientRect();
            const {ctx} = setCanvasSize(canvas, rect.width, rect.height);
            if (!ctx) return;

            ctx.fillStyle = invertColors ? color : background;
            ctx.fillRect(0, 0, rect.width, rect.height);

            const cx = holeCenter.x;
            const cy = holeCenter.y;

            // если второй центр ещё не инициализирован — делаем это
            const c2 = holeCenter ?? {x: cx + gapX, y: cy + gapY};

            if (lastTimeRef.current == null) lastTimeRef.current = now;
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;

            angleRef.current += rotationSpeed * dt;
            inwardOffsetRef.current += inwardSpeed * dt;

            const maxR = Math.max(cx, cy);
            const clampR = (r: number) => Math.max(0, Math.min(maxR, r));

            const decay = (radius: number) => {
                let t = 1 - Math.min(1, radius / Math.max(1, maxR));
                if (decayMode === "quadratic") t = t * t;
                else if (decayMode === "exponential") {
                    const e = Math.E;
                    t = (Math.exp(t) - 1) / (e - 1);
                }
                return t;
            };

            const widthAt = (radius: number) => {
                const t = decay(clampR(radius));
                const widthScale = Math.pow(1 / Math.max(1, spaghettiFactorWidth), t);
                return Math.max(minWidth, diamondWidth * widthScale);
            };

            const heightAt = (radius: number) => {
                const t = decay(clampR(radius));
                const heightScale = Math.pow(Math.max(1, spaghettiFactorHeight), t);
                return Math.min(maxStretch, diamondHeight * heightScale);
            };

            const spacingScaleAt = (radius: number) => {
                const t = decay(clampR(radius));
                return Math.pow(Math.max(1, spaghettiFactorSpacing), t);
            };

            const centerStep = (radius: number) => {
                const hPrev = heightAt(radius);
                const scalePrev = spacingScaleAt(radius);
                const approxNextRadius = radius + spacing * scalePrev;
                const hNext = heightAt(approxNextRadius);
                return hPrev / 2 + spacing * scalePrev + hNext / 2;
            };

            const curveOffset = (radius: number) => {
                const k = rotationSpeed / 250; // коэффициент кривизны
                return k * radius * radius; // параболическое смещение
            };

            const splitDirX = Math.cos(splitAngle);
            const splitDirY = Math.sin(splitAngle);

            for (let r = 0; r < rays; r++) {
                const baseAngle = (r / rays) * Math.PI * 2 + angleRef.current;
                const head = startRadius - inwardOffsetRef.current;

                const centers: number[] = [];
                let rad = head;

                if (diamondsPerRay > 0) {
                    for (let i = 0; i < diamondsPerRay + 1; i++) {
                        centers.push(rad);
                        rad += centerStep(rad);
                    }
                } else {
                    // динамическое покрытие блока (чуть сверх maxR, чтобы края закрывались)
                    while (rad <= (maxR * 1.5)) {
                        centers.push(rad);
                        rad += centerStep(rad);
                    }
                }

                while (centers.length && centers[0] < 0) {
                    centers.shift();
                    const last = centers.length ? centers[centers.length - 1] : head;
                    centers.push(last + centerStep(last));
                }

                const view = diamondsPerRay > 0 ? centers.slice(0, diamondsPerRay) : centers.slice(0);

                for (let i = 0; i < view.length; i++) {
                    const radius = view[i];
                    const w = widthAt(radius);
                    const h = heightAt(radius);

                    const localAngle = baseAngle;
                    const dirX = Math.cos(localAngle);
                    const dirY = Math.sin(localAngle);

                    const offset = curveOffset(radius);
                    // предварительная позиция от центральной линии, чтобы определить сторону
                    const prelimX = cx + dirX * radius + (-dirY) * offset;
                    const prelimY = cy + dirY * radius + (dirX) * offset;

                    const relX = prelimX - cx;
                    const relY = prelimY - cy;
                    const side = relX * splitDirY - relY * splitDirX;

                    // выбор центра втягивания:
                    // слева от линии — левый центр, справа — интерактивный центр2
                    const useCx = side >= 0 ? cx - gapX : c2.x;
                    const useCy = side >= 0 ? cy - gapY : c2.y;

                    // финальная позиция с выбранным центром
                    const px = useCx + dirX * radius + (-dirY) * offset;
                    const py = useCy + dirY * radius + (dirX) * offset;

                    let angleRad = 0;
                    if (rotation === "radial") angleRad = localAngle + Math.PI / 2;
                    else if (typeof rotation === "number")
                        angleRad = (rotation * Math.PI) / 180 + Math.PI / 2;

                    drawDiamondFunhouse(
                        ctx, px, py, w, h, angleRad, invertColors ? background : color,
                        mirrorCurveX, mirrorCurveY, mirrorBarrel, mirrorSegments
                    );

                    if (printIndex && i > 0) {
                        ctx.save();
                        ctx.fillStyle = "red";
                        ctx.font = `${Math.max(10, Math.floor(h / 3))}px Arial`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(String(i + 1), px, py);
                        ctx.restore();
                    }
                }
            }

            frameId = requestAnimationFrame(render);
        };

        frameId = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(frameId);
            lastTimeRef.current = null;
            inwardOffsetRef.current = 0;
        };
    }, [
        printIndex, rays, diamondsPerRay, startRadius, spacing,
        diamondWidth, diamondHeight, rotation, color, background,
        rotationSpeed, spaghettiFactorWidth, spaghettiFactorHeight,
        spaghettiFactorSpacing, maxStretch, minWidth, decayMode,
        inwardSpeed, mirrorCurveX, mirrorCurveY, mirrorBarrel,
        mirrorSegments, gapX, gapY, splitAngle, holeCenter
    ]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            const rect = container.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;

            setHoleCenter({x: cx, y: cy});

            // сброс времени и смещения
            lastTimeRef.current = null;
            inwardOffsetRef.current = 0;
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{width: "100%", height: "100%"}}>
            <canvas ref={canvasRef} style={{display: "block", width: "100%", height: "100%"}}/>
        </div>
    );
};

export default DiamondsOnRaysCanvas;
