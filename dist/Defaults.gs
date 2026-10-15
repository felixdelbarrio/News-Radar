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
    "defaultEntity": "BBVA",
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
    "unknownCountry": "Sin determinar",
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
        "Garanti BBVA",
        "BBVA Provincial",
        "Provinet Empresas"
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
        "Santander Empresas"
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
        "HSBC Empresas"
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
      "aliases": [],
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
        "Citibank"
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
        "smb",
        "imprese",
        "unternehmen",
        "entreprises"
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
  ]
});
