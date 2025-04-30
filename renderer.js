document.addEventListener('DOMContentLoaded', () => {
    // Исправлено: используем querySelector для радио-кнопок
    const modeSelector = document.getElementById('select-mode');
    const radioButtons = modeSelector.querySelectorAll('input[name="mode"]');
    const selectPathBtn = document.getElementById('select-path');
    const selectedPaths = document.getElementById('selected-paths');
    const status = document.getElementById('status');
    const logs = document.getElementById('logs');
    let selectedPathsList = [];

    // Переключатель режима
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('file-mode-hint').style.display =
                e.target.value === 'file' ? 'block' : 'none';
        });
    });

    // Выбор пути
    selectPathBtn.addEventListener('click', async () => {
        try {
            const selectedMode = modeSelector.querySelector('input[name="mode"]:checked').value;
            selectedPathsList = await window.electron.selectPath(selectedMode);

            if (selectedPathsList.length > 0) {
                selectedPaths.textContent = selectedPathsList.map(p => `→ ${p}`).join('\n');
                status.textContent = `Выбрано: ${selectedPathsList.length} элементов`;
            } else {
                selectedPaths.textContent = '';
                status.textContent = 'Ничего не выбрано';
            }
        } catch (error) {
            alert(`Ошибка выбора: ${error.message}`);
        }
    });

    // Запуск миграции
    document.getElementById('start-migration').addEventListener('click', () => {
        if (selectedPathsList.length === 0) {
            alert('Сначала выберите файлы или директорию!');
            return;
        }

        window.electron.startMigration(selectedPathsList);
        logs.textContent = '';
    });

    // Подписка на логи
    window.electron.onMigrationLog((event, message) => {
        logs.textContent += message + '\n';
        logs.scrollTop = logs.scrollHeight;
    });

    // Подписка на ошибки
    window.electron.onMigrationError((event, error) => {
        alert(`Ошибка миграции: ${error}`);
    });
});
