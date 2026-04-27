// FILE: /src/js/seed.js
import {
  getProducts,
  setProducts,
  clearCart,
  clearAdminSession,
  clearCheckoutDraft
} from "./storage.js";

const SEED_URL = "./data/products.seed.json";
const SEED_VERSION = "url-photos-static-2026-04-27-v2";

/**
 * Фолбэк, если fetch() не работает при открытии через file://
 * (часто блокируется браузером). При запуске через http.server JSON подхватится.
 */
const SEED_FALLBACK = [
  {
    "id": "p_7ded6c7a123108_19db0aa76ef",
    "title": "Forward Fold 20 City",
    "category": "складной",
    "brand": "Forward",
    "price": 22990,
    "oldPrice": 25990,
    "inStock": false,
    "rating": 4.4,
    "reviewsCount": 22,
    "qaCount": 6,
    "tags": [
      "SALE"
    ],
    "images": [
      "https://i.pinimg.com/1200x/23/17/54/231754ac962eee51f15474865854ed0b.jpg"
    ],
    "bullets": [
      "Складная конструкция",
      "Удобно хранить дома",
      "Подходит для города",
      "Компактный и лёгкий"
    ],
    "description": "Складной городской велосипед для коротких поездок, хранения в квартире и перевозки в багажнике. Удобный вариант для повседневных дел.",
    "specs": [
      {
        "k": "Рама",
        "v": "Сталь"
      },
      {
        "k": "Колёса",
        "v": "20\""
      },
      {
        "k": "Тормоза",
        "v": "Ободные"
      },
      {
        "k": "Назначение",
        "v": "Город"
      },
      {
        "k": "Складной механизм",
        "v": "Есть"
      }
    ],
    "variants": {
      "sizes": [
        "One size"
      ],
      "colors": [
        "Серебристый",
        "Чёрный"
      ]
    },
    "popularity": 71,
    "createdAt": 1776785933648,
    "updatedAt": 1776785933648
  },
  {
    "id": "p_a9103aecddeef8_19db0a90b64",
    "title": "Stinger подростковый Storm 24",
    "category": "подростковый",
    "brand": "Stinger",
    "price": 25990,
    "oldPrice": 0,
    "inStock": true,
    "rating": 4.5,
    "reviewsCount": 18,
    "qaCount": 5,
    "tags": [
      "HIT"
    ],
    "images": [
      "https://i.pinimg.com/1200x/94/98/3d/94983d5f80fead3f45766108638ac444.jpg"
    ],
    "bullets": [
      "Колёса 24\"",
      "Подходит подросткам 8–13 лет",
      "Дисковые тормоза",
      "Удобен для двора и парка"
    ],
    "description": "Практичный подростковый велосипед для прогулок, школы и активного отдыха. Хорошо подойдёт как первый серьёзный велосипед.",
    "specs": [
      {
        "k": "Рама",
        "v": "Сталь"
      },
      {
        "k": "Колёса",
        "v": "24\""
      },
      {
        "k": "Тормоза",
        "v": "Дисковые механические"
      },
      {
        "k": "Скорости",
        "v": "7"
      },
      {
        "k": "Назначение",
        "v": "Подростковый"
      }
    ],
    "variants": {
      "sizes": [
        "12\"",
        "14\""
      ],
      "colors": [
        "Чёрный",
        "Оранжевый"
      ]
    },
    "popularity": 71,
    "createdAt": 1776785974947,
    "updatedAt": 1776785974947
  },
  {
    "id": "p_6639634992539_19db0a805dd",
    "title": "Novatrack Blast 18 Kids",
    "category": "детский",
    "brand": "Novatrack",
    "price": 14990,
    "oldPrice": 16990,
    "inStock": true,
    "rating": 4.9,
    "reviewsCount": 41,
    "qaCount": 13,
    "tags": [
      "HIT",
      "SALE"
    ],
    "images": [
      "https://i.pinimg.com/736x/93/09/4e/93094e4d38a26a0e4b03939521851ecc.jpg"
    ],
    "bullets": [
      "Колёса 18\"",
      "Надёжная стальная рама",
      "Яркий дизайн",
      "Подходит для детей 5–7 лет"
    ],
    "description": "Детский велосипед для уверенного старта и прогулок во дворе или в парке. Простая и надёжная модель для ежедневного использования.",
    "specs": [
      {
        "k": "Рама",
        "v": "Сталь"
      },
      {
        "k": "Колёса",
        "v": "18\""
      },
      {
        "k": "Тормоза",
        "v": "Ободные"
      },
      {
        "k": "Назначение",
        "v": "Детский"
      },
      {
        "k": "Дополнительно",
        "v": "Защитные крылья"
      }
    ],
    "variants": {
      "sizes": [
        "One size"
      ],
      "colors": [
        "Синий",
        "Красный",
        "Жёлтый"
      ]
    },
    "popularity": 81,
    "createdAt": 1776786011146,
    "updatedAt": 1776786011146
  },
  {
    "id": "p_3798677ea10c38_19db0a6d1c8",
    "title": "Liv City Breeze",
    "category": "женский",
    "brand": "Liv",
    "price": 46990,
    "oldPrice": 52990,
    "inStock": true,
    "rating": 4.6,
    "reviewsCount": 29,
    "qaCount": 8,
    "tags": [
      "SALE"
    ],
    "images": [
      "https://i.pinimg.com/736x/7e/ad/c2/7eadc28d7cb324292f3c252e21805fb9.jpg"
    ],
    "bullets": [
      "Комфортная женская геометрия",
      "Лёгкая алюминиевая рама",
      "Удобно для прогулок и города",
      "21 скорость"
    ],
    "description": "Женский велосипед для повседневных поездок, прогулок и комфортного катания по городу. Удобная посадка и прияткая управляемость.",
    "specs": [
      {
        "k": "Рама",
        "v": "Алюминий"
      },
      {
        "k": "Колёса",
        "v": "27.5\""
      },
      {
        "k": "Тормоза",
        "v": "Дисковые механические"
      },
      {
        "k": "Скорости",
        "v": "21"
      },
      {
        "k": "Назначение",
        "v": "Город / прогулки"
      }
    ],
    "variants": {
      "sizes": [
        "S",
        "M",
        "L"
      ],
      "colors": [
        "Белый",
        "Лавандовый",
        "Мятный"
      ]
    },
    "popularity": 76,
    "createdAt": 1776786058281,
    "updatedAt": 1776786058281
  },
  {
    "id": "p_9ba60c26ac9428_19db0a5d35c",
    "title": "Merida Road Sprint 200",
    "category": "шоссейный",
    "brand": "Merida",
    "price": 118990,
    "oldPrice": 0,
    "inStock": true,
    "rating": 4.8,
    "reviewsCount": 24,
    "qaCount": 7,
    "tags": [
      "HIT"
    ],
    "images": [
      "https://i.pinimg.com/1200x/60/69/dd/6069ddee253c263b998cfcdc8407b10f.jpg"
    ],
    "bullets": [
      "Лёгкая алюминиевая рама",
      "Быстрый разгон",
      "Комфортная посадка",
      "Подходит для тренировок и трассы"
    ],
    "description": "Шоссейный велосипед для скоростных поездок, тренировок и длинных маршрутов. Хороший вариант для тех, кто хочет лёгкий и быстрый велосипед.",
    "specs": [
      {
        "k": "Рама",
        "v": "Алюминий"
      },
      {
        "k": "Назначение",
        "v": "Шоссе"
      },
      {
        "k": "Тормоза",
        "v": "Дисковые механические"
      },
      {
        "k": "Скорости",
        "v": "18"
      },
      {
        "k": "Колёса",
        "v": "700C"
      }
    ],
    "variants": {
      "sizes": [
        "52",
        "54",
        "56"
      ],
      "colors": [
        "Красный",
        "Чёрный"
      ]
    },
    "popularity": 76,
    "createdAt": 1776786093363,
    "updatedAt": 1776786093363
  },
  {
    "id": "p_a4bd21296f392_19db0a41f7d",
    "title": "Stark Hunter 29 HD",
    "category": "горный",
    "brand": "Stark",
    "price": 58990,
    "oldPrice": 64990,
    "inStock": true,
    "rating": 4.7,
    "reviewsCount": 36,
    "qaCount": 11,
    "tags": [
      "HIT",
      "SALE"
    ],
    "images": [
      "https://i.pinimg.com/1200x/08/ea/13/08ea13e34bdb0edfb4279cfda22d19dd.jpg"
    ],
    "bullets": [
      "Колёса 29\"",
      "Гидравлические дисковые тормоза",
      "Амортизационная вилка",
      "Подходит для города и лесных троп"
    ],
    "description": "Универсальный горный велосипед для активного катания по городу, паркам и лёгкому бездорожью. Хорошо подойдёт для начинающих и любителей.",
    "specs": [
      {
        "k": "Рама",
        "v": "Алюминий"
      },
      {
        "k": "Колёса",
        "v": "29\""
      },
      {
        "k": "Вилка",
        "v": "Амортизационная"
      },
      {
        "k": "Тормоза",
        "v": "Дисковые гидравлические"
      },
      {
        "k": "Скорости",
        "v": "18"
      }
    ],
    "variants": {
      "sizes": [
        "17\"",
        "19\"",
        "21\"M"
      ],
      "colors": [
        "Чёрный",
        "Серый",
        "Синия"
      ]
    },
    "popularity": 78,
    "createdAt": 1776786122763,
    "updatedAt": 1776786122763
  },
  {
    "id": "p_7ecf1fa8ea1ad8_19d2943e0e2",
    "title": "ALTAIR В",
    "category": "горный",
    "brand": "ALTAIR",
    "price": 12999,
    "oldPrice": 0,
    "inStock": true,
    "rating": 4.5,
    "reviewsCount": 0,
    "qaCount": 0,
    "tags": [],
    "images": [
      "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTB5sOMbK_jhfKMrVVUAm2qeWsGhMQT3RMAiuAaGQ9JaHrsj2tvKG1UlPM6ldh3CgELiWS7_YBZYrQNn7AF1FtcBQgXFw_Xng"
    ],
    "bullets": [],
    "description": "",
    "specs": [],
    "variants": {
      "sizes": [
        "M"
      ],
      "colors": [
        "Чёрный"
      ]
    },
    "popularity": 45,
    "createdAt": 1774513848356,
    "updatedAt": 1774513848356
  },
  {
    "id": "p_b590d30c3c33b_19c320fa260",
    "title": "xube123",
    "category": "горный",
    "brand": "cube",
    "price": 12,
    "oldPrice": 123,
    "inStock": true,
    "rating": 3.7,
    "reviewsCount": 3,
    "qaCount": 1,
    "tags": [],
    "images": [
      "https://i.pinimg.com/736x/1f/fa/a8/1ffaa8bfaa9474c15139c893b317f853.jpg"
    ],
    "bullets": [],
    "description": "",
    "specs": [],
    "variants": {
      "sizes": [
        "M"
      ],
      "colors": [
        "Чёрный"
      ]
    },
    "popularity": 49,
    "createdAt": 1770366442745,
    "updatedAt": 1770366442746
  },
  {
    "id": "p_1001",
    "title": "Aspect Air 29 (2025)",
    "category": "горный",
    "brand": "Aspect",
    "price": 61590,
    "oldPrice": 76990,
    "inStock": true,
    "rating": 4.8,
    "reviewsCount": 128,
    "qaCount": 39,
    "tags": [
      "HIT",
      "SALE"
    ],
    "images": [
      "https://i.pinimg.com/736x/35/4f/85/354f856fd9a1e64f7a97e5fefd496b78.jpg"
    ],
    "bullets": [
      "Гидравлические дисковые тормоза",
      "9 скоростей",
      "Колёса 29\"",
      "Лёгкая алюминиевая рама"
    ],
    "description": "Горный велосипед для города и лёгкого трейла: уверенная посадка, дисковые тормоза и колёса 29\" для стабильности.",
    "specs": [
      {
        "k": "Рама",
        "v": "Алюминий"
      },
      {
        "k": "Колёса",
        "v": "29\""
      },
      {
        "k": "Вилка",
        "v": "Амортизационная"
      },
      {
        "k": "Тормоза",
        "v": "Дисковые гидравлические"
      },
      {
        "k": "Скорости",
        "v": "9"
      }
    ],
    "variants": {
      "sizes": [
        "16\"",
        "18\"",
        "20\""
      ],
      "colors": [
        "Чёрный",
        "Синий",
        "Красный"
      ]
    },
    "popularity": 90,
    "createdAt": 1770365886961,
    "updatedAt": 1770365886961
  }
];

async function loadSeed() {
  try {
    const res = await fetch(SEED_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Seed fetch failed");
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 1) throw new Error("Seed invalid");
    return data;
  } catch {
    return SEED_FALLBACK;
  }
}

/** Совместимость с app.js */
export async function initSeedIfNeeded() {
  const existing = getProducts();
  let currentVersion = null;
  try { currentVersion = localStorage.getItem("vm_seed_version_v1"); } catch {}

  if (Array.isArray(existing) && existing.length > 0 && currentVersion === SEED_VERSION) return;

  const seed = await loadSeed();
  setProducts(seed);
  try { localStorage.setItem("vm_seed_version_v1", SEED_VERSION); } catch {}
}

/** Алиас (если где-то используется) */
export async function ensureSeed() {
  return initSeedIfNeeded();
}

export async function resetToSeed() {
  const seed = await loadSeed();
  setProducts(seed);
  try { localStorage.setItem("vm_seed_version_v1", SEED_VERSION); } catch {}

  clearCart();
  clearCheckoutDraft();
  clearAdminSession();

  try { localStorage.removeItem("vm_promo_state_v1"); } catch {}
}