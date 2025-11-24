import React, {useEffect, useRef} from "react";

interface DiamondsOnRaysProps {
    rays?: number;
    diamondsPerRay?: number;
    startRadius?: number;
    spacing?: number;
    diamondWidth?: number;
    diamondHeight?: number;
    rotation?: "none" | "radial" | number;
    color?: string;
    background?: string;
    rotationSpeed?: number;          // рад/сек
    spaghettiFactorWidth?: number;   // множитель сжатия ширины
    spaghettiFactorHeight?: number;  // множитель растяжения высоты
    spaghettiFactorSpacing?: number; // множитель для отступов
    maxStretch?: number;             // максимум по высоте
    minWidth?: number;               // минимум по ширине
    decayMode?: "linear" | "quadratic" | "exponential";
    inwardSpeed?: number;            // скорость движения к центру (px/сек)
}

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

function drawDiamond(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    angleRad: number,
    fill: string
) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    const hw = w / 2;
    const hh = h / 2;

    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
}

const DiamondsOnRaysCanvas: React.FC<DiamondsOnRaysProps> = ({
                                                                 rays = 8,
                                                                 diamondsPerRay = 15,
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
                                                             }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const angleRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);
    const inwardOffsetRef = useRef(0);

    useEffect(() => {
        let frameId: number;

        const render = (now: number) => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const rect = container.getBoundingClientRect();
            const {ctx} = setCanvasSize(canvas, rect.width, rect.height);
            if (!ctx) return;

            ctx.fillStyle = background;
            ctx.fillRect(0, 0, rect.width, rect.height);

            const cx = rect.width / 2;
            const cy = rect.height / 2;

            if (lastTimeRef.current == null) lastTimeRef.current = now;
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;

            angleRef.current += rotationSpeed * dt;
            inwardOffsetRef.current += inwardSpeed * dt;

            const maxR = Math.min(cx, cy);

            for (let r = 0; r < rays; r++) {
                const baseAngle = (r / rays) * Math.PI * 2 + angleRef.current;
                const dirX = Math.cos(baseAngle);
                const dirY = Math.sin(baseAngle);

                let radius = startRadius - inwardOffsetRef.current;

                for (let i = 0; i < diamondsPerRay; i++) {
                    while (radius < 0) {
                        radius += maxR;
                    }

                    // коэффициент затухания
                    let t = 1 - Math.min(1, radius / Math.max(1, maxR));
                    if (decayMode === "quadratic") t = t * t;
                    else if (decayMode === "exponential") {
                        const e = Math.E;
                        t = (Math.exp(t) - 1) / (e - 1);
                    }

                    const widthScale = Math.pow(1 / Math.max(1, spaghettiFactorWidth), t);
                    const heightScale = Math.pow(Math.max(1, spaghettiFactorHeight), t);
                    const spacingScale = Math.pow(Math.max(1, spaghettiFactorSpacing), t);

                    const w = Math.max(minWidth, diamondWidth * widthScale);
                    const h = Math.min(maxStretch, diamondHeight * heightScale);

                    const px = cx + dirX * radius;
                    const py = cy + dirY * radius;

                    let angleRad = 0;
                    if (rotation === "radial") angleRad = baseAngle + Math.PI / 2;
                    else if (typeof rotation === "number")
                        angleRad = (rotation * Math.PI) / 180 + Math.PI / 2;

                    drawDiamond(ctx, px, py, w, h, angleRad, color);

                    // отрисовка номера ромба
                    ctx.save();
                    ctx.fillStyle = "red";
                    ctx.font = `${Math.floor(h / 3)}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(String(i + 1), px, py);
                    ctx.restore();

                    // вычисляем высоту следующего ромба для равномерного шага центров
                    const nextRadius = radius + spacing;
                    let nextT = 1 - Math.min(1, nextRadius / Math.max(1, maxR));
                    if (decayMode === "quadratic") nextT = nextT * nextT;
                    else if (decayMode === "exponential") {
                        const e = Math.E;
                        nextT = (Math.exp(nextT) - 1) / (e - 1);
                    }
                    const nextHeightScale = Math.pow(Math.max(1, spaghettiFactorHeight), nextT);
                    const nextH = Math.min(maxStretch, diamondHeight * nextHeightScale);

                    // равномерное расстояние между центрами
                    radius += h / 2 + spacing * spacingScale + nextH / 2;
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
        rays,
        diamondsPerRay,
        startRadius,
        spacing,
        diamondWidth,
        diamondHeight,
        rotation,
        color,
        background,
        rotationSpeed,
        spaghettiFactorWidth,
        spaghettiFactorHeight,
        spaghettiFactorSpacing,
        maxStretch,
        minWidth,
        decayMode,
        inwardSpeed,
    ]);

    return (
        <div ref={containerRef} style={{width: "100%", height: "100%"}}>
            <canvas ref={canvasRef} style={{display: "block", width: "100%", height: "100%"}}/>
        </div>
    );
};

export default DiamondsOnRaysCanvas;
