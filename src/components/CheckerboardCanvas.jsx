import React, { useRef, useEffect, useState } from 'react';

const CELL_SIZE = 16;
const TIMER = 250;

const CheckerboardCanvas = () => {
  const canvasRef = useRef(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [shift, setShift] = useState(0);
  const [invSquare, setInvSquare] = useState({ row: 5, col: 5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      drawCanvas();
    };

    const drawCanvas = () => {
      const { width, height } = canvas;
      const rows = Math.ceil(height / CELL_SIZE);
      const cols = Math.ceil(width / CELL_SIZE);

      ctx.clearRect(0, 0, width, height);

      // Основная шахматка
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
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
          ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }

      // Обводка инвертированного квадрата
      //ctx.strokeStyle = 'red';
      //ctx.lineWidth = 1;
      //ctx.strokeRect(
      //  invSquare.col * CELL_SIZE,
      //  invSquare.row * CELL_SIZE,
      //  CELL_SIZE * 2,
      //  CELL_SIZE * 2
      //);

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
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [hoverPos, shift, invSquare]);

  // Таймер для смены шахматки
  useEffect(() => {
    const interval = setInterval(() => {
      setShift((prev) => (prev + 1) % 2);
    }, TIMER);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverPos({ x, y });

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (
      row >= invSquare.row &&
      row < invSquare.row + 2 &&
      col >= invSquare.col &&
      col < invSquare.col + 2
    ) {
      const canvas = canvasRef.current;
      const rows = Math.floor(canvas.height / CELL_SIZE);
      const cols = Math.floor(canvas.width / CELL_SIZE);

      const newRow = Math.floor(Math.random() * (rows - 2));
      const newCol = Math.floor(Math.random() * (cols - 2));
      setInvSquare({ row: newRow, col: newCol });
    }
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default CheckerboardCanvas;
