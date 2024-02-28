const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

function Ball(x, y, acceleration, maxSpeed, color) {
    this.x = x;
    this.y = y;
    this.acceleration = acceleration;
    this.maxSpeed = maxSpeed;
    this.color = color;
    this.size = 40;
    this.isMoving = false;
    this.velX = 0;
    this.velY = 0;

    this.draw = function() {
        ctx.save();  // Save the current transformation state
        ctx.translate(this.x, this.y);  // Move the canvas origin to the ball's position
        const angle = Math.atan2(mouseY - this.y, mouseX - this.x);
        ctx.rotate(angle+1.47);  // Rotate the canvas to face the mouse
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.lineTo(this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();  // Restore the saved transformation state
    }

    this.updateVelocity = function() {
        let targetVelX = (keys['D'] - keys['A']);
        let targetVelY = (keys['S'] - keys['W']);

        // Normalize diagonal movement
        if (targetVelX !== 0 && targetVelY !== 0) {
            targetVelX *= 0.7071;  // 1/sqrt(2) to ensure the speed is the same on diagonals
            targetVelY *= 0.7071;
        }

        this.velX += (targetVelX - this.velX) * this.acceleration;
        this.velY += (targetVelY - this.velY) * this.acceleration;
    }

    this.startMove = function() {
        if (!this.isMoving) {
            this.isMoving = true;
            this.moveSmoothly();
        }
    }

    this.stopMove = function() {
        this.isMoving = false;
    }

    this.moveSmoothly = function() {
        if (this.isMoving) {
            this.updateVelocity();
            this.x += this.velX * this.maxSpeed;
            this.y += this.velY * this.maxSpeed;
            this.draw();
            checkCollision();
            requestAnimationFrame(() => this.moveSmoothly());
        }
    }
    this.shootBullet = function() {
        const bulletSpeed = 5;
        const bulletAngle = Math.atan2(mouseY - this.y, mouseX - this.x);
        const bullet = new Bullet(this.x, this.y, bulletSpeed * Math.cos(bulletAngle), bulletSpeed * Math.sin(bulletAngle), 'yellow');; // Change color to any desired color
        bullets.push(bullet);
    }
}
function Bullet(x, y, speedX, speedY, color) {
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.color = color;
    this.radius = 5;

    this.draw = function() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    this.move = function() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}


function Opponent(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = 20;

    this.draw = function() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size);
        ctx.closePath();
        ctx.fill();
    }

    this.moveTowards = function(ballX, ballY) {
        const speed = 2;
        const angle = Math.atan2(ballY - this.y, ballX - this.x);
        this.x += Math.cos(angle) * speed;
        this.y += Math.sin(angle) * speed;
    }

    this.checkCollisionWithBall = function(ball) {
        const dx = this.x - ball.x;
        const dy = this.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        // Since both the ball and the opponents are drawn as triangles, 
        // you might want to use a simpler collision detection like considering both as circles.
        // For that, we consider half of the size as an approximation of the radius for collision.
        const ballRadius = ball.size / 2;
        const opponentRadius = this.size / 2; // Assuming this.size refers to the "diameter" of the opponent for simplicity.
    
        // Check if the distance between the centers of the two objects is less than the sum of their radii
        return distance < ballRadius + opponentRadius;
    };
}

const opponents = [];
const bullets = [];
const ball = new Ball(width / 2, height / 2, 0.1, 3, 'blue'); 
const keys = {
    'W': 0,
    'A': 0,
    'S': 0,
    'D': 0,
};

let mouseX = width / 2;  // Initialize mouseX and mouseY
let mouseY = height / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});
let gameover = false;  // Add a flag to track gameover state

function drawOpponent() {
    const minDistance = 100;
    const randomX = Math.random() * (width - minDistance * 2) + minDistance;
    const randomY = Math.random() * (height - minDistance * 2) + minDistance;
    const opponentColor = 'red';

    const opponent = new Opponent(randomX, randomY, opponentColor);
    opponents.push(opponent);
}

function checkBulletCollision() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = opponents.length - 1; j >= 0; j--) {
            const opponent = opponents[j];
            const distance = Math.sqrt((opponent.x - bullet.x) ** 2 + (opponent.y - bullet.y) ** 2);
            if (distance < opponent.size / 2 + bullet.radius) {
                bullets.splice(i, 1); // Remove the bullet
                opponents.splice(j, 1); // Remove the opponent
            }
        }
    }
}
function handleKeyPress(event) {
    keys[event.key.toUpperCase()] = 1;
    ball.startMove();
}

function handleKeyRelease(event) {
    keys[event.key.toUpperCase()] = 0;
    ball.stopMove();
}

function checkCollision() {
    if (!gameover) {
        for (const opponent of opponents) {
            if (opponent.checkCollisionWithBall(ball)) {
                // Collision detected, set a delay before reloading the page
                gameover = true;
                console.log('Collision detected!');
                console.log('Ball position:', ball.x, ball.y);
                console.log('Opponent position:', opponent.x, opponent.y);
                setTimeout(() => {
                    alert('Game over!')
                    location.reload();
                }, 100);  // 1 second delay before reloading
            }
        }
    }
}
document.addEventListener('click', (event) => {
        ball.shootBullet();
});
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('keyup', handleKeyRelease);

function animate() {
    ctx.clearRect(0, 0, width, height);
    ball.draw();

    for (const opponent of opponents) {
        opponent.moveTowards(ball.x, ball.y);
        opponent.draw();
    }

    for (const bullet of bullets) {
        bullet.move();
        bullet.draw();
    }

    checkBulletCollision();
    
    checkCollision();

    requestAnimationFrame(animate);
}


// Add a new opponent every 10 seconds
setInterval(drawOpponent, 2000);

animate();