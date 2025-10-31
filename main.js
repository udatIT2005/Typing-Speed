const texts = [
  `Buổi sáng nắng lên vàng ươm, tiếng chim ríu rít bên thềm gió bay`,
  `Cuộc sống như tách cà phê buổi sớm, có vị đắng, có vị ngọt, nhưng luôn đáng để thưởng thức.`,
  `Tôi gõ từng dòng chữ nhỏ, như gió khẽ lướt qua tay.`,
  `Mỗi ngày là một cơ hội để bắt đầu lại, viết tiếp hành trình của chính mình.`,
  `Bầu trời hôm nay thật trong, và lòng người cũng cần được trong như thế.`,
];

const target = document.getElementById("target");
const input = document.getElementById("input");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const durationSelect = document.getElementById("duration");
const timerEl = document.getElementById("timer");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");

let totalTime = parseInt(durationSelect.value, 10);
let timeLeft = totalTime;
let interval = null;
let started = false;
let currentIndex = 0;

// Lưu đoạn đã gõ
const segmentsTyped = [];
let currentTyped = "";

// thời gian bắt đầu để tính elapsed
let startTimestamp = null;

// Hiển thị target với highlight
function renderTarget(text, userInput = "") {
  let html = "";
  // highlight theo từng ký tự của target
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const typedChar = userInput[i];
    const visibleChar = char; // giữ nguyên khoảng trắng như bình thường
    if (typedChar == null) {
      html += `<span class="char">${visibleChar}</span>`;
    } else if (typedChar === char) {
      html += `<span class="char correct">${visibleChar}</span>`;
    } else {
      html += `<span class="char incorrect">${visibleChar}</span>`;
    }
  }
  // nếu người dùng gõ vượt quá độ dài target -> hiển thị phần vượt như incorrect
  if (userInput.length > text.length) {
    const extra = userInput.slice(text.length);
    for (let j = 0; j < extra.length; j++) {
      const ch = extra[j] === " " ? " " : extra[j];
      html += `<span class="char incorrect">${ch}</span>`;
    }
  }
  // con trỏ: chỉ hiển thị khi chưa gõ vượt quá hoặc chưa hoàn thành target (strict <)
  if (userInput.length < text.length) {
    html += `<span class="cursor"></span>`;
  }
  target.innerHTML = html;
}

function initFirstText() {
  currentIndex = 0;
  currentTyped = "";
  segmentsTyped.length = 0;
  startTimestamp = null;
  timeLeft = parseInt(durationSelect.value, 10);
  totalTime = timeLeft;
  timerEl.textContent = ` Time: ${timeLeft}`;
  wpmEl.textContent = ` WPM: 0`;
  accuracyEl.textContent = ` Accuracy: 0%`;
  renderTarget(texts[currentIndex], "");
}
initFirstText();

// Prevent paste để test trung thực
input.addEventListener("paste", (e) => e.preventDefault());

// Start test
startBtn.addEventListener("click", () => {
  if (started) return;
  started = true;
  startBtn.disabled = true;
  input.disabled = false;
  input.value = "";
  input.focus();
  timeLeft = parseInt(durationSelect.value, 10);
  totalTime = timeLeft;
  timerEl.textContent = ` Time: ${timeLeft}`;
  segmentsTyped.length = 0;
  currentTyped = "";
  initFirstText();
  // set start time
  startTimestamp = Date.now();
  // clear old interval nếu có
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    const remain = totalTime - elapsed;
    timeLeft = remain >= 0 ? remain : 0;
    timerEl.textContent = ` Time: ${timeLeft}`;
    // update live stats mỗi giây
    updateLiveStats();
    if (timeLeft <= 0) finish();
  }, 250); // cập nhật 4 lần/giây (mượt)
});

