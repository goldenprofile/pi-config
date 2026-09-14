# pi-config

Личный пул агентов для [pi coding agent](https://github.com/earendil-works/pi-coding-agent) — работает поверх расширения [subagents](https://github.com/goldenprofile/pi-extensions) (спавн в панели, steer/resume/cancel, headless-батчи `task_batch`).

12 агентов: оркестратор, разведка, планирование, исполнение, ревью, тесты, документация и утилитарные роли. Каждый — один markdown-файл: frontmatter (модель, thinking, инструменты, права на делегирование) + identity, который аппендится к system prompt ребёнка.

## Пул

| Агент | Роль | Модель / thinking | Делегирует |
|---|---|---|---|
| `prime` | Оркестратор: декомпозиция, диспетчеризация, верификация, стоп-решение | наследует | всем |
| `scout` | Разведка кодовой базы с жёстким бюджетом; NOT FOUND — валидный результат | flash | — |
| `planner` | План с acceptance-критериями на каждый шаг | наследует | scout |
| `worker` | Исполнитель: план/задача, проверка критериев | наследует | scout, reviewer |
| `reviewer` | Ревью: чек-листы по типу изменения, вердикт | наследует | — |
| `fixer` | Применяет находки ревью без scope creep | наследует | — |
| `tester` | Тесты до зелёного; прод-код не трогает | наследует | — |
| `researcher` | Веб-исследование с гранями поиска и отбором источников | flash / medium | — |
| `commit-planner` | Рабочее дерево → атомарные коммиты (только чтение git) | наследует | — |
| `summarizer` | Сессия/артефакты → handoff-бриф | flash | — |
| `doc-writer` | README/ADR/docstrings — «почему», а не «что» | наследует | — |
| `librarian` | «Как у нас принято X» — из AGENTS.md/docs с цитатами file:line | flash | — |

Принципы пула:
- **«Не найдено» — результат.** Скауты не молотят поиск бесконечно — рапортуют тупик и где смотрели.
- **Проверяемая готовность.** План несёт acceptance-критерии, worker их проверяет, prime не верит словам — верифицирует.
- **Бюджеты вшиты в контракты.** Лимит tool-вызовов / строк отчёта / раундов поиска прямо в identity.
- **Плоский граф делегирования.** prime → все; worker/planner — точечно; исполнители никого не спавнят. Без рекурсии.

## Установка

```bash
git clone https://github.com/goldenprofile/pi-config.git
# глобально (все проекты):
cp pi-config/agents/*.md ~/.pi/agent/agents/
# или в проект (переопределяет глобальных с тем же именем):
cp pi-config/agents/*.md <project>/.pi/agents/
```

Требуется расширение [subagents](https://github.com/goldenprofile/pi-extensions):

```bash
git clone https://github.com/goldenprofile/pi-extensions.git
cd pi-extensions && npm run sync
```

## Использование

```
/subagent prime "цель — оркестратор сам разберёт и разгонит"
/subagent scout "найди, где валидируется вебхук, budget: 15"
task_batch parallel: scout + researcher — независимые задачи одним батчем
```

## Формат агента

```markdown
---
name: scout
description: Краткое описание (видно диспетчеру при выборе)
model: zai/glm-5.3-flash      # опционально, иначе модель диспетчера
thinking: medium              # off|minimal|low|medium|high|xhigh|max
tools: read, grep, ls, bash   # опционально, иначе полный набор
subagents: reviewer           # опционально: кому можно спавнить
auto-exit: true               # выходить ли по завершении
---

Identity — всё ниже frontmatter аппендится к system prompt ребёнка.
Выходной контракт в конце identity — то, что получит родитель.
```

Проектные агенты (`<project>/.pi/agents/`) переопределяют глобальных с тем же именем.

## Структура

```
agents/
  prime.md          # оркестратор
  scout.md          # разведка
  planner.md        # планирование
  worker.md         # исполнение
  reviewer.md       # ревью
  fixer.md          # правки по ревью
  tester.md         # тесты
  researcher.md     # веб-исследование
  commit-planner.md # атомарные коммиты
  summarizer.md     # handoff-брифы
  doc-writer.md     # документация
  librarian.md      # конвенции проекта
```
