const fs = require('fs/promises');
const path = require('path');
const replacements = require('./replacements');

async function migratePaths(paths, onLog) {
    try {
        const allFiles = [];

        // Собираем все файлы из выбранных путей
        for (const currentPath of paths) {
            try {
                const stat = await fs.lstat(currentPath);

                if (stat.isDirectory()) {
                    // Рекурсивно собираем файлы из директории
                    const directoryFiles = await getAllFiles(currentPath);
                    allFiles.push(...directoryFiles);
                } else if (stat.isFile()) {
                    // Добавляем отдельный файл
                    allFiles.push(currentPath);
                }
            } catch (error) {
                onLog(`⚠️ Ошибка доступа к пути ${currentPath}: ${error.message}`);
            }
        }

        onLog(`Найдено файлов: ${allFiles.length}`);

        // Обрабатываем каждый файл
        for (const file of allFiles) {
            try {
                onLog(`\nОбрабатываю: ${file}`);

                let content = await fs.readFile(file, 'utf-8');
                let changesMade = false;

                // Применяем замены в строгом порядке
                for (const { from, to } of replacements) {
                    const regex = new RegExp(`\\b${from}\\b`, 'g');
                    const newContent = content.replace(regex, to);

                    if (newContent !== content) {
                        changesMade = true;
                        const count = (content.match(regex) || []).length;
                        onLog(`  Замена ${from} → ${to}: ${count} раз`);
                    }

                    content = newContent;
                }

                // Сохраняем изменения, только если были замены
                if (changesMade) {
                    await fs.writeFile(file, content);
                    onLog(`✅ Файл обновлен: ${file}`);
                } else {
                    onLog(`  Ничего не изменено в ${file}`);
                }

            } catch (error) {
                onLog(`❌ Ошибка обработки файла ${file}: ${error.message}`);
            }
        }

        onLog('\nМиграция завершена!');

    } catch (error) {
        throw new Error(`Критическая ошибка: ${error.message}`);
    }
}

// Рекурсивный сбор файлов из директории
async function getAllFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Рекурсивно обрабатываем поддиректории
            const nestedFiles = await getAllFiles(fullPath);
            files.push(...nestedFiles);
        } else {
            // Проверяем расширение файла
            const ext = path.extname(entry.name).toLowerCase();
            if (['.svelte', '.html', '.js'].includes(ext)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

module.exports = { migratePaths };
