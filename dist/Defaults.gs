const CONFIGURATION_DEFAULTS = Object.freeze({
  "settings": {
    "timezone": "Europe/Madrid",
    "windowDays": 10,
    "pageSize": 30,
    "maxCustomFeeds": 30,
    "maxFeedBytes": 2000000,
    "maxItems": 200,
    "exportLimit": 10000,
    "newsReadLimit": 10000,
    "eventLimit": 20000,
    "retentionDays": 90,
    "trendPoints": 60,
    "trendSeries": 6,
    "collectionBatch": 3,
    "retryMinutes": 10,
    "pauseMinutes": 5,
    "dailyHour": 7,
    "briefingLimit": 50,
    "unclassifiedTopic": "Sin clasificar",
    "defaultEntity": "BBVA",
    "defaultSegment": "Empresas e instituciones",
    "defaultTopic": "",
    "defaultCountry": "",
    "searchTerms": [
      "banca",
      "banking",
      "empresa",
      "pyme",
      "autónomo",
      "retail",
      "cuenta",
      "tarjeta",
      "financiación",
      "pagos",
      "producto",
      "lanzamiento",
      "ticari bankacılık",
      "nakit yönetimi",
      "KOBİ",
      "kredi",
      "business",
      "SME",
      "account",
      "card",
      "finance",
      "payment",
      "product",
      "launch",
      "hesap",
      "kart",
      "ürün",
      "lansman"
    ],
    "disabledSources": [],
    "maxSubscriptions": 20,
    "unknownCountry": "Sin determinar",
    "defaultPeriodicity": "monthly",
    "newsletterEnabled": false,
    "newsletterBatch": 20,
    "newsletterSender": "news-radar.group@bbva.com",
    "newsletterSenderName": "News Radar · BBVA Empresas",
    "newsletterDailyLimit": 100,
    "newsletterAppUrl": ""
  },
  "entities": [
    {
      "name": "BBVA",
      "type": "Banco tradicional",
      "aliases": [
        "BBVA Empresas",
        "BBVA Business",
        "BBVA Net Cash",
        "Garanti BBVA"
      ],
      "countries": [
        "España",
        "México",
        "Perú",
        "Colombia",
        "Argentina",
        "Turquía",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Santander",
      "type": "Banco tradicional",
      "aliases": [
        "Santander Empresas"
      ],
      "countries": [
        "España",
        "México",
        "Argentina",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "CaixaBank",
      "type": "Banco tradicional",
      "aliases": [
        "CaixaBank Empresas"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Sabadell",
      "type": "Banco tradicional",
      "aliases": [
        "Sabadell Empresas"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Bankinter",
      "type": "Banco tradicional",
      "aliases": [
        "Bankinter Empresas"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Banorte",
      "type": "Banco tradicional",
      "aliases": [
        "Banorte Empresas"
      ],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "Banco del Bajío",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "HSBC",
      "type": "Banco tradicional",
      "aliases": [
        "HSBC Empresas"
      ],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "BCP",
      "type": "Banco tradicional",
      "aliases": [
        "BCP Empresas"
      ],
      "countries": [
        "Perú"
      ],
      "enabled": true
    },
    {
      "name": "Interbank",
      "type": "Banco tradicional",
      "aliases": [
        "Interbank Empresas"
      ],
      "countries": [
        "Perú"
      ],
      "enabled": true
    },
    {
      "name": "Scotiabank",
      "type": "Banco tradicional",
      "aliases": [
        "Scotiabank Empresas"
      ],
      "countries": [
        "Perú",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Bancolombia",
      "type": "Banco tradicional",
      "aliases": [
        "Bancolombia Empresas"
      ],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Banco de Bogotá",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Banco de Occidente",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Davivienda",
      "type": "Banco tradicional",
      "aliases": [
        "Davivienda Empresas"
      ],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Banco Galicia",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Banco Nación",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Banco Macro",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Akbank",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "İşbank",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "Yapı Kredi",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "Halkbank",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "BROU",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Itaú",
      "type": "Banco tradicional",
      "aliases": [
        "Itaú Empresas"
      ],
      "countries": [
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Revolut",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "N26",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Qonto",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Wise",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Nubank",
      "type": "Neobanco",
      "aliases": [
        "Nu"
      ],
      "countries": [
        "México",
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Mercado Pago",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México",
        "Argentina",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Ualá",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México",
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Klar",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "Konfío",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "Yape",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "Perú"
      ],
      "enabled": true
    },
    {
      "name": "Openbank",
      "type": "Neobanco",
      "aliases": [
        "Open Bank"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "bunq",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "myPOS",
      "type": "Fintech",
      "aliases": [
        "myPOS Glass"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Stripe",
      "type": "Fintech",
      "aliases": [
        "Stripe Terminal"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    }
  ],
  "geographies": [
    {
      "name": "España",
      "code": "ES",
      "language": "es",
      "mapId": "724",
      "enabled": true,
      "searchName": "España"
    },
    {
      "name": "México",
      "code": "MX",
      "language": "es-419",
      "mapId": "484",
      "enabled": true,
      "searchName": "México"
    },
    {
      "name": "Perú",
      "code": "PE",
      "language": "es-419",
      "mapId": "604",
      "enabled": true,
      "searchName": "Perú"
    },
    {
      "name": "Colombia",
      "code": "CO",
      "language": "es-419",
      "mapId": "170",
      "enabled": true,
      "searchName": "Colombia"
    },
    {
      "name": "Argentina",
      "code": "AR",
      "language": "es-419",
      "mapId": "032",
      "enabled": true,
      "searchName": "Argentina"
    },
    {
      "name": "Turquía",
      "code": "TR",
      "language": "tr",
      "mapId": "792",
      "enabled": true,
      "searchName": "Türkiye"
    },
    {
      "name": "Uruguay",
      "code": "UY",
      "language": "es-419",
      "mapId": "858",
      "enabled": true,
      "searchName": "Uruguay"
    }
  ],
  "topics": [
    {
      "name": "Continuidad de servicio",
      "terms": [
        "incidencia",
        "interrupción",
        "caída",
        "outage",
        "kesinti",
        "arıza",
        "interruption",
        "failure",
        "hizmet kesintisi"
      ],
      "enabled": true
    },
    {
      "name": "Regulación y ratings",
      "terms": [
        "regulación",
        "sanción",
        "rating",
        "calificación",
        "regulator",
        "downgrade",
        "normativa",
        "verifactu",
        "supervisor",
        "düzenleme",
        "kredi notu",
        "regulation",
        "compliance",
        "yönetmelik"
      ],
      "enabled": true
    },
    {
      "name": "Financiación",
      "terms": [
        "financia",
        "préstamo",
        "sindicado",
        "bono",
        "project finance",
        "loan",
        "bond",
        "emisión",
        "deuda",
        "capital markets",
        "finansman",
        "kredi",
        "tahvil",
        "leasing",
        "factoring",
        "confirming",
        "crédito",
        "aval"
      ],
      "enabled": true
    },
    {
      "name": "Transaction banking",
      "terms": [
        "cash management",
        "transaction banking",
        "tesorería",
        "comercio exterior",
        "trade finance",
        "pagos",
        "nakit yönetimi",
        "ödeme",
        "hazine",
        "payment",
        "payments",
        "işlem bankacılığı"
      ],
      "enabled": true
    },
    {
      "name": "Resultados y capital",
      "terms": [
        "recompra",
        "dividendo",
        "resultados",
        "beneficio",
        "capital ratio",
        "earnings",
        "kâr",
        "sermaye",
        "dividend",
        "buyback",
        "profit",
        "temettü",
        "geri alım"
      ],
      "enabled": true
    },
    {
      "name": "Estrategia y alianzas",
      "terms": [
        "alianza",
        "adquisición",
        "fusión",
        "corporate",
        "cib",
        "m&a",
        "birleşme",
        "satın alma",
        "partnership",
        "acquisition",
        "merger",
        "iş birliği",
        "ortaklık",
        "anlaşma"
      ],
      "enabled": true
    },
    {
      "name": "Empresas y pymes",
      "terms": [
        "empresa",
        "pyme",
        "sme",
        "b2b",
        "business banking",
        "emprendedor",
        "işletme",
        "ticari",
        "kobi",
        "enterprise",
        "entrepreneur",
        "girişimci"
      ],
      "enabled": true
    },
    {
      "name": "Sostenibilidad",
      "terms": [
        "sostenib",
        "esg",
        "sustainable",
        "sürdürülebilir"
      ],
      "enabled": true
    },
    {
      "name": "Productos y experiencia",
      "terms": [
        "cuenta",
        "tarjeta",
        "depósito",
        "hipoteca",
        "app",
        "plataforma",
        "producto",
        "servicio",
        "account",
        "card",
        "product",
        "mevduat",
        "seguro",
        "inversión",
        "fondo",
        "monedero",
        "wallet",
        "terminal",
        "tpv",
        "factura",
        "programa",
        "deposit",
        "mortgage",
        "insurance",
        "investment",
        "platform",
        "service",
        "hesap",
        "kart",
        "ürün",
        "hizmet",
        "sigorta",
        "yatırım",
        "fatura",
        "program"
      ],
      "enabled": true
    }
  ],
  "segments": [
    {
      "name": "Empresas e instituciones",
      "terms": [
        "empresa",
        "pyme",
        "sme",
        "autónom",
        "emprendedor",
        "corporat",
        "institucion",
        "business",
        "b2b",
        "cib",
        "comercio exterior",
        "tesorería",
        "trade finance",
        "işletme",
        "ticari",
        "kobi",
        "municipio",
        "administración pública",
        "universidad",
        "organismo",
        "ayuntamiento",
        "profesional",
        "independiente",
        "freelanc",
        "self-employed",
        "smb"
      ],
      "enabled": true
    },
    {
      "name": "Retail",
      "terms": [
        "particular",
        "consumidor",
        "familia",
        "retail",
        "minorista",
        "personal",
        "hipoteca",
        "nómina",
        "ahorro",
        "consumer",
        "bireysel",
        "tasarruf",
        "maaş"
      ],
      "enabled": true
    }
  ],
  "signals": [
    {
      "name": "Lanzamiento de producto",
      "terms": [
        "lanza",
        "lanzamiento",
        "estrena",
        "presenta",
        "nuevo",
        "nueva",
        "launch",
        "introduce",
        "unveils",
        "yeni",
        "launches",
        "introduces",
        "unveil",
        "sunar",
        "tanıt",
        "başlat",
        "piyasaya"
      ],
      "context": [
        "cuenta",
        "tarjeta",
        "plataforma",
        "producto",
        "servicio",
        "financia",
        "préstamo",
        "pago",
        "depósito",
        "hipoteca",
        "app",
        "account",
        "card",
        "product",
        "loan",
        "leasing",
        "factoring",
        "confirming",
        "crédito",
        "aval",
        "seguro",
        "inversión",
        "fondo",
        "monedero",
        "wallet",
        "terminal",
        "tpv",
        "programa",
        "service",
        "platform",
        "payment",
        "deposit",
        "mortgage",
        "insurance",
        "investment",
        "hesap",
        "kart",
        "ürün",
        "hizmet",
        "ödeme",
        "kredi",
        "mevduat",
        "sigorta",
        "yatırım"
      ],
      "enabled": true,
      "scope": "headline",
      "exclude": [
        "qué es",
        "qué son",
        "cómo",
        "guía",
        "premio",
        "reskilling",
        "formación tecnológica",
        "colaboradores",
        "what is",
        "what are",
        "how to",
        "guide",
        "award",
        "nedir",
        "nasıl",
        "rehber",
        "ödül"
      ]
    },
    {
      "name": "Mejora de oferta",
      "terms": [
        "amplía",
        "mejora",
        "renueva",
        "incorpora",
        "reduce",
        "aumenta",
        "enhances",
        "expands",
        "improves",
        "upgrades",
        "extends",
        "yenile",
        "geliştir",
        "genişlet",
        "iyileştir"
      ],
      "context": [
        "cuenta",
        "tarjeta",
        "producto",
        "servicio",
        "comisión",
        "tipo",
        "plataforma",
        "pago",
        "financia",
        "account",
        "card",
        "product",
        "service",
        "platform",
        "payment",
        "loan",
        "deposit",
        "mortgage",
        "insurance",
        "investment",
        "hesap",
        "kart",
        "ürün",
        "hizmet",
        "ödeme",
        "kredi",
        "mevduat",
        "sigorta",
        "yatırım"
      ],
      "enabled": true,
      "scope": "headline",
      "exclude": [
        "qué es",
        "qué son",
        "cómo",
        "guía",
        "premio",
        "reskilling",
        "formación tecnológica",
        "colaboradores",
        "what is",
        "what are",
        "how to",
        "guide",
        "award",
        "nedir",
        "nasıl",
        "rehber",
        "ödül"
      ]
    },
    {
      "name": "Alianza estratégica",
      "terms": [
        "alianza",
        "acuerdo",
        "partnership",
        "acuerd",
        "colabora con",
        "colaboración",
        "partners with",
        "agreement",
        "iş birliği",
        "işbirliği",
        "ortaklık",
        "anlaşma"
      ],
      "context": [],
      "enabled": true,
      "scope": "headline",
      "exclude": [
        "qué es",
        "qué son",
        "cómo",
        "guía",
        "premio",
        "reskilling",
        "formación tecnológica",
        "colaboradores",
        "what is",
        "what are",
        "how to",
        "guide",
        "award",
        "nedir",
        "nasıl",
        "rehber",
        "ödül"
      ]
    }
  ],
  "feeds": [
    {
      "id": "bbva-empresas",
      "name": "BBVA · Empresas",
      "url": "https://www.bbva.com/es/empresas/feed/",
      "domain": "bbva.com",
      "entity": "BBVA",
      "country": "Sin determinar",
      "enabled": true,
      "language": "es"
    },
    {
      "id": "bbva-corporativo",
      "name": "BBVA · Información corporativa",
      "url": "https://www.bbva.com/es/economia-y-finanzas/informacion-corporativa/feed/",
      "domain": "bbva.com",
      "entity": "BBVA",
      "country": "Sin determinar",
      "enabled": true,
      "language": "es"
    },
    {
      "id": "bbva-english",
      "name": "BBVA · English",
      "url": "https://www.bbva.com/en/feed/",
      "domain": "bbva.com",
      "entity": "BBVA",
      "country": "Sin determinar",
      "language": "en",
      "enabled": true
    },
    {
      "id": "finextra-mobile",
      "name": "Finextra · Mobile & online",
      "url": "https://www.finextra.com/rss/channel.aspx?channel=mobile",
      "domain": "finextra.com",
      "entity": "Sector",
      "country": "Sin determinar",
      "enabled": true,
      "language": "en"
    },
    {
      "id": "finextra-payments",
      "name": "Finextra · Payments",
      "url": "https://www.finextra.com/rss/channel.aspx?channel=payments",
      "domain": "finextra.com",
      "entity": "Sector",
      "country": "Sin determinar",
      "enabled": true,
      "language": "en"
    },
    {
      "id": "bankinter-blog",
      "name": "Bankinter · Blog",
      "url": "https://www.bankinter.com/blog/rss",
      "domain": "bankinter.com",
      "entity": "Bankinter",
      "country": "Sin determinar",
      "enabled": true,
      "language": "es"
    },
    {
      "id": "stripe-blog",
      "name": "Stripe · Blog",
      "url": "https://stripe.com/blog/feed.rss",
      "domain": "stripe.com",
      "entity": "Stripe",
      "country": "Sin determinar",
      "enabled": true,
      "language": "en"
    }
  ],
  "capabilities": {
    "Empresas": [
      {
        "name": "Aplicaciones móviles empresariales",
        "terms": [
          "app empresas",
          "business app",
          "mobile business banking"
        ],
        "enabled": true
      },
      {
        "name": "Banca electrónica corporativa",
        "terms": [
          "banca electronica corporativa",
          "corporate online banking",
          "net cash"
        ],
        "enabled": true
      },
      {
        "name": "Onboarding digital de empresas",
        "terms": [
          "onboarding empresas",
          "business onboarding",
          "apertura digital empresas"
        ],
        "enabled": true
      },
      {
        "name": "Gestión de usuarios, roles y permisos",
        "terms": [
          "roles y permisos",
          "user permissions",
          "multiusuario"
        ],
        "enabled": true
      },
      {
        "name": "Autenticación y seguridad",
        "terms": [
          "autenticacion",
          "authentication",
          "seguridad digital"
        ],
        "enabled": true
      },
      {
        "name": "Firma electrónica",
        "terms": [
          "firma electronica",
          "electronic signature",
          "e-signature"
        ],
        "enabled": true
      },
      {
        "name": "Autorización de operaciones",
        "terms": [
          "autorizacion de operaciones",
          "payment approval",
          "firma mancomunada"
        ],
        "enabled": true
      },
      {
        "name": "Pagos",
        "terms": [
          "pagos",
          "payments",
          "pagos digitales",
          "digital payments"
        ],
        "enabled": true
      },
      {
        "name": "Cobros y recaudación",
        "terms": [
          "cobros digitales",
          "digital collections",
          "recaudacion"
        ],
        "enabled": true
      },
      {
        "name": "Tesorería y cash management",
        "terms": [
          "tesoreria",
          "cash management",
          "nakit yonetimi"
        ],
        "enabled": true
      },
      {
        "name": "Gestión de liquidez",
        "terms": [
          "gestion de liquidez",
          "liquidity management",
          "cash pooling"
        ],
        "enabled": true
      },
      {
        "name": "Conciliación bancaria",
        "terms": [
          "conciliacion",
          "reconciliation"
        ],
        "enabled": true
      },
      {
        "name": "Financiación digital",
        "terms": [
          "financiacion digital",
          "digital lending"
        ],
        "enabled": true
      },
      {
        "name": "Préstamos y líneas de crédito",
        "terms": [
          "prestamo online",
          "digital loan",
          "linea de credito"
        ],
        "enabled": true
      },
      {
        "name": "Factoring",
        "terms": [
          "factoring"
        ],
        "enabled": true
      },
      {
        "name": "Comercio exterior",
        "terms": [
          "comercio exterior",
          "trade finance"
        ],
        "enabled": true
      },
      {
        "name": "Divisas y pagos internacionales",
        "terms": [
          "pagos internacionales",
          "cross-border payments",
          "divisas",
          "money transfer"
        ],
        "enabled": true
      },
      {
        "name": "Tarjetas de empresa",
        "terms": [
          "tarjetas de empresa",
          "business cards",
          "corporate cards"
        ],
        "enabled": true
      },
      {
        "name": "Gestión de gastos corporativos",
        "terms": [
          "gestion de gastos",
          "expense management"
        ],
        "enabled": true
      },
      {
        "name": "Integraciones ERP",
        "terms": [
          "integracion erp",
          "erp integration"
        ],
        "enabled": true
      },
      {
        "name": "API bancarias",
        "terms": [
          "api bancaria",
          "banking api",
          "banking apis",
          "api"
        ],
        "enabled": true
      },
      {
        "name": "Open banking empresarial",
        "terms": [
          "open banking empresarial",
          "business open banking"
        ],
        "enabled": true
      },
      {
        "name": "Embedded finance",
        "terms": [
          "embedded finance",
          "finanzas embebidas"
        ],
        "enabled": true
      },
      {
        "name": "Automatización de procesos",
        "terms": [
          "automatizacion",
          "automation"
        ],
        "enabled": true
      },
      {
        "name": "Inteligencia artificial aplicada al canal",
        "terms": [
          "inteligencia artificial",
          "artificial intelligence",
          "agentic ai",
          "ia",
          "ai"
        ],
        "enabled": true
      },
      {
        "name": "Asistentes digitales",
        "terms": [
          "asistente digital",
          "digital assistant"
        ],
        "enabled": true
      },
      {
        "name": "Personalización de la experiencia",
        "terms": [
          "personalizacion",
          "personalisation",
          "personalization"
        ],
        "enabled": true
      },
      {
        "name": "Experiencia de usuario y accesibilidad",
        "terms": [
          "experiencia de usuario",
          "user experience",
          "accesibilidad"
        ],
        "enabled": true
      },
      {
        "name": "Autoservicio empresarial",
        "terms": [
          "autoservicio",
          "self-service"
        ],
        "enabled": true
      },
      {
        "name": "Notificaciones y alertas",
        "terms": [
          "notificaciones",
          "notifications",
          "alertas"
        ],
        "enabled": true
      },
      {
        "name": "Documentación y gestión documental",
        "terms": [
          "gestion documental",
          "document management"
        ],
        "enabled": true
      },
      {
        "name": "Identidad y verificación digital",
        "terms": [
          "identidad digital",
          "digital identity",
          "kyb"
        ],
        "enabled": true
      },
      {
        "name": "Omnicanalidad",
        "terms": [
          "omnicanal",
          "omnichannel"
        ],
        "enabled": true
      },
      {
        "name": "Analítica y reporting financiero",
        "terms": [
          "reporting financiero",
          "financial reporting",
          "analitica financiera"
        ],
        "enabled": true
      },
      {
        "name": "Nuevos servicios digitales para pymes y autónomos",
        "terms": [
          "servicios digitales pymes",
          "digital sme",
          "digital freelancers"
        ],
        "enabled": true
      },
      {
        "name": "Biometría",
        "terms": [
          "biometria",
          "biometric"
        ],
        "enabled": true
      },
      {
        "name": "Beneficiarios",
        "terms": [
          "beneficiarios",
          "beneficiaries"
        ],
        "enabled": true
      },
      {
        "name": "Remesas",
        "terms": [
          "remesas",
          "remittances"
        ],
        "enabled": true
      },
      {
        "name": "Pagos masivos",
        "terms": [
          "pagos masivos",
          "bulk payments"
        ],
        "enabled": true
      },
      {
        "name": "Aprobaciones multinivel",
        "terms": [
          "aprobaciones multinivel",
          "multi-level approvals"
        ],
        "enabled": true
      },
      {
        "name": "Accesibilidad",
        "terms": [
          "accesibilidad",
          "accessibility"
        ],
        "enabled": true
      },
      {
        "name": "Confirming",
        "terms": [
          "confirming",
          "reverse factoring"
        ],
        "enabled": true
      },
      {
        "name": "Transferencias",
        "terms": [
          "transferencias",
          "transfers"
        ],
        "enabled": true
      }
    ],
    "Retail": [
      {
        "name": "Aplicaciones de banca móvil",
        "terms": [
          "banca movil",
          "mobile banking",
          "banking app",
          "mobil bankacilik"
        ],
        "enabled": true
      },
      {
        "name": "Banca online",
        "terms": [
          "banca online",
          "online banking",
          "internet banking"
        ],
        "enabled": true
      },
      {
        "name": "Onboarding digital",
        "terms": [
          "onboarding digital",
          "digital onboarding"
        ],
        "enabled": true
      },
      {
        "name": "Identificación y verificación digital",
        "terms": [
          "verificacion digital",
          "digital verification",
          "kyc"
        ],
        "enabled": true
      },
      {
        "name": "Autenticación biométrica",
        "terms": [
          "biometria",
          "biometric",
          "face id"
        ],
        "enabled": true
      },
      {
        "name": "Seguridad y prevención del fraude",
        "terms": [
          "prevencion del fraude",
          "fraud prevention"
        ],
        "enabled": true
      },
      {
        "name": "Pagos móviles",
        "terms": [
          "pagos moviles",
          "mobile payments",
          "bizum pay"
        ],
        "enabled": true
      },
      {
        "name": "Transferencias inmediatas",
        "terms": [
          "transferencias inmediatas",
          "instant payments",
          "instant transfers"
        ],
        "enabled": true
      },
      {
        "name": "Pagos P2P",
        "terms": [
          "pagos p2p",
          "p2p payments"
        ],
        "enabled": true
      },
      {
        "name": "Tarjetas virtuales",
        "terms": [
          "tarjeta virtual",
          "virtual card"
        ],
        "enabled": true
      },
      {
        "name": "Wallets digitales",
        "terms": [
          "wallet",
          "monedero digital"
        ],
        "enabled": true
      },
      {
        "name": "Gestión de tarjetas",
        "terms": [
          "gestion de tarjetas",
          "card management"
        ],
        "enabled": true
      },
      {
        "name": "Finanzas personales",
        "terms": [
          "finanzas personales",
          "personal finance"
        ],
        "enabled": true
      },
      {
        "name": "Ahorro digital",
        "terms": [
          "ahorro digital",
          "digital savings",
          "deposit account"
        ],
        "enabled": true
      },
      {
        "name": "Inversión digital",
        "terms": [
          "inversion digital",
          "digital investing",
          "robo-advisor",
          "cash fund"
        ],
        "enabled": true
      },
      {
        "name": "Financiación al consumo",
        "terms": [
          "financiacion al consumo",
          "consumer lending"
        ],
        "enabled": true
      },
      {
        "name": "Hipotecas digitales",
        "terms": [
          "hipoteca digital",
          "digital mortgage"
        ],
        "enabled": true
      },
      {
        "name": "Contratación digital",
        "terms": [
          "contratacion digital",
          "digital contracting"
        ],
        "enabled": true
      },
      {
        "name": "Firma electrónica",
        "terms": [
          "firma electronica",
          "electronic signature",
          "e-signature"
        ],
        "enabled": true
      },
      {
        "name": "Gestión de suscripciones",
        "terms": [
          "gestion de suscripciones",
          "subscription management"
        ],
        "enabled": true
      },
      {
        "name": "Open banking",
        "terms": [
          "open banking",
          "banca abierta"
        ],
        "enabled": true
      },
      {
        "name": "Embedded finance",
        "terms": [
          "embedded finance",
          "finanzas embebidas"
        ],
        "enabled": true
      },
      {
        "name": "Personalización",
        "terms": [
          "personalizacion",
          "personalisation",
          "personalization"
        ],
        "enabled": true
      },
      {
        "name": "Experiencia de usuario",
        "terms": [
          "experiencia de usuario",
          "user experience"
        ],
        "enabled": true
      },
      {
        "name": "Accesibilidad",
        "terms": [
          "accesibilidad",
          "accessibility"
        ],
        "enabled": true
      },
      {
        "name": "Asistentes virtuales",
        "terms": [
          "asistente virtual",
          "virtual assistant",
          "chatbot"
        ],
        "enabled": true
      },
      {
        "name": "Inteligencia artificial",
        "terms": [
          "inteligencia artificial",
          "artificial intelligence",
          "agentic ai",
          "ia",
          "ai"
        ],
        "enabled": true
      },
      {
        "name": "Atención al cliente digital",
        "terms": [
          "atencion digital",
          "digital customer service"
        ],
        "enabled": true
      },
      {
        "name": "Autoservicio",
        "terms": [
          "autoservicio",
          "self-service"
        ],
        "enabled": true
      },
      {
        "name": "Notificaciones inteligentes",
        "terms": [
          "notificaciones inteligentes",
          "smart notifications"
        ],
        "enabled": true
      },
      {
        "name": "Educación financiera digital",
        "terms": [
          "educacion financiera digital",
          "digital financial education"
        ],
        "enabled": true
      },
      {
        "name": "Fidelización y recompensas",
        "terms": [
          "fidelizacion",
          "rewards",
          "loyalty"
        ],
        "enabled": true
      },
      {
        "name": "Omnicanalidad",
        "terms": [
          "omnicanal",
          "omnichannel"
        ],
        "enabled": true
      },
      {
        "name": "Agregación financiera",
        "terms": [
          "agregacion financiera",
          "account aggregation"
        ],
        "enabled": true
      },
      {
        "name": "Nuevos productos y funcionalidades digitales",
        "terms": [
          "funcionalidad digital",
          "digital feature",
          "nueva funcionalidad",
          "new feature",
          "nuevas funcionalidades",
          "mobile feature"
        ],
        "enabled": true
      },
      {
        "name": "Recibos",
        "terms": [
          "recibos",
          "direct debits"
        ],
        "enabled": true
      },
      {
        "name": "Control de gastos",
        "terms": [
          "control de gastos",
          "spending controls"
        ],
        "enabled": true
      },
      {
        "name": "Límites de tarjetas",
        "terms": [
          "limites de tarjetas",
          "card limits"
        ],
        "enabled": true
      },
      {
        "name": "Dispositivos",
        "terms": [
          "dispositivos",
          "devices"
        ],
        "enabled": true
      },
      {
        "name": "Seguridad",
        "terms": [
          "seguridad",
          "security"
        ],
        "enabled": true
      }
    ]
  }
});
