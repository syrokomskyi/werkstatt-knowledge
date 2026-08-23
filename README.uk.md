# @warpgogol/werkstatt-knowledge

Українська | [English](README.md)

Плагін Werkstatt для систем знань з підтримкою доказів. Реалізує `werkstatt/plugin@1` з `profileId: "knowledge-typescript-turborepo"`.

---

## Що робить цей плагін

Плагін Knowledge надає структурований пайплайн для створення та підтримки баз знань з підтримкою доказів — канонічні записи, прив'язка джерел, екстракція, матеріалізація та реліз. Він забезпечує 28 стек-інваріантів (KNO-001..028), які керують цілісністю джерел, валідністю канонічних записів, простежуваністю доказів, управлінням онтологією та готовністю до релізу.

---

## Коли потрібен цей плагін

Встановіть цей плагін, якщо ваш проєкт — система знань: структурований набір даних, де твердження підтверджені доказами з зареєстрованих джерел. Профіль `knowledge-typescript-turborepo` генерує правильну структуру папок, директорію контенту та інструменти.

---

## Встановлення

```sh
pnpm add -D @warpgogol/werkstatt @warpgogol/werkstatt-knowledge
```

---

## Профіль стеку

| Профіль | Тип проєкту | Перший робочий простір | Призначення |
| --- | --- | --- | --- |
| `knowledge-typescript-turborepo` | Система знань | `knowledge/my-kb` | Бази знань з підтримкою доказів, структуровані набори даних з джерельною простежуваністю |

Створення нового проєкту системи знань:

```sh
mkdir my-knowledge-base
cd my-knowledge-base
pnpm dlx @warpgogol/forge@latest create --in-place --profile knowledge-typescript-turborepo
```

---

## Kernel-модулі

Плагін реєструє 5 kernel-модулів з 23 командами:

| Модуль | Команди | Призначення |
| --- | --- | --- |
| `knowledge-source` | `knowledge.source.scan`, `knowledge.source.status`, `knowledge.source.bind`, `knowledge.source.verify` | Реєстрація, сканування, прив'язка та верифікація джерел |
| `knowledge-core` | `knowledge.verify`, `knowledge.status`, `knowledge.coverage`, `knowledge.audit`, `knowledge.candidate.validate`, `knowledge.promote`, `knowledge.transaction.status` | Валідація канонічних записів, аналіз покриття, аудит та промоція |
| `knowledge-extract` | `knowledge.extract.list`, `knowledge.extract.run`, `knowledge.extract.verify`, `knowledge.refresh.prepare`, `knowledge.refresh.apply` | Пайплайн екстракції та операції оновлення |
| `knowledge-materialize` | `knowledge.materialize`, `knowledge.materialize.verify`, `knowledge.projection.status`, `knowledge.projection.build` | Матеріалізація та побудова проєкцій |
| `knowledge-release` | `knowledge.release.check`, `knowledge.release.evidence`, `knowledge.release.manifest` | Перевірки готовності релізу, генерація evidence, маніфест |

---

## Хуки життєвого циклу

| Хук | Призначення |
| --- | --- |
| `materialize` | Підготовка робочого простору знань при матеріалізації місії |
| `build` | Побудова проєкцій знань |
| `checkGate` | Запуск 7 валідаторів (source, verify, coverage, audit, materialize, release, projection) |
| `releaseEvidence` | Генерація release evidence для бази знань |
| `scaffoldProject` | Скаффолд нового проєкту системи знань з маніфестом, конфігом та структурою папок |

---

## Конвенції шляхів

| Шлях | Значення |
| --- | --- |
| Директорія контенту | `knowledge` |
| Директорія дистрибуції | `.generated/knowledge/dist` |
| Точки входу | `knowledge/manifest.yaml`, `knowledge/ontology/schema-registry.yaml` |

---

## Інваріанти

Плагін забезпечує 28 стек-інваріантів (KNO-001..028). Див. `AGENTS.md` для повної таблиці з описами та пов'язаними командами перевірки.

Ключові групи інваріантів:

