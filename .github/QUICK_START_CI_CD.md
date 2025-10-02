# 🚀 Быстрый старт CI/CD

## Активация (одноразово):

1. **Добавьте секрет в GitHub**:
   ```
   Repository → Settings → Secrets and variables → Actions
   New repository secret:
   Name: SERVER_PASSWORD
   Secret: SBA12store
   ```

2. **Проверьте работу**:
   ```bash
   cd leadvertex-clone
   chmod +x ci-cd-manager.sh
   ./ci-cd-manager.sh status
   ```

## Ежедневная работа:

```bash
# Обычная разработка
git checkout -b feature/my-feature
# ... работаем с кодом ...
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
# Создаем PR → После merge автоматический деплой!

# Экстренный хотфикс
git checkout main
git pull
# ... исправляем баг ...
git add .
git commit -m "hotfix: fix critical issue"
git push origin main
# Автоматический деплой запустится через 1-2 минуты!
```

## Мониторинг:

```bash
# Проверка статуса
./ci-cd-manager.sh status

# Детальное здоровье
./ci-cd-manager.sh health

# Логи деплоев
./ci-cd-manager.sh logs
```

## 🎉 Готово!

Теперь при каждом push в main ветку ваши серверы автоматически обновляются!

**Серверы**:
- Frontend: https://moonline.pw (139.59.158.109)
- Backend: https://api.moonline.pw (159.89.108.100)

**Мониторинг**: GitHub Actions проверяет серверы каждые 15 минут

---

📖 **Полная документация**: `.github/CI_CD_README.md`  
💡 **Примеры использования**: `.github/CI_CD_EXAMPLES.md`