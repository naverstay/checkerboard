import React, {useRef, useEffect, useState, useCallback} from 'react';

const CELL_SIZE = 16;
const TICK_MS = 500;
const ANIMATION_DURATION = 1; // длительность анимации прыжка (мс)

interface Position {
    x: number;
    y: number;
}

interface SquarePosition {
    row: number;
    col: number;
}

const CheckerboardCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [hoverPos, setHoverPos] = useState<Position | null>(null);
    const [shift, setShift] = useState<number>(0);

    const [tickMs, setTickMs] = useState<number>(TICK_MS);

    // текущие координаты квадрата
    const [invSquare, setInvSquare] = useState<SquarePosition>({row: -200, col: -200});
    // целевые координаты квадрата
    const targetSquareRef = useRef<SquarePosition>(invSquare);
    const animStartRef = useRef<number | null>(null);

    // ---------- Таймер смещения ----------
    useEffect(() => {
        const interval = window.setInterval(() => {
            setShift(prev => (prev + 1) % 2);
        }, tickMs);

        return () => clearInterval(interval);
    }, [tickMs]);

    // ---------- Анимация перемещения квадрата ----------
    const animateSquare = useCallback((timestamp: number) => {
        if (!animStartRef.current) animStartRef.current = timestamp;
        const progress = Math.min((timestamp - animStartRef.current) / ANIMATION_DURATION, 1);

        const startRow = invSquare.row;
        const startCol = invSquare.col;
        const targetRow = targetSquareRef.current.row;
        const targetCol = targetSquareRef.current.col;

        const newRow = startRow + (targetRow - startRow) * progress;
        const newCol = startCol + (targetCol - startCol) * progress;

        setInvSquare({row: newRow, col: newCol});

        if (progress < 1) {
            requestAnimationFrame(animateSquare);
        } else {
            animStartRef.current = null;
        }
    }, [invSquare]);

    const moveInvSquareRandomly = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rows = Math.floor(canvas.height / CELL_SIZE);
        const cols = Math.floor(canvas.width / CELL_SIZE);

        const maxRow = Math.max(0, rows - 2);
        const maxCol = Math.max(0, cols - 2);

        const newRow = Math.floor(Math.random() * (maxRow + 1));
        const newCol = Math.floor(Math.random() * (maxCol + 1));

        targetSquareRef.current = {row: newRow, col: newCol};
        animStartRef.current = null;
        requestAnimationFrame(animateSquare);
    }, [animateSquare]);

    // ---------- Рисование ----------
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const {width, height} = canvas;

        const rows = Math.ceil(height / CELL_SIZE);
        const cols = Math.ceil(width / CELL_SIZE);

        ctx.clearRect(0, 0, width, height);

        // Основная шахматка
        for (let row = 0; row < rows + 1; row++) {
            for (let col = 0; col < cols + 1; col++) {
                let color = (row + col + shift) % 2 === 0 ? '#fff' : '#000';

                // Инвертированный квадрат 2×2
                if (
                    row >= Math.floor(invSquare.row) &&
                    row < Math.floor(invSquare.row) + 2 &&
                    col >= Math.floor(invSquare.col) &&
                    col < Math.floor(invSquare.col) + 2
                ) {
                    color = color === '#fff' ? '#000' : '#fff';
                }

                ctx.fillStyle = color;
                ctx.fillRect(col * CELL_SIZE, (row - 0.5) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }

        // Лупа
        if (hoverPos) {
            const zoomFactor = 2;
            const zoomSquares = 4;
            const zoomSize = CELL_SIZE * zoomSquares;
            const srcSize = zoomSize / zoomFactor;

            const sx = hoverPos.x - srcSize / 2;
            const sy = hoverPos.y - srcSize / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(hoverPos.x, hoverPos.y, zoomSize / 2, 0, 2 * Math.PI);
            ctx.clip();

            ctx.drawImage(
                canvas,
                sx, sy, srcSize, srcSize,
                hoverPos.x - zoomSize / 2, hoverPos.y - zoomSize / 2,
                zoomSize, zoomSize
            );

            ctx.restore();
        }
    }, [hoverPos, shift, invSquare]);

    // ---------- Ресайз ----------
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
            draw();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [draw]);

    useEffect(() => {
        draw();
    }, [draw]);

    // ---------- Обработчики ----------
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setHoverPos({x, y});
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);

        if (
            row >= Math.floor(invSquare.row) &&
            row < Math.floor(invSquare.row) + 2 &&
            col >= Math.floor(invSquare.col) &&
            col < Math.floor(invSquare.col) + 2
        ) {
            setTickMs(TICK_MS / 5);
            moveInvSquareRandomly();
            setTimeout(() => setTickMs(TICK_MS), TICK_MS);
        }
    }, [invSquare, moveInvSquareRandomly]);

    const handleMouseLeave = useCallback(() => {
        setHoverPos(null);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rows = Math.floor(canvas.height / CELL_SIZE);
        const cols = Math.floor(canvas.width / CELL_SIZE);

        const maxRow = Math.max(0, rows - 2);
        const maxCol = Math.max(0, cols - 2);

        const newRow = Math.floor(Math.random() * (maxRow + 1));
        const newCol = Math.floor(Math.random() * (maxCol + 1));

        setInvSquare({row: newRow, col: newCol});
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{width: '100%', height: '100%', display: 'block'}}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
        />
    );
};

export default CheckerboardCanvas;
