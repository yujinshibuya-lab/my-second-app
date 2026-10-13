const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const message = document.querySelector("#message");
const restartButton = document.querySelector("#restart");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 3600;
const GRAVITY = 1800;
const MOVE_SPEED = 320;
const JUMP_SPEED = 690;

const platforms = [
  { x: 0, y: 460, width: 760, height: 100 },
  { x: 900, y: 460, width: 570, height: 100 },
  { x: 1580, y: 460, width: 790, height: 100 },
  { x: 2480, y: 460, width: 1120, height: 100 },
  { x: 300, y: 360, width: 150, height: 18 },
  { x: 540, y: 300, width: 130, height: 18 },
  { x: 1030, y: 355, width: 150, height: 18 },
  { x: 1270, y: 300, width: 120, height: 18 },
  { x: 1730, y: 355, width: 150, height: 18 },
  { x: 1980, y: 295, width: 150, height: 18 },
  { x: 2220, y: 350, width: 100, height: 18 },
  { x: 2660, y: 360, width: 150, height: 18 },
  { x: 2900, y: 300, width: 150, height: 18 },
  { x: 3170, y: 350, width: 140, height: 18 },
];

const coins = [
  { x: 350, y: 320 },
  { x: 590, y: 260 },
  { x: 820, y: 400 },
  { x: 1080, y: 315 },
  { x: 1320, y: 260 },
  { x: 1510, y: 400 },
  { x: 1780, y: 315 },
  { x: 2030, y: 255 },
  { x: 2260, y: 310 },
  { x: 2410, y: 400 },
  { x: 2710, y: 320 },
  { x: 2950, y: 260 },
  { x: 3220, y: 310 },
];

const keys = new Set();
const touchControls = new Set();
const player = { x: 70, y: 400, width: 34, height: 48, vx: 0, vy: 0, onGround: false };
let cameraX = 0;
let collected = new Set();
let jumpPressed = false;
let finished = false;
let previousTime = 0;
let animationTime = 0;

function resetGame() {
  player.x = 70;
  player.y = 400;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  cameraX = 0;
  collected = new Set();
  jumpPressed = false;
  finished = false;
  coinCount.textContent = "0";
  message.hidden = true;
}

function isHeld(...controls) {
  return controls.some((control) => keys.has(control) || touchControls.has(control));
}

