let allQuestions = [];
let ticket = [];
let currentQuestionIndex = 0;
let errors = 0;
let timeRemaining = 20 * 60; // 20 minutes
let timerInterval = null;
let answers = new Array(20).fill(null);
let isStudyMode = false;

let answeredQuestions = JSON.parse(localStorage.getItem('mvs_answered')) || [];

const sectionNames = {
    "1": "Загальні положення",
    "2": "Обов'язки і права водіїв",
    "3": "Рух транспортних засобів із спецсигналами",
    "4": "Обов'язки і права пішоходів",
    "5": "Обов'язки і права пасажирів",
    "6": "Вимоги до велосипедистів",
    "7": "Вимоги до осіб, які керують гужовим транспортом",
    "8.1": "Регулювання руху (Знаки)",
    "8.2": "Регулювання руху (Світлофори)",
    "9": "Попереджувальні сигнали",
    "10": "Початок руху та зміна напрямку",
    "11": "Розташування транспортних засобів на дорозі",
    "12": "Швидкість руху",
    "13": "Дистанція, інтервал, зустрічний роз'їзд",
    "14": "Обгін",
    "15": "Зупинка і стоянка",
    "16.1": "Проїзд перехресть (Регульовані)",
    "16.2": "Проїзд перехресть (Нерегульовані)",
    "17": "Переваги маршрутних транспортних засобів",
    "18": "Проїзд пішохідних переходів і зупинок",
    "19": "Користування зовнішніми світловими приладами",
    "20": "Рух через залізничні переїзди",
    "21": "Перевезення пасажирів",
    "22": "Перевезення вантажу",
    "23": "Буксирування та експлуатація",
    "24": "Навчальна їзда",
    "25": "Рух транспортних засобів у колонах",
    "26": "Рух у житловій та пішохідній зоні",
    "27": "Рух по автомагістралях",
    "28": "Рух по гірських дорогах",
    "29": "Міжнародний рух",
    "30": "Номерні та розпізнавальні знаки",
    "31": "Технічний стан транспортних засобів",
    "32": "Окремі питання дорожнього руху",
    "33": "Дорожні знаки",
    "34": "Дорожня розмітка",
    "35": "Основи безпеки дорожнього руху",
    "36": "Основи права",
    "37": "Домедична допомога",
    "38": "Перехрестя (Додатково)",
    "39": "Європротокол та ДТП",
    "40": "Автомагістралі (Додатково)",
    "41": "Категорія А (Мотоцикли) - Загальне",
    "42": "Категорія А (Мотоцикли) - Швидкість",
    "43": "Категорія А (Мотоцикли) - Екіпірування",
    "44": "Категорія В - Окремі питання",
    "45": "Безпека та видимість",
    "46": "Правові питання (Додатково)",
    "47": "Безпечне керування (Додатково)",
    "48": "Категорія С (Вантажні автомобілі)",
    "49": "Категорія C1,C (Будова і терміни)",
    "50": "Категорія C1,C (Водіння в складних умовах)",
    "51": "Категорія C1,C (Безпека)"
};