// update live WPM & accuracy
function updateLiveStats() {
  // tổng ký tự đã gõ (tính cả segments + currentTyped)
  let totalCharsTyped = 0;
  let totalCorrectChars = 0;
  for (const seg of segmentsTyped) {
    const targetText = texts[seg.targetIndex] || "";
    const typed = seg.typed || "";
    totalCharsTyped += typed.length;
    const len = Math.min(typed.length, targetText.length);
    for (let i = 0; i < len; i++) {
      if (typed[i] === targetText[i]) totalCorrectChars++;
    }
  }
  // add currentTyped
  totalCharsTyped += currentTyped.length;
  const curTarget = texts[currentIndex] || "";
  const lenCur = Math.min(currentTyped.length, curTarget.length);
  for (let i = 0; i < lenCur; i++) {
    if (currentTyped[i] === curTarget[i]) totalCorrectChars++;
  }
  // elapsed seconds so far
  const elapsedMs = startTimestamp ? Date.now() - startTimestamp : 0;
  const elapsedSec = Math.max(1, Math.floor(elapsedMs / 1000)); // avoid div by 0
  // WPM realtime: words = chars/5, minutes = elapsedSec/60
  const words = totalCharsTyped / 5;
  const wpm = Math.round(words / (elapsedSec / 60) || 0);
  const accuracy =
    totalCharsTyped > 0
      ? Math.round((totalCorrectChars / totalCharsTyped) * 100)
      : 0;
  wpmEl.textContent = ` WPM: ${wpm}`;
  accuracyEl.textContent = ` Accuracy: ${accuracy}%`;
}

// Input event - cập nhật currentTyped + render highlight
input.addEventListener("input", () => {
  // không cho phép bắt đầu gõ khi chưa start (phòng trường hợp)
  if (!started) {
    input.value = "";
    return;
  }
  currentTyped = input.value;
  renderTarget(texts[currentIndex], currentTyped);
  updateLiveStats();

  // khi gõ hết đoạn (>= độ dài target) -> chuyển sang đoạn mới
  if (currentTyped.length >= texts[currentIndex].length) {
    segmentsTyped.push({
      targetIndex: currentIndex,
      typed: currentTyped,
    });
    // chuyển sang đoạn tiếp theo
    currentIndex = (currentIndex + 1) % texts.length;
    currentTyped = "";
    input.value = "";
    renderTarget(texts[currentIndex], "");
  }
});

resetBtn.addEventListener("click", resetTest);

function finish() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  started = false;
  input.disabled = true;
  startBtn.disabled = false;

  // lưu đoạn hiện tại (nếu có)
  if (currentTyped.length > 0) {
    segmentsTyped.push({
      targetIndex: currentIndex,
      typed: currentTyped,
    });
  }

  let totalCharsTyped = 0;
  let totalCorrectChars = 0;

  for (const seg of segmentsTyped) {
    const targetText = texts[seg.targetIndex] || "";
    const typed = seg.typed || "";
    totalCharsTyped += typed.length;
    const len = Math.min(typed.length, targetText.length);
    for (let i = 0; i < len; i++) {
      if (typed[i] === targetText[i]) totalCorrectChars++;
    }
  }

  // tính WPM dựa trên thời gian thực đã chạy
  const elapsedMs = startTimestamp ? Date.now() - startTimestamp : 0;
  const elapsedSec = Math.max(1, Math.floor(elapsedMs / 1000));
  const minutes = elapsedSec / 60;
  const words = totalCharsTyped / 5;
  const wpm = minutes > 0 ? Math.round(words / minutes) : 0;

  const accuracy =
    totalCharsTyped > 0
      ? Math.round((totalCorrectChars / totalCharsTyped) * 100)
      : 0;

  wpmEl.textContent = ` WPM: ${wpm}`;
  accuracyEl.textContent = ` Accuracy: ${accuracy}%`;

  currentTyped = "";
  startTimestamp = null;
}

function resetTest() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  started = false;
  input.value = "";
  input.disabled = true;
  startBtn.disabled = false;
  currentIndex = 0;
  currentTyped = "";
  segmentsTyped.length = 0;
  timeLeft = parseInt(durationSelect.value, 10);
  totalTime = timeLeft;
  timerEl.textContent = ` Time: ${timeLeft}`;
  wpmEl.textContent = ` WPM: 0`;
  accuracyEl.textContent = ` Accuracy: 0%`;
  renderTarget(texts[currentIndex], "");
  startTimestamp = null;
}
