class Habit {
    constructor(title, description) {
        this.id = crypto.randomUUID(); // Унікальний ID
        this.title = title;
        this.description = description;
        this.completedDates = []; // Масив дат, коли звичку виконано, наприклад: ['2026-10-07']
    }
    
}

class HabitTracker {
    constructor() {
        this.habits = [];
        this.loadFromStorage();
    }

    addHabit(habit) {
        this.habits.push(habit);
        this.saveToStorage();
    }

    deleteHabit(id) {
        this.habits = this.habits.filter(habit => habit.id !== id);
    }

    toggleDate(habitId, dateString) {
        // Знаходимо потрібну звичку
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const index = habit.completedDates.indexOf(dateString);
            if (index > -1) {
                // Якщо дата вже є, прибираємо її (відміна виконання)
                habit.completedDates.splice(index, 1);
            } else {
                // Якщо немає, додаємо
                habit.completedDates.push(dateString);
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('habits');
        if (saved) {
            this.habits = JSON.parse(saved);
        }
    }
}

const tracker = new HabitTracker();

// --- Робота з DOM ---
const form = document.getElementById('habit-form');
const habitsContainer = document.getElementById('habits-container');

// Малюємо список одразу при завантаженні сторінки (якщо щось було в localStorage)
render();

// --- Делегування подій ---
habitsContainer.addEventListener('click', (event) => {
    // 1. Клік по кнопці "Видалити"
    if (event.target.classList.contains('delete-btn')) {
        const id = event.target.dataset.id;
        tracker.deleteHabit(id);
        tracker.saveToStorage();
        render();
    }

    // 2. Клік по клітинці дня
    if (event.target.classList.contains('day-cell')) {
        const habitId = event.target.dataset.habitId;
        const day = event.target.dataset.day;
        
        tracker.toggleDate(habitId, day);
        tracker.saveToStorage();
        render();
    }
});

form.addEventListener('submit', (event) => {
    event.preventDefault(); // Зупиняємо перезавантаження сторінки
    
    const nameInput = document.getElementById('habit-name');
    const descInput = document.getElementById('habit-desc');
    const errorMsg = document.getElementById('form-error');

    const nameValue = nameInput.value.trim();
    const descValue = descInput.value.trim();

    // Регулярний вираз: мінімум 3 символи (не рахуючи пробіли по краях)
    const pattern = /^.{3,}$/; 

    // Валідація
    if (!pattern.test(nameValue)) {
        nameInput.classList.add('invalid');
        errorMsg.style.display = 'block';
        return; // Зупиняємо виконання, якщо дані некоректні
    }

    // Якщо все добре, прибираємо помилки
    nameInput.classList.remove('invalid');
    errorMsg.style.display = 'none';

    // Створюємо нову звичку і додаємо в трекер
    const newHabit = new Habit(nameValue, descValue);
    tracker.addHabit(newHabit);
    
    form.reset(); // Очищаємо поля вводу
    render(); // Перемальовуємо інтерфейс
});

function render() {
    // 1. Очищаємо контейнер, щоб уникнути дублювання старих записів
    habitsContainer.innerHTML = '';

    // 2. Проходимося по кожній звичці в масиві
    tracker.habits.forEach(habit => {
        // Створюємо головний блок картки
        const card = document.createElement('div');
        card.className = 'habit-card';

        // Формуємо шапку картки (назва + кнопка видалення)
        const header = document.createElement('div');
        header.className = 'habit-header';
        
        // Підрахунок статистики (streak та відсоток для 7 днів)
        const totalDays = 7;
        const completedCount = habit.completedDates.length;
        const percent = Math.round((completedCount / totalDays) * 100);
        
        let streak = 0;
        // Рахуємо стрік з кінця (від 7-го дня назад)
        for (let i = 7; i >= 1; i--) {
            if (habit.completedDates.includes(i.toString())) {
                streak++;
            } else {
                break;
            }
        }

        const titleInfo = document.createElement('div');
        titleInfo.innerHTML = `
            <h3>${habit.title}</h3>
            <p>${habit.description}</p>
            <p style="font-size: 0.9em; color: #666;">
                Прогрес: ${percent}% | Поточна серія: ${streak} днів
            </p>
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Видалити';
        // Зберігаємо ID звички в самій кнопці (в атрибуті data-id)
        deleteBtn.dataset.id = habit.id;

        header.append(titleInfo, deleteBtn);

        // Формуємо сітку днів (для прикладу - 7 днів)
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        for (let i = 1; i <= 7; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.textContent = i;
            dayCell.title = `День ${i}`; // Підказка при наведенні курсора
            
            // Якщо день є в масиві completedDates, зафарбовуємо його
            if (habit.completedDates.includes(i.toString())) {
                dayCell.classList.add('done');
            }
            
            // Записуємо дані прямо в HTML-елемент, щоб при кліку знати, що це за клітинка
            dayCell.dataset.habitId = habit.id;
            dayCell.dataset.day = i.toString();

            daysGrid.append(dayCell);
        }

        card.append(header, daysGrid);
        habitsContainer.append(card);
    });
}