const DOM = {
    startScreen: document.getElementById('start-screen'),
    examScreen: document.getElementById('exam-screen'),
    resultScreen: document.getElementById('result-screen'),
    startBtn: document.getElementById('start-btn'),
    displayName: document.getElementById('display-name'),
    timer: document.getElementById('timer'),
    timeProgress: document.getElementById('time-progress'),
    errorsDisplay: document.getElementById('errors-display'),
    statsCount: document.getElementById('stats-count'),
    statsTotal: document.getElementById('stats-total'),
    resetStatsBtn: document.getElementById('reset-stats-btn'),
    studyBtn: document.getElementById('study-btn'),
    sectionScreen: document.getElementById('section-screen'),
    sectionsGrid: document.getElementById('sections-grid'),
    backToStartBtn: document.getElementById('back-to-start-btn'),
    qText: document.getElementById('question-text'),
    qImage: document.getElementById('question-image'),
    qBadge: document.getElementById('current-q-badge'),
    optionsContainer: document.getElementById('options-container'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pagination: document.getElementById('pagination'),
    resultTitle: document.getElementById('result-title'),
    resultDetails: document.getElementById('result-details'),
    restartBtn: document.getElementById('restart-btn'),
    exitExamBtn: document.getElementById('exit-exam-btn'),
};

function getQKey(q) {
    return `${q.section}_${q.id}`;
}

function updateStatsUI() {
    DOM.statsCount.textContent = answeredQuestions.length;
    DOM.statsTotal.textContent = allQuestions.length;
}

function resetStats() {
    if (confirm("Ви впевнені, що хочете скинути статистику? Всі відповіді будуть видалені, і питання почнуть повторюватися.")) {
        answeredQuestions = [];
        localStorage.setItem('mvs_answered', JSON.stringify(answeredQuestions));
        updateStatsUI();
    }
}

async function loadQuestions() {
    try {
        const res = await fetch('questions_db.json?v=2');
        allQuestions = await res.json();
        updateStatsUI();
    } catch (e) {
        alert('Помилка завантаження бази питань!');
        console.error(e);
    }
}

function getRandomFromCategory(categoryCondition, count) {
    // Filter by category AND not answered
    let filtered = allQuestions.filter(q => categoryCondition(q) && !answeredQuestions.includes(getQKey(q)));
    
    // If not enough questions left in this category that are unanswered, 
    // we fallback to include already answered ones for this category to avoid empty tickets
    if (filtered.length < count) {
        let fallback = allQuestions.filter(q => categoryCondition(q));
        const shuffledFallback = [...fallback].sort(() => 0.5 - Math.random());
        return shuffledFallback.slice(0, count);
    }
    
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateTicket() {
    let pdr = getRandomFromCategory(q => {
        let sec = parseFloat(q.section);
        return sec >= 1 && sec <= 32;
    }, 8);
    
    let signs = getRandomFromCategory(q => {
        let sec = parseFloat(q.section);
        return sec === 33 || sec === 34;
    }, 4);
    
    let safety = getRandomFromCategory(q => {
        let sec = parseFloat(q.section);
        return sec >= 35 && sec <= 37;
    }, 3);
    
    let medlaw = getRandomFromCategory(q => {
        let sec = parseFloat(q.section);
        return sec >= 38 && sec <= 47;
    }, 2);

    let cat_c = getRandomFromCategory(q => {
        let sec = parseFloat(q.section);
        return sec >= 48 && sec <= 51;
    }, 3);
    
    let newTicket = [...pdr, ...signs, ...safety, ...medlaw, ...cat_c];
    
    if (newTicket.length < 20) {
        const needed = 20 - newTicket.length;
        const remaining = allQuestions.filter(q => !newTicket.includes(q));
        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        newTicket = [...newTicket, ...shuffled.slice(0, needed)];
    }
    
    return newTicket.sort(() => 0.5 - Math.random());
}

function initExam() {
    if (allQuestions.length === 0) {
        alert("База питань ще завантажується...");
        return;
    }
    
    DOM.displayName.textContent = 'Романов Кирило Олександрович';
    
    isStudyMode = false;
    ticket = generateTicket();
    currentQuestionIndex = 0;
    errors = 0;
    timeRemaining = 20 * 60;
    answers = new Array(20).fill(null);
    
    DOM.errorsDisplay.textContent = "0 / 2";
    
    DOM.timer.parentElement.style.display = 'flex';
    DOM.errorsDisplay.parentElement.style.display = 'flex';
    DOM.pagination.style.flexWrap = 'nowrap';
    DOM.pagination.style.maxHeight = 'none';
    
    renderPagination();
    startTimer();
    
    DOM.startScreen.classList.add('hidden');
    DOM.resultScreen.classList.add('hidden');
    DOM.examScreen.classList.remove('hidden');
    
    loadQuestion(0);
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            endExam(false, "Час вичерпано!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const s = (timeRemaining % 60).toString().padStart(2, '0');
    DOM.timer.textContent = `${m}:${s}`;
    
    const pct = (timeRemaining / (20 * 60)) * 100;
    DOM.timeProgress.style.width = `${pct}%`;
}

function renderPagination() {
    DOM.pagination.innerHTML = '';
    for (let i = 0; i < ticket.length; i++) {
        const btn = document.createElement('div');
        btn.className = 'page-btn';
        btn.textContent = i + 1;
        
        if (i === currentQuestionIndex) {
            btn.classList.add('current');
        } else if (answers[i] !== null) {
            btn.classList.add(answers[i] ? 'answered' : 'wrong-ans');
        }
        
        btn.onclick = () => {
            if (answers[i] === null) {
                loadQuestion(i);
            }
        };
        DOM.pagination.appendChild(btn);
    }
}

function loadQuestion(index) {
    currentQuestionIndex = index;
    const q = ticket[index];
    
    DOM.qText.textContent = q.text;
    DOM.qBadge.textContent = index + 1;
    
    if (q.image) {
        DOM.qImage.src = q.image;
        DOM.qImage.style.display = 'block';
    } else {
        DOM.qImage.style.display = 'none';
        DOM.qImage.src = '';
    }
    
    DOM.optionsContainer.innerHTML = '';
    
    const isAnswered = answers[index] !== null;
    
    q.options.forEach((optText, optIdx) => {
        const optNum = optIdx + 1;
        
        const div = document.createElement('div');
        div.className = 'option-item';
        
        const radio = document.createElement('div');
        radio.className = 'option-radio';
        
        const text = document.createElement('div');
        text.className = 'option-text';
        text.textContent = optText;
        
        div.appendChild(radio);
        div.appendChild(text);
        
        if (isAnswered) {
            if (optNum == q.correct) {
                div.classList.add('correct');
            } else if (answers[index] === false && div.classList.contains('selected_wrong')) {
               // We don't track which wrong option was picked in answers array, 
               // but we can just show correct one. MVS test usually just highlights correct.
            }
        } else {
            div.onclick = () => selectOption(optNum, div);
        }
        
        DOM.optionsContainer.appendChild(div);
    });
    
    DOM.nextBtn.disabled = true;
    if (isAnswered) {
        DOM.nextBtn.disabled = false;
        checkIfDone();
    }
    
    DOM.prevBtn.disabled = (index === 0);
    
    renderPagination();
}

function selectOption(selectedOptNum, optionElement) {
    const q = ticket[currentQuestionIndex];
    const isCorrect = (selectedOptNum == q.correct);
    
    answers[currentQuestionIndex] = isCorrect;
    
    // Save to statistics
    const qKey = getQKey(q);
    if (!answeredQuestions.includes(qKey)) {
        answeredQuestions.push(qKey);
        localStorage.setItem('mvs_answered', JSON.stringify(answeredQuestions));
        updateStatsUI();
    }
    
    if (!isCorrect) {
        errors++;
        if (!isStudyMode) {
            DOM.errorsDisplay.textContent = `${errors} / 2`;
        }
    }
    
    const allItems = DOM.optionsContainer.children;
    for (let i = 0; i < allItems.length; i++) {
        allItems[i].onclick = null;
        const optN = i + 1;
        if (optN == q.correct) {
            allItems[i].classList.add('correct');
        } else if (optN == selectedOptNum && !isCorrect) {
            allItems[i].classList.add('wrong');
        }
    }
    
    DOM.nextBtn.disabled = false;
    renderPagination();
    
    if (!isStudyMode && errors > 2) {
        setTimeout(() => endExam(false, "Допущено більше 2 помилок."), 1000);
        return;
    }
}

function nextQuestion() {
    let nextIdx = -1;
    for (let i = currentQuestionIndex + 1; i < ticket.length; i++) {
        if (answers[i] === null) {
            nextIdx = i;
            break;
        }
    }
    
    if (nextIdx === -1) {
        for (let i = 0; i < currentQuestionIndex; i++) {
            if (answers[i] === null) {
                nextIdx = i;
                break;
            }
        }
    }
    
    if (nextIdx !== -1) {
        loadQuestion(nextIdx);
    } else {
        checkIfDone();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
}

function checkIfDone() {
    if (answers.every(a => a !== null)) {
        setTimeout(() => endExam(true), 500);
    }
}

function endExam(success, reason = "") {
    clearInterval(timerInterval);
    DOM.examScreen.classList.add('hidden');
    DOM.resultScreen.classList.remove('hidden');
    
    if (success && errors <= 2) {
        DOM.resultTitle.textContent = "Іспит складено!";
        DOM.resultTitle.style.color = "#4caf50";
        DOM.resultDetails.textContent = `Ви успішно відповіли на всі питання. Допущено помилок: ${errors}.`;
    } else {
        DOM.resultTitle.textContent = "Іспит не складено";
        DOM.resultTitle.style.color = "#f44336";
        DOM.resultDetails.textContent = `${reason} Допущено помилок: ${errors}.`;
    }
}

DOM.startBtn.addEventListener('click', initExam);
DOM.prevBtn.addEventListener('click', prevQuestion);
DOM.nextBtn.addEventListener('click', nextQuestion);
DOM.restartBtn.addEventListener('click', () => {
    DOM.resultScreen.classList.add('hidden');
    DOM.startScreen.classList.remove('hidden');
});
DOM.resetStatsBtn.addEventListener('click', resetStats);

if (DOM.studyBtn) {
    DOM.studyBtn.addEventListener('click', () => {
        DOM.startScreen.classList.add('hidden');
        DOM.sectionScreen.classList.remove('hidden');
        renderSections();
    });
}

if (DOM.backToStartBtn) {
    DOM.backToStartBtn.addEventListener('click', () => {
        DOM.sectionScreen.classList.add('hidden');
        DOM.startScreen.classList.remove('hidden');
    });
}

if (DOM.exitExamBtn) {
    DOM.exitExamBtn.addEventListener('click', () => {
        if (confirm('Ви впевнені, що хочете перервати проходження і повернутися до головного меню? Прогрес поточного іспиту не буде збережено.')) {
            clearInterval(timerInterval);
            DOM.examScreen.classList.add('hidden');
            DOM.startScreen.classList.remove('hidden');
        }
    });
}

function renderSections() {
    DOM.sectionsGrid.innerHTML = '';
    const sections = [...new Set(allQuestions.map(q => q.section))].sort((a, b) => parseFloat(a) - parseFloat(b));
    sections.forEach(sec => {
        const btn = document.createElement('button');
        btn.className = 'section-btn';
        
        const nameDiv = document.createElement('div');
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.marginBottom = '5px';
        nameDiv.textContent = `Розділ ${sec}`;
        
        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '12px';
        titleDiv.style.color = '#333';
        titleDiv.textContent = sectionNames[sec] || '';
        
        const count = allQuestions.filter(q => q.section === sec).length;
        const countDiv = document.createElement('div');
        countDiv.style.fontSize = '11px';
        countDiv.style.color = '#0056b3';
        countDiv.style.marginTop = '6px';
        countDiv.textContent = `${count} питань`;
        
        btn.appendChild(nameDiv);
        if(sectionNames[sec]) btn.appendChild(titleDiv);
        btn.appendChild(countDiv);
        
        btn.onclick = () => startStudyMode(sec);
        DOM.sectionsGrid.appendChild(btn);
    });
}

function startStudyMode(section) {
    isStudyMode = true;
    ticket = allQuestions.filter(q => q.section === section);
    ticket.sort((a,b) => a.id - b.id);
    
    currentQuestionIndex = 0;
    errors = 0;
    answers = new Array(ticket.length).fill(null);
    
    DOM.timer.parentElement.style.display = 'none';
    DOM.errorsDisplay.parentElement.style.display = 'none';
    
    DOM.sectionScreen.classList.add('hidden');
    DOM.examScreen.classList.remove('hidden');
    
    DOM.pagination.style.flexWrap = 'wrap';
    DOM.pagination.style.maxHeight = '150px';
    DOM.pagination.style.overflowY = 'auto';
    
    renderPagination();
    loadQuestion(0);
}

window.onload = loadQuestions;
