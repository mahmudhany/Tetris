document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('nextPiece');
    const nextPieceContext = nextPieceCanvas.getContext('2d');
    
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const timeElement = document.getElementById('time');
    
    const startButton = document.getElementById('start-btn');
    const pauseButton = document.getElementById('pause-btn');
    const leftButton = document.getElementById('left-btn');
    const rightButton = document.getElementById('right-btn');
    const downButton = document.getElementById('down-btn');
    const rotateButton = document.getElementById('rotate-btn');

    // حجم كل مربع
    const blockSize = 30;
    const rows = 20;
    const cols = 10;
    
    // الألوان لكل شكل
    const colors = [
        '#FF9FF3', // وردي
        '#FECA57', // أصفر
        '#FF6B6B', // أحمر
        '#48DBFB', // أزرق فاتح
        '#1DD1A1', // أخضر
        '#F368E0', // بنفسجي
        '#FF9F43'  // برتقالي
    ];

    // أشكال القطع مع تفاصيل أكثر
    const shapes = [
        {   // I
            shape: [[1, 1, 1, 1]],
            color: colors[0],
            emoji: '🟩'
        },
        {   // O
            shape: [[1, 1], [1, 1]],
            color: colors[1],
            emoji: '🟨'
        },
        {   // T
            shape: [[1, 1, 1], [0, 1, 0]],
            color: colors[2],
            emoji: '🟥'
        },
        {   // L
            shape: [[1, 1, 1], [1, 0, 0]],
            color: colors[3],
            emoji: '🟦'
        },
        {   // J
            shape: [[1, 1, 1], [0, 0, 1]],
            color: colors[4],
            emoji: '🟪'
        },
        {   // S
            shape: [[0, 1, 1], [1, 1, 0]],
            color: colors[5],
            emoji: '🟧'
        },
        {   // Z
            shape: [[1, 1, 0], [0, 1, 1]],
            color: colors[6],
            emoji: '🟫'
        }
    ];

    let score = 0;
    let level = 1;
    let lines = 0;
    let time = 0;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let gameOver = false;
    let isPaused = false;
    let board = createBoard();
    let piece = null;
    let nextPiece = null;
    let gameInterval = null;
    let timeInterval = null;

    // إنشاء لوحة اللعب
    function createBoard() {
        return Array.from(Array(rows), () => Array(cols).fill(0));
    }

    // إنشاء قطعة جديدة
    function createPiece() {
        if (!nextPiece) {
            nextPiece = shapes[Math.floor(Math.random() * shapes.length)];
        }
        
        const newPiece = {
            pos: {x: Math.floor(cols / 2) - Math.floor(nextPiece.shape[0].length / 2), y: 0},
            shape: nextPiece.shape,
            color: nextPiece.color,
            emoji: nextPiece.emoji
        };
        
        nextPiece = shapes[Math.floor(Math.random() * shapes.length)];
        drawNextPiece();
        
        return newPiece;
    }

    // رسم المربع مع تأثيرات
    function drawBlock(x, y, color, ctx = context, size = blockSize) {
        ctx.fillStyle = color;
        ctx.fillRect(x * size, y * size, size, size);
        
        // تأثير ثلاثي الأبعاد
        ctx.strokeStyle = '#ffffff80';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
        
        // تأثير الضوء
        const gradient = ctx.createRadialGradient(
            x * size + size/2, y * size + size/2, 0,
            x * size + size/2, y * size + size/2, size/2
        );
        gradient.addColorStop(0, '#ffffff80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x * size, y * size, size, size);
    }

    // رسم اللوحة
    function drawBoard() {
        // خلفية اللوحة
        context.fillStyle = '#fafafa';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // رسم الشبكة
        context.strokeStyle = '#e0e0e0';
        context.lineWidth = 0.5;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                context.strokeRect(i * blockSize, j * blockSize, blockSize, blockSize);
            }
        }
        
        // رسم القطع الموجودة
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(x, y, value);
                }
            });
        });
    }

    // رسم القطعة الحالية
    function drawPiece() {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(x + piece.pos.x, y + piece.pos.y, piece.color);
                }
            });
        });
    }

    // رسم القطعة التالية
    function drawNextPiece() {
        nextPieceContext.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        // حجم أصغر للعرض
        const previewSize = 20;
        const offsetX = (nextPieceCanvas.width - nextPiece.shape[0].length * previewSize) / 2;
        const offsetY = (nextPieceCanvas.height - nextPiece.shape.length * previewSize) / 2;
        
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(x, y, nextPiece.color, nextPieceContext, previewSize);
                }
            });
        });
        
        // تحريك القطعة لتصبح في المنتصف
        nextPieceContext.translate(offsetX, offsetY);
    }

    // تحديث اللعبة
    function update(time = 0) {
        if (gameOver || isPaused) return;

        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            movePieceDown();
            dropCounter = 0;
        }

        draw();
        requestAnimationFrame(update);
    }

    // رسم كل شيء
    function draw() {
        drawBoard();
        drawPiece();
        
        // تحديث المعلومات
        scoreElement.textContent = score;
        levelElement.textContent = level;
    }

    // بدء مؤقت اللعبة
    function startTimer() {
        clearInterval(timeInterval);
        timeInterval = setInterval(() => {
            if (!isPaused && !gameOver) {
                time++;
                timeElement.textContent = formatTime(time);
            }
        }, 1000);
    }

    // تنسيق الوقت
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // تحريك القطعة لأسفل
    function movePieceDown() {
        if (gameOver || isPaused) return;
        
        piece.pos.y++;
        if (collision()) {
            piece.pos.y--;
            mergePiece();
            removeFullRows();
            if (gameOver) {
                endGame();
                return;
            }
            piece = createPiece();
        }
        dropCounter = 0;
    }

    // تحريك القطعة جانبيًا
    function movePiece(dir) {
        if (gameOver || isPaused) return;
        
        piece.pos.x += dir;
        if (collision()) {
            piece.pos.x -= dir;
        }
    }

    // تدوير القطعة في جميع الاتجاهات
    function rotatePiece() {
        if (gameOver || isPaused) return;
        
        const originalShape = piece.shape;
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        
        // تدوير المصفوفة 90 درجة في اتجاه عقارب الساعة
        const rotated = Array(cols).fill().map((_, y) => 
            Array(rows).fill().map((_, x) => 
                piece.shape[rows - 1 - x][y]
            )
        );
        
        piece.shape = rotated;
        if (collision()) {
            // محاولة تعديل الموضع إذا كان هناك تصادم
            const offsets = [1, -1, 2, -2]; // محاولة إزاحة القطعة
            for (const offset of offsets) {
                piece.pos.x += offset;
                if (!collision()) return;
                piece.pos.x -= offset;
            }
            piece.shape = originalShape;
        }
    }

    // اكتشاف التصادم
    function collision() {
        return piece.shape.some((row, y) => {
            return row.some((value, x) => {
                return value !== 0 &&
                    (board[y + piece.pos.y] === undefined || 
                     board[y + piece.pos.y][x + piece.pos.x] === undefined ||
                     board[y + piece.pos.y][x + piece.pos.x] !== 0);
            });
        });
    }

    // دمج القطعة مع اللوحة
    function mergePiece() {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[y + piece.pos.y][x + piece.pos.x] = piece.color;
                }
            });
        });
    }

    // إزالة الصفوف المكتملة مع تأثيرات
    function removeFullRows() {
        let rowsRemoved = 0;
        
        board.forEach((row, y) => {
            if (row.every(cell => cell !== 0)) {
                rowsRemoved++;
                
                // تأثير اختفاء الصف
                animateRowClear(y);
                
                // إزالة الصف وإضافة جديد في الأعلى
                board.splice(y, 1);
                board.unshift(Array(cols).fill(0));
            }
        });
        
        if (rowsRemoved > 0) {
            // حساب النقاط
            const points = [100, 300, 500, 800][rowsRemoved - 1] || 1000;
            score += points * level;
            lines += rowsRemoved;
            
            // تأثير النقاط
            animateScore(points);
            
            // زيادة المستوى كل 10 خطوط
            if (lines >= level * 10) {
                level++;
                dropInterval = Math.max(100, dropInterval * 0.8); // زيادة السرعة مع حد أدنى
                
                // تأثير تغيير المستوى
                animateLevelUp();
            }
        }
    }

    // تأثير مسح الصف
    function animateRowClear(y) {
        const originalColors = [];
        
        // حفظ الألوان الأصلية
        for (let x = 0; x < cols; x++) {
            originalColors[x] = board[y][x];
            board[y][x] = '#ffffff';
        }
        
        // رسم اللوحة مع الصف الأبيض
        draw();
        
        // استعادة الألوان بعد تأخير
        setTimeout(() => {
            for (let x = 0; x < cols; x++) {
                board[y][x] = originalColors[x];
            }
            draw();
        }, 100);
    }

    // تأثير النقاط
    function animateScore(points) {
        const scoreEffect = document.createElement('div');
        scoreEffect.className = 'score-effect';
        scoreEffect.textContent = `+${points}`;
        scoreEffect.style.position = 'absolute';
        scoreEffect.style.color = '#4CAF50';
        scoreEffect.style.fontSize = '24px';
        scoreEffect.style.fontWeight = 'bold';
        scoreEffect.style.animation = 'scorePop 1s forwards';
        
        const scoreRect = scoreElement.getBoundingClientRect();
        scoreEffect.style.left = `${scoreRect.right + 10}px`;
        scoreEffect.style.top = `${scoreRect.top}px`;
        
        document.body.appendChild(scoreEffect);
        
        setTimeout(() => {
            scoreEffect.remove();
        }, 1000);
    }

    // تأثير تغيير المستوى
    function animateLevelUp() {
        const levelUp = document.createElement('div');
        levelUp.className = 'level-up';
        levelUp.textContent = `المستوى ${level}! 🎉`;
        levelUp.style.position = 'fixed';
        levelUp.style.top = '50%';
        levelUp.style.left = '50%';
        levelUp.style.transform = 'translate(-50%, -50%)';
        levelUp.style.backgroundColor = 'rgba(156, 39, 176, 0.9)';
        levelUp.style.color = 'white';
        levelUp.style.padding = '20px 40px';
        levelUp.style.borderRadius = '50px';
        levelUp.style.fontSize = '32px';
        levelUp.style.zIndex = '1000';
        levelUp.style.animation = 'levelUp 1.5s forwards';
        
        document.body.appendChild(levelUp);
        
        setTimeout(() => {
            levelUp.remove();
        }, 1500);
    }

    // بدء اللعبة
    function startGame() {
        if (gameInterval && !gameOver) return;
        
        board = createBoard();
        piece = createPiece();
        nextPiece = shapes[Math.floor(Math.random() * shapes.length)];
        score = 0;
        level = 1;
        lines = 0;
        time = 0;
        dropInterval = 1000;
        gameOver = false;
        isPaused = false;
        lastTime = 0;
        dropCounter = 0;
        
        startButton.textContent = 'إعادة اللعب 🔄';
        pauseButton.textContent = 'إيقاف ⏸️';
        
        startTimer();
        update();
    }

    // إيقاف اللعبة
    function pauseGame() {
        if (gameOver) return;
        
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'متابعة ▶️' : 'إيقاف ⏸️';
        
        if (!isPaused) {
            lastTime = performance.now();
            update();
        }
    }

    // نهاية اللعبة
    function endGame() {
        gameOver = true;
        clearInterval(timeInterval);
        
        // عرض رسالة النهاية
        const gameOverMsg = document.createElement('div');
        gameOverMsg.className = 'game-over';
        gameOverMsg.innerHTML = `
            <h2>انتهت اللعبة! 😢</h2>
            <p>النقاط النهائية: ${score} 🌟</p>
            <p>المستوى: ${level} 🏆</p>
            <p>الوقت: ${formatTime(time)} ⏱️</p>
            <button onclick="this.parentElement.remove()">حسناً 👍</button>
        `;
        gameOverMsg.style.position = 'fixed';
        gameOverMsg.style.top = '50%';
        gameOverMsg.style.left = '50%';
        gameOverMsg.style.transform = 'translate(-50%, -50%)';
        gameOverMsg.style.backgroundColor = 'white';
        gameOverMsg.style.padding = '30px';
        gameOverMsg.style.borderRadius = '20px';
        gameOverMsg.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
        gameOverMsg.style.zIndex = '1000';
        gameOverMsg.style.textAlign = 'center';
        
        document.body.appendChild(gameOverMsg);
    }

    // إضافة أنماط للرسوم المتحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scorePop {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-50px); opacity: 0; }
        }
        
        @keyframes levelUp {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        .score-effect {
            animation: scorePop 1s forwards;
        }
        
        .level-up {
            animation: levelUp 1.5s forwards;
        }
    `;
    document.head.appendChild(style);

    // التحكم باستخدام لوحة المفاتيح
    document.addEventListener('keydown', event => {
        if (gameOver) return;
        
        switch (event.keyCode) {
            case 37: // Left arrow
                movePiece(-1);
                break;
            case 39: // Right arrow
                movePiece(1);
                break;
            case 40: // Down arrow
                movePieceDown();
                break;
            case 32: // Space
                rotatePiece();
                break;
            case 80: // P
                pauseGame();
                break;
        }
    });

    // التحكم باستخدام الأزرار
    leftButton.addEventListener('click', () => movePiece(-1));
    rightButton.addEventListener('click', () => movePiece(1));
    downButton.addEventListener('click', () => movePieceDown());
    rotateButton.addEventListener('click', () => rotatePiece());
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
});