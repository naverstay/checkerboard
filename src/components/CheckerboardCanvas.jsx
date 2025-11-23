import React, { useRef, useEffect, useState, useCallback } from 'react';

const CELL_SIZE = 16; // фиксированный размер клетки
const TICK_MS = 150;  // частота смещения шахматки
const IDLE_STOP_MS = 150; // остановка таймера после бездействия

const CheckerboardCanvas = () => {
  const canvasRef = useRef(null);

  const [hoverPos, setHoverPos] = useState(null);
  const [shift, setShift] = useState(0);
  const [invSquare, setInvSquare] = useState({ row: 5, col: 5 });

  const intervalRef = useRef(null);
  const idleTimeoutRef = useRef(null);

  // ---------- Случайное перемещение квадрата ----------
  const moveInvSquareRandomly = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rows = Math.floor(canvas.height / CELL_SIZE);
    const cols = Math.floor(canvas.width / CELL_SIZE);

    const maxRow = Math.max(0, rows - 2);
    const maxCol = Math.max(0, cols - 2);

    const newRow = Math.floor(Math.random() * (maxRow + 1));
    const newCol = Math.floor(Math.random() * (maxCol + 1));
    setInvSquare({ row: newRow, col: newCol });
  }, []);

  // ---------- Таймер смещения ----------
  const startTicking = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setShift(prev => (prev + 1) % 2);
    }, TICK_MS);
  }, []);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetIdleStop = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      stopTicking();
    }, IDLE_STOP_MS);
  }, [stopTicking]);

  // ---------- Рисование ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    const rows = Math.ceil(height / CELL_SIZE);
    const cols = Math.ceil(width / CELL_SIZE);

    ctx.clearRect(0, 0, width, height);

    // Основная шахматка
    for (let row = 0; row < rows + 1; row++) {
      for (let col = 0; col < cols + 1; col++) {
        let color = (row + col + shift) % 2 === 0 ? '#fff' : '#000';

        // Инвертированный квадрат 2×2
        if (
          row >= invSquare.row &&
          row < invSquare.row + 2 &&
          col >= invSquare.col &&
          col < invSquare.col + 2
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
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverPos({ x, y });

    startTicking();
    resetIdleStop();
  }, [startTicking, resetIdleStop]);

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (
      row >= invSquare.row &&
      row < invSquare.row + 2 &&
      col >= invSquare.col &&
      col < invSquare.col + 2
    ) {
      moveInvSquareRandomly();
    }
  }, [invSquare, moveInvSquareRandomly]);

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
    stopTicking();
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, [stopTicking]);

  useEffect(() => {
    return () => {
      stopTicking();
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [stopTicking]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default CheckerboardCanvas;
