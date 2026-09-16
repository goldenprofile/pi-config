# pi-config

Резервная копия конфига [pi coding agent](https://github.com/earendil-works/pi-coding-agent): пул агентов для расширения [subagents](https://github.com/goldenprofile/pi-extensions) (спавн в панели, steer/resume/cancel, headless-батчи `task_batch`), always-on протокол оркестратора, расширения, промпты и скиллы.

**13 агентов**: оркестратор на `glm-5.3`, 12 специалистов на `glm-5.3-flash`. Каждый — один markdown-файл: frontmatter (модель, thinking, инструменты, права на делегирование) + identity, который аппендится к system prompt ребёнка.

## Пул

| Агент | Роль | Модель | Делегирует |
|---|---|---|---|
| `prime` | Оркестратор: декомпозиция, диспетчеризация, верификация, стоп-решение | glm-5.3 | всем |
| `scout` | Разведка кодовой базы с жёстким бюджетом; NOT FOUND — валидный результат | flash | — |
| `planner` | План с acceptance-критериями; шаги `[P]`/`[S]` для веера воркеров | flash | scout |
| `worker` | Исполнитель: план/задача, критерии, готовые командные последовательности | flash | scout, reviewer |
| `reviewer` | Ревью: чек-листы по типу изменения, вердикт | flash | — |
| `fixer` | Применяет находки ревью без scope creep | flash | — |
| `tester` | Тесты до зелёного; прод-код не трогает | flash | — |
| `researcher` | Веб-исследование с гранями поиска и отбором источников | flash / medium | — |
| `commit-planner` | Рабочее дерево → атомарные коммиты (только чтение git) | flash | — |
| `summarizer` | Сессия/артефакты → handoff-бриф | flash | — |
| `doc-writer` | README/ADR/docstrings — «почему», а не «что» | flash | — |
| `librarian` | «Как у нас принято X» — из AGENTS.md/docs с цитатами file:line | flash | — |
| `web-verifier` | Живая проверка фронтенда в браузере: клики, консоль, сеть, PASS/FAIL | flash | — |

Принципы пула:
- **«Не найдено» — результат.** Скауты не молотят поиск бесконечно — рапортуют тупик и где смотрели.
- **Проверяемая готовность.** План несёт acceptance-критерии, worker их проверяет, prime не верит словам — верифицирует.
- **Бюджеты вшиты в контракты.** Лимит tool-вызовов / строк отчёта / раундов поиска прямо в identity.
- **Плоский граф делегирования.** prime → все; worker/planner — точечно; исполнители никого не спавнят.
- **Дорогой мозг, дешёвые руки.** Оркестрация — на сильной модели, исполнение — на flash.

## Always-on оркестратор

`PRIME.md` — компактный протокол оркестратора (жёсткие триггеры делегирования, solo-whitelist, механика fire-and-forget). Расширение `extensions/prime-protocol.ts` дописывает его к системному промпту **каждой основной сессии**, превращая pi в prime без специальных команд.

Дочерние сессии субагентов протокол не получают — triple-guard: проверяется `PI_SUBAGENT_SESSION`, наличие identity в `--append-system-prompt` и отсутствие инструмента `subagent` в выбранном наборе — иначе scout перестал бы работать и начал бы делегировать.

## Структура

```
agents/                 # пул: 13 .md-определений
PRIME.md                # протокол always-on оркестратора
extensions/             # prime-protocol, ask-user-question, browser,
                        # web-fetch, prompt-snippets, custom-header,
                        # herdr-agent-state (managed by herdr), vlt-bridge
prompts/                # шаблоны сессий (implement, scout-and-plan, …)
skills/                 # analyze-sessions, pdf-reader, web-debug, youtube-transcript
settings.json           # провайдер/модель по умолчанию, скиллы, пакеты
npm/                    # манифесты pi-пакетов (ставятся через pi install)
sync.ps1                # обновление бэкапа из ~/.pi/agent
```

Не бэкапится (секреты/личное/генерация): `auth.json`, `trust.json`, `sessions/`, `models-store.json`, `node_modules`, `.venv`, профиль браузера (`.profile`), `*.bak-*`.

## Обновить бэкап

```powershell
powershell -ExecutionPolicy Bypass -File sync.ps1
git add -A && git commit -m "sync" && git push
```

## Восстановление

```bash
git clone https://github.com/goldenprofile/pi-config.git
mkdir -p ~/.pi/agent
cp -r pi-config/agents ~/.pi/agent/
cp -r pi-config/extensions pi-config/prompts pi-config/skills ~/.pi/agent/
cp pi-config/PRIME.md pi-config/settings.json ~/.pi/agent/
# npm-зависимости расширений и скиллов ставятся на месте:
# pi install … (пакеты), pip install -r (pdf-reader), npm i (browser, web-fetch)
# auth.json восстанавливается логином провайдера, не из бэкапа.
```

Агенты отдельно (без остального конфига):

```bash
cp pi-config/agents/*.md ~/.pi/agent/agents/     # глобально
# или в проект (переопределяет глобальных с тем же именем):
cp pi-config/agents/*.md <project>/.pi/agents/
```

Требуется расширение [subagents](https://github.com/goldenprofile/pi-extensions):

```bash
git clone https://github.com/goldenprofile/pi-extensions.git
cd pi-extensions && npm run sync
```

## Использование

Любая новая сессия pi уже работает как prime: нетривиальная задача сама расходится на scout/planner/worker/reviewer. Панели субагентов управляются вручную:

```
/subagent scout "найди, где валидируется вебхук, budget: 15"
/subagent_message <имя> "уточнение"      # steer / resume
/subagent_cancel <имя>                   # остановить
```

## Формат агента

```markdown
---
name: scout
description: Краткое описание (видно диспетчеру при выборе)
model: zai/glm-5.3-flash      # опционально, иначе модель сессии
thinking: medium              # off|minimal|low|medium|high|xhigh|max
tools: read, grep, ls, bash   # опционально, иначе полный набор
subagents: reviewer           # опционально: кому можно спавнить
auto-exit: true               # выходить ли по завершении
---

Identity — всё ниже frontmatter аппендится к system prompt ребёнка.
Выходной контракт в конце identity — то, что получит родитель.
```

Проектные агенты (`<project>/.pi/agents/`) переопределяют глобальных с тем же именем.