- **Цілісність джерел** (KNO-001..006) — валідність маніфесту, резолюція кореня джерел, незмінність джерел, відстеження fingerprint, безпека виконання коду
- **Валідність канонічних записів** (KNO-007..015) — валідність схеми, унікальність ID, простежуваність доказів, семантична достатність, реєстрація типів відношень, епістемічний статус, мова, виключення staging/laboratory
- **Управління онтологією** (KNO-016..017) — глобальні зміни вимагають прийнятий RFC, міжігрове прийняття концепцій вимагає прийняте рішення
- **Покриття та аудит** (KNO-018, KNO-020) — правила знаменника покриття, виявлення секретів
- **Матеріалізація** (KNO-019, KNO-027) — збіг канонічного хеша, детермінована матеріалізація
- **Реліз** (KNO-021..022) — метадані ліцензії набору даних, політика публікації за джерелом
- **Розрішення воркшопу** (KNO-024) — єдиний поточний плагін Werkstatt
- **Ізоляція bundle-джерела** (KNO-025) — поза glob-ами npm/Turbo workspace
- **Шлях мутації** (KNO-026) — канонічна мутація через transaction/promotion
- **Метадані доказів** (KNO-028) — резolvable repo/commit/path метадані

---

## Архітектура

```text
src/
  index.ts                    # Точка входу плагіна — werkstattKnowledgePlugin
  paths/                      # Конвенції шляхів знань
  invariants/                 # Декларації стек-інваріантів KNO-001..028
  source/                     # Модуль knowledge-source (scan, status, bind, verify)
  core/                       # Модуль knowledge-core (verify, status, coverage, audit, promote)
  extract/                    # Модуль knowledge-extract (list, run, verify, refresh)
  materialize/                # Модуль knowledge-materialize (materialize, projection)
  release/                    # Модуль knowledge-release (check, evidence, manifest)
  hooks/                      # 5 хуків життєвого циклу
```

---

## Архітектурні обмеження

- Немає адаптерів деплою у v1 (згідно з SPEC-v1.0 розділ 7).
- Немає імпортів з `@warpgogol/werkstatt-site` або інших стек-плагінів.
- Немає нових хуків рушія — список хуків закритий на п'яти.
- Немає ШІ-оркестрації або навичок всередині плагіна.
- Доменна логіка знань ізольована від об'єкта входу плагіна для майбутньої міграції сертифікації.

---

## RFC

- **RFC-0894** — Додавання плагіна werkstatt-knowledge (специфікація та реалізація).
- **SPEC-v1.0** — `docs/specs/werkstatt-knowledge-plugin/SPEC-v1.0.md`
- **PLUGIN-INVARIANTS** — `docs/specs/werkstatt-knowledge-plugin/PLUGIN-INVARIANTS.md`

---

## Публікація в npm

Цей пакет публікується в реєстр npm як `@warpgogol/werkstatt-knowledge`. Публікація автоматизована через GitHub Actions CI.

### Як це працює

1. Вихідний код знаходиться в монорепозиторії [warpgogol/werkstatt](https://github.com/syrokomskyi/werkstatt) у `packages/werkstatt-knowledge/`.
2. [`@warpgogol/repo-extract`](https://github.com/syrokomskyi/repo-extract) витягує пакет у автономний репозиторій [syrokomskyi/werkstatt-knowledge](https://github.com/syrokomskyi/werkstatt-knowledge), вирівнюючи його до кореня репозиторію та видаляючи залежності робочого простору.
3. Згенерований GitHub Actions CI-воркфлоу запускається при кожному пуші в `main`: lint → typecheck → build → test → `npm publish --provenance --access public`.
4. Секрет `NPM_TOKEN` має бути встановлений у [налаштуваннях репозиторію](https://github.com/syrokomskyi/werkstatt-knowledge/settings/secrets/actions).

### Запуск нового релізу

З кореня монорепозиторію werkstatt:

```sh
# 1. Підняти версію в packages/werkstatt-knowledge/package.json
# 2. Запустити екстракцію (витягує + комітить + пушить в github.com:syrokomskyi/werkstatt-knowledge.git)
pnpm exec repo-extract --config packages/werkstatt-knowledge/extract.config.yaml --verbose

# 3. CI підхоплює пуш і публікує в npm автоматично
```

Після завершення CI перевірте нову версію на [npmjs.com/package/@warpgogol/werkstatt-knowledge](https://www.npmjs.com/package/@warpgogol/werkstatt-knowledge).

---

## Ліцензія

Apache-2.0
