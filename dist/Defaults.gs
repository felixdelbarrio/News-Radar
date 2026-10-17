const CONFIGURATION_VOCABULARY_UPDATE = Object.freeze({
  "version": "3.3.0",
  "relevanceRules": [
    {
      "name": "Evidencia de canal digital",
      "terms": [
        "transacciones inmediatas",
        "pagos inmediatos",
        "bre-b",
        "instant transfers"
      ]
    },
    {
      "name": "Servicios financieros y operativa",
      "terms": [
        "transacciones inmediatas",
        "llaves",
        "bre-b",
        "gastos",
        "nominas",
        "payroll",
        "impuestos",
        "tax",
        "adquirencia",
        "acquiring",
        "depositos",
        "deposit",
        "seguros",
        "insurance",
        "huella de carbono",
        "carbon footprint",
        "stablecoin",
        "stablecoins"
      ]
    },
    {
      "name": "Capacidades reutilizables por empresas",
      "terms": [
        "transacciones inmediatas",
        "pagos inmediatos",
        "bre-b",
        "digitaliza gastos",
        "request to pay",
        "cyber insurance",
        "ciberseguro",
        "stablecoin",
        "stablecoins",
        "retargeting",
        "deeplink"
      ]
    },
    {
      "name": "Infraestructura y servicios empresariales",
      "terms": [
        "bre-b"
      ]
    }
  ],
  "capabilities": [
    {
      "name": "Gestión de gastos corporativos",
      "terms": [
        "digitaliza gastos",
        "digitalizacion de gastos",
        "digitises expenses",
        "digitizes expenses"
      ]
    },
    {
      "name": "Transferencias",
      "terms": [
        "transacciones inmediatas",
        "pagos inmediatos",
        "bre-b",
        "instant transfers"
      ]
    }
  ],
  "searchLanguages": [
    {
      "name": "Español",
      "terms": [
        "nominas digitales",
        "pago de impuestos",
        "adquirencia",
        "depositos a plazo",
        "huella de carbono",
        "salud financiera",
        "ciberseguro",
        "stablecoins",
        "request to pay",
        "deeplink"
      ]
    },
    {
      "name": "English",
      "terms": [
        "payroll",
        "tax payments",
        "merchant acquiring",
        "term deposit",
        "carbon footprint",
        "financial health",
        "cyber insurance",
        "stablecoin",
        "request to pay",
        "deep link"
      ]
    }
  ]
});
const CONFIGURATION_DEFAULTS = Object.freeze({
  "settings": {
    "timezone": "Europe/Madrid",
    "windowDays": 10,
    "pageSize": 30,
    "maxCustomFeeds": 30,
    "maxFeedBytes": 2000000,
    "maxItems": 200,
    "exportLimit": 10000,
    "eventLimit": 20000,
    "retentionDays": 90,
    "trendPoints": 60,
    "trendSeries": 6,
    "collectionBatch": 3,
    "retryMinutes": 10,
    "pauseMinutes": 5,
    "dailyHour": 7,
    "briefingLimit": 50,
    "searchTerms": [
      "banca",
      "banking",
      "empresa",
      "pyme",
      "autónomo",
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
    "unknownCountry": "Sin determinar",
    "newsletterEnabled": false,
    "newsletterBatch": 20,
    "newsletterSender": "news-radar.group@bbva.com",
    "newsletterSenderName": "News Radar · BBVA Empresas",
    "newsletterDailyLimit": 100,
    "newsletterAppUrl": "",
    "taxonomyCatalogUrl": "https://docs.google.com/spreadsheets/d/1hsFp-ZiiSsSt_ka73oKAWFlHEySdmJM_IrkBmK6YfH8/edit?gid=1593939800#gid=1593939800",
    "taxonomyCatalogRefresh": false
  },
  "entities": [
    {
      "name": "BBVA",
      "type": "Banco tradicional",
      "aliases": [
        "BBVA Empresas",
        "BBVA Business",
        "BBVA Net Cash",
        "Garanti BBVA",
        "BBVA Provincial",
        "Provinet Empresas",
        "Openpay",
        "BBVA Pivot"
      ],
      "countries": [
        "España",
        "México",
        "Perú",
        "Colombia",
        "Argentina",
        "Turquía",
        "Uruguay",
        "Italia",
        "Alemania",
        "Francia",
        "Portugal",
        "Reino Unido",
        "Estados Unidos",
        "Suiza",
        "Países Bajos",
        "Bélgica",
        "Rumanía",
        "Brasil",
        "Chile",
        "China",
        "Hong Kong",
        "Japón",
        "Singapur",
        "Venezuela"
      ],
      "enabled": true
    },
    {
      "name": "Santander",
      "type": "Banco tradicional",
      "aliases": [
        "Santander Empresas",
        "Getnet",
        "PagoNxt",
        "Ebury",
        "Cash Nexus"
      ],
      "countries": [
        "España",
        "México",
        "Argentina",
        "Uruguay",
        "Italia",
        "Alemania",
        "Portugal",
        "Reino Unido",
        "Estados Unidos",
        "Brasil",
        "Chile"
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
        "HSBC Empresas",
        "HSBCnet",
        "HSBCnio"
      ],
      "countries": [
        "México",
        "Reino Unido",
        "Hong Kong",
        "China",
        "Singapur",
        "India",
        "Australia"
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
        "Uruguay",
        "Brasil",
        "Chile"
      ],
      "enabled": true
    },
    {
      "name": "Revolut",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España",
        "Italia",
        "Alemania",
        "Reino Unido",
        "Francia"
      ],
      "enabled": true
    },
    {
      "name": "N26",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España",
        "Alemania",
        "Italia",
        "Francia"
      ],
      "enabled": true
    },
    {
      "name": "Qonto",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "España",
        "Italia",
        "Alemania",
        "Francia"
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
        "Colombia",
        "Brasil"
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
        "España",
        "Países Bajos",
        "Alemania",
        "Italia"
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
    },
    {
      "name": "Intesa Sanpaolo",
      "countries": [
        "Italia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "UniCredit",
      "countries": [
        "Italia",
        "Alemania"
      ],
      "aliases": [
        "HypoVereinsbank"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Deutsche Bank",
      "countries": [
        "Alemania"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Commerzbank",
      "countries": [
        "Alemania"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "ING",
      "countries": [
        "Países Bajos",
        "Alemania"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "BNP Paribas",
      "countries": [
        "Francia",
        "Bélgica"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Crédit Agricole",
      "countries": [
        "Francia",
        "Italia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Société Générale",
      "countries": [
        "Francia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Millennium bcp",
      "countries": [
        "Portugal"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Caixa Geral de Depósitos",
      "countries": [
        "Portugal"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Barclays",
      "countries": [
        "Reino Unido"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "NatWest",
      "countries": [
        "Reino Unido"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "JPMorgan Chase",
      "countries": [
        "Estados Unidos"
      ],
      "aliases": [
        "JPMorgan"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Bank of America",
      "countries": [
        "Estados Unidos"
      ],
      "aliases": [
        "CashPro"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Citi",
      "countries": [
        "Estados Unidos",
        "Singapur",
        "Hong Kong"
      ],
      "aliases": [
        "Citibank",
        "CitiDirect",
        "CitiBusiness"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "UBS",
      "countries": [
        "Suiza"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "KBC",
      "countries": [
        "Bélgica"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Banca Transilvania",
      "countries": [
        "Rumanía"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Bradesco",
      "countries": [
        "Brasil"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Banco de Chile",
      "countries": [
        "Chile"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "DBS",
      "countries": [
        "Singapur",
        "Hong Kong",
        "India",
        "Indonesia"
      ],
      "aliases": [
        "DBS Bank"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "OCBC",
      "countries": [
        "Singapur",
        "Malasia"
      ],
      "aliases": [
        "Oversea-Chinese Banking Corporation"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "UOB",
      "countries": [
        "Singapur",
        "Tailandia"
      ],
      "aliases": [
        "United Overseas Bank"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "MUFG",
      "countries": [
        "Japón",
        "Australia"
      ],
      "aliases": [
        "Mitsubishi UFJ"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "SMBC",
      "countries": [
        "Japón",
        "Singapur"
      ],
      "aliases": [
        "Sumitomo Mitsui Banking Corporation"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Mizuho",
      "countries": [
        "Japón"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Standard Chartered",
      "countries": [
        "Reino Unido",
        "Hong Kong",
        "Singapur",
        "India"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "ICBC",
      "countries": [
        "China"
      ],
      "aliases": [
        "Industrial and Commercial Bank of China"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Bank of China",
      "countries": [
        "China",
        "Hong Kong"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "China Construction Bank",
      "countries": [
        "China"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "State Bank of India",
      "countries": [
        "India"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "HDFC Bank",
      "countries": [
        "India"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "ICICI Bank",
      "countries": [
        "India"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "ANZ",
      "countries": [
        "Australia"
      ],
      "aliases": [
        "Australia and New Zealand Banking Group"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Commonwealth Bank",
      "countries": [
        "Australia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Macquarie",
      "countries": [
        "Australia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "National Australia Bank",
      "countries": [
        "Australia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Westpac",
      "countries": [
        "Australia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Bank Mandiri",
      "countries": [
        "Indonesia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Bank Central Asia",
      "countries": [
        "Indonesia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "KB Kookmin",
      "countries": [
        "Corea del Sur"
      ],
      "aliases": [
        "Kookmin Bank"
      ],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Shinhan Bank",
      "countries": [
        "Corea del Sur"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Vietcombank",
      "countries": [
        "Vietnam"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "BDO Unibank",
      "countries": [
        "Filipinas"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Maybank",
      "countries": [
        "Malasia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Bangkok Bank",
      "countries": [
        "Tailandia"
      ],
      "aliases": [],
      "type": "Banco tradicional",
      "enabled": true
    },
    {
      "name": "Asian Development Bank",
      "countries": [
        "Filipinas"
      ],
      "aliases": [
        "ADB"
      ],
      "type": "Multilateral",
      "enabled": true
    },
    {
      "name": "Asian Infrastructure Investment Bank",
      "countries": [
        "China"
      ],
      "aliases": [
        "AIIB"
      ],
      "type": "Multilateral",
      "enabled": true
    },
    {
      "name": "Mercantil Banco",
      "type": "Banco tradicional",
      "aliases": [
        "Mercantil en Línea Empresas"
      ],
      "countries": [
        "Venezuela"
      ],
      "enabled": true
    },
    {
      "name": "RBC",
      "type": "Banco tradicional",
      "aliases": [
        "Royal Bank of Canada",
        "RBC Express"
      ],
      "countries": [
        "Canadá"
      ],
      "enabled": true
    },
    {
      "name": "Emirates NBD",
      "type": "Banco tradicional",
      "aliases": [
        "businessONLINE",
        "ENBD"
      ],
      "countries": [
        "Emiratos Árabes Unidos"
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
      "searchName": "España",
      "terms": [
        "Spain",
        "Espanha"
      ]
    },
    {
      "name": "México",
      "code": "MX",
      "language": "es-419",
      "mapId": "484",
      "enabled": true,
      "searchName": "México",
      "terms": []
    },
    {
      "name": "Perú",
      "code": "PE",
      "language": "es-419",
      "mapId": "604",
      "enabled": true,
      "searchName": "Perú",
      "terms": []
    },
    {
      "name": "Colombia",
      "code": "CO",
      "language": "es-419",
      "mapId": "170",
      "enabled": true,
      "searchName": "Colombia",
      "terms": []
    },
    {
      "name": "Argentina",
      "code": "AR",
      "language": "es-419",
      "mapId": "032",
      "enabled": true,
      "searchName": "Argentina",
      "terms": []
    },
    {
      "name": "Turquía",
      "code": "TR",
      "language": "tr",
      "mapId": "792",
      "enabled": true,
      "searchName": "Türkiye",
      "terms": [
        "Turkey"
      ]
    },
    {
      "name": "Uruguay",
      "code": "UY",
      "language": "es-419",
      "mapId": "858",
      "enabled": true,
      "searchName": "Uruguay",
      "terms": []
    },
    {
      "name": "Italia",
      "code": "IT",
      "language": "it",
      "mapId": "380",
      "searchName": "Italy",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Alemania",
      "code": "DE",
      "language": "de",
      "mapId": "276",
      "searchName": "Germany",
      "enabled": true,
      "terms": [
        "Deutschland"
      ]
    },
    {
      "name": "Francia",
      "code": "FR",
      "language": "fr",
      "mapId": "250",
      "searchName": "France",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Portugal",
      "code": "PT",
      "language": "pt-PT",
      "mapId": "620",
      "searchName": "Portugal",
      "enabled": true,
      "terms": [
        "Portogallo"
      ]
    },
    {
      "name": "Reino Unido",
      "code": "GB",
      "language": "en",
      "mapId": "826",
      "searchName": "United Kingdom",
      "enabled": true,
      "terms": [
        "Britain"
      ]
    },
    {
      "name": "Estados Unidos",
      "code": "US",
      "language": "en",
      "mapId": "840",
      "searchName": "United States",
      "enabled": true,
      "terms": [
        "USA",
        "United States of America"
      ]
    },
    {
      "name": "Suiza",
      "code": "CH",
      "language": "en",
      "mapId": "756",
      "searchName": "Switzerland",
      "enabled": true,
      "terms": [
        "Schweiz",
        "Suisse",
        "Svizzera"
      ]
    },
    {
      "name": "Países Bajos",
      "code": "NL",
      "language": "nl",
      "mapId": "528",
      "searchName": "Netherlands",
      "enabled": true,
      "terms": [
        "Nederland"
      ]
    },
    {
      "name": "Bélgica",
      "code": "BE",
      "language": "fr",
      "mapId": "056",
      "searchName": "Belgium",
      "enabled": true,
      "terms": [
        "Belgique",
        "België"
      ]
    },
    {
      "name": "Rumanía",
      "code": "RO",
      "language": "ro",
      "mapId": "642",
      "searchName": "Romania",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Brasil",
      "code": "BR",
      "language": "pt-BR",
      "mapId": "076",
      "searchName": "Brazil",
      "enabled": true,
      "terms": [
        "Brasil"
      ]
    },
    {
      "name": "Chile",
      "code": "CL",
      "language": "es-419",
      "mapId": "152",
      "searchName": "Chile",
      "enabled": true,
      "terms": []
    },
    {
      "name": "China",
      "code": "CN",
      "language": "en",
      "mapId": "156",
      "searchName": "China",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Hong Kong",
      "code": "HK",
      "language": "en",
      "mapId": "344",
      "searchName": "Hong Kong",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Japón",
      "code": "JP",
      "language": "en",
      "mapId": "392",
      "searchName": "Japan",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Singapur",
      "code": "SG",
      "language": "en",
      "mapId": "702",
      "searchName": "Singapore",
      "enabled": true,
      "terms": []
    },
    {
      "name": "India",
      "code": "IN",
      "language": "en",
      "mapId": "356",
      "searchName": "India",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Australia",
      "code": "AU",
      "language": "en",
      "mapId": "036",
      "searchName": "Australia",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Indonesia",
      "code": "ID",
      "language": "en",
      "mapId": "360",
      "searchName": "Indonesia",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Corea del Sur",
      "code": "KR",
      "language": "en",
      "mapId": "410",
      "searchName": "South Korea",
      "enabled": true,
      "terms": [
        "Republic of Korea"
      ]
    },
    {
      "name": "Vietnam",
      "code": "VN",
      "language": "en",
      "mapId": "704",
      "searchName": "Vietnam",
      "enabled": true,
      "terms": [
        "Viet Nam"
      ]
    },
    {
      "name": "Filipinas",
      "code": "PH",
      "language": "en",
      "mapId": "608",
      "searchName": "Philippines",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Malasia",
      "code": "MY",
      "language": "en",
      "mapId": "458",
      "searchName": "Malaysia",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Tailandia",
      "code": "TH",
      "language": "en",
      "mapId": "764",
      "searchName": "Thailand",
      "enabled": true,
      "terms": []
    },
    {
      "name": "Venezuela",
      "code": "VE",
      "language": "es",
      "mapId": "862",
      "enabled": true,
      "searchName": "Venezuela",
      "terms": [
        "Venezuela",
        "venezolano"
      ]
    },
    {
      "name": "Canadá",
      "code": "CA",
      "language": "en",
      "mapId": "124",
      "enabled": true,
      "searchName": "Canada",
      "terms": [
        "Canada",
        "Canadian"
      ]
    },
    {
      "name": "Emiratos Árabes Unidos",
      "code": "AE",
      "language": "en",
      "mapId": "784",
      "enabled": true,
      "searchName": "UAE",
      "terms": [
        "UAE",
        "United Arab Emirates",
        "Dubai",
        "Abu Dhabi"
      ]
    }
  ],
  "segments": [
    {
      "name": "Empresas e instituciones",
      "terms": [
        "empresa",
        "empresas",
        "pyme",
        "pymes",
        "sme",
        "smes",
        "autonomo",
        "autonomos",
        "autonoma",
        "emprendedor",
        "emprendedores",
        "corporativa",
        "corporativo",
        "corporativas",
        "corporativos",
        "corporate",
        "institucional",
        "institucionales",
        "institutional",
        "business",
        "b2b",
        "cib",
        "comercio exterior",
        "tesoreria",
        "trade finance",
        "isletme",
        "ticari",
        "kobi",
        "profesional",
        "freelance",
        "freelancers",
        "self-employed",
        "smb",
        "imprese",
        "unternehmen",
        "entreprises",
        "comercio",
        "comercios",
        "comerciante",
        "comerciantes",
        "merchant",
        "merchants",
        "pequenos negocios",
        "businesses",
        "mipymes",
        "mipyme",
        "mypes",
        "corporations",
        "profesional independiente"
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
    },
    {
      "id": "bbva-corporativo",
      "name": "BBVA · Información corporativa",
      "url": "https://www.bbva.com/es/economia-y-finanzas/informacion-corporativa/feed/",
      "domain": "bbva.com",
      "entity": "BBVA",
      "country": "Sin determinar",
      "enabled": true
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
    }
  ],
  "capabilities": {
    "Empresas": [
      {
        "name": "Aplicaciones móviles empresariales",
        "terms": [
          "app empresas",
          "app empresarial",
          "app",
          "aplicacion movil",
          "business app",
          "mobile business banking",
          "mobil bankacilik",
          "app itau empresas"
        ],
        "enabled": true
      },
      {
        "name": "Banca electrónica corporativa",
        "terms": [
          "banca electronica",
          "banca digital",
          "banca online",
          "banca en linea",
          "banca por internet",
          "corporate online banking",
          "digital banking",
          "online banking",
          "internet banking",
          "net cash",
          "dijital bankacilik",
          "business banking"
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
          "seguridad digital",
          "fraud prevention",
          "prevencion del fraude",
          "ciberseguridad",
          "cybersecurity",
          "autorizacion de compras",
          "passkeys",
          "rcs",
          "autenticazione",
          "kimlik dogrulama"
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
          "pago",
          "payments",
          "payment",
          "pagamenti",
          "odeme",
          "pix",
          "bizum",
          "qr",
          "billetera",
          "wallet",
          "instant payments"
        ],
        "enabled": true
      },
      {
        "name": "Cobros y recaudación",
        "terms": [
          "cobros",
          "cobro",
          "cobranza",
          "recaudacion",
          "digital collections",
          "collections",
          "merchant acquiring",
          "acquiring",
          "checkout",
          "tpv",
          "softpos",
          "paycomet",
          "datáfono",
          "contactless",
          "sin contacto",
          "receivables",
          "payment acceptance"
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
          "financiamiento digital",
          "credito digital",
          "prestamo digital",
          "digital lending",
          "digital loan",
          "digital business lending",
          "credito pyme",
          "credito simple digital",
          "financiamento digital",
          "dijital kredi",
          "financiacion online",
          "credito",
          "creditos",
          "prestamo",
          "prestamos"
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
          "cross border",
          "divisas",
          "money transfer",
          "swift",
          "pagos transfronterizos",
          "stablecoin",
          "stablecoins",
          "tokenized deposits",
          "depositos tokenizados"
        ],
        "enabled": true
      },
      {
        "name": "Tarjetas de empresa",
        "terms": [
          "tarjetas de empresa",
          "tarjeta empresarial",
          "tarjetas empresariales",
          "tarjeta corporativa",
          "tarjetas corporativas",
          "business cards",
          "business card",
          "corporate cards",
          "corporate card"
        ],
        "enabled": true
      },
      {
        "name": "Gestión de gastos corporativos",
        "terms": [
          "gestion de gastos",
          "expense management",
          "control de gastos",
          "spending controls",
          "limites de tarjetas",
          "limites de las tarjetas"
        ],
        "enabled": true
      },
      {
        "name": "Integraciones ERP",
        "terms": [
          "integracion erp",
          "erp integration",
          "erp",
          "contpaqi",
          "contabilidad",
          "accounting integration",
          "facturación electrónica",
          "e-invoicing",
          "electronic invoicing"
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
          "open banking",
          "banca abierta",
          "open finance",
          "finanzas abiertas",
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
          "digital assistant",
          "asistente virtual",
          "virtual assistant",
          "chatbot",
          "chatbots"
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
          "kyb",
          "kyc",
          "digital verification",
          "verificacion digital"
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
          "digital freelancers",
          "digitalizacion",
          "digitalizar",
          "digitalisation",
          "digitalization",
          "digital transformation",
          "transformacion digital"
        ],
        "enabled": true
      },
      {
        "name": "Biometría",
        "terms": [
          "biometria",
          "biometrico",
          "biometricos",
          "biometric",
          "biometrics",
          "facial recognition"
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
          "bulk payments",
          "payroll",
          "nóminas",
          "pago de proveedores",
          "supplier payments"
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
      },
      {
        "name": "Nóminas digitales",
        "terms": [
          "nominas digitales",
          "payroll",
          "real-time payroll",
          "nominas en tiempo real"
        ],
        "enabled": true
      },
      {
        "name": "Impuestos y pagos de servicios",
        "terms": [
          "pago de impuestos",
          "tax payments",
          "bill payments",
          "pago de servicios",
          "request to pay",
          "request-to-pay"
        ],
        "enabled": true
      },
      {
        "name": "Adquirencia y terminales",
        "terms": [
          "adquirencia",
          "merchant acquiring",
          "tpv",
          "softpos",
          "tap to phone",
          "commerce 360"
        ],
        "enabled": true
      },
      {
        "name": "Inversión y depósitos de empresa",
        "terms": [
          "depositos a plazo",
          "term deposit",
          "fondos de inversion",
          "investment funds",
          "securities custody",
          "custodia de valores"
        ],
        "enabled": true
      },
      {
        "name": "Sostenibilidad y salud financiera",
        "terms": [
          "huella de carbono",
          "carbon footprint",
          "salud financiera",
          "financial health"
        ],
        "enabled": true
      },
      {
        "name": "Seguros digitales de empresa",
        "terms": [
          "ciberseguro",
          "cyber insurance",
          "seguros para empresas",
          "business insurance"
        ],
        "enabled": true
      },
      {
        "name": "Capacidades de venta digital",
        "terms": [
          "retargeting",
          "deeplink",
          "deep link",
          "quantum",
          "a/b testing",
          "campaign attribution"
        ],
        "enabled": true
      },
      {
        "name": "Pagos con activos digitales",
        "terms": [
          "stablecoin",
          "stablecoins",
          "tokenized payments",
          "pagos tokenizados",
          "tokenised payments"
        ],
        "enabled": true
      }
    ]
  },
  "applicationScope": [
    {
      "name": "Empresas e instituciones",
      "countries": [
        "España",
        "México",
        "Perú",
        "Colombia",
        "Argentina",
        "Turquía",
        "Uruguay",
        "Venezuela"
      ]
    }
  ],
  "searchLanguages": [
    {
      "name": "Español",
      "language": "es",
      "terms": [
        "banca",
        "empresa",
        "pyme",
        "autónomo",
        "cuenta",
        "tarjeta",
        "financiación",
        "pagos",
        "producto",
        "lanzamiento",
        "app empresas",
        "banca electronica corporativa",
        "onboarding empresas",
        "apertura digital empresas",
        "roles y permisos",
        "multiusuario",
        "autenticacion",
        "seguridad digital",
        "firma electronica",
        "autorizacion de operaciones",
        "firma mancomunada",
        "pagos digitales",
        "cobros digitales",
        "recaudacion",
        "tesoreria",
        "gestion de liquidez",
        "conciliacion",
        "financiacion digital",
        "prestamo online",
        "comercio exterior",
        "pagos internacionales",
        "divisas",
        "tarjetas de empresa",
        "gestion de gastos",
        "integracion erp",
        "api bancaria",
        "open banking empresarial",
        "finanzas embebidas",
        "automatizacion",
        "inteligencia artificial",
        "asistente digital",
        "personalizacion",
        "experiencia de usuario",
        "accesibilidad",
        "autoservicio",
        "notificaciones",
        "alertas",
        "gestion documental",
        "identidad digital",
        "omnicanal",
        "reporting financiero",
        "analitica financiera",
        "servicios digitales pymes",
        "biometria",
        "beneficiarios",
        "remesas",
        "pagos masivos",
        "aprobaciones multinivel",
        "transferencias",
        "banca movil",
        "banca online",
        "verificacion digital",
        "prevencion del fraude",
        "pagos moviles",
        "transferencias inmediatas",
        "pagos p2p",
        "tarjeta virtual",
        "monedero digital",
        "gestion de tarjetas",
        "finanzas personales",
        "ahorro digital",
        "inversion digital",
        "financiacion al consumo",
        "hipoteca digital",
        "contratacion digital",
        "gestion de suscripciones",
        "open banking",
        "banca abierta",
        "asistente virtual",
        "atencion digital",
        "notificaciones inteligentes",
        "educacion financiera digital",
        "fidelizacion",
        "agregacion financiera",
        "funcionalidad digital",
        "nueva funcionalidad",
        "nuevas funcionalidades",
        "recibos",
        "control de gastos",
        "limites de tarjetas",
        "dispositivos",
        "seguridad",
        "linea de credito",
        "nominas digitales",
        "pago de impuestos",
        "adquirencia",
        "depositos a plazo",
        "huella de carbono",
        "salud financiera",
        "ciberseguro",
        "stablecoins",
        "request to pay",
        "deeplink"
      ],
      "enabled": true
    },
    {
      "name": "English",
      "language": "en",
      "terms": [
        "banking",
        "business",
        "SME",
        "account",
        "card",
        "finance",
        "payment",
        "product",
        "launch",
        "business app",
        "mobile business banking",
        "corporate online banking",
        "net cash",
        "business onboarding",
        "user permissions",
        "authentication",
        "electronic signature",
        "e-signature",
        "payment approval",
        "payments",
        "digital payments",
        "digital collections",
        "cash management",
        "liquidity management",
        "cash pooling",
        "reconciliation",
        "digital lending",
        "digital loan",
        "trade finance",
        "cross-border payments",
        "money transfer",
        "business cards",
        "corporate cards",
        "expense management",
        "erp integration",
        "banking api",
        "banking apis",
        "business open banking",
        "automation",
        "artificial intelligence",
        "agentic ai",
        "digital assistant",
        "personalisation",
        "personalization",
        "user experience",
        "self-service",
        "notifications",
        "document management",
        "digital identity",
        "omnichannel",
        "financial reporting",
        "digital sme",
        "digital freelancers",
        "biometric",
        "beneficiaries",
        "remittances",
        "bulk payments",
        "multi-level approvals",
        "accessibility",
        "reverse factoring",
        "transfers",
        "mobile banking",
        "online banking",
        "internet banking",
        "digital onboarding",
        "digital verification",
        "fraud prevention",
        "mobile payments",
        "instant payments",
        "instant transfers",
        "p2p payments",
        "virtual card",
        "card management",
        "personal finance",
        "digital savings",
        "deposit account",
        "digital investing",
        "cash fund",
        "consumer lending",
        "digital mortgage",
        "digital contracting",
        "subscription management",
        "virtual assistant",
        "digital customer service",
        "smart notifications",
        "digital financial education",
        "rewards",
        "loyalty",
        "account aggregation",
        "digital feature",
        "new feature",
        "mobile feature",
        "direct debits",
        "spending controls",
        "card limits",
        "devices",
        "security",
        "payroll",
        "tax payments",
        "merchant acquiring",
        "term deposit",
        "carbon footprint",
        "financial health",
        "cyber insurance",
        "stablecoin",
        "request to pay",
        "deep link"
      ],
      "enabled": true
    },
    {
      "name": "Türkçe",
      "language": "tr",
      "terms": [
        "ticari bankacılık",
        "nakit yönetimi",
        "KOBİ",
        "kredi",
        "hesap",
        "kart",
        "ürün",
        "lansman",
        "nakit yonetimi",
        "mobil bankacilik"
      ],
      "enabled": true
    },
    {
      "name": "Italiano",
      "language": "it",
      "terms": [
        "banca digitale",
        "conto corrente",
        "pagamenti digitali",
        "app bancaria"
      ],
      "enabled": true
    },
    {
      "name": "Deutsch",
      "language": "de",
      "terms": [
        "digitales banking",
        "girokonto",
        "digitales bezahlen",
        "banking app"
      ],
      "enabled": true
    },
    {
      "name": "Français",
      "language": "fr",
      "terms": [
        "banque en ligne",
        "paiements",
        "application bancaire",
        "compte en ligne"
      ],
      "enabled": true
    },
    {
      "name": "Português",
      "language": "pt",
      "terms": [
        "banca digital",
        "conta digital",
        "pagamentos digitais"
      ],
      "enabled": true
    },
    {
      "name": "Nederlands",
      "language": "nl",
      "terms": [
        "digitaal bankieren",
        "betaalrekening"
      ],
      "enabled": true
    },
    {
      "name": "Română",
      "language": "ro",
      "terms": [
        "banca digitala",
        "cont online"
      ],
      "enabled": true
    }
  ],
  "relevanceRules": [
    {
      "name": "Evidencia de canal digital",
      "role": "channel",
      "terms": [
        "digital*",
        "digitaliza*",
        "online",
        "tiempo real",
        "real-time",
        "internet",
        "movil",
        "mobile",
        "rcs",
        "passkey*",
        "biometri*",
        "app",
        "apps",
        "web",
        "api",
        "apis",
        "wallet",
        "billetera",
        "plataforma",
        "platform",
        "autoservicio",
        "self-service",
        "onboarding",
        "kyb",
        "kyc",
        "erp",
        "cloud",
        "nube",
        "dijital",
        "tokenized",
        "tokenised",
        "tokenizacion",
        "inteligencia artificial",
        "artificial intelligence",
        "agentic ai",
        "ai",
        "ia",
        "contactless",
        "sin contacto",
        "nfc",
        "cashless",
        "datáfono",
        "e-invoicing"
      ],
      "enabled": true
    },
    {
      "name": "Servicios financieros y operativa",
      "role": "service",
      "terms": [
        "pago*",
        "pagamenti",
        "odeme",
        "cobro*",
        "payment*",
        "collection*",
        "checkout",
        "acquiring",
        "acquirer",
        "tpv",
        "softpos",
        "bizum",
        "pix",
        "qr",
        "transferencia*",
        "transfer*",
        "tesoreria",
        "treasury",
        "liquidez",
        "liquidity",
        "cash management",
        "nakit yonetimi",
        "trade finance",
        "factoring",
        "confirming",
        "open banking",
        "open finance",
        "embedded finance",
        "finanzas embebidas",
        "finanzas",
        "financiamiento",
        "financiacion",
        "banca",
        "banking",
        "bankacilik",
        "bancari*",
        "credito*",
        "lending",
        "loan*",
        "prestamo*",
        "onboarding",
        "kyb",
        "kyc",
        "erp",
        "contabilidad",
        "autenticacion",
        "authentication",
        "fraud*",
        "cybersecurity",
        "ciberseguridad",
        "biometri*",
        "passkey*",
        "rcs",
        "swift",
        "stablecoin*",
        "tokenized deposits",
        "tokenised deposits",
        "nominas",
        "payroll",
        "impuestos",
        "tax",
        "adquirencia",
        "depositos",
        "deposit",
        "seguros",
        "insurance",
        "huella de carbono",
        "carbon footprint",
        "stablecoin",
        "stablecoins"
      ],
      "enabled": true
    },
    {
      "name": "Capacidades reutilizables por empresas",
      "role": "shared",
      "terms": [
        "pago*",
        "pagamenti",
        "odeme",
        "cobro*",
        "payment*",
        "collection*",
        "checkout",
        "acquiring",
        "acquirer",
        "tpv",
        "softpos",
        "bizum",
        "pix",
        "qr",
        "tesoreria",
        "treasury",
        "liquidez",
        "liquidity",
        "cash management",
        "nakit yonetimi",
        "trade finance",
        "factoring",
        "confirming",
        "open banking",
        "open finance",
        "embedded finance",
        "finanzas embebidas",
        "banking api",
        "api bancaria",
        "swift",
        "stablecoin*",
        "tokenized deposits",
        "tokenised deposits",
        "autenticacion",
        "authentication",
        "fraud prevention",
        "prevencion del fraude",
        "ciberseguridad",
        "cybersecurity",
        "biometri*",
        "passkey*",
        "rcs",
        "request to pay",
        "cyber insurance",
        "ciberseguro",
        "stablecoin",
        "stablecoins",
        "retargeting",
        "deeplink"
      ],
      "enabled": true
    },
    {
      "name": "Infraestructura y servicios empresariales",
      "role": "infrastructure",
      "terms": [
        "cobro*",
        "collection*",
        "checkout",
        "acquiring",
        "acquirer",
        "tpv",
        "softpos",
        "tesoreria",
        "treasury",
        "cash management",
        "nakit yonetimi",
        "trade finance",
        "factoring",
        "confirming",
        "open banking",
        "open finance",
        "embedded finance",
        "finanzas embebidas",
        "swift",
        "stablecoin*",
        "tokenized deposits",
        "tokenised deposits"
      ],
      "enabled": true
    },
    {
      "name": "Excluir información corporativa sin utilidad de canal",
      "role": "corporate",
      "terms": [
        "earnings",
        "net profit",
        "share price",
        "stock price",
        "stock and other",
        "keeps buy",
        "stock narrative",
        "stocks to watch",
        "look fully valued",
        "yield that",
        "forum & discussion",
        "index ntr",
        "price target",
        "shares sold",
        "shares bought",
        "shares purchased",
        "shares of",
        "dividend*",
        "dividendo*",
        "cotizacion",
        "recompra de acciones",
        "capital notes",
        "appoint*",
        "nombramiento*",
        "nombra",
        "names new",
        "nueva responsable",
        "nuevo director",
        "patrocinio",
        "sponsorship",
        "premio*",
        "premiad*",
        "premiara",
        "mejor banco",
        "recognised for",
        "award*",
        "pension*",
        "jubilacion",
        "quiniela",
        "loteria",
        "resultados financieros",
        "ingresos de su negocio",
        "beneficios del grupo",
        "resultado neto",
        "net income",
        "quarterly results"
      ],
      "enabled": true
    },
    {
      "name": "Excluir consumo particular sin contexto empresarial",
      "role": "retail",
      "terms": [
        "particulares",
        "personal customers",
        "personal finance",
        "consumer lending",
        "consumo*",
        "cuotas",
        "installments",
        "descuentos",
        "promocion especial",
        "regalo",
        "pago complementario",
        "cash payments",
        "payment offer",
        "groups of customers",
        "claim",
        "beca*",
        "bps",
        "auh",
        "pensionados",
        "colpensiones",
        "seniors",
        "sueldo",
        "prestamo personal",
        "prestamos personales",
        "casino",
        "apuestas",
        "hipoteca*",
        "mortgage*",
        "cuenta de ahorro*",
        "cuenta ahorro*",
        "ahorrar",
        "ahorro",
        "remunerada",
        "rentabilidad",
        "tae",
        "cashback",
        "nomina",
        "jovenes",
        "students",
        "estudiantes",
        "family",
        "familiares",
        "retirement"
      ],
      "enabled": true
    },
    {
      "name": "Excluir guías genéricas sin movimiento de mercado",
      "role": "editorial",
      "terms": [
        "que es",
        "que son",
        "what is",
        "what are",
        "how to",
        "guia de",
        "guide to",
        "como abrir",
        "como activar",
        "como solicitar",
        "como invertir",
        "como pagar",
        "como retirar",
        "usos reales",
        "consejos para",
        "tips for"
      ],
      "enabled": true
    },
    {
      "name": "Excluir avisos rutinarios y sucesos individuales",
      "role": "incidental",
      "terms": [
        "stock after-hours",
        "one-off payment",
        "pago de servicios con tarjeta de credito",
        "donde retirar",
        "justica",
        "weekly recap",
        "young people",
        "sustrajeron",
        "le vacian",
        "estafad*",
        "victima",
        "estafa a",
        "calendario de pagos",
        "cronograma",
        "fecha de pago",
        "horarios",
        "apagon programado",
        "mantenimiento de",
        "mantenimiento la",
        "mantenimiento el",
        "caida de",
        "sufrio caida",
        "presenta fallas",
        "presentan fallas",
        "reporta fallas",
        "reportan fallas",
        "reportan problemas",
        "habrian problemas",
        "fallas masivas",
        "se cayo",
        "colapsaron",
        "caida global",
        "falla global",
        "no funciona*",
        "goes down",
        "outage",
        "suspendera*",
        "fraudulent",
        "sospechosos",
        "cocaina",
        "recibo trucho",
        "desviaba",
        "desviado",
        "denuncia",
        "justicia",
        "supremo condena",
        "mis-selling",
        "coupon payments",
        "intermitencias",
        "no podian",
        "fuera de servicio",
        "no se puede iniciar",
        "pagos a cardama",
        "falta de pagos"
      ],
      "enabled": true
    }
  ],
  "taxonomy": [
    {
      "name": "01.Home",
      "terms": [
        "dashboard",
        "posicion global",
        "home banking"
      ],
      "functions": [
        {
          "id": "01.01",
          "name": "Dashboard/Posición productos transformados",
          "terms": [
            "posicion global",
            "financial dashboard"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "02.Cuentas",
      "terms": [
        "cuentas",
        "accounts",
        "cash management",
        "tesoreria",
        "liquidez",
        "conciliacion",
        "cash pooling",
        "reconciliation",
        "cuenta",
        "account",
        "liquidity",
        "treasury"
      ],
      "functions": [
        {
          "id": "02.01",
          "name": "Landing de cuentas",
          "terms": []
        },
        {
          "id": "02.02",
          "name": "Consulta de movimientos de cuenta",
          "terms": [
            "movimientos de cuenta",
            "account transactions"
          ]
        },
        {
          "id": "02.03",
          "name": "Extracto mensual de cuenta / Estado de cuenta",
          "terms": [
            "estado de cuenta",
            "account statement"
          ]
        },
        {
          "id": "02.04",
          "name": "Editar alias de cuenta",
          "terms": []
        },
        {
          "id": "02.05",
          "name": "Descarga formatos de ficheros (PDF, Excel, CSV,TXT, C43, CAMT053)",
          "terms": [
            "camt053",
            "camt.053",
            "cuaderno 43"
          ]
        },
        {
          "id": "02.06",
          "name": "Descarga formatos de ficheros (Multicash y BAI-2)",
          "terms": [
            "multicash",
            "bai-2"
          ]
        },
        {
          "id": "02.07",
          "name": "Cuentas Maestras",
          "terms": []
        },
        {
          "id": "02.08",
          "name": "Cuentas AFC",
          "terms": []
        },
        {
          "id": "02.09",
          "name": "Centralización de cuentas",
          "terms": [
            "cash pooling",
            "centralizacion de cuentas"
          ]
        },
        {
          "id": "02.10",
          "name": "Centralización Plus",
          "terms": []
        },
        {
          "id": "02.11",
          "name": "Cuentas y Movimientos de otros bancos",
          "terms": [
            "agregacion de cuentas",
            "account aggregation",
            "multibank"
          ]
        },
        {
          "id": "02.12",
          "name": "Financiación de movimientos",
          "terms": []
        },
        {
          "id": "02.13",
          "name": "Aclaraciones",
          "terms": []
        },
        {
          "id": "02.14",
          "name": "Apertura 2ª cuenta (y sucesivas cuentas)",
          "terms": [
            "segunda cuenta",
            "additional account"
          ]
        },
        {
          "id": "02.15",
          "name": "Certificados",
          "terms": []
        },
        {
          "id": "02.16",
          "name": "Correspondencia Virtual",
          "terms": []
        },
        {
          "id": "02.17",
          "name": "Intereses Overnight",
          "terms": []
        },
        {
          "id": "02.18",
          "name": "Cuenta CLABE",
          "terms": []
        },
        {
          "id": "02.19",
          "name": "Documentos operativa CED",
          "terms": []
        },
        {
          "id": "02.20",
          "name": "Personalización grupos de cuentas",
          "terms": []
        },
        {
          "id": "02.21",
          "name": "Intervinientes",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "03.Pagos - Transf. y traspasos",
      "terms": [
        "pagos",
        "payments",
        "transferencias",
        "transfers",
        "stablecoin",
        "stablecoins",
        "remesas",
        "remittances"
      ],
      "functions": [
        {
          "id": "03.01",
          "name": "Landing de pagos",
          "terms": []
        },
        {
          "id": "03.02",
          "name": "Traspasos individuales Nacionales",
          "terms": []
        },
        {
          "id": "03.03",
          "name": "Traspasos individuales Interbancarios",
          "terms": []
        },
        {
          "id": "03.04",
          "name": "Transferencias individuales Nacionales",
          "terms": []
        },
        {
          "id": "03.05",
          "name": "Transferencias individuales Nacionales en divisa",
          "terms": []
        },
        {
          "id": "03.06",
          "name": "Transferencias masivas",
          "terms": [
            "transferencias masivas",
            "bulk transfers",
            "bulk payments"
          ]
        },
        {
          "id": "03.07",
          "name": "Transferencias masivas Nacionales en divisa",
          "terms": []
        },
        {
          "id": "03.08",
          "name": "Pagos y traspasos puntuales y masivos con cuentas periféricas",
          "terms": []
        },
        {
          "id": "03.09",
          "name": "Pagos individuales cuentas VOSTRO",
          "terms": []
        },
        {
          "id": "03.10",
          "name": "Transferencias cuentas agencia CED",
          "terms": []
        },
        {
          "id": "03.11",
          "name": "Transferencias individuales a otros destinos/productos",
          "terms": []
        },
        {
          "id": "03.12",
          "name": "Tracking para transferencias individuales y masivas - Nacionales",
          "terms": []
        },
        {
          "id": "03.13",
          "name": "Transferencias individuales internacionales",
          "terms": [
            "transferencias internacionales",
            "cross-border payments",
            "international transfers"
          ]
        },
        {
          "id": "03.14",
          "name": "Transferencias masivas internacionales",
          "terms": []
        },
        {
          "id": "03.15",
          "name": "Tracking transferencias individuales internacionales",
          "terms": []
        },
        {
          "id": "03.16",
          "name": "Pago a proveedores",
          "terms": [
            "pago a proveedores",
            "supplier payments"
          ]
        },
        {
          "id": "03.17",
          "name": "SIT (Servicio Integral de Tesorería, que es la aplicación de Pago a Proveedores de México",
          "terms": []
        },
        {
          "id": "03.18",
          "name": "Periodicas y Programadas individuales",
          "terms": [
            "pagos programados",
            "scheduled payments",
            "recurring payments"
          ]
        },
        {
          "id": "03.19",
          "name": "Programadas masivas",
          "terms": []
        },
        {
          "id": "03.20",
          "name": "Administración de lotes",
          "terms": []
        },
        {
          "id": "03.21",
          "name": "Transferencias en Streaming (alcance estratégico)",
          "terms": [
            "transferencias en streaming"
          ]
        },
        {
          "id": "03.22",
          "name": "Pagos financiados - Individuales",
          "terms": []
        },
        {
          "id": "03.23",
          "name": "Pagos financiados - Ficheros",
          "terms": []
        },
        {
          "id": "03.24",
          "name": "Reutilización de ficheros",
          "terms": []
        },
        {
          "id": "03.25",
          "name": "Iniciación de pagos de cuentas de otros bancos",
          "terms": [
            "iniciacion de pagos",
            "payment initiation"
          ]
        },
        {
          "id": "03.26",
          "name": "Transferencias individuales nacionales (alcance estratégico)",
          "terms": []
        },
        {
          "id": "03.27",
          "name": "Tracking SWIFT-GPI",
          "terms": [
            "swift gpi",
            "swift-gpi"
          ]
        }
      ],
      "emerging": [
        {
          "name": "Pagos con stablecoins",
          "terms": [
            "pagos con stablecoins",
            "pagos en stablecoins",
            "pagos con stablecoin",
            "pagos stablecoins",
            "stablecoin payments",
            "stablecoin payment",
            "payments with stablecoins",
            "stablecoins payments",
            "transferencias con stablecoins",
            "stablecoin transfers"
          ]
        }
      ]
    },
    {
      "name": "04.Pagos - Nóminas",
      "terms": [
        "nominas",
        "payroll",
        "salarios"
      ],
      "functions": [
        {
          "id": "04.01",
          "name": "Nóminas en tiempo real",
          "terms": [
            "nominas en tiempo real",
            "real-time payroll"
          ]
        },
        {
          "id": "04.02",
          "name": "Tracking de Nóminas",
          "terms": [
            "tracking de nominas",
            "payroll tracking"
          ]
        },
        {
          "id": "04.03",
          "name": "Nóminas - Contratación",
          "terms": []
        },
        {
          "id": "04.04",
          "name": "Afiliación apertura de Cuentas masiva",
          "terms": []
        },
        {
          "id": "04.05",
          "name": "Afiliación tarjetas beneficiacios nómina",
          "terms": []
        },
        {
          "id": "04.06",
          "name": "Pago de CTS masivo",
          "terms": []
        },
        {
          "id": "04.07",
          "name": "Nóminas en tiempo real (alcance estratégico)",
          "terms": []
        },
        {
          "id": "04.08",
          "name": "Pago a fuerzas de ventas / comisionistas",
          "terms": []
        },
        {
          "id": "04.09",
          "name": "Programas Sociales: Afiliación masiva beneficiarios",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "05.Pagos - Impuestos",
      "terms": [
        "impuestos",
        "tax payments",
        "tributos",
        "cfdi"
      ],
      "functions": [
        {
          "id": "05.01",
          "name": "Consulta y modificación de datos fiscales",
          "terms": [
            "datos fiscales",
            "tax information"
          ]
        },
        {
          "id": "05.02",
          "name": "Pago de impuestos CDMX",
          "terms": []
        },
        {
          "id": "05.03",
          "name": "Consulta de impuesto CDMX",
          "terms": []
        },
        {
          "id": "05.04",
          "name": "Pago de impuestos TESOFE",
          "terms": []
        },
        {
          "id": "05.05",
          "name": "Consulta de impuesto TESOFE",
          "terms": []
        },
        {
          "id": "05.06",
          "name": "Pago de impuestos SAT",
          "terms": []
        },
        {
          "id": "05.07",
          "name": "Consulta de impuesto SAT",
          "terms": []
        },
        {
          "id": "05.08",
          "name": "Pago de impuestos ADUANALES",
          "terms": []
        },
        {
          "id": "05.09",
          "name": "Consulta de impuesto ADUANALES",
          "terms": []
        },
        {
          "id": "05.10",
          "name": "Pago de impuestos SIPARE",
          "terms": []
        },
        {
          "id": "05.11",
          "name": "Consulta de impuesto SIPARE",
          "terms": []
        },
        {
          "id": "05.12",
          "name": "Pago de impuestos SAR-ISSSTE",
          "terms": []
        },
        {
          "id": "05.13",
          "name": "Consulta de impuesto SAR-ISSSTE",
          "terms": []
        },
        {
          "id": "05.14",
          "name": "Pago de Impuestos SUA",
          "terms": []
        },
        {
          "id": "05.15",
          "name": "Consulta de impuestos SUA",
          "terms": []
        },
        {
          "id": "05.16",
          "name": "DPA (Derecho, Productos y aprovechamientos)",
          "terms": []
        },
        {
          "id": "05.17",
          "name": "Afiliación y Administración de detracciones (PE)",
          "terms": []
        },
        {
          "id": "05.18",
          "name": "CFDI: Constancias Fiscales Consultas Solicitud (MX)",
          "terms": []
        },
        {
          "id": "05.19",
          "name": "CFDI: Fiduciario",
          "terms": []
        },
        {
          "id": "05.20",
          "name": "CFDI: Complemento de pago",
          "terms": []
        },
        {
          "id": "05.21",
          "name": "CFDI: Estado de cuenta",
          "terms": []
        },
        {
          "id": "05.22",
          "name": "CFDI: Factoraje",
          "terms": []
        },
        {
          "id": "05.23",
          "name": "Estatales",
          "terms": []
        },
        {
          "id": "05.24",
          "name": "Impuestos Autonómicos (ES)",
          "terms": []
        },
        {
          "id": "05.25",
          "name": "Impuestos Municipales (ES)",
          "terms": []
        },
        {
          "id": "05.26",
          "name": "Pago de impuestos masivo por fichero",
          "terms": [
            "impuestos masivos",
            "bulk tax payments"
          ]
        },
        {
          "id": "05.27",
          "name": "Tracking de pago de impuestos España",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "06.Pagos - Servicios y otros",
      "terms": [
        "pago de servicios",
        "bill payments",
        "cheques",
        "checks",
        "request to pay"
      ],
      "functions": [
        {
          "id": "06.01",
          "name": "Pagos individuales CIE o servicios/recibos no domicilados",
          "terms": []
        },
        {
          "id": "06.02",
          "name": "Pagos de facturas masivos",
          "terms": []
        },
        {
          "id": "06.03",
          "name": "PSE - pagos",
          "terms": [
            "pse pagos"
          ]
        },
        {
          "id": "06.04",
          "name": "PSE - Pago seguridad social",
          "terms": []
        },
        {
          "id": "06.05",
          "name": "Servicios en línea (pantalla llamada \"Cheques en línea\")",
          "terms": []
        },
        {
          "id": "06.06",
          "name": "Request to Pay",
          "terms": [
            "request to pay",
            "request-to-pay",
            "solicitud de pago"
          ]
        },
        {
          "id": "06.07",
          "name": "Pagos via SEBRA",
          "terms": []
        },
        {
          "id": "06.08",
          "name": "Dispersión de efectivo",
          "terms": []
        },
        {
          "id": "06.09",
          "name": "Mandatos SEPA",
          "terms": [
            "mandatos sepa",
            "sepa mandates"
          ]
        },
        {
          "id": "06.10",
          "name": "Cheques - Consultas",
          "terms": []
        },
        {
          "id": "06.11",
          "name": "Envio de impresión de Cheques a la oficina",
          "terms": []
        },
        {
          "id": "06.12",
          "name": "Contratación de domiciliaciones",
          "terms": [
            "contratacion de domiciliaciones"
          ]
        },
        {
          "id": "06.13",
          "name": "Cheques - Operativa",
          "terms": []
        },
        {
          "id": "06.14",
          "name": "Cheques - Imágenes digitalizadas",
          "terms": []
        },
        {
          "id": "06.15",
          "name": "eCheqs - Pago",
          "terms": [
            "echeqs pago"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "07.Cobros",
      "terms": [
        "cobros",
        "collections",
        "recaudacion",
        "direct debit"
      ],
      "functions": [
        {
          "id": "07.01",
          "name": "Landing de cobros",
          "terms": []
        },
        {
          "id": "07.02",
          "name": "Adeudos directos (débito automático/recibos domicilados) - CREACIÓN MANUAL",
          "terms": [
            "adeudos directos",
            "direct debit",
            "debito automatico"
          ]
        },
        {
          "id": "07.03",
          "name": "Adeudos directos (débito automático/recibos domicilados) - TRACKING",
          "terms": []
        },
        {
          "id": "07.04",
          "name": "Recibos no domiciliados - Carga / Cobros de Servicios / Cobros CIE (visión cobrador)",
          "terms": []
        },
        {
          "id": "07.05",
          "name": "Recibos no domiciliados - Tracking / Cobros de Servicios / Cobros CIE (visión cobrador)",
          "terms": []
        },
        {
          "id": "07.06",
          "name": "Cobranza y Recaudación - CIE Reporte Mensual",
          "terms": []
        },
        {
          "id": "07.07",
          "name": "Cobranza y Recaudación - CIE 7x24",
          "terms": []
        },
        {
          "id": "07.08",
          "name": "Cobranza y Recaudación - CIE Estado de cuenta CIE",
          "terms": []
        },
        {
          "id": "07.09",
          "name": "Cobranza y Recaudación - CIE Movimientos del día",
          "terms": []
        },
        {
          "id": "07.10",
          "name": "Transferencias nacionales recibidas",
          "terms": [
            "transferencias nacionales recibidas"
          ]
        },
        {
          "id": "07.11",
          "name": "Transferencias internacionales recibidas",
          "terms": [
            "transferencias internacionales recibidas"
          ]
        },
        {
          "id": "07.12",
          "name": "TIB (Tesorería Integral Bancaria - MX)",
          "terms": []
        },
        {
          "id": "07.13",
          "name": "Convenio CEE - Cobranza empresarial especializada",
          "terms": []
        },
        {
          "id": "07.14",
          "name": "Convenio CEE - Cobranza empresarial especializada",
          "terms": []
        },
        {
          "id": "07.15",
          "name": "Devolución de recibos",
          "terms": []
        },
        {
          "id": "07.16",
          "name": "Adeudos directos (débito automático/recibos domicilados) - FICHEROS",
          "terms": []
        },
        {
          "id": "07.17",
          "name": "Adeudos directos (débito automático/recibos domicilados) - CREACIÓN MANUAL FINANCIADO",
          "terms": []
        },
        {
          "id": "07.18",
          "name": "Adeudos directos (débito automático/recibos domicilados) - FICHERO FINANCIADO",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "08.Financiación",
      "terms": [
        "financiacion",
        "financing",
        "lending",
        "credito",
        "credit",
        "prestamo",
        "loan",
        "factoring",
        "confirming",
        "leasing",
        "financiamiento",
        "financiamientos",
        "creditos",
        "prestamos",
        "loans",
        "credits"
      ],
      "functions": [
        {
          "id": "08.01",
          "name": "Landing de Financiación",
          "terms": []
        },
        {
          "id": "08.02",
          "name": "Crédito Virtual",
          "terms": [
            "credito virtual",
            "virtual credit"
          ]
        },
        {
          "id": "08.03",
          "name": "Crédito Líquido a plazos",
          "terms": []
        },
        {
          "id": "08.04",
          "name": "Crédito Líquido anual",
          "terms": []
        },
        {
          "id": "08.05",
          "name": "Crédito Líquido Flex - Consultas",
          "terms": []
        },
        {
          "id": "08.06",
          "name": "FastCash",
          "terms": [
            "fastcash",
            "fast cash"
          ]
        },
        {
          "id": "08.07",
          "name": "Línea de Crédito Multifinalidad",
          "terms": []
        },
        {
          "id": "08.08",
          "name": "Tarjeta Negocios / TKT (consulta, pago y disposición)",
          "terms": []
        },
        {
          "id": "08.09",
          "name": "Tarjeta Negocios / TKT (Administración)",
          "terms": []
        },
        {
          "id": "08.10",
          "name": "Línea de Crédito Digital (OCDL)",
          "terms": [
            "linea de credito digital",
            "digital credit line",
            "ocdl"
          ]
        },
        {
          "id": "08.11",
          "name": "Crédito en Cuenta Corriente / Cupo rotativo",
          "terms": [
            "cupo rotativo",
            "revolving credit"
          ]
        },
        {
          "id": "08.12",
          "name": "Préstamo empresarial (no revolvente) / Crédito Simple",
          "terms": [
            "prestamo empresarial",
            "business loan",
            "credito simple"
          ]
        },
        {
          "id": "08.13",
          "name": "Click and Pay",
          "terms": [
            "click and pay"
          ]
        },
        {
          "id": "08.14",
          "name": "Crédito Habilitación o AVIO",
          "terms": []
        },
        {
          "id": "08.15",
          "name": "Confirming cliente / Factoring electronico pagador / Crediproveedores - comprador - CONSULTAS",
          "terms": []
        },
        {
          "id": "08.16",
          "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - OPERATIVA/ANTICIPOS",
          "terms": [
            "anticipo confirming",
            "reverse factoring advances"
          ]
        },
        {
          "id": "08.17",
          "name": "Crediproveedor PYME",
          "terms": [
            "crediproveedor pyme"
          ]
        },
        {
          "id": "08.18",
          "name": "Factoring / Descuento de letras y facturas - CONSULTAS",
          "terms": []
        },
        {
          "id": "08.19",
          "name": "Efectos / Descuento Mercantil",
          "terms": [
            "descuento mercantil"
          ]
        },
        {
          "id": "08.20",
          "name": "Libranzas",
          "terms": []
        },
        {
          "id": "08.21",
          "name": "Leasing",
          "terms": [
            "leasing"
          ]
        },
        {
          "id": "08.22",
          "name": "Renting",
          "terms": [
            "renting"
          ]
        },
        {
          "id": "08.23",
          "name": "Crédito Stock",
          "terms": []
        },
        {
          "id": "08.24",
          "name": "Simulador de crédito PYME",
          "terms": [
            "simulador de credito"
          ]
        },
        {
          "id": "08.25",
          "name": "Contratación OneClick - Prestamo TPV - Prestamo de adelanto de venta",
          "terms": [
            "prestamo tpv",
            "merchant cash advance"
          ]
        },
        {
          "id": "08.26",
          "name": "Contratación OneClick - Línea de Confirming",
          "terms": []
        },
        {
          "id": "08.27",
          "name": "Contratación OneClick - Cuenta de Crédito",
          "terms": []
        },
        {
          "id": "08.28",
          "name": "Contratación OneClick - Préstamo Online Negocio",
          "terms": [
            "prestamo online negocio",
            "online business loan"
          ]
        },
        {
          "id": "08.29",
          "name": "Contratación de Crédito Pyme Digital (RECO)",
          "terms": [
            "credito pyme digital"
          ]
        },
        {
          "id": "08.30",
          "name": "Consulta Carta Fianza / Avales",
          "terms": []
        },
        {
          "id": "08.31",
          "name": "Crédito Digital Flexible",
          "terms": [
            "credito digital flexible"
          ]
        },
        {
          "id": "08.32",
          "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - CONSULTAS",
          "terms": []
        },
        {
          "id": "08.33",
          "name": "Solicitud Carta Fianza / Avales",
          "terms": [
            "solicitud de aval",
            "digital bank guarantee"
          ]
        },
        {
          "id": "08.34",
          "name": "Modificación/renovación Carta Fianza / Avales",
          "terms": []
        },
        {
          "id": "08.35",
          "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - ESTADÍSTICAS E INFORMES",
          "terms": []
        },
        {
          "id": "08.36",
          "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - FIRMA Y CUSTODIA DIGITAL DE CONTRATO",
          "terms": []
        },
        {
          "id": "08.37",
          "name": "Confirming cliente / Factoring electronico pagador / Crediproveedores - comprador - OPERATIVA",
          "terms": []
        },
        {
          "id": "08.38",
          "name": "Crédito Líquido 2.0",
          "terms": []
        },
        {
          "id": "08.39",
          "name": "Incremento de Línea de Crédito Digital",
          "terms": []
        },
        {
          "id": "08.40",
          "name": "Disposición de Plan de Pagos Fijos",
          "terms": []
        },
        {
          "id": "08.41",
          "name": "Factoring / Descuento de letras y facturas - OPERATIVA",
          "terms": [
            "factoring digital",
            "invoice financing",
            "descuento de facturas"
          ]
        },
        {
          "id": "08.42",
          "name": "Financiación Argentina",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "09.Tarjetas",
      "terms": [
        "tarjetas",
        "cards",
        "card",
        "wallet",
        "wallets",
        "gestion de gastos",
        "expense management"
      ],
      "functions": [
        {
          "id": "09.01",
          "name": "Landing de tarjetas/ Listado de tarjetas",
          "terms": []
        },
        {
          "id": "09.02",
          "name": "Extractos (Estado de Cuenta) Tarjeta",
          "terms": []
        },
        {
          "id": "09.03",
          "name": "Editar alias de tarjetas",
          "terms": []
        },
        {
          "id": "09.04",
          "name": "Tarjetas Crédito - Consulta",
          "terms": []
        },
        {
          "id": "09.05",
          "name": "Tarjetas Crédito - Operativa",
          "terms": []
        },
        {
          "id": "09.06",
          "name": "Tarjetas Crédito - ON/OFF",
          "terms": [
            "bloquear tarjeta de credito",
            "credit card freeze"
          ]
        },
        {
          "id": "09.07",
          "name": "Tarjetas Crédito - Contratación",
          "terms": []
        },
        {
          "id": "09.08",
          "name": "Tarjetas Crédito - Alta masiva de tarjeta",
          "terms": []
        },
        {
          "id": "09.09",
          "name": "Tarjetas Crédito - Pago",
          "terms": []
        },
        {
          "id": "09.10",
          "name": "Tarjetas Débito - ON/OFF",
          "terms": [
            "bloquear tarjeta de debito",
            "debit card freeze"
          ]
        },
        {
          "id": "09.11",
          "name": "Tarjetas Débito - Consulta",
          "terms": []
        },
        {
          "id": "09.12",
          "name": "Tarjetas Débito - Consulta de contrato",
          "terms": []
        },
        {
          "id": "09.13",
          "name": "Tarjetas Débito - Solicitud de nueva tarjeta",
          "terms": []
        },
        {
          "id": "09.14",
          "name": "Tarjetas Débito - Operativa",
          "terms": []
        },
        {
          "id": "09.15",
          "name": "Tarjetas Débito - Contratación",
          "terms": []
        },
        {
          "id": "09.16",
          "name": "Tarjetas Débito - Alta masiva de tarjeta",
          "terms": []
        },
        {
          "id": "09.17",
          "name": "Tarjetas Prepago - Consulta",
          "terms": []
        },
        {
          "id": "09.18",
          "name": "Tarjetas Prepago - Operativa",
          "terms": []
        },
        {
          "id": "09.19",
          "name": "Tarjeta Crédito - Consulta de contrato",
          "terms": []
        },
        {
          "id": "09.20",
          "name": "CVV Dinámico",
          "terms": [
            "cvv dinamico",
            "dynamic cvv"
          ]
        },
        {
          "id": "09.21",
          "name": "Tarjeta Prepago - Consulta contrato",
          "terms": []
        },
        {
          "id": "09.22",
          "name": "Tarjetas Crédito - Anulación",
          "terms": []
        },
        {
          "id": "09.23",
          "name": "Tarjetas Débito - Anulación",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "10.Comercio Exterior",
      "terms": [
        "comercio exterior",
        "trade finance",
        "divisas",
        "foreign exchange",
        "swift"
      ],
      "functions": [
        {
          "id": "10.01",
          "name": "Créditos documentarios de Exportación (Cartas de Crédito de Exportación)",
          "terms": [
            "carta de credito de exportacion",
            "export letter of credit"
          ]
        },
        {
          "id": "10.02",
          "name": "Créditos documentarios de Importación (Cartas de Crédito de Importación)",
          "terms": [
            "carta de credito de importacion",
            "import letter of credit"
          ]
        },
        {
          "id": "10.03",
          "name": "Remesas documentarias de Exportación (Cobranzas de Exportación)",
          "terms": []
        },
        {
          "id": "10.04",
          "name": "Financiamiento de Importacion y exportación",
          "terms": [
            "financiacion de importaciones",
            "export finance"
          ]
        },
        {
          "id": "10.05",
          "name": "Compra venta de divisas",
          "terms": [
            "cambio de divisas",
            "foreign exchange",
            "currency exchange"
          ]
        },
        {
          "id": "10.06",
          "name": "Landing de Gestión de Divisas",
          "terms": []
        },
        {
          "id": "10.07",
          "name": "Digital Trade Loan",
          "terms": [
            "digital trade loan"
          ]
        },
        {
          "id": "10.08",
          "name": "FX en Colombia",
          "terms": []
        },
        {
          "id": "10.09",
          "name": "Gestión de divisa masiva (ficheros)",
          "terms": []
        },
        {
          "id": "10.10",
          "name": "COMEX Argentina",
          "terms": []
        },
        {
          "id": "10.11",
          "name": "Contratos web",
          "terms": []
        },
        {
          "id": "10.12",
          "name": "T-Cambio (Alertas y órdenes)",
          "terms": [
            "t-cambio"
          ]
        },
        {
          "id": "10.13",
          "name": "Remesas documentarias de Importación (Cobranzas de Importación)",
          "terms": []
        },
        {
          "id": "10.14",
          "name": "Remesas Truncadas (autocobro Exprés) y Remesas Directas",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "11.Adquirencia / TPVs",
      "terms": [
        "adquirencia",
        "acquiring",
        "tpv",
        "pos",
        "checkout",
        "merchant services"
      ],
      "functions": [
        {
          "id": "11.01",
          "name": "Landing TPVs (reportería TPVs)",
          "terms": []
        },
        {
          "id": "11.02",
          "name": "Contratación TPV",
          "terms": [
            "contratacion tpv",
            "digital merchant onboarding"
          ]
        },
        {
          "id": "11.03",
          "name": "Seguimiento",
          "terms": []
        },
        {
          "id": "11.04",
          "name": "Control de terminales",
          "terms": []
        },
        {
          "id": "11.05",
          "name": "Seguimiento y contrato de terminales",
          "terms": []
        },
        {
          "id": "11.06",
          "name": "Commerce 360",
          "terms": [
            "commerce 360"
          ]
        },
        {
          "id": "11.07",
          "name": "TPVs Argentina",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "12.Inversión y Mercados",
      "terms": [
        "inversion",
        "investment",
        "deposito",
        "deposit",
        "ahorro",
        "savings",
        "inversiones",
        "investments",
        "depositos",
        "deposits"
      ],
      "functions": [
        {
          "id": "12.01",
          "name": "Inversión Libre Patrimonial",
          "terms": []
        },
        {
          "id": "12.02",
          "name": "Streaming PRLV (Pagaré con Rendimiento Liquidable al Vencimiento)",
          "terms": []
        },
        {
          "id": "12.03",
          "name": "Streaming PRLV (Pagaré con Rendimiento Liquidable al Vencimiento) Reinversión",
          "terms": []
        },
        {
          "id": "12.04",
          "name": "Depósitos a plazo",
          "terms": [
            "depositos a plazo",
            "term deposit",
            "time deposit"
          ]
        },
        {
          "id": "12.05",
          "name": "Fondos de inversión (consulta y compraventa)",
          "terms": [
            "fondos de inversion",
            "investment funds"
          ]
        },
        {
          "id": "12.06",
          "name": "Fondos de inversión Programados",
          "terms": []
        },
        {
          "id": "12.07",
          "name": "Mercados Globales",
          "terms": []
        },
        {
          "id": "12.08",
          "name": "Inversiones en reporto",
          "terms": []
        },
        {
          "id": "12.09",
          "name": "Fondos Internacionales + ESIS",
          "terms": []
        },
        {
          "id": "12.10",
          "name": "Custodio de valores",
          "terms": [
            "custodia de valores",
            "securities custody"
          ]
        },
        {
          "id": "12.11",
          "name": "Custodio de valores v2",
          "terms": []
        },
        {
          "id": "12.12",
          "name": "BBVA SAB",
          "terms": []
        },
        {
          "id": "12.13",
          "name": "Broker",
          "terms": [
            "broker"
          ]
        },
        {
          "id": "12.14",
          "name": "Carteras Patrimoniales",
          "terms": []
        },
        {
          "id": "12.15",
          "name": "Carteras Privadas",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "13.Salud financiera",
      "terms": [
        "salud financiera",
        "financial health",
        "financial analysis"
      ],
      "functions": [
        {
          "id": "13.02",
          "name": "Finanzas Inteligentes (Factura empresarial 2.0)",
          "terms": [
            "finanzas inteligentes",
            "factura empresarial"
          ]
        },
        {
          "id": "13.03",
          "name": "Análisis Financiero",
          "terms": [
            "analisis financiero",
            "financial analysis"
          ]
        },
        {
          "id": "13.04",
          "name": "Salud Financiera",
          "terms": [
            "salud financiera",
            "financial health"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "13.Sostenibilidad",
      "terms": [
        "sostenibilidad",
        "sustainability",
        "carbon footprint"
      ],
      "functions": [
        {
          "id": "13.01",
          "name": "Huella de Carbono",
          "terms": [
            "huella de carbono",
            "carbon footprint"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "14.Seguros",
      "terms": [
        "seguros",
        "insurance",
        "ciberseguro"
      ],
      "functions": [
        {
          "id": "14.01",
          "name": "Landing de Seguros",
          "terms": []
        },
        {
          "id": "14.02",
          "name": "Contratación de ciber seguro",
          "terms": [
            "ciberseguro",
            "ciber seguro",
            "cyber insurance"
          ]
        },
        {
          "id": "14.03",
          "name": "Contratación AR",
          "terms": []
        },
        {
          "id": "14.04",
          "name": "Autoseguro PYME - Contratación",
          "terms": [
            "autoseguro pyme"
          ]
        },
        {
          "id": "14.05",
          "name": "Autoseguro PYME - Cancelacion",
          "terms": []
        },
        {
          "id": "14.06",
          "name": "Polizas vigentes",
          "terms": []
        },
        {
          "id": "14.07",
          "name": "Gestión de Pólizas maestras",
          "terms": []
        },
        {
          "id": "14.08",
          "name": "Seguro Vida Ley",
          "terms": [
            "seguro vida ley"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "15.Otros",
      "terms": [
        "ficheros",
        "files",
        "documentos",
        "documents",
        "multiempresa",
        "self-service"
      ],
      "functions": [
        {
          "id": "15.01",
          "name": "Agenda de Beneficiarios",
          "terms": [
            "agenda de beneficiarios",
            "beneficiary management"
          ]
        },
        {
          "id": "15.02",
          "name": "Operaciones frecuentes",
          "terms": []
        },
        {
          "id": "15.03",
          "name": "Cita Previa",
          "terms": []
        },
        {
          "id": "15.04",
          "name": "Consulta de otros estados de cuenta",
          "terms": []
        },
        {
          "id": "15.05",
          "name": "Fideicomisos",
          "terms": [
            "fideicomisos",
            "trust management"
          ]
        },
        {
          "id": "15.06",
          "name": "Mis documentos/Expediente digital",
          "terms": [
            "expediente digital",
            "gestion documental",
            "document management"
          ]
        },
        {
          "id": "15.07",
          "name": "Mis tareas",
          "terms": []
        },
        {
          "id": "15.08",
          "name": "Ficheros",
          "terms": []
        },
        {
          "id": "15.09",
          "name": "Envío directo de ficheros",
          "terms": []
        },
        {
          "id": "15.10",
          "name": "Transmisión genérica",
          "terms": []
        },
        {
          "id": "15.11",
          "name": "Archivos encriptados (archivos cifrados)",
          "terms": [
            "archivos cifrados",
            "encrypted files"
          ]
        },
        {
          "id": "15.12",
          "name": "Encripción",
          "terms": []
        },
        {
          "id": "15.13",
          "name": "Mis conversaciones",
          "terms": [
            "mis conversaciones",
            "secure messaging"
          ]
        },
        {
          "id": "15.14",
          "name": "Ficheros - Recibir del banco",
          "terms": []
        },
        {
          "id": "15.15",
          "name": "Ficheros Mixtos Perú",
          "terms": []
        },
        {
          "id": "15.16",
          "name": "Capacidad Multiempresa Perú",
          "terms": [
            "multiempresa",
            "multi-company"
          ]
        },
        {
          "id": "15.18",
          "name": "Solicitudes por Formulario Perú",
          "terms": []
        },
        {
          "id": "15.19",
          "name": "Comprobantes",
          "terms": [
            "comprobantes",
            "payment receipts"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "16.Security Experience & Onboarding",
      "terms": [
        "seguridad",
        "security",
        "fraud",
        "fraude",
        "identidad",
        "identity",
        "onboarding",
        "autenticacion",
        "authentication",
        "biometria",
        "biometric",
        "firma",
        "signature"
      ],
      "functions": [
        {
          "id": "16.01",
          "name": "Login / login biométrico",
          "terms": [
            "login biometrico",
            "biometria",
            "biometricos",
            "biometric",
            "biometrics",
            "facial recognition"
          ]
        },
        {
          "id": "16.02",
          "name": "Login con coexistencia",
          "terms": []
        },
        {
          "id": "16.03",
          "name": "Olvido/Recuperar contraseña",
          "terms": [
            "recuperar contrasena",
            "password recovery"
          ]
        },
        {
          "id": "16.04",
          "name": "Consentimientos",
          "terms": [
            "consentimientos",
            "consent management"
          ]
        },
        {
          "id": "16.05",
          "name": "Firma online",
          "terms": [
            "firma electronica",
            "electronic signature",
            "e-signature"
          ]
        },
        {
          "id": "16.06",
          "name": "Firmas pendientes",
          "terms": [
            "firmas pendientes",
            "pending approvals"
          ]
        },
        {
          "id": "16.07",
          "name": "Firma con documento",
          "terms": []
        },
        {
          "id": "16.08",
          "name": "Softoken - Uso en canales",
          "terms": [
            "softtoken",
            "softoken",
            "soft token"
          ]
        },
        {
          "id": "16.09",
          "name": "Activacion digital",
          "terms": []
        },
        {
          "id": "16.10",
          "name": "Onboarding de no clientes (PJ)",
          "terms": [
            "onboarding digital",
            "digital onboarding",
            "onboarding empresas",
            "kyb",
            "kyc"
          ]
        },
        {
          "id": "16.11",
          "name": "Firma Diferida",
          "terms": [
            "firma diferida"
          ]
        },
        {
          "id": "16.12",
          "name": "Softoken - Activación",
          "terms": []
        },
        {
          "id": "16.13",
          "name": "Firma Out Of Band",
          "terms": [
            "firma out of band",
            "out-of-band signing"
          ]
        },
        {
          "id": "16.14",
          "name": "Login Out Of Band",
          "terms": [
            "login out of band"
          ]
        },
        {
          "id": "16.15",
          "name": "Clave de Operaciones",
          "terms": []
        },
        {
          "id": "16.16",
          "name": "Solicitud de cambio de versión de BBVA Empresas Web",
          "terms": []
        },
        {
          "id": "16.17",
          "name": "Solicitud de Token Físico",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "17.Enablers",
      "terms": [
        "api",
        "apis",
        "erp",
        "open banking",
        "automatizacion",
        "automation",
        "inteligencia artificial",
        "artificial intelligence",
        "ia",
        "ai",
        "asistente",
        "assistant",
        "chatbot",
        "embedded finance",
        "notifications",
        "omnicanal",
        "omnichannel"
      ],
      "functions": [
        {
          "id": "17.01",
          "name": "FAQs",
          "terms": [
            "preguntas frecuentes",
            "faqs"
          ]
        },
        {
          "id": "17.02",
          "name": "Avisos y novedades",
          "terms": []
        },
        {
          "id": "17.03",
          "name": "Espacios comerciales (opción de menú \"contratar\")",
          "terms": []
        },
        {
          "id": "17.04",
          "name": "Comunicaciones no comerciales - Envío",
          "terms": [
            "notificaciones",
            "notifications"
          ]
        },
        {
          "id": "17.05",
          "name": "Comunicaciones no comerciales - Dashboard y configuración",
          "terms": []
        },
        {
          "id": "17.06",
          "name": "Administración de usuarios/tokens",
          "terms": [
            "roles y permisos",
            "user permissions",
            "multiusuario",
            "multi-level approvals"
          ]
        },
        {
          "id": "17.07",
          "name": "Actualización de datos básicos",
          "terms": []
        },
        {
          "id": "17.09",
          "name": "Mensajería a beneficiarios (BBVA y Terceros)",
          "terms": [
            "mensajeria a beneficiarios"
          ]
        },
        {
          "id": "17.10",
          "name": "Autómata",
          "terms": []
        },
        {
          "id": "17.11",
          "name": "Descargas autómata",
          "terms": []
        },
        {
          "id": "17.12",
          "name": "Actividad en el canal",
          "terms": [
            "auditoria del canal",
            "channel audit"
          ]
        },
        {
          "id": "17.13",
          "name": "Límites",
          "terms": []
        },
        {
          "id": "17.14",
          "name": "SICOCO (información de comisiones cobradas por el uso del canal)",
          "terms": []
        },
        {
          "id": "17.15",
          "name": "H2H",
          "terms": [
            "h2h",
            "host to host",
            "host-to-host"
          ]
        },
        {
          "id": "17.16",
          "name": "API Channel",
          "terms": [
            "api bancaria",
            "banking api",
            "open banking",
            "open finance",
            "api",
            "apis",
            "integracion erp",
            "erp integration"
          ]
        },
        {
          "id": "17.17",
          "name": "Autorización de consulta a Buró de Crédito",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "18.Herramientas Empleados",
      "terms": [
        "helpdesk",
        "monitor funcional"
      ],
      "functions": [
        {
          "id": "18.01",
          "name": "Login y Portal Helpdesk",
          "terms": [
            "helpdesk"
          ]
        },
        {
          "id": "18.02",
          "name": "Identificación automática y contextualización en HelpDesk",
          "terms": []
        },
        {
          "id": "18.03",
          "name": "Integración en Monitor Funcional",
          "terms": [
            "monitor funcional"
          ]
        },
        {
          "id": "18.04",
          "name": "Portal administracion (Caudalimetro)",
          "terms": []
        },
        {
          "id": "18.05",
          "name": "Portal administracion (Menú)",
          "terms": []
        },
        {
          "id": "18.06",
          "name": "Menurización Landing",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "19.Core",
      "terms": [
        "accesibilidad",
        "accessibility",
        "navegacion",
        "navigation",
        "sesion",
        "session"
      ],
      "functions": [
        {
          "id": "19.01",
          "name": "Menurización",
          "terms": []
        },
        {
          "id": "19.02",
          "name": "Caudalímetro",
          "terms": []
        },
        {
          "id": "19.03",
          "name": "Portal configurador",
          "terms": []
        },
        {
          "id": "19.04",
          "name": "Acciones relacionadas",
          "terms": []
        },
        {
          "id": "19.05",
          "name": "Gestión de navegación",
          "terms": []
        },
        {
          "id": "19.06",
          "name": "Gestión de datos de sesión",
          "terms": []
        },
        {
          "id": "19.07",
          "name": "Gestión de errores",
          "terms": []
        },
        {
          "id": "19.08",
          "name": "Multiidioma",
          "terms": [
            "multiidioma",
            "multilingual"
          ]
        },
        {
          "id": "19.09",
          "name": "Cacheado de datos",
          "terms": [
            "cacheado de datos"
          ]
        },
        {
          "id": "19.10",
          "name": "Modo demo",
          "terms": [
            "modo demo",
            "demo mode"
          ]
        },
        {
          "id": "19.11",
          "name": "Gestión de formatos",
          "terms": []
        },
        {
          "id": "19.12",
          "name": "Modales",
          "terms": []
        },
        {
          "id": "19.13",
          "name": "Convivencia legacy",
          "terms": []
        },
        {
          "id": "19.14",
          "name": "SeMAAS",
          "terms": [
            "semaas"
          ]
        },
        {
          "id": "19.15",
          "name": "Comunicación entre soluciones funcionales",
          "terms": []
        },
        {
          "id": "19.16",
          "name": "Integración de dispositivo",
          "terms": []
        },
        {
          "id": "19.17",
          "name": "Gestión de PDF",
          "terms": []
        },
        {
          "id": "19.18",
          "name": "Configuarión de Toggles",
          "terms": [
            "feature toggles"
          ]
        },
        {
          "id": "19.19",
          "name": "Acciones",
          "terms": []
        },
        {
          "id": "19.20",
          "name": "Login con coexistencia",
          "terms": []
        },
        {
          "id": "19.21",
          "name": "Accesibilidad",
          "terms": [
            "accesibilidad",
            "accessibility"
          ]
        },
        {
          "id": "19.22",
          "name": "Sesión",
          "terms": []
        },
        {
          "id": "19.23",
          "name": "App Setting",
          "terms": []
        },
        {
          "id": "19.24",
          "name": "Gestión de redirección",
          "terms": []
        }
      ],
      "emerging": []
    },
    {
      "name": "20.Venta Digital",
      "terms": [
        "venta digital",
        "digital sales",
        "personalizacion",
        "personalization",
        "personalisation",
        "retargeting",
        "quantum",
        "deeplink"
      ],
      "functions": [
        {
          "id": "20.01",
          "name": "Espacios comerciales",
          "terms": []
        },
        {
          "id": "20.02",
          "name": "Identificación cliente",
          "terms": [
            "retargeting"
          ]
        },
        {
          "id": "20.03",
          "name": "Tagging",
          "terms": [
            "analitica de navegacion",
            "web analytics"
          ]
        },
        {
          "id": "20.04",
          "name": "Quantum",
          "terms": [
            "quantum",
            "analitica cualitativa"
          ]
        },
        {
          "id": "20.05",
          "name": "Deeplink",
          "terms": [
            "deeplink",
            "deep link",
            "deep linking"
          ]
        },
        {
          "id": "20.06",
          "name": "F30V",
          "terms": [
            "f30v"
          ]
        },
        {
          "id": "20.07",
          "name": "Tracking code",
          "terms": [
            "tracking code",
            "campaign attribution"
          ]
        },
        {
          "id": "20.08",
          "name": "Testing y personalización",
          "terms": [
            "personalizacion",
            "personalization",
            "personalisation",
            "a/b testing"
          ]
        }
      ],
      "emerging": []
    },
    {
      "name": "21.Funcionalidad transversal",
      "terms": [
        "feedback",
        "customer feedback"
      ],
      "functions": [
        {
          "id": "21.01",
          "name": "Espacios comerciales (opción de menú \"contratar\")",
          "terms": []
        },
        {
          "id": "21.02",
          "name": "Feedback de cliente",
          "terms": [
            "feedback de cliente",
            "customer feedback"
          ]
        }
      ],
      "emerging": []
    }
  ]
});
addVocabularyTerms_(CONFIGURATION_DEFAULTS);