function update(delta) {
  if (finished) return;

  const left = isHeld("ArrowLeft", "a", "A", "left");
  const right = isHeld("ArrowRight", "d", "D", "right");
  player.vx = (Number(right) - Number(left)) * MOVE_SPEED;

  if (jumpPressed && player.onGround) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }
  jumpPressed = false;

  const previousBottom = player.y + player.height;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x + player.vx * delta));
  player.vy += GRAVITY * delta;
  player.y += player.vy * delta;
  player.onGround = false;

  for (const platform of platforms) {
    const overlapsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossedTop = previousBottom <= platform.y && player.y + player.height >= platform.y;
    if (player.vy >= 0 && overlapsX && crossedTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.y > HEIGHT + 120) {
    player.x = Math.max(70, player.x - 180);
    player.y = 300;
    player.vy = 0;
  }

  for (let i = 0; i < coins.length; i += 1) {
    if (collected.has(i)) continue;
    const coin = coins[i];
    const dx = player.x + player.width / 2 - coin.x;
    const dy = player.y + player.height / 2 - coin.y;
    if (dx * dx + dy * dy < 28 * 28) {
      collected.add(i);
      coinCount.textContent = String(collected.size);
    }
  }

  if (player.x + player.width >= 3480) {
    finished = true;
    message.innerHTML = `<strong>ゴール！</strong><span>コイン ${collected.size} / ${coins.length} 枚を集めました</span>`;
    message.hidden = false;
  }

  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#72b8ec");
  sky.addColorStop(1, "#d0efff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawClouds();
  drawHills(0.18, 390, "#9bd6dc", 95);
  drawHills(0.32, 430, "#75bdbe", 65);
}

function drawClouds() {
  ctx.fillStyle = "#ffffffa8";
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 190 - cameraX * 0.12) % (WIDTH + 180) + WIDTH + 180) % (WIDTH + 180) - 90;
    const y = 68 + (i % 3) * 46;
    ctx.beginPath();
    ctx.ellipse(x, y, 38, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 22, y - 8, 25, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 46, y, 31, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(parallax, baseY, color, amplitude) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  for (let x = 0; x <= WIDTH + 20; x += 20) {
    const worldX = x + cameraX * parallax;
    const y = baseY - Math.sin(worldX * 0.005) * amplitude - Math.sin(worldX * 0.011) * amplitude * 0.3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawPlatforms() {
  for (const platform of platforms) {
    const x = platform.x - cameraX;
    if (x + platform.width < -10 || x > WIDTH + 10) continue;
    ctx.fillStyle = platform.height > 30 ? "#805b46" : "#a46e4d";
    ctx.fillRect(x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#61bd78";
    ctx.fillRect(x, platform.y, platform.width, 10);
    ctx.fillStyle = "#ffffff17";
    for (let tileX = x + 12; tileX < x + platform.width; tileX += 38) {
      ctx.fillRect(tileX, platform.y + 20, 2, Math.max(0, platform.height - 24));
    }
  }
}

function drawCoins() {
  coins.forEach((coin, index) => {
    if (collected.has(index)) return;
    const x = coin.x - cameraX;
    if (x < -20 || x > WIDTH + 20) return;
    const pulse = Math.sin(animationTime * 5 + index) * 2;
    ctx.fillStyle = "#ffcf57";
    ctx.beginPath();
    ctx.ellipse(x, coin.y, 10 + pulse * 0.25, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff2af";
    ctx.fillRect(x - 2, coin.y - 7, 3, 14);
  });
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;
  const running = player.onGround && Math.abs(player.vx) > 0;
  const bounce = running ? Math.sin(animationTime * 18) * 2 : 0;
  ctx.fillStyle = "#334078";
  ctx.fillRect(x + 5, y + 11 + bounce, 25, 30);
  ctx.fillStyle = "#f2a978";
  ctx.fillRect(x + 7, y + bounce, 22, 23);
  ctx.fillStyle = "#f6cf67";
  ctx.fillRect(x + 5, y - 3 + bounce, 25, 8);
  ctx.fillRect(x + 11, y - 8 + bounce, 13, 8);
  ctx.fillStyle = "#27304f";
  ctx.fillRect(x + 20, y + 8 + bounce, 3, 4);
  ctx.fillStyle = "#e97866";
  ctx.fillRect(x + 2, y + 36 + bounce, 15, 8);
  ctx.fillRect(x + 19, y + 36 + bounce, 14, 8);
}

function drawGoal() {
  const x = 3480 - cameraX;
  ctx.fillStyle = "#fff3d0";
  ctx.fillRect(x, 325, 6, 135);
  ctx.fillStyle = "#ff7d72";
  ctx.beginPath();
  ctx.moveTo(x + 6, 328);
  ctx.lineTo(x + 58, 344);
  ctx.lineTo(x + 6, 360);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("GOAL", x + 10, 349);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawCoins();
  drawGoal();
  drawPlayer();
}

function frame(time) {
  const delta = Math.min((time - previousTime) / 1000 || 0, 1 / 30);
  previousTime = time;
  animationTime += delta;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault();
  if (!keys.has(event.key) && ["ArrowUp", "w", "W", " "].includes(event.key)) jumpPressed = true;
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key));
window.addEventListener("blur", () => keys.clear());
restartButton.addEventListener("click", resetGame);

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const release = (event) => {
    event.preventDefault();
    touchControls.delete(control);
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    touchControls.add(control);
    if (control === "jump") jumpPressed = true;
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", () => touchControls.delete(control));
});

requestAnimationFrame(frame);
