const FUNCTIONAL_CATALOG_SEED = Object.freeze([
  {
    "name": "01.Home",
    "functions": [
      {
        "id": "01.01",
        "name": "Dashboard/Posición productos transformados",
        "description": "funcionalidad de MX. Actualmente es una pantalla donde lista todas tus cuentas en formato CLABE. No deberíamos hacerlo así sino incrustando la visualización del número de cuenta en formato CLABE al lado de donde aparece en el formato clásico (en la pantalla de consulta de cuenta)"
      }
    ]
  },
  {
    "name": "02.Cuentas",
    "functions": [
      {
        "id": "02.01",
        "name": "Landing de cuentas",
        "description": "Landing de cuentas, hace referencia a saldos y movimientos"
      },
      {
        "id": "02.02",
        "name": "Consulta de movimientos de cuenta",
        "description": "Consulta de movimientos de cuenta"
      },
      {
        "id": "02.03",
        "name": "Extracto mensual de cuenta / Estado de cuenta",
        "description": "Extracto mensual de cuentas / estado de cuenta"
      },
      {
        "id": "02.04",
        "name": "Editar alias de cuenta",
        "description": "Edición del alias de una cuenta"
      },
      {
        "id": "02.05",
        "name": "Descarga formatos de ficheros (PDF, Excel, CSV,TXT, C43, CAMT053)",
        "description": "Descarga formatos de ficheros (CAMT 53, cuaderno 43, pdf y csv)"
      },
      {
        "id": "02.06",
        "name": "Descarga formatos de ficheros (Multicash y BAI-2)",
        "description": "Descarga formatos de ficheros (Multicash y BAI-2). Se incluye como formatos de descarga de movimientos."
      },
      {
        "id": "02.07",
        "name": "Cuentas Maestras",
        "description": "Cuentas de gobierno - Solo Colombia\nCuentas con restricciones de operaciones. \nPara el modulo de cuentas debería poder listarse como una cuenta mas, se debería controlar en las operativas."
      },
      {
        "id": "02.08",
        "name": "Cuentas AFC",
        "description": "Cuenta de ahorros para fomento de construcción\n\nLos saldos se ven en SyM de Cuentas como en una cuenta cualquiera pero tienen funcionalidades adicionales (dispersión del efectivo, informes fiscales, etc), que está pendiente que se desarrollen para empatar con la funcionalidad legacy."
      },
      {
        "id": "02.09",
        "name": "Centralización de cuentas",
        "description": "La centralización de cuentas es un cash pooling que permite dejar las cuentas con unos saldos determinados a cierre de día generando movimeintos de barridos automáticos en una estructura jerarquizada de cuentas. Esto solo incluye la consulta de dicha estructura y reglas, no realizar cambios, altas o bajas en ella.\n\nEn el caso de MX, están con el proyecto de Cuentas Virtuales y se están planteando que los pocos clientes que tienen centralización de cuentas se migren a Cuentas Virtuales. Si es así, no llegaremos a transformar esto. De momento, lo dejaremos para el final por si no se hace"
      },
      {
        "id": "02.10",
        "name": "Centralización Plus",
        "description": "Es una segunda opción de Centralización de Cuentas que existe en MX pero usando no cuentas reales sino cuentas control (una suerte de Cuentas Virtuales de MX). Es posible que se llegue a deprecar porque quede cubierta con el proyecto de Cuentas Virtuales. De momento no está concretado si eso ocurrirá."
      },
      {
        "id": "02.11",
        "name": "Cuentas y Movimientos de otros bancos",
        "description": "Cuentas y Movimientos que provienen de otros bancos"
      },
      {
        "id": "02.12",
        "name": "Financiación de movimientos",
        "description": "Posibilidad de financiación sobre algún movimiento"
      },
      {
        "id": "02.13",
        "name": "Aclaraciones",
        "description": "Reclamar al banco y pedir explicaciones por un movimiento no reconocido"
      },
      {
        "id": "02.14",
        "name": "Apertura 2ª cuenta (y sucesivas cuentas)",
        "description": "Es la contratación de una cuenta corriente adicional. El único requisito es tener ya contratada una cuenta previamente.\n\nNo se está usando mucho demasiado. Colombia valorará si se transforma tal cual está o hay que reformularlo. Podría apagarse net cash sin estar esto transformado."
      },
      {
        "id": "02.15",
        "name": "Certificados",
        "description": "Titularidad de cuentas, saldo en cuenta, etc.."
      },
      {
        "id": "02.16",
        "name": "Correspondencia Virtual",
        "description": "Documentación vinculada a los movimientos (versión digital de la carta que anteriormente se recibía por correo ordinario)"
      },
      {
        "id": "02.17",
        "name": "Intereses Overnight",
        "description": "Producto CIB de inversión con similitudes con la centralización de cuentas. La idea es que saldo de la cuenta del cliente se mueve durante la noche a un producto de inversión ubicado fuera de México que le reporta más intereses al cliente que el tener el saldo en la cuenta. A primera hora del día, se recupera el saldo más los intereses generados y se vuelve a situar en la cuenta del cliente\nFuncionalidades que incluye:\n- Cotización y alta de operaciones (tanto en MXN como en USD)\n- Consulta de operaciones liquidadas\n- Simulador de cotización de tasa"
      },
      {
        "id": "02.18",
        "name": "Cuenta CLABE",
        "description": "Funcinalidad de MX. Actualmente es una pantalla donde lista todas tus cuentas en formato CLABE. No deberíamos hacerlo así sino incrustando la visualización del número de cuenta en formato CLABE al lado de donde aparece en el formato clásico (en la pantalla de consulta de cuenta)"
      },
      {
        "id": "02.19",
        "name": "Documentos operativa CED",
        "description": "En MX, cuando se tienen cuentas en dólares se generan una serie de documentos en PDF (Seguridad, Compliance, términos y condiciones, etc) que han de quedar a disposición del cliente para su consulta o descarga. Habrá que valorar si se hace una pantalla específica, si se queda en el panel de empresa, en la consulta de cuentas... \nSon unos PDF únicos para el cliente, no para cada cuenta."
      },
      {
        "id": "02.20",
        "name": "Personalización grupos de cuentas",
        "description": "En MX se pueden agrupar varias cuentas del cliente bajo un nombre de grupo y luego usarlo en unos cuantos servicios para que la acción de ese servicio se haga sobre el conjunto de las cuentas agrupadas (evitando tener que hacerlo una a una). Ojo, porque esto puede tener impacto porque habrá que tenerlo en cuenta e implicará desarrollos seguramente en todos los servicios que tienen en cuenta estos grupos"
      },
      {
        "id": "02.21",
        "name": "Intervinientes",
        "description": "Permite consultar y modificar los intervinientes de una cuenta"
      }
    ]
  },
  {
    "name": "03.Pagos - Transf. y traspasos",
    "functions": [
      {
        "id": "03.01",
        "name": "Landing de pagos",
        "description": "Landing de consulta y navegación a los productos de pagos, incluyendo tracking, análisis de los pagos (proveedores, nóminas, impuestos...), etc"
      },
      {
        "id": "03.02",
        "name": "Traspasos individuales Nacionales",
        "description": "Traspasos mismo banco individuales"
      },
      {
        "id": "03.03",
        "name": "Traspasos individuales Interbancarios",
        "description": "Traspasos individuales interbancarios"
      },
      {
        "id": "03.04",
        "name": "Transferencias individuales Nacionales",
        "description": "Transferencias individuales interbancarias (SPEI)"
      },
      {
        "id": "03.05",
        "name": "Transferencias individuales Nacionales en divisa",
        "description": "Transferencias individuales interbancarias (SPID)"
      },
      {
        "id": "03.06",
        "name": "Transferencias masivas",
        "description": "Transferencias masivas mismo banco e interbancarias"
      },
      {
        "id": "03.07",
        "name": "Transferencias masivas Nacionales en divisa",
        "description": "Transferencias masivas interbancarias (SPID)"
      },
      {
        "id": "03.08",
        "name": "Pagos y traspasos puntuales y masivos con cuentas periféricas",
        "description": "Una cuenta periferica es una cuenta concentradora que barre saldos sobre una madre"
      },
      {
        "id": "03.09",
        "name": "Pagos individuales cuentas VOSTRO",
        "description": "Orden individual de pago con cargo a una cuenta VOSTRO de una entidad corresponsal. No comprende pagos internacionales genéricos sin referencia a VOSTRO."
      },
      {
        "id": "03.10",
        "name": "Transferencias cuentas agencia CED",
        "description": "Transferencias de cuentas agencia de BBVA en Houston en dólares (transferencias entre cuentas propias, internacionales y con compraventa de divisa)"
      },
      {
        "id": "03.11",
        "name": "Transferencias individuales a otros destinos/productos",
        "description": "Tarjeta de crédito\nTarjeta de crédito Puntos BBVA\nTarjeta crédito Cancelar pago programado\nTraspasos a terceros Moneda nacional A cuenta express\nTraspasos a terceros Moneda nacional A tarjetas pre-pagadas\nTraspasos a otros bancos A cuentas con/sin chequera\nTraspasos a otros bancos A otros créditos\nDinero móvil\nConsulta y cancelación Dinero movil"
      },
      {
        "id": "03.12",
        "name": "Tracking para transferencias individuales y masivas - Nacionales",
        "description": "Tracking de transferencias individuales y masivas E2E"
      },
      {
        "id": "03.13",
        "name": "Transferencias individuales internacionales",
        "description": "Transferencias individuales internacionales\nEn España incluye ABA y seguro de cambios"
      },
      {
        "id": "03.14",
        "name": "Transferencias masivas internacionales",
        "description": "Transferencias masivas internacionales"
      },
      {
        "id": "03.15",
        "name": "Tracking transferencias individuales internacionales",
        "description": "Tracking de transferencias individuales internacionales E2E"
      },
      {
        "id": "03.16",
        "name": "Pago a proveedores",
        "description": "Funcionalidad de pago a proveedores. No hablamos de \"Transferencias Masivas\" en Streaming sino de una aplicación paralela para el pago a proveedores, que incorpora información y alguna funcionalidad adicional"
      },
      {
        "id": "03.17",
        "name": "SIT (Servicio Integral de Tesorería, que es la aplicación de Pago a Proveedores de México",
        "description": "Funcionalidad que permite realizar la dispersión de pagos para ayudar a tu empresa a administrar en forma ágil y oportuna el pago referenciado a proveedores, asegurando que cada pago enviado sea validado contra el catálogo de proveedores registrado por la misma empresa/entidad."
      },
      {
        "id": "03.18",
        "name": "Periodicas y Programadas individuales",
        "description": "Todo lo relacionado con las transferencias individuales programadas:\n- Creación\n- Administración\n- Procesado\n- Tracking"
      },
      {
        "id": "03.19",
        "name": "Programadas masivas",
        "description": "Todo lo relacionado con las transferencias masivas programadas:\n- Creación\n- Administración\n- Procesado\n- Tracking"
      },
      {
        "id": "03.20",
        "name": "Administración de lotes",
        "description": "Gestión de lotes (alta, baja y modificación)\nAdministración de lotes:\nPagos Mixtos\nBajas/Modificación de registros\nCrear Copia\nConsulta de plantillas"
      },
      {
        "id": "03.21",
        "name": "Transferencias en Streaming (alcance estratégico)",
        "description": "Incluye todas aquellas features que puedan existir en la geografía en legacy relacionadas con transferencias masivas en streaming que aún no están cubiertas por el MVP productivo de ETPB y que son imprescindibles para poder apagar la funcionalidad legacy"
      },
      {
        "id": "03.22",
        "name": "Pagos financiados - Individuales",
        "description": "Financiación de una orden individual de pago empresarial; exige referencia explícita al anticipo o financiación del pago."
      },
      {
        "id": "03.23",
        "name": "Pagos financiados - Ficheros",
        "description": "Financiación de pagos empresariales enviados por fichero o lote. Excluye una transferencia individual sin financiación."
      },
      {
        "id": "03.24",
        "name": "Reutilización de ficheros",
        "description": "Feature que permite buscar desde tracking un fichero ya procesado, seleccionarlo, recuperar sus datos y editarlos para poder volver a enviarlo"
      },
      {
        "id": "03.25",
        "name": "Iniciación de pagos de cuentas de otros bancos",
        "description": "Poder iniciar transferencias seleccionando como cuentas de cargo cuentas de otros bancos (funcioanlidad disponible del proyecto de One View)"
      },
      {
        "id": "03.26",
        "name": "Transferencias individuales nacionales (alcance estratégico)",
        "description": "Incluye todas aquellas features que puedan existir en la geografía en legacy relacionadas con transferencias individuales que aún no están cubiertas por el MVP productivo de ETPB y que son imprescindibles para poder apagar la funcionalidad legacy"
      },
      {
        "id": "03.27",
        "name": "Tracking SWIFT-GPI",
        "description": "Tracking detallado de transferencias internacionales donde se puede seguir también la situación del pago durante su paso por bancos corresponsales."
      }
    ]
  },
  {
    "name": "04.Pagos - Nóminas",
    "functions": [
      {
        "id": "04.01",
        "name": "Nóminas en tiempo real",
        "description": "Nominas en streaming\nES: Incluye fichero Nominas bajo ETPB"
      },
      {
        "id": "04.02",
        "name": "Tracking de Nóminas",
        "description": "Tracking de nominas E2E"
      },
      {
        "id": "04.03",
        "name": "Nóminas - Contratación",
        "description": "Contratación del servicio de nómina para una empresa. Se diferencia de enviar una nómina o consultar un pago ya realizado."
      },
      {
        "id": "04.04",
        "name": "Afiliación apertura de Cuentas masiva",
        "description": "Alta de cuentas masivas para empleados en el pago de nominas y CTS (en México se llama AFILIACIÓN DE CUENTAS y es es una opción dentro de Nóminas)"
      },
      {
        "id": "04.05",
        "name": "Afiliación tarjetas beneficiacios nómina",
        "description": "Afiliación de tarjetas de los beneficiarios al servicio de nómina de la empresa. No comprende una oferta general de tarjetas de particulares."
      },
      {
        "id": "04.06",
        "name": "Pago de CTS masivo",
        "description": "Pago de CTS masivo. Compensación por tiempo de servicio (cuenta intangible que recibe 2 pagos al año)\nIncluye tracking de CTS"
      },
      {
        "id": "04.07",
        "name": "Nóminas en tiempo real (alcance estratégico)",
        "description": "Incluye todas aquellas features que puedan existir en la geografía en legacy que aún no están cubiertas por el MVP productivo de ETPB y que son imprescindibles para poder apagar la funcionalidad legacy"
      },
      {
        "id": "04.08",
        "name": "Pago a fuerzas de ventas / comisionistas",
        "description": "Feature del aplicativo de nóminas que permite el abono de las comisiones generadas por ventas a las personas contratadas como fuerza de ventas pero que cobran por comisión, ya que no son empleados de la empresa y, por tanto, no pueden recibir una nóminas por temas legales.\n\nLa idea es realizar el pago usando nóminas en tiempo real, pero indicando en un atributo que no es una nómina propiamente dicha sino un pago de comisiones por ventas."
      },
      {
        "id": "04.09",
        "name": "Programas Sociales: Afiliación masiva beneficiarios",
        "description": "Los Programas sociales en MX son ayudas institucionales a personas en situación de vulnerabilidad. En este caso el cliente del banco es el pagados (Gobierno e Insituciones Públicas).\n\nLo que se quiere es replicar el proceso de afiliación masiva de cuentas para beneficiarios de nómina, pero para personas beneficarias de programas sociales. El proceso será DIY y lo lanza (subiendo el fichero) la propia Institución Pública. No puede usarse el mismo proceso que el de afiliación masiva porque nacerían como cuentas normales asociadas a un beneficiario de nómina y estarían sujetos a comisiones y además se contaminaría el stock de nómina actual."
      }
    ]
  },
  {
    "name": "05.Pagos - Impuestos",
    "functions": [
      {
        "id": "05.01",
        "name": "Consulta y modificación de datos fiscales",
        "description": "Funcionalidad para la consulta y modificación de datos fiscales\nCFDI"
      },
      {
        "id": "05.02",
        "name": "Pago de impuestos CDMX",
        "description": "Pago de impuestos TESOFE (Tesorería de la Federación), CDMX (Tesorería de Ciudad de México), SAT (Obligaciones fiscales federales) y Aduanales (pago de impuestos al comercio exterior)\n\nSAT (Consulta y pago de impuestos federales ISR, IVA y el IEPS)"
      },
      {
        "id": "05.03",
        "name": "Consulta de impuesto CDMX",
        "description": "Pantalla a la que se accederá al pulsar la opción de menú \"Impuestos\", que mostrará un tracking común para todos los impuestos (pudiendo filtrar por tipo de impuesto, fecha, texto libre, etc) y los CTA para iniciar los flujos de los distintos tipos de impuesto"
      },
      {
        "id": "05.04",
        "name": "Pago de impuestos TESOFE",
        "description": "Pago de impuestos TESOFE (Tesorería de la Federación), CDMX (Tesorería de Ciudad de México), SAT (Obligaciones fiscales federales) y Aduanales (pago de impuestos al comercio exterior)\n\nSAT (Consulta y pago de impuestos federales ISR, IVA y el IEPS)"
      },
      {
        "id": "05.05",
        "name": "Consulta de impuesto TESOFE",
        "description": "Pantalla a la que se accederá al pulsar la opción de menú \"Impuestos\", que mostrará un tracking común para todos los impuestos (pudiendo filtrar por tipo de impuesto, fecha, texto libre, etc) y los CTA para iniciar los flujos de los distintos tipos de impuesto"
      },
      {
        "id": "05.06",
        "name": "Pago de impuestos SAT",
        "description": "Pago de impuestos TESOFE (Tesorería de la Federación), CDMX (Tesorería de Ciudad de México), SAT (Obligaciones fiscales federales) y Aduanales (pago de impuestos al comercio exterior)\n\nSAT (Consulta y pago de impuestos federales ISR, IVA y el IEPS)"
      },
      {
        "id": "05.07",
        "name": "Consulta de impuesto SAT",
        "description": "Pantalla a la que se accederá al pulsar la opción de menú \"Impuestos\", que mostrará un tracking común para todos los impuestos (pudiendo filtrar por tipo de impuesto, fecha, texto libre, etc) y los CTA para iniciar los flujos de los distintos tipos de impuesto"
      },
      {
        "id": "05.08",
        "name": "Pago de impuestos ADUANALES",
        "description": "Pago de impuestos TESOFE (Tesorería de la Federación), CDMX (Tesorería de Ciudad de México), SAT (Obligaciones fiscales federales) y Aduanales (pago de impuestos al comercio exterior)\n\nSAT (Consulta y pago de impuestos federales ISR, IVA y el IEPS)"
      },
      {
        "id": "05.09",
        "name": "Consulta de impuesto ADUANALES",
        "description": "Pantalla a la que se accederá al pulsar la opción de menú \"Impuestos\", que mostrará un tracking común para todos los impuestos (pudiendo filtrar por tipo de impuesto, fecha, texto libre, etc) y los CTA para iniciar los flujos de los distintos tipos de impuesto"
      },
      {
        "id": "05.10",
        "name": "Pago de impuestos SIPARE",
        "description": "SIPARE (Sistema de Pago Referenciado)"
      },
      {
        "id": "05.11",
        "name": "Consulta de impuesto SIPARE",
        "description": "Pantalla a la que se accederá al pulsar la opción de menú \"Impuestos\", que mostrará un tracking común para todos los impuestos (pudiendo filtrar por tipo de impuesto, fecha, texto libre, etc) y los CTA para iniciar los flujos de los distintos tipos de impuesto"
      },
      {
        "id": "05.12",
        "name": "Pago de impuestos SAR-ISSSTE",
        "description": "SAR-ISSSTE (Sistema de Pago Referenciado)"
      },
      {
        "id": "05.13",
        "name": "Consulta de impuesto SAR-ISSSTE",
        "description": "Pantalla a la que se accederá al pulsar la opción de menú \"Impuestos\", que mostrará un tracking común para todos los impuestos (pudiendo filtrar por tipo de impuesto, fecha, texto libre, etc) y los CTA para iniciar los flujos de los distintos tipos de impuesto"
      },
      {
        "id": "05.14",
        "name": "Pago de Impuestos SUA",
        "description": "Sistema único de autodeterminación"
      },
      {
        "id": "05.15",
        "name": "Consulta de impuestos SUA",
        "description": "Sistema único de autodeterminación"
      },
      {
        "id": "05.16",
        "name": "DPA (Derecho, Productos y aprovechamientos)",
        "description": "Derechos, Productos y aprovechamientos"
      },
      {
        "id": "05.17",
        "name": "Afiliación y Administración de detracciones (PE)",
        "description": "Permite afiliarse para que la agencia tributaria haga los cargos en las cuenta del ciente.\n\nLas detracciones son impuestos al ente regulador SUNAT (Superintendencia Nacional de Tributos Internos · Superintendencia Nacional de Aduanas). Este es un pago que ayuda a la recaudación de impuestos. Este mecanismo consiste en generar un descuento al comprador (un porcentaje sobre el precio de venta del servicio o bien comprado). El comprador abona en una cuenta de \"detracciones\" y desde esta cuenta, nuestro cliente sólo puede realizar pagos de tributos al Sunat, de forma masiva o individual.."
      },
      {
        "id": "05.18",
        "name": "CFDI: Constancias Fiscales Consultas Solicitud (MX)",
        "description": "Funcionalidad para la consulta y solicitud de la Constancia de situación fiscal (es un documento oficial emitido por el Servicio de Administración Tributaria (SAT), el cual da a conocer la legalidad del régimen fiscal de una persona física o moral, así como su actividad económica. Es requisito primordial que el contribuyente cuente con este documento para la generación de diferentes trámites fiscales)"
      },
      {
        "id": "05.19",
        "name": "CFDI: Fiduciario",
        "description": "CFDI: Fiduciario"
      },
      {
        "id": "05.20",
        "name": "CFDI: Complemento de pago",
        "description": "Permitir añadir el sello digital que genera el banxico al SPEI que se ha generado"
      },
      {
        "id": "05.21",
        "name": "CFDI: Estado de cuenta",
        "description": "Habilita la descarga de informes de consultas CFDI"
      },
      {
        "id": "05.22",
        "name": "CFDI: Factoraje",
        "description": "Descarga de comprobantes fiscales, carga de complemento de recepción de pagos y consultas"
      },
      {
        "id": "05.23",
        "name": "Estatales",
        "description": "Pago de impuestos estatales"
      },
      {
        "id": "05.24",
        "name": "Impuestos Autonómicos (ES)",
        "description": "Pago de tributos de una comunidad autónoma española mediante canal empresarial. Requiere identificación del tributo o administración autonómica."
      },
      {
        "id": "05.25",
        "name": "Impuestos Municipales (ES)",
        "description": "Pago de tributos municipales españoles mediante canal empresarial. Requiere referencia al impuesto o ayuntamiento, no a cualquier pago público."
      },
      {
        "id": "05.26",
        "name": "Pago de impuestos masivo por fichero",
        "description": "Funcionalidad de España que permite el envío de un fichero con pagos de varios impuestos (estatales, autonómicos y municipales y múltiples en un único fichero), tanto con cargo sin agrupar como con cargo agrupado"
      },
      {
        "id": "05.27",
        "name": "Tracking de pago de impuestos España",
        "description": "Consulta de  histórico de impuestos, detalle y justificante"
      }
    ]
  },
  {
    "name": "06.Pagos - Servicios y otros",
    "functions": [
      {
        "id": "06.01",
        "name": "Pagos individuales CIE o servicios/recibos no domicilados",
        "description": "Dentro de esta feature se incluye cualquier forma de pagar Servicios a proveedores de forma no automática o domiciliada. En cada país tiene un nombre diferente (ejemplos: Pagos CIE en México, Pago de Recibos no domiliados en España, Recaudadoras en Argentina, Pago de Factura individual en Colombia, Pago de Servicios e Instituciones en Perú).\n\nSe incluye también la parte de la administración del servicio. Por ejemplo, programar pagos periódicos de servicios, cancelar esta programación, etc"
      },
      {
        "id": "06.02",
        "name": "Pagos de facturas masivos",
        "description": "Funcionalidad para el pago de facturas de forma masiva (pago de servicios, no pago a proveedores)\n\nEl cliente genera un archivo con todas las facturas que tiene que pagar que están asociadas a algún convenio. Pero estas son todas destino BBVA.\n\nEs la versión masiva del ID55"
      },
      {
        "id": "06.03",
        "name": "PSE - pagos",
        "description": "Funcionalidad de Pagos Seguros en Línea que permite a las empresas vender o recaudar dinero a través de internet\n\nEs pago de servicios de forma no domiciliada (vía Convenio como el CIE de MX; en Colombia se llama PSE)"
      },
      {
        "id": "06.04",
        "name": "PSE - Pago seguridad social",
        "description": "Pagos Seguros en linea para la seguridad social"
      },
      {
        "id": "06.05",
        "name": "Servicios en línea (pantalla llamada \"Cheques en línea\")",
        "description": "Es una funcionalidad muy usada en MX (creo que en un minisitio al que llegas tanto desde BNC como desde BCOM y la de particulares) para pago de convenios (impuesto, servicios). No hay cheque de por medio, en realidad sólo se llama así."
      },
      {
        "id": "06.06",
        "name": "Request to Pay",
        "description": "Producto de petición de pago (visión pagador)\nCODI México\nQR Perú\nRequest to Pay (ESPAÑA)"
      },
      {
        "id": "06.07",
        "name": "Pagos via SEBRA",
        "description": "Pagos entre el Banco de la República y el banco.\n\nSEBRA es la cámara de compensación del banco de la República de Colombia, que tiene varios barridos al día. Grandes empresas lo utilizan para compensar con el Banco de la República. \n\nHoy por hoy, sólo es un front en el que el cliente \"solicita\" hacer un pago de este tipo. Y luego la ejecuta manualmente el equipo de Operaciones."
      },
      {
        "id": "06.08",
        "name": "Dispersión de efectivo",
        "description": "Funcionalidad que recauda de los clientes y ese dinero se pone directamente en sus cuentas\nPor ejemplo, una empresa recibe pagos con tarjeta y en efectivo. Contratan el servicio de \"recogida de efectivo\", una empresa llega, recoge el dinero y lo ingresa en una cuenta temporal. Desde esta funcionalidad se mueve el dinero de la cuenta remansadora temporal a las cuentas del cliente que él especifique.\nHaciéndolo de esta forma, permiten ahorrar una tasa del 4%. Solo unos 20 clientes lo tienen actualmente pero se espera que crezca"
      },
      {
        "id": "06.09",
        "name": "Mandatos SEPA",
        "description": "Consulta de mandatos SEPA o autorizaciones de cargo en cuenta por recibos domiciliados. Desde aquí se pueden consultar qué empresas pueden emitir adeudos/recibos para cargarlo en cuenta automáticamente y puedes revocar dichas autorizaciones."
      },
      {
        "id": "06.10",
        "name": "Cheques - Consultas",
        "description": "Funcionalidad completa de Cheques:\n\nConsultas Cheques\nConsultas Lotes\nConsultas Chequeras"
      },
      {
        "id": "06.11",
        "name": "Envio de impresión de Cheques a la oficina",
        "description": "Journey en el que se crea un fichero en el canal que llega a la oficina, y la oficina genera el cheque físico\". En el caso de Perú se llama \"Solicitud de cheques\""
      },
      {
        "id": "06.12",
        "name": "Contratación de domiciliaciones",
        "description": "Nueva funcionalidad en MX. Hasta ahora, existía la funcionalidad de \"domiciliaciones\" con la visión del cobrador/proveedor de servicios, donde enviaban recibos al cobro automático. \r\n\r\nEsto es la visión del que tiene que pagar sus servicios y los quiere domiciliar. Se proporcionará un proceso E2E para que \"contraten\" sus domiciliaciones, refiriéndonos a que con ese proceso den de alta (y firmen teniendo poderes bastantes) a aquellos proveedores que puedan hacerles cobros automáticos vía domiciliación, evitando así algunas situaciones de fraude que han venido dándose."
      },
      {
        "id": "06.13",
        "name": "Cheques - Operativa",
        "description": "Funcionalidad que permite proteger (impedir que pueda cobrarse) o liberar (permitir su cobro) un cheque. En el caso de la liberación, se puede especificar fecha hasta la cual puede cobrarse y limitar quién puede cobrarlo\n\nIncluye:\nCaptura Inmediata (protección, desprotección)\nCaptura Multiple (protección, desprotección)\nImportación Mismo día\nImportación Día Siguiente\nSuspensión de cheques\nCheques devueltos"
      },
      {
        "id": "06.14",
        "name": "Cheques - Imágenes digitalizadas",
        "description": "\"Imágenes Digitalizadas/\"Cheques Devueltos        \"        \n\"Imágenes Digitalizadas/\"Cheques Pagados/\"Solicitar Imagen        \"\n\"Imágenes Digitalizadas/\"Cheques Pagados/Consultar Solicitados"
      },
      {
        "id": "06.15",
        "name": "eCheqs - Pago",
        "description": "Incluye: \n- Pago de eCheqs\n- Bandeja de entrada: Búsqueda y consulta de eCheqs recibidos\n- Bandeja de salida: Bandeja de salida, emision masiva, notificaciones, configutacion y cesion /dscto de echeq"
      }
    ]
  },
  {
    "name": "07.Cobros",
    "functions": [
      {
        "id": "07.01",
        "name": "Landing de cobros",
        "description": "Pantalla a la que se accede al pulsar la opción de \"cobros\" en el menú lateral, que permitirá el acceso al cliente a operar o gestionar su operativa con los distintos productos de cobros así como disponer de información del tracking de los mismos e información analítica sobre cómo ha recibido ingresos por ventas en un periodo de tiempo (cantidades recaudadas con adquirencia, transfrencias recibidas, ingresos en cuenta, adeudos directos, recibos no domiciliados, cobros CIE, etc)"
      },
      {
        "id": "07.02",
        "name": "Adeudos directos (débito automático/recibos domicilados) - CREACIÓN MANUAL",
        "description": "Creación manual, individual o múltiple (lotes), de órdenes de recibos domiliados (domicilaciones, adeudos directos SEPA, etc)\n\nPermite crear órdenes individuales o lotes de órdenes de adeudo directo/automático en cuenta para cobro de servicios."
      },
      {
        "id": "07.03",
        "name": "Adeudos directos (débito automático/recibos domicilados) - TRACKING",
        "description": "Permitiría el tracking de los ficheros u órdenes (individuales o múltiples) de adeudo directo automático, consultar qué órdenes han sido cobradas, cuáles rechazadas, volver a enviar al cobro, información totalizada, consultas, etc"
      },
      {
        "id": "07.04",
        "name": "Recibos no domiciliados - Carga / Cobros de Servicios / Cobros CIE (visión cobrador)",
        "description": "Listado de las órdenes de cobro que envías a los clientes, para que te lo paguen mediante el flujo de pagos de servicios"
      },
      {
        "id": "07.05",
        "name": "Recibos no domiciliados - Tracking / Cobros de Servicios / Cobros CIE (visión cobrador)",
        "description": "Tracking de recibos no docimiliados visión \"cobrador\". Permite la consulta de aquellos recibos que has enviado a tus clientes para el cobro"
      },
      {
        "id": "07.06",
        "name": "Cobranza y Recaudación - CIE Reporte Mensual",
        "description": "Recibir los pagos de tus clientes en forma automática y referenciada a través del número de convenio exclusivo de Concentración Inmediata Empresarial (CIE)."
      },
      {
        "id": "07.07",
        "name": "Cobranza y Recaudación - CIE 7x24",
        "description": "Recibir los pagos de tus clientes en forma automática y referenciada a través del número de convenio exclusivo de Concentración Inmediata Empresarial (CIE)."
      },
      {
        "id": "07.08",
        "name": "Cobranza y Recaudación - CIE Estado de cuenta CIE",
        "description": "Recibir los pagos de tus clientes en forma automática y referenciada a través del número de convenio exclusivo de Concentración Inmediata Empresarial (CIE)."
      },
      {
        "id": "07.09",
        "name": "Cobranza y Recaudación - CIE Movimientos del día",
        "description": "Recibir los pagos de tus clientes en forma automática y referenciada a través del número de convenio exclusivo de Concentración Inmediata Empresarial (CIE)."
      },
      {
        "id": "07.10",
        "name": "Transferencias nacionales recibidas",
        "description": "Consulta específica de Transferencias recibidas (bizum, ingresos o depósitos en cuenta también), donde el cliente elegirá una o varias cuentas y un periodo de tiempo y podrá ver todas los cobros que ha recibido en ese periodo por esos medios"
      },
      {
        "id": "07.11",
        "name": "Transferencias internacionales recibidas",
        "description": "Transferencias internacionales recibidas (OPRs)\n\nEn Colombia esta funcionalidad se realiza con Comex Net). Van a darle una vuelta a ver si lo integran en net cash porque tienen un presupuesto específico para FX este año, que habrá que ver si se puede reutilizar algo hecho por otro país..\n\nEn Argentina esta opción se llama \"Gestión de Órdenes\" y permite la consulta y la liquidación de órdenes de pago recibidas del exterior"
      },
      {
        "id": "07.12",
        "name": "TIB (Tesorería Integral Bancaria - MX)",
        "description": "Funcionalidad para recibir cualquier tipo de depósito, en efectivo, documentos, cheques de BBVA y otros bancos, en moneda nacional o dólares.\nImpotación y Envío (Depósitos y Devoluciones)\nSolcitudes\nConsultas (Depositos, devoluciones, parámetros, Operaciones de terminales, \nSolicitudes"
      },
      {
        "id": "07.13",
        "name": "Convenio CEE - Cobranza empresarial especializada",
        "description": "Depósito - Alta puntual\nDepósito - Alta Importación\r\nConsulta de Movimientos\nConsulta Mensual\nDotaciones - Crear Solicitud\nDotaciones - Consultar Solicitud"
      },
      {
        "id": "07.14",
        "name": "Convenio CEE - Cobranza empresarial especializada",
        "description": "Convenio CEE:\nDocumentos por pagar\nDocumentos que ya pagó"
      },
      {
        "id": "07.15",
        "name": "Devolución de recibos",
        "description": "Devolución de recibos domiciliados desde una cuenta empresarial. Se diferencia de la devolución de una compra con tarjeta."
      },
      {
        "id": "07.16",
        "name": "Adeudos directos (débito automático/recibos domicilados) - FICHEROS",
        "description": "Carga, procesado y tracking de ficheros de recibos domiliados (domicilaciones, adeudos directos SEPA, etc)\n\nPermite enviar ficheros de adeudo directo/automático en cuenta para cobro de servicios."
      },
      {
        "id": "07.17",
        "name": "Adeudos directos (débito automático/recibos domicilados) - CREACIÓN MANUAL FINANCIADO",
        "description": "Creación manual de órdenes de Adeudos directos Financiados"
      },
      {
        "id": "07.18",
        "name": "Adeudos directos (débito automático/recibos domicilados) - FICHERO FINANCIADO",
        "description": "Ficheros de de Adeudos directos Financiados"
      }
    ]
  },
  {
    "name": "08.Financiación",
    "functions": [
      {
        "id": "08.01",
        "name": "Landing de Financiación",
        "description": "Landing donde se agrupan todas las funcionalidades de Financiación"
      },
      {
        "id": "08.02",
        "name": "Crédito Virtual",
        "description": "Se trata límites revolventes que el cliente contrata previamente con el banco y de los que luego va a haciendo disposiciones a voluntad. En MX se llama Crédito Líquido (con variantes \"a plazos\", \"anual\" y \"Flex\") y está también oa variante Crédito Líquido FIRA, que es lo mismo pero con una garantía adicional, en principio no es necesario transformar dos productos distintos. Crédito Líquido a plazos, Flex y anual tienen líneas específicas en esta excel porque no tenemos claro que sea reutilizable lo de MX)\nSe parece a la línea multifinalidad de España, pero en este caso puede utilizarse para cualquier finalidad y hay amortización mensual o trimestral (también anual en el caso de México), mientras que en la multifinalidad de España la amortización es en un pago único a vencimiento."
      },
      {
        "id": "08.03",
        "name": "Crédito Líquido a plazos",
        "description": "Es un límite revolvente que el cliente contrata previamente con el banco y de los que luego va a haciendo disposiciones a voluntad con un plazxo máximo de 180 días y tiene flujos adicionales al crédito líquido a plazos como la recalendarización."
      },
      {
        "id": "08.04",
        "name": "Crédito Líquido anual",
        "description": "Es un límite revolvente que el cliente contrata previamente con el banco y de los que luego va a haciendo disposiciones a voluntad pero las disposiciones tienen obligatoriamente un plazo de 365 días (aunque puedes amortizar anticipadamente si quieres"
      },
      {
        "id": "08.05",
        "name": "Crédito Líquido Flex - Consultas",
        "description": "\"Es una línea de crédito para Empresas (no Pymes) que se contrata en oficina y sobre la que se hacen disposiciones de manera digital. Las disposiciones pueden ser de dos tipos: revolventes (con pagos puntuales) o con plan de pagos fijos (con cuadro de amortización), admitiendo varios tipos de amortización en este segundo caso (mensual, trimestral, anual...). Sea cual sea la modalidad, se renueva anualmente y para renovarlo al año, se hace un pago puntual de todo lo dispuesto pendiente de amortizar. \n\nLeyendo esta descripción, inicialmente interpretamos que eran dos límites en uno, como el Préstamo Flexible Digital Pymes pero no, el límite es único y lo que cambia es la forma de amortización. Pero según se ve en la descripción comercial del producto, parece que en ambos casos el comportamiento es Revolvente (lo que se va pagando, se va disponibilizando de nuevo).\n\nEl producto es también llamado \"Crédito Líquido Flexible\" o \"Crediflex\". Esta es la ficha comercial del producto:\nhttps://www.bbva.mx/empresas/productos/financiamiento/creditos-a-corto-y-largo-plazo/credito-flex.html"
      },
      {
        "id": "08.06",
        "name": "FastCash",
        "description": "Como en el caso de la Cuenta de crédito de España, la línea multifinalidad de España, el Crédito Líquido de México o el Crédito Virtual de Colombia, la línea de Préstamo Comercial es un producto de financiación revolvente que el cliente contrata previamente y del que va haciendo disposiciones.\r\n\r\nLa diferencia de este producto con los anteriores es que, de ese límite revolvente, una parte es no comprometida (se pueden hacer disposiciones en la oficina previa autorización) y otra parte, comprometida y se puede disponer libremente de ella desde el canal bajo el nombre comercial FastCash.\r\n\r\nEstas disposiciones también se diferencian de las de las de crédito virtual (CO) ya que cada una de ellas tendrá su propio vencimiento y cuadro de amortización en lugar de tener liquidaciones periódicas por el total del importe dispuesto"
      },
      {
        "id": "08.07",
        "name": "Línea de Crédito Multifinalidad",
        "description": "Esta línea tiene como alcance las disposiciones ya que el producto se contrata en oficina y se firma ante notario .\nProducto muy similar a una línea de crédito desde el punto de vista de que es un límite revolvente, lo contratas una vez con firma ante notario y luego puedes hacer disposiciones a voluntad para destinar ese dinero a múltiples finalidades. No cubre todas las funcionalidades, por lo que puede complementarse con una cuenta de crédito (por un trozo del importe de la línea multifinalidad), con el que puedes pagar cualquier cosa pero con mayores costes financieros. Las disposiciones se amortizan a vencimiento por el total del importe.\nES: Equivalen a nuestras disposiciones. Las disposiciones son agnosticas del producto, es una solucion para las 4 tipologias de límites"
      },
      {
        "id": "08.08",
        "name": "Tarjeta Negocios / TKT (consulta, pago y disposición)",
        "description": "Tarjeta de financiamiento de Working Capital. El cliente que tiene contratada esta tarjeta tiene asignado un límite revolvente comprometido del que puede ir haciendo uso a su voluntad con disposiciones a su cuenta. En esta funcionalidad puede consultar límite, disponible, dispuesto y movimientos de la tarjeta, realizar disposiciones y el pago/amortización de la tarjeta"
      },
      {
        "id": "08.09",
        "name": "Tarjeta Negocios / TKT (Administración)",
        "description": "Administración de una tarjeta de negocios, incluidos controles y configuración. No comprende la mera contratación de crédito."
      },
      {
        "id": "08.10",
        "name": "Línea de Crédito Digital (OCDL)",
        "description": "Es como la tarjeta negocios pero sin plástico. \nProducto sólo de SMEs que se hizo inicialmente sólo para GEMA aunque había plan de llevarlo a Senda también. El producto nació sin plástico asociado y luego pasó a tener de forma opcional un plástico asociado. No sabemos si ahora incluso ha pasado a ser obligatorio.\n\nOJO, este producto ha cambiado de nombre comercial y no estamos seguros de si éste es el vigente actualmente. Confirmar con Álex Corsino."
      },
      {
        "id": "08.11",
        "name": "Crédito en Cuenta Corriente / Cupo rotativo",
        "description": "Es un crédito revolvente que se contrata en la oficina y que sólo se puede disponer en oficina. En BNC sólo se consultan los movimientos del crédito (en loan view o específico?) Confirmar con RENZO"
      },
      {
        "id": "08.12",
        "name": "Préstamo empresarial (no revolvente) / Crédito Simple",
        "description": "A diferencia de un límite revolvente, el préstamo se condece de forma puntual por un importe total , con una fecha de vencimiento y un cuadro de amortización. El ir amortizando el préstamo no implica que vuelva a subir el límite disponible\nPoder hacer el pago de cuotas, descargar extractos y gneerar un certificado de deuda.\nEn el caso de MX el producto es tanto para Pymes como para Empresas y, concretamente, de Pymes, se está construyendo la contratación E2E de un crédito simple que sirva para amortizar lo que queda de uno existente y quedar con un préstamo vivo por la diferencia. Es lo que viene en el catálogo como \"Contratación de Crédito Digital Pyme\" (RECO) (8.29)."
      },
      {
        "id": "08.13",
        "name": "Click and Pay",
        "description": "El click and pay es un límite comprometido preautorizado para el cliente del que puede disponer total o parcialmente para hacer frente a una serie de finalidades limitadas. Sólo se puede tener un click and pay en vigor en cada momento (salvo que lo contrates en oficina). Cada disposición tiene un cuadro de amortización."
      },
      {
        "id": "08.14",
        "name": "Crédito Habilitación o AVIO",
        "description": "Es un crédito que se contrata en oficina (es un producto bancario con Instituciones por detrás, no es específico de BBVA) del que puedes realizar una o varias disposiciones, que es sólo para el sector industrial, agropecuario, minero, pesquero, etc y que lleva asociada garantía hipotecaria y también los bienes adquiridos con el crédito son considerados garantía en caso de impago.\n\nLleva cuadro de amortización (puede ser mensual, trimestral, semestral o anual más el pago de los propios intereses generados mensualmente.\n\nHoy por hoy, en BNC, sólo se consulta y se hace desde la funcionalidad de Loan View, que es como una posición de activo similar a la landing de financiación pero menos completa."
      },
      {
        "id": "08.15",
        "name": "Confirming cliente / Factoring electronico pagador / Crediproveedores - comprador - CONSULTAS",
        "description": "Producto que permite al cliente informarnos con antelación de sus pagos futuros y a BBVA contactar con sus beneficiarios para ofrecerles descontar esos derechos de cobro futuros que tiene.\n\nEsta es la parte de Consultas, informes y estadísticas. La operativa (envío de remesas, aplazamiento de pago y pronto pago) se queda en la 8.37"
      },
      {
        "id": "08.16",
        "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - OPERATIVA/ANTICIPOS",
        "description": "En este caso, el beneficiario de los pagos futuros de uno de nuestros clientes es también nuestro cliente. En la funcionalidad de Confirming Proveedores le estamos permitiendo que haga el descuento de los mismos. El riesgo lo tenemos con el pagador, que es también cliente nuestro."
      },
      {
        "id": "08.17",
        "name": "Crediproveedor PYME",
        "description": "Es un minisitio externo donde los no clientes aceptan los descuentos de sus facturas pendientes de cobro. No queda claro si forma parte de lo que hay que transformar con EDC, porque es uno más de más de 20 minisitios que hay en el banco"
      },
      {
        "id": "08.18",
        "name": "Factoring / Descuento de letras y facturas - CONSULTAS",
        "description": "Funcionalidad por la cual un cliente puede descontar aquellos documentos que le supongan derechos de cobro a futuro que tenga en Cartera (cualquier tipo de efecto, facturas, cheques, letras, pagarés, etc). El descuento puede ser con y sin recurso. Si es con recurso, el riesgo es de nuestro cliente con derechos de cobro futuros y en caso de sin recurso, el del pagador, que no lo conocemos necesariamente.\n\nEsta funcionalidad está dividida en dos entregables independientes. Éste es el correspondiente a los primeros niveles de navegación y las consultas de factoring. La parte de descuento y gestión de facturas está en la 8.41."
      },
      {
        "id": "08.19",
        "name": "Efectos / Descuento Mercantil",
        "description": "Supuestamente en MX sólo se consultar. ¿Es en loan view o en otra categoría) (CONFIRMAR CON RENZO)"
      },
      {
        "id": "08.20",
        "name": "Libranzas",
        "description": "Libranzas es un producto que el banco ofrece a sus empresas para que puedan hacer anticipos de nómina a sus empleados, que se van cobrando detrayendo un porcentaje de su nómina durante X nóminas. El anticipo lo fondea BBVA y en esta pantalla es cómo la empresa va haciendo pagos a BBVA para amortizar esta deuda. Los pagos los saca de lo que detrae de las nóminas a sus empleados"
      },
      {
        "id": "08.21",
        "name": "Leasing",
        "description": "Productos de arrendamiento de vehículos para empresas. Incluye un \"estado de cuenta\" en el caso de MX"
      },
      {
        "id": "08.22",
        "name": "Renting",
        "description": "Productos de arrendamiento de vehículos para empresas"
      },
      {
        "id": "08.23",
        "name": "Crédito Stock",
        "description": "Producto creado específicamente para cubrir las necesidades de financiación de los concesionarios de automóviles para adquirir vehículos y tenerlos expuestos hasta su venta (ES: Crédito Stock. MX: Plan Piso)"
      },
      {
        "id": "08.24",
        "name": "Simulador de crédito PYME",
        "description": "MX: Opción existente en BBVA.mx donde el cliente puede simular si le conviene más una tarjeta negocios o un crédito simple para sus necesidades. Confirmado con PYMES que es de mucha importancia"
      },
      {
        "id": "08.25",
        "name": "Contratación OneClick - Prestamo TPV - Prestamo de adelanto de venta",
        "description": "Flujo de contratación que permite la contratación E2E de:\n- Prestamo TPV (nuevo nombre del Anticipo TPV)"
      },
      {
        "id": "08.26",
        "name": "Contratación OneClick - Línea de Confirming",
        "description": "Flujo de contratación disponible en España que permite la contratación E2E de:\n- Línea de Confirming"
      },
      {
        "id": "08.27",
        "name": "Contratación OneClick - Cuenta de Crédito",
        "description": "Flujo de contratación multiproducto disponible en España que permite la contratación E2E de:\n- Cuenta de Crédito"
      },
      {
        "id": "08.28",
        "name": "Contratación OneClick - Préstamo Online Negocio",
        "description": "Flujo de contratación multiproducto disponible en España que permite la contratación E2E de:\n- Préstamo Online Negocios . Metemos en la solucion el PON sostenbile tb, que itene particularaidades operativas"
      },
      {
        "id": "08.29",
        "name": "Contratación de Crédito Pyme Digital (RECO)",
        "description": "Cuando contratas un Crédito Simple en oficina y tienes impago o quieres mejorar tus condiciones, el banco te ofrece un Crédito Digital Pyme como opción. Ojo, no es lo mismo que la línea de crédito digital Pyme, que es la tarjeta negocios sin plástico ni el Crédito Flexible Digital Pyme, que son dos productos en uno. Con el crédito digital Pyme se supone que lo que estás contratando es un Crédito Simple. Se puede hacer para ampliar el monto de tu crédito simple, para aumentar el plazo (por decisión propia o porque está perdiendo. Lo que contratas mata tu crédito simple en vigor y es sustituido por este nuevo crédito simple (aunque se llame Crédito digital pyme, es una contratación de crédito simple. La cosa es que el crédito simple sólo se contrata en oficina (salvo para este caso de uso de Reco)"
      },
      {
        "id": "08.30",
        "name": "Consulta Carta Fianza / Avales",
        "description": "Documento que emite el BBVA y que respalda tus obligaciones ante organismos públicos o al momento de realizar una operación comercial.\n\nProducto con el cual BBVA está garantizando a un tercero que, en caso de que nuestro cliente no pudiera hacer frente a sus obligaciones de pago, BBVA las asumiría. Esto tiene un coste financiero para el cliente que depende del importe y el del plazo del aval, entre otras cosas.\n\nEsta es la parte de consulta de los avales / Cartas fianza que ya tienes contratados"
      },
      {
        "id": "08.31",
        "name": "Crédito Digital Flexible",
        "description": "Producto de Financiación creado en México con foco en Pymes en el que se ofrecen al cliente, bajo un único contrato, dos límites independientes: uno revolvente y uno no revolvente. El revolvente se comporta como una Tarjeta Negocios (y, de hecho, aunque nació sin un plástico asociado, ahora también se le va a asociar un plástico al límite) y el no revolvente, como un crédito simple con un cuadro de amortización.\n\nNOTA: El producto ha cambiado. Ahora el cliente no elige cuánto quiere revolvente y cuánto quiere no revolvente sino que el 20% del total es revolvente y el 80% del total es no revolvente."
      },
      {
        "id": "08.32",
        "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - CONSULTAS",
        "description": "Consulta de operaciones de confirming o factoring por el proveedor beneficiario. Excluye contratación y consultas genéricas de financiación."
      },
      {
        "id": "08.33",
        "name": "Solicitud Carta Fianza / Avales",
        "description": "\"Documento que emite el BBVA y que respalda tus obligaciones ante organismos públicos o al momento de realizar una operación comercial.\n\nProducto con el cual BBVA está garantizando a un tercero que, en caso de que nuestro cliente no pudiera hacer frente a sus obligaciones de pago, BBVA las asumiría. Esto tiene un coste financiero para el cliente que depende del importe y el del plazo del aval, entre otras cosas.\n\nEsta es la parte de solicitud  de nuevos avales / Cartas fianza"
      },
      {
        "id": "08.34",
        "name": "Modificación/renovación Carta Fianza / Avales",
        "description": "\"\"\"Documento que emite el BBVA y que respalda tus obligaciones ante organismos públicos o al momento de realizar una operación comercial.\n\nProducto con el cual BBVA está garantizando a un tercero que, en caso de que nuestro cliente no pudiera hacer frente a sus obligaciones de pago, BBVA las asumiría. Esto tiene un coste financiero para el cliente que depende del importe y el del plazo del aval, entre otras cosas.\n\nEsta es la parte de modificación  de nuevos avales / Cartas fianza que ya tienes contratados\""
      },
      {
        "id": "08.35",
        "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - ESTADÍSTICAS E INFORMES",
        "description": "Consulta de informes y estadísticas asociada a la operativa de Confirming proveedores (factoring electrónico proveedor - Crediproveedores Proveedor)"
      },
      {
        "id": "08.36",
        "name": "Confirming Proveedores /Factoring electrónico proveedor / Crediproveedores - proveedor - FIRMA Y CUSTODIA DIGITAL DE CONTRATO",
        "description": "Firma de contrato para anticipo de confirming al proveedor y custodia en la biblioteca digital de contratos"
      },
      {
        "id": "08.37",
        "name": "Confirming cliente / Factoring electronico pagador / Crediproveedores - comprador - OPERATIVA",
        "description": "Producto que permite al cliente informarnos con antelación de sus pagos futuros y a BBVA contactar con sus beneficiarios para ofrecerles descontar esos derechos de cobro futuros que tiene.\n\nEsta es la parte de  operativa (envío de remesas, aplazamiento de pago y pronto pago). La parte de Consultas, informes y estadísticas queda en la 8.15"
      },
      {
        "id": "08.38",
        "name": "Crédito Líquido 2.0",
        "description": "Nuevo producto (transformado a partir del CrediFlex) que quedará como único Crédito Líquido cuando vayan venciendo los contratos aún vivos de Crédito Líquido Anual y Crédito Líquido a Plazos. \n\nDesde este producto se podrán hacer Disposiciones, recalendarizaciones y pagos"
      },
      {
        "id": "08.39",
        "name": "Incremento de Línea de Crédito Digital",
        "description": "Funcionalidad que permite al cliente ampliar el límite de su línea de Crédito Digital (MX), Puede lanzarse tanto desde el propio producto LCD como desde campañas que, al ser pulsadas, abren el flujo"
      },
      {
        "id": "08.40",
        "name": "Disposición de Plan de Pagos Fijos",
        "description": "Disposición que se ofrece al cliente Pyme via Campaña en MX cuando se identifica que está teniendo complicaciones para pagar disposiciones revolventes realizadas con Tarjeta Negocios o LCD.  Utiliza un backend diferente al que tiene la disposición de plan de pagos fijos si se solicita desde el producto, por lo que requiere un desarrollo específico para permitir el apagado de la funcionalidad."
      },
      {
        "id": "08.41",
        "name": "Factoring / Descuento de letras y facturas - OPERATIVA",
        "description": "Funcionalidad por la cual un cliente puede descontar aquellos documentos que le supongan derechos de cobro a futuro que tenga en Cartera (cualquier tipo de efecto, facturas, cheques, letras, pagarés, etc). El descuento puede ser con y sin recurso. Si es con recurso, el riesgo es de nuestro cliente con derechos de cobro futuros y en caso de sin recurso, el del pagador, que no lo conocemos necesariamente.\n\nFactoring está dividida en dos entregables independientes. Éste es el correspondiente a:\n- descuento\n- gestión de facturas\n- gestión,validación y trazabilidad de ficheros de remesas de facturas \n\nLos primeros niveles de navegación y las consultas de factoring están en la 8.18."
      },
      {
        "id": "08.42",
        "name": "Financiación Argentina",
        "description": "Pack de funcionalidades relacionadas con financiación específicas de Argentina, como:\n*Multimodal:Funcionalidad específica de Argentina que permite a los clientes mover importes entre sus límites cualificados (similar a preconcedido) en los distintos productos\n*Préstamo Convenios: Financiacion donde participa una empresa intermediaria, subsidiando la tasa del cliente final\n*Préstamo SGR: Prestamos avalados por un tercero (Sociedad de Garantía Recíproca)\n*Acuerdos de Descubierto:  Permite contratar, en una cuenta corriente, que el descubierto no implique inversión irregular o mora hasta determinada cantidad sino sólo generar intereses acordados entre el cliente y el banco mientras está en esa situación. \nNo es como la cuenta de crédito de España puesto que no tiene una contrapartida específica sino que toda cuenta corriente puede tener o no tener un acuerdo de descubierto firmado. \n*Facturas Electrónicas: Por cobrar, por pagar, gestión de autorizados, descuento"
      }
    ]
  },
  {
    "name": "09.Tarjetas",
    "functions": [
      {
        "id": "09.01",
        "name": "Landing de tarjetas/ Listado de tarjetas",
        "description": "Listado de las tarjetas que tienen contratado un cliente, ya sean de crédito, débito, prepago, working capital o cualquier otro tipo de tarjeta"
      },
      {
        "id": "09.02",
        "name": "Extractos (Estado de Cuenta) Tarjeta",
        "description": "Generación de extractos (estados de cuenta) de tarjetas de crédito, débito o prepago"
      },
      {
        "id": "09.03",
        "name": "Editar alias de tarjetas",
        "description": "Funcionalidad para editar el alias de las tarjetas"
      },
      {
        "id": "09.04",
        "name": "Tarjetas Crédito - Consulta",
        "description": "Consulta tanto de la propia tarjeta de crédito y sus datos generales como de los movimientos"
      },
      {
        "id": "09.05",
        "name": "Tarjetas Crédito - Operativa",
        "description": "Modificación de límites e informes\nCancelación"
      },
      {
        "id": "09.06",
        "name": "Tarjetas Crédito - ON/OFF",
        "description": "Operativa de encendido y apagado de tarjeta"
      },
      {
        "id": "09.07",
        "name": "Tarjetas Crédito - Contratación",
        "description": "Contratación de tarjeta de crédito (en principio creemos que no es la contratación DIY de una o varias tarjetas de crédito sino la solicitud de nuevas tarjetas para los empleados tirando de un contrato ya existente para la empresa que es nuestro cliente)"
      },
      {
        "id": "09.08",
        "name": "Tarjetas Crédito - Alta masiva de tarjeta",
        "description": "Contratación masiva de tarjeta de crédito (no es la contratación DIY de una o varias tarjetas de crédito sino la solicitud de nuevas tarjetas para los empleados tirando de un contrato ya existente para la empresa que es nuestro cliente)"
      },
      {
        "id": "09.09",
        "name": "Tarjetas Crédito - Pago",
        "description": "Pago del saldo dispuesto en tarjetas de crédito, total o parcial"
      },
      {
        "id": "09.10",
        "name": "Tarjetas Débito - ON/OFF",
        "description": "Operativa de encendido y apagado de tarjeta"
      },
      {
        "id": "09.11",
        "name": "Tarjetas Débito - Consulta",
        "description": "Consulta de los datos de la propia tarjeta de débito y sus movimientos"
      },
      {
        "id": "09.12",
        "name": "Tarjetas Débito - Consulta de contrato",
        "description": "Consulta de los datos del contrato de la tarjeta de débito"
      },
      {
        "id": "09.13",
        "name": "Tarjetas Débito - Solicitud de nueva tarjeta",
        "description": "Solicitud de una nueva tarjeta de débito para la empresa. No comprende tarjetas de crédito ni la operativa de una tarjeta existente."
      },
      {
        "id": "09.14",
        "name": "Tarjetas Débito - Operativa",
        "description": "Operativa de una tarjeta de débito empresarial ya emitida. Se diferencia de la solicitud inicial y de tarjetas de crédito."
      },
      {
        "id": "09.15",
        "name": "Tarjetas Débito - Contratación",
        "description": "Contratación individual de tarjeta de débito (en principio creemos que no es la contratación DIY de una o varias tarjetas de débito sino la solicitud de nuevas tarjetas para los empleados tirando de un contrato ya existente para la empresa que es nuestro cliente)"
      },
      {
        "id": "09.16",
        "name": "Tarjetas Débito - Alta masiva de tarjeta",
        "description": "Contratación masiva de tarjeta de débito (no es la contratación DIY de una o varias tarjetas de débito sino la solicitud de nuevas tarjetas para los empleados tirando de un contrato ya existente para la empresa que es nuestro cliente)"
      },
      {
        "id": "09.17",
        "name": "Tarjetas Prepago - Consulta",
        "description": "Consulta de tarjetas de prepago y sus movimientos"
      },
      {
        "id": "09.18",
        "name": "Tarjetas Prepago - Operativa",
        "description": "Operativa de tarjetas de prepago"
      },
      {
        "id": "09.19",
        "name": "Tarjeta Crédito - Consulta de contrato",
        "description": "Consulta de los datos del contrato de la tarjeta de crédito"
      },
      {
        "id": "09.20",
        "name": "CVV Dinámico",
        "description": "Funcionalidad de CVV dinámico para cualquier tipo de tarjeta (crédito, débito o prepago)"
      },
      {
        "id": "09.21",
        "name": "Tarjeta Prepago - Consulta contrato",
        "description": "Consulta de los datos del contrato de la tarjeta de prepago"
      },
      {
        "id": "09.22",
        "name": "Tarjetas Crédito - Anulación",
        "description": "Anulación / Cancelación de tarjeta de Crédito"
      },
      {
        "id": "09.23",
        "name": "Tarjetas Débito - Anulación",
        "description": "Anulación / Cancelación de tarjeta de débito"
      }
    ]
  },
  {
    "name": "10.Comercio Exterior",
    "functions": [
      {
        "id": "10.01",
        "name": "Créditos documentarios de Exportación (Cartas de Crédito de Exportación)",
        "description": "Créditos documentarios (El crédito documentario es un mandato de pago que el importador cursa a través de su entidad financiera para que, directamente o a través de otro banco, pague al exportador el importe de la operación, siempre y cuando dicho exportador cumpla, estrictamente, con el condicionado del propio crédito, generalmente la entrega de determinada documentación) \n\nIncluye para España:\n- Consulta detalle de remesa y situación\n- Listado CDE por CIF y opcional añadir otros filtros para acotar la búsqueda\n- Consulta de CDE datos generales y textos largos\n- Consultar mensajes swift, detalle swift\n- Consulta Proximos vencimientos\n- Lista utilización y detalle\n- Lista documentos, estado\n- Alta nueva utilización\n- Alta de documento en biblioteca\n- Reembolso y detalle\n- Consulta financiaciones\n- Lista liquidaciones y detalle\n- Lista de seguros de cambio\n- Asociar cambios pactaddos\n- Asociar financiación con utilización\n- Modificar referencia\n- Modificar cuenta nominal y comisones\n- Gestionar : otras instrucciones"
      },
      {
        "id": "10.02",
        "name": "Créditos documentarios de Importación (Cartas de Crédito de Importación)",
        "description": "Funcionalidad de Créditos Documentarios de Importación (contratación y gestión), también llamada \"Cartas de Crédito\" (Es un medio por el cual un banco se obliga a pagar a un proveedor internacional por cuenta del ordenante determinada suma de dinero).\n\nIncluyhe, para España:\n- Consulta limites de PLR 479\n- Detalle de PLR y sus CDI\n- Lista de créditos documentarios y borradores\n- Consulta detalle de un CDI y borrador\n- Detalle de mensajes \n- Consulta de textos largos\n- Consulta Motivos Rechazo y detalle por Opplus CDI\n- Solicitar Emisión de crédito, borrador, modificación\n- Alta textos largos\n- Lista Utilizaciones del crédito\n- Consulta de Documentos-estado\n- Alta Discrepancias (rechazar/aceptar discrepancia del documento)\n- Consulta de CDIs en liquidacion vigentes\n- Lista de liquidaciones acontecimientos\n- Detalle de liquidaciones\n- Próximos vencimientostos por id fiscal\n- Lista CDI para financiaciones y anticipos\n- Asociar cambios pactados\n- Asociar financiación\n- Lista de financiaciones\n- Lista de seguros de cambio\n\nEn Perú incluye: Solicitud de Emisión y modificación de cartas de crédito, Solicitud de endoso previo, embarques con discrepancias, instrucciones de pago."
      },
      {
        "id": "10.03",
        "name": "Remesas documentarias de Exportación (Cobranzas de Exportación)",
        "description": "Remesas documentarias (Cobranzas documentarias) es uno de los medios de pago más habituales en comercio exterior. Consiste en encargar al banco la gestión de una serie de documentos que hacen posible el cobro de una exportación.\n\nIncluye para España las Remesas documentarias de Exportación simples:\n- Consulta de remesas de exportacion (incluye tabla de remesas, detalle de remesas, consulta de documentos y vencimientos de una remesa, mensajes y descargas de listados, mensajes y documentos).\n- Consulta y descarga de Vencimientos y detalle de vencimiento\n- LIquidaciones: consulta de listado, detalle y descarga de liquidaciones de remesas de exportación\n- Reembolsos: consulta de listado, detalle y descarga de reembolsos de remesas de exportación\n\nIncluye para Perú Consulta de operaciones de exportación, cobranzas de exportación, emisión de cartas de crédito, modificación de cartas de crédito, solicitud de endoso, solicitud financiamientos de exportación (pagos de cuota, prórroga, preliquidaciones)"
      },
      {
        "id": "10.04",
        "name": "Financiamiento de Importacion y exportación",
        "description": "Financiamiento pre y post embarque en exportaciones y de todo tipo en importación."
      },
      {
        "id": "10.05",
        "name": "Compra venta de divisas",
        "description": "Funcionalidad para la compra/venta de divisas.Incluye el traspaso entre cuentas propias en distinta moneda y, adicionalmente en el caso de España:\n\n- Operativa con todas estas funcionalidades: \n- Modificación y Cancelación de Anticipos total y parcial de operaciones\n- Modificación y Cancelación de Prórrogas total y parcial de operaciones\n- Compra/venta de Spot \n- Compra/Venta de Forward\n- A/B/M de alertas (no necesita firma)\n- A/B/M de Operaciones Automatizadas (si necesitan firmas)\n- Alias"
      },
      {
        "id": "10.06",
        "name": "Landing de Gestión de Divisas",
        "description": "Landing multiCIF consultiva de acceso para la gestión de divisa y compraventa de divisa. Incluye estas funcionalidades:\n\n- Consultas De operaciones vigentes e históricas + el detalle\n- Consulta de Alertas, notificaciones \n- Consulta de Operaciones automatizadas\n- Consulta de divisas frecuentes."
      },
      {
        "id": "10.07",
        "name": "Digital Trade Loan",
        "description": "Producto de MX para financiar importaciones. Se realizará utilizando las piezas de pagos internacionales de ETPB permitiendo el pago no cargando directamente sobre la cuenta de un cliente sino sobre la línea de Digital Trade Loan del cliente (se realiza en un sólo paso la disposición de la línea de Impor sobre la cuenta del cliente y, una vez fondeada, se realizar el cargo de la transferencia). Habrá también producto de financiación de Expor en el futuro"
      },
      {
        "id": "10.08",
        "name": "FX en Colombia",
        "description": "Por normativa nacional en Colombia no se pueden tener cuentas en moneda extranjera, lo cual implica que tanto la compraventa de Divisa como las transferencias internacionales tienen procesos diferentes a los del resto de países."
      },
      {
        "id": "10.09",
        "name": "Gestión de divisa masiva (ficheros)",
        "description": "Funcionalidad de envío de ficheros para compraventa masiva de divisa"
      },
      {
        "id": "10.10",
        "name": "COMEX Argentina",
        "description": "Incluye funcionalidades COMEX específicas de Argentina como:\n\n*Trámites: Esta funcionalidad se utiliza para Gestión de préstamos y apertura de Carta de Crédito de Importación. En ambos casos se envia por este medio documentación basica de contratación (actúa como mesa de entradas digital, el alta de los productos se realiza desde el área comercial)\n* Compra Venta de billetes: Moneda Extranjera para empresas para atesoramiento por restricciones cambiarias actuales por el momento solo las empresas pueden venderle al banco monedas extranjeras, no pueden comprar con este fin."
      },
      {
        "id": "10.11",
        "name": "Contratos web",
        "description": "Funcionalidad para firmar los contratos de comex online con bastanteo"
      },
      {
        "id": "10.12",
        "name": "T-Cambio (Alertas y órdenes)",
        "description": "Funcionalidad asociada a T-Cambio (compraventa de divisa) Perú que no estaba en el levantamiento inicial del proyecto pero que se desarrolló durante EDC en tecnología legacy y, por tanto, es necesario transformar para el apagado"
      },
      {
        "id": "10.13",
        "name": "Remesas documentarias de Importación (Cobranzas de Importación)",
        "description": "En España son Gestiones (OPPLUS): análisis, diseño.  Depende de normativa SWIFT\n\nTambién, en el caso de España, incluye \"Utilidades COMEX\": \n- Calcular IBAN\n- Búsqueda de códigos:paises\n- Búsqueda de códigos:estadisticos\n- Búsqueda de códigos:cod.swift\n- Etiquetas exportación"
      },
      {
        "id": "10.14",
        "name": "Remesas Truncadas (autocobro Exprés) y Remesas Directas",
        "description": "- Alta de remesas truncadas via fichero por la web.\nLas remesas truncadas, son remesas simples con tres paises (bancos): Portugal, Italia y Francia\n\n- Alta de remesas directas por la web.\nA través de esta opción se pueden dar de alta remesas simples o documentarias, con cualquier pais/banco. \nLa reestricción de esta opción es que solo se habilita a clientes en los que se confía."
      }
    ]
  },
  {
    "name": "11.Adquirencia / TPVs",
    "functions": [
      {
        "id": "11.01",
        "name": "Landing TPVs (reportería TPVs)",
        "description": "Landing donde se ven todas las funcionalidades relativas que tenemos sobre TPVs"
      },
      {
        "id": "11.02",
        "name": "Contratación TPV",
        "description": "Funcionalidad para la afiliación de un comercio más la solicitud de un TPV para ese comercio.\n\nPara poder lanzar este flujo, ha de ser cliente ya de BBVA y tener canal web. De ser así, si aún no tienen actividad de TPVs con nosotros, este fluno termina creando un primer comercio de forma E2E Digital y al día siguiente se contacta con el comercio para enviarle el TPV, aunque desde el momento 0 puede operar con eCommerce. En caso de que ya esté trabajando con nosotros, lo que crea es un comercio adicional."
      },
      {
        "id": "11.03",
        "name": "Seguimiento",
        "description": "Seguimiento de la actividad de los terminales de cobro del comercio. No comprende el seguimiento genérico de transferencias."
      },
      {
        "id": "11.04",
        "name": "Control de terminales",
        "description": "Control y administración de terminales de cobro de un comercio. Excluye dispositivos informáticos sin función de aceptación de pagos."
      },
      {
        "id": "11.05",
        "name": "Seguimiento y contrato de terminales",
        "description": "Tracking de la entrega al cliente del terminal (cuantos tiene, estado, etc)"
      },
      {
        "id": "11.06",
        "name": "Commerce 360",
        "description": "Funcionalidad que permite, a partir de la lectura de los datos de facturación de todos los TPVs de BBVA (de los negocios de la zona en la que el cliente opera) comparar datos de facturación y operativa del cliente con las de sus competidores, proporcionándole insights"
      },
      {
        "id": "11.07",
        "name": "TPVs Argentina",
        "description": "TPVs en Argentina incluye múltiples funcionalidades específicas del país como el descuento de cupones, BBVA Smart, Millas, cobros con QR, etc, por lo que se recoge como una línea independiente en el catálogo"
      }
    ]
  },
  {
    "name": "12.Inversión y Mercados",
    "functions": [
      {
        "id": "12.01",
        "name": "Inversión Libre Patrimonial",
        "description": "Consulta del Seguro de Vida Inversión Libre Patrimonial que es un seguro de vida que, además, le permite administrar su patrimonio a largo plazo."
      },
      {
        "id": "12.02",
        "name": "Streaming PRLV (Pagaré con Rendimiento Liquidable al Vencimiento)",
        "description": "Funcionalidad según la cual se ingresa (\"se invierte\" en el caso del PRLV) una cantidad de dinero durante un plazo determinado, no pudiéndose disponer de este capital durante ese plazo y retirándose al final del mismo el capital ingresado/invertido más una rentabilidad generada al tipo de interés pactado al inicio\n\nNo esta en EDC lo lleva DIY"
      },
      {
        "id": "12.03",
        "name": "Streaming PRLV (Pagaré con Rendimiento Liquidable al Vencimiento) Reinversión",
        "description": "Al vencimiento del PRLV se reinvierte de forma automática"
      },
      {
        "id": "12.04",
        "name": "Depósitos a plazo",
        "description": "Contratación y consulta de depósitos a corto, medio y largo plazo\n\nCO: Contratación y consulta del depósito CDT (Certificado de Depósito a Término). Es un producto financiero que te permite invertir de forma sencilla con altos estándares de seguridad y que ofrece una rentabilidad fija o variable según la opción seleccionada\n\nAR: Incluye también CEDIP"
      },
      {
        "id": "12.05",
        "name": "Fondos de inversión (consulta y compraventa)",
        "description": "Permite consultar las participaciones que el cliente tiene en fondos de inversión de cualquier tipo así como realizar órdenes de compra o venta de participaciones para esos fondos u otros de los disponibles en BBVA\nIncluye los Fondos mutuos de Perú\nEn España se llaman Fondos nacionales"
      },
      {
        "id": "12.06",
        "name": "Fondos de inversión Programados",
        "description": "Fondos de inversión Programados \n- Venta/Consulta\n- Costos y remuneraciones"
      },
      {
        "id": "12.07",
        "name": "Mercados Globales",
        "description": "Estado de Cuenta Operaciones Financieras (hay que hacerlo)\nConfirmaciones de Operaciones Derivadas (deprecar)"
      },
      {
        "id": "12.08",
        "name": "Inversiones en reporto",
        "description": "Los reportos son ventas de títulos en el presente con un acuerdo obligatorio de recompra en el futuro, ya sea en una fecha preestablecida o abierta"
      },
      {
        "id": "12.09",
        "name": "Fondos Internacionales + ESIS",
        "description": "Acceso a la operativa de fondos internacionales, Instrucciones de liquidación y ESIS (Empresas de servicios de inversión) desde la nueva landing"
      },
      {
        "id": "12.10",
        "name": "Custodio de valores",
        "description": "Landing de valores para operar sobre clientes delegados"
      },
      {
        "id": "12.11",
        "name": "Custodio de valores v2",
        "description": "Landing de valores para operar por ccvs"
      },
      {
        "id": "12.12",
        "name": "BBVA SAB",
        "description": "Es el intermediario del mercado bursátil que está encargado de realizar las operaciones de compra y venta que solicitan los inversionistas."
      },
      {
        "id": "12.13",
        "name": "Broker",
        "description": "Acceso a broker para la gestión de compra venta de posiciones de valores (funcionalidad actual de España para la comprabente de valores que es posible que no llegue a transformarse porque se discontinue este servicio)"
      },
      {
        "id": "12.14",
        "name": "Carteras Patrimoniales",
        "description": "Un asesor externo al titular de la cartera, tiene acceso a las mismas, y puede gestionar sobre ellas, aunque no sea el titular. Sólo pueden realizarse consultas de la evolución de la cartera."
      },
      {
        "id": "12.15",
        "name": "Carteras Privadas",
        "description": "Solo tienen acceso los titulares de las mismas, un tercero no puede acceder. Sólo pueden realizarse consultas de la evolución de la cartera."
      }
    ]
  },
  {
    "name": "13.Salud financiera",
    "functions": [
      {
        "id": "13.02",
        "name": "Finanzas Inteligentes (Factura empresarial 2.0)",
        "description": "Desarrollo que permite enganchar BBVA Empresas con el SAT (Hacienda en México) para recuperar la información de facturas electrónicas en las que el cliente tiene participación y poder recuperar esa información para realizar estudios de salud financiera del cliente"
      },
      {
        "id": "13.03",
        "name": "Análisis Financiero",
        "description": "Es el estudio que sirve para entender e interpretar la información contable de una empresa u organización, buscando conocer el uso de sus recursos financieros, todo esto con el fin de realizar un diagnóstico de su situación actual y planear sus próximas acciones"
      },
      {
        "id": "13.04",
        "name": "Salud Financiera",
        "description": "Funcionalidad para diagnosticar el estado de la salud financiera de un cliente"
      }
    ]
  },
  {
    "name": "13.Sostenibilidad",
    "functions": [
      {
        "id": "13.01",
        "name": "Huella de Carbono",
        "description": "Calculadora de la huella de carbono de una empresa"
      }
    ]
  },
  {
    "name": "14.Seguros",
    "functions": [
      {
        "id": "14.01",
        "name": "Landing de Seguros",
        "description": "Landing que agrupa toda la funcionalidad relativa a seguros"
      },
      {
        "id": "14.02",
        "name": "Contratación de ciber seguro",
        "description": "Contratación de Ciber seguro"
      },
      {
        "id": "14.03",
        "name": "Contratación AR",
        "description": "Contratación de seguros (Pdte refinar los seguros disponibles)"
      },
      {
        "id": "14.04",
        "name": "Autoseguro PYME - Contratación",
        "description": "Cotiza y Contrata tu AutoSeguro Pyme"
      },
      {
        "id": "14.05",
        "name": "Autoseguro PYME - Cancelacion",
        "description": "Cancelación de AutoSeguro Pyme"
      },
      {
        "id": "14.06",
        "name": "Polizas vigentes",
        "description": "Consulta de las pólizas vigentes"
      },
      {
        "id": "14.07",
        "name": "Gestión de Pólizas maestras",
        "description": "Gestión de pólizas maestras de seguros empresariales. No comprende una póliza de crédito o financiación."
      },
      {
        "id": "14.08",
        "name": "Seguro Vida Ley",
        "description": "El Seguro Vida Ley es un producto de Perú que contrata nuestro cliente (empresa) pero cuyos beneficiarios son sus empleados. El alcance de esta línea incluye la carga de la planilla de empleados de la empresa (carga inicial y actualizaciones) así como la administración del propio seguro. \n\nSe integrará en la landing de Seguros que está haciendo España."
      }
    ]
  },
  {
    "name": "15.Otros",
    "functions": [
      {
        "id": "15.01",
        "name": "Agenda de Beneficiarios",
        "description": "Funcionalidad para la gestion de los contactos de una empresa"
      },
      {
        "id": "15.02",
        "name": "Operaciones frecuentes",
        "description": "Gestión de operaciones frecuentes"
      },
      {
        "id": "15.03",
        "name": "Cita Previa",
        "description": "El cliente recibirá, vía correo electrónico, una notificación del alta de la cita y de cualquier modificación o anulación posterior, tanto para cita presencial como cita telefónica. Adicionalmente, se incluye también la posibilidad de modificar la cita previa telefónica.\n\nEn el caso de cita presencial, recibirá un recordatorio vía SMS un día antes."
      },
      {
        "id": "15.04",
        "name": "Consulta de otros estados de cuenta",
        "description": "En MX hay unos estados de cuenta de productos que no están en el canal sino sólo en oficina, pero desde el canal sí se pueden solicitar estados de cuenta. Como no tienen el producto en el canal, correspondería ponerlos en una sección transversal en Senda, como \"Consultas\" o similar. Estos son los estados de cuenta a los que nos referimos:\n- Crédito Tradicional\n- Crédito Auto\n- Renta fija nacional\n- Banca Patrimonial"
      },
      {
        "id": "15.05",
        "name": "Fideicomisos",
        "description": "Amarrar ingresos a una cuenta, separar la figura de la empresa, independiente para que no la puedan embargar. El banco es el tercero que administra el dinero que has puesto en esa caja.\nSeguimiento de instrucciones\nAlta de instrucciones\nPago de honorarios\nConsulta Movimientos\nConsulta Cartera\nResumen Fideicomiso\nConsulta Fideicomisos"
      },
      {
        "id": "15.06",
        "name": "Mis documentos/Expediente digital",
        "description": "Landing donde el cliente puede visualizar y gestionar la documentación de la empresa (y sus usuarios) requerida por el banco para cumplir la regulación, así como para visualizar los contratos de aquellos productos que tiene en BBVA\n\nEn el caso de Argentina, la parte de consultar los propios documentos que tienes firmados con el banco se llama actualmente \"Recupero de documentación\""
      },
      {
        "id": "15.07",
        "name": "Mis tareas",
        "description": "Funcionalidad para indicar al cliente que tiene tareas pendientes por realizar (validación de email, movil, RBA, etc)"
      },
      {
        "id": "15.08",
        "name": "Ficheros",
        "description": "Normalizador de ficheros (adaptación de archivos en Argentina)"
      },
      {
        "id": "15.09",
        "name": "Envío directo de ficheros",
        "description": "Esta funcioanlidad se utiliza en España para la subida de ficheros (de pagos u otrras funcionalidades) de más de X miles de órdenes (nímero que puede depender de la geografía). Antiguamente se procesaban en batch y se enviaba el resultado al cliente para que corrigiese por fuera el fichero si había errores. Ahora, apalancado en las capacidades de ECP Files, la validación será online y la experiencia será transparente para el cliente (no cambiará si sube un fichero de muchas o pocas órdenes), pero lo que se hace por detrás es distinto, por lo que se crea esta feature independiente"
      },
      {
        "id": "15.10",
        "name": "Transmisión genérica",
        "description": "Envío de ficheros mixtos o que requieren una normalización o troceado"
      },
      {
        "id": "15.11",
        "name": "Archivos encriptados (archivos cifrados)",
        "description": "Intercambio de archivos cifrados en la operativa bancaria empresarial. No equivale a una referencia general a ciberseguridad."
      },
      {
        "id": "15.12",
        "name": "Encripción",
        "description": "Intercambio de llaves e intercambio de certificados"
      },
      {
        "id": "15.13",
        "name": "Mis conversaciones",
        "description": "Modulo que permite al cliente comunicarse con su gestor de relación"
      },
      {
        "id": "15.14",
        "name": "Ficheros - Recibir del banco",
        "description": "Funcionalidad que permite acceder a un repositorio donde recibir descargas periódicas de información en fichero que el cliente ha solicitado previamente. También incluye estadísticas sobre estos ficheros.\n\n\"Servicios adicionales / Descargas\" y \"Estadísticas\" en Argentina, que incluye:\n- Filtro temporal: Define periodos fijos o rangos de fechas personalizados.\n- Selector de divisas: Filtra reportes por monedas específicas (ARS , DOLARES) o visión global.\n- Generador de informes: Procesa datos históricos para mostrar estadísticas de la tesoreria de la empresa"
      },
      {
        "id": "15.15",
        "name": "Ficheros Mixtos Perú",
        "description": "Procesado de Archivos Mixto de Transferencia / Proveedores /Nominas. El cliente ingresa un único fichero con órdenes de distintos tipos y el canal es capaz de trocearlo y enviarlo a cada uno de los aplicativos."
      },
      {
        "id": "15.16",
        "name": "Capacidad Multiempresa Perú",
        "description": "Perú tiene requisitos multiempresa (MultiCIF) adicionales al resto de países, así como la necesidad de solucionar algunos problemas de la solución legacy, como en el caso de Financiación para referencias MultiCIF. Por ello, se crear una línea específica separada del resto"
      },
      {
        "id": "15.18",
        "name": "Solicitudes por Formulario Perú",
        "description": "Creación de formulario para solicitud de distintos productos/servicios que se generan desde un único punto en el canal y que le llegan al gestor/ejecutivo o back office para su procesado posterior. Incluye:\n- Modificar cuenta de cargo de la cuota del canal\n- Modificar personas de contacto\n- Solicitud de chequera\n- Solicitud de situación de cheque\n- Agregar productos\n- Histórico de solicitudes"
      },
      {
        "id": "15.19",
        "name": "Comprobantes",
        "description": "Modulo que sirve para que los usuarios puedan consultar, obtener o gestionar comprobantes  de operaciones realizadas. El primer entregable incluye los comprobantes de los pagos enviados (con lo que se empataría con el módulo existente en legacy). Más adelante la funcionalidad escalará para que incluya comprobantes de otro tipo de operaciones que realice el cliente (ingresos en depósitos, disposiciones, etc). Saldra en app y web."
      }
    ]
  },
  {
    "name": "16.Security Experience & Onboarding",
    "functions": [
      {
        "id": "16.01",
        "name": "Login / login biométrico",
        "description": "Funcionalidad de Login"
      },
      {
        "id": "16.02",
        "name": "Login con coexistencia",
        "description": "Funcionalidad de login para permitir la coexistencia del login legacy con el login nextgen"
      },
      {
        "id": "16.03",
        "name": "Olvido/Recuperar contraseña",
        "description": "Funcionalidad para la recuperación de contraseña"
      },
      {
        "id": "16.04",
        "name": "Consentimientos",
        "description": "Funcionalidad para recoger el consentimiento de un cliente sobre operativas"
      },
      {
        "id": "16.05",
        "name": "Firma online",
        "description": "Capacidad para poder autorizar/firmar operacionmes en el canal (es la que se incrusta en los flujos para firmar directamente (sin ir a \"pendientes de firma\")"
      },
      {
        "id": "16.06",
        "name": "Firmas pendientes",
        "description": "Funcionalidad para el seguimiento y firma de operaciones pendientes"
      },
      {
        "id": "16.07",
        "name": "Firma con documento",
        "description": "Firma en procesos de contratacion con docuemnto de contrato asociado"
      },
      {
        "id": "16.08",
        "name": "Softoken - Uso en canales",
        "description": "Capacidad para poder realizar firmas o autorizaciones de segundo nivel en los canales web y app con un softoken R3 (no incluye posibles procesos previos de contratación o similar realizados fuera del canal del cliente)."
      },
      {
        "id": "16.09",
        "name": "Activacion digital",
        "description": "Cliente no digital, hace la activación de los canles"
      },
      {
        "id": "16.10",
        "name": "Onboarding de no clientes (PJ)",
        "description": "Onboarding de no clientes monousurios"
      },
      {
        "id": "16.11",
        "name": "Firma Diferida",
        "description": "Funcionalidad que permitirá que algo que se está contratando desde la oficina, pueda ser enviado para firma a canales digitales (web y/o app). \n\nEsto permite hacer flujos de contratación que, desde el punto de vista de cliente, son E2E digital aunque técnicamente no lo sean. Un flujo de contratación de este tipo podría iniciarse desde web o app con un \"formulario de contratación\" que llegaría al gestor/ejecutivo quien, atendiendo la petición, contrataría el producto al cliente desde su herramienta y, al llegar al final del proceso, en lugar de imprimir y firmar en la oficina, lo envía a la firma a los canales digitales del cliente.\n\nArgentina, solución adaptada a la web de firmas (zona pública de WEB)."
      },
      {
        "id": "16.12",
        "name": "Softoken - Activación",
        "description": "En el proceso de contratación de canales digitales (app/web) realizar la contratación y activación del softtoken desde escenarios comerciales"
      },
      {
        "id": "16.13",
        "name": "Firma Out Of Band",
        "description": "Evolución de la firma online que aumenta la seguridad y minimiza el riesgo de fraude al derivar a la app la firma requerida por una operativa realizada en web, de forma que puede utilizarse softtoken y biometría"
      },
      {
        "id": "16.14",
        "name": "Login Out Of Band",
        "description": "Evolución del login para web en el que se pide validar desde la app el acceso del usuario permitiendo usar softoken y biometría y aumentando así la seguridad y minimizando el riesgo de fraude"
      },
      {
        "id": "16.15",
        "name": "Clave de Operaciones",
        "description": "Sigue vigente en Argentina y se gestiona en una funcionalidad llamada Clave BBVA"
      },
      {
        "id": "16.16",
        "name": "Solicitud de cambio de versión de BBVA Empresas Web",
        "description": "Funcionalidad que permite en Perú a los  Clientes solicitar un upgrade o downgrade del plan contratado para BBVA empresas."
      },
      {
        "id": "16.17",
        "name": "Solicitud de Token Físico",
        "description": "Funcionalidad que permite en Perú al cliente solicitar un nuevo token físico para su referencia.  Esto es el formulario para su solicitud. Una vez recibido físicamente, el administrador podrá asignarlo a un usuario con la funcionalidad \"Gestión de dispositivos\" (independiente de esta)"
      }
    ]
  },
  {
    "name": "17.Enablers",
    "functions": [
      {
        "id": "17.01",
        "name": "FAQs",
        "description": "Preguntas frecuentes"
      },
      {
        "id": "17.02",
        "name": "Avisos y novedades",
        "description": "Permite mostrar avisos tanto en el flujo de acceso como en la carga de las funcionalidades"
      },
      {
        "id": "17.03",
        "name": "Espacios comerciales (opción de menú \"contratar\")",
        "description": "Capacidad que habilita espacios en los canales de manera que se puedan disponibilizar campañas comerciales"
      },
      {
        "id": "17.04",
        "name": "Comunicaciones no comerciales - Envío",
        "description": "Funcionalidad para el envio de notificaciones no comerciales (sobre transaccionalidad, correspondencia virtual, etc)"
      },
      {
        "id": "17.05",
        "name": "Comunicaciones no comerciales - Dashboard y configuración",
        "description": "Funcionalidad que permitirá al usuario consultar y también administrar qué notificaciones quiere recibir y por qué vías"
      },
      {
        "id": "17.06",
        "name": "Administración de usuarios/tokens",
        "description": "Funcionalidad para la gestion de usuarios y tokens de acceso de una empresa"
      },
      {
        "id": "17.07",
        "name": "Actualización de datos básicos",
        "description": "Funcionalidad para la actualización de los datos básicos de un usuario (mail, teléfono)"
      },
      {
        "id": "17.09",
        "name": "Mensajería a beneficiarios (BBVA y Terceros)",
        "description": "Funcionalidad para el envío de mensajes de los beneficiarios de que el pago se ha emitido (SMS y/o mail)"
      },
      {
        "id": "17.10",
        "name": "Autómata",
        "description": "Va de forma automatica a los servicdores de los clientes a bucar archivos para traerlos al banco\nConfiguración\nActividad\nDescargas\nActivación\nArchivos"
      },
      {
        "id": "17.11",
        "name": "Descargas autómata",
        "description": "Descarga de SW para Autómata"
      },
      {
        "id": "17.12",
        "name": "Actividad en el canal",
        "description": "Auditoria en el canal"
      },
      {
        "id": "17.13",
        "name": "Límites",
        "description": "Configuración o consulta de límites de operativa en el canal bancario empresarial. No comprende límites macroeconómicos ni una mención genérica a restricciones."
      },
      {
        "id": "17.14",
        "name": "SICOCO (información de comisiones cobradas por el uso del canal)",
        "description": "Herramienta para que el cliente pueda consultar los datos de tarificación y facturación de su operativa con el banco. Incluye estas funcionalidades:\n- Facturación final / mensual\n. Acumulado mensual\n- Reportes"
      },
      {
        "id": "17.15",
        "name": "H2H",
        "description": "Lugar desde donde gestionar todo lo relativo a canales H2H desde el canal web. Incluye:\n- Consulta de lotes recibidos\n- Consulta de notificaciones\n- Eventos ejecutados\n- Administración H2H"
      },
      {
        "id": "17.16",
        "name": "API Channel",
        "description": "Canal API para integrar servicios bancarios en sistemas de empresas. Exige referencia a la interfaz de integración, no a una app móvil genérica."
      },
      {
        "id": "17.17",
        "name": "Autorización de consulta a Buró de Crédito",
        "description": "Flujo multipaso que permite al cliente dar permiso al banco para consultar la posición financiera del cliente teniendo en cuenta todas las entidades financieras del país (información disponible en el Buró de Crédito, institución pública)"
      }
    ]
  },
  {
    "name": "18.Herramientas empleados",
    "functions": [
      {
        "id": "18.01",
        "name": "Login y Portal Helpdesk",
        "description": "Acceso al portal de Help Desk"
      },
      {
        "id": "18.02",
        "name": "Identificación automática y contextualización en HelpDesk",
        "description": "Identificación del cliente que contacta con Help Desk y carga de la información del cliente"
      },
      {
        "id": "18.03",
        "name": "Integración en Monitor Funcional",
        "description": "Habilitar el Monitor Funcional dentro de la herramienta de Help Desk"
      },
      {
        "id": "18.04",
        "name": "Portal administracion (Caudalimetro)",
        "description": "Funcionalidad que permite regular la activación de funcionalidades a los clientes (pilotos)"
      },
      {
        "id": "18.05",
        "name": "Portal administracion (Menú)",
        "description": "Portal que permite configurar los caudalímetros y las opciones del menú"
      },
      {
        "id": "18.06",
        "name": "Menurización Landing",
        "description": "Menurización del canal (Vertical y horizontal). Dispone de una landing para acceder a los subniveles de menú"
      }
    ]
  },
  {
    "name": "19.Core",
    "functions": [
      {
        "id": "19.01",
        "name": "Menurización",
        "description": "Menurización del canal (Vertical y horizontal). Dispone de una landing para acceder a los subniveles de menú"
      },
      {
        "id": "19.02",
        "name": "Caudalímetro",
        "description": "Funcionalidad que permite regular la activación de funcionalidades a los clientes (pilotos)"
      },
      {
        "id": "19.03",
        "name": "Portal configurador",
        "description": "Portal que permite configurar los caudalímetros y las opciones del menú"
      },
      {
        "id": "19.04",
        "name": "Acciones relacionadas",
        "description": "Opciones de menú contextualizadas a una funcionalidad o producto"
      },
      {
        "id": "19.05",
        "name": "Gestión de navegación",
        "description": "Permite la navegación entre las funcionalidades disponibles en el canal"
      },
      {
        "id": "19.06",
        "name": "Gestión de datos de sesión",
        "description": "Información de contexto o sesión sobre la empresa y el usuario logado accesible por cualquier funcionalidad"
      },
      {
        "id": "19.07",
        "name": "Gestión de errores",
        "description": "Solución funcional que ayuda a visualizar los errores que se producen en las funcionalidades"
      },
      {
        "id": "19.08",
        "name": "Multiidioma",
        "description": "Capacidad que permite mostrar las funcionalidades del canal  en distintos idiomas"
      },
      {
        "id": "19.09",
        "name": "Cacheado de datos",
        "description": "Capacidad técnica para almacenar temporalmente cierta información que necesitamos frecuentemente en una funcionalidad"
      },
      {
        "id": "19.10",
        "name": "Modo demo",
        "description": "Permite mostrar el funcionamiento de una funcionalidad con datos estáticos y sin necesidad de levantar una sesión"
      },
      {
        "id": "19.11",
        "name": "Gestión de formatos",
        "description": "Control de los formatos de fechas, importes, etc.. en las funcionalidades del canal"
      },
      {
        "id": "19.12",
        "name": "Modales",
        "description": "Permite mostrar ventanas emergentes sobre las funcionalidades"
      },
      {
        "id": "19.13",
        "name": "Convivencia legacy",
        "description": "Capacidad que permite a los clientes mediante el menú acceder a funcionalidades legacy de BNC o BCOM"
      },
      {
        "id": "19.14",
        "name": "SeMAAS",
        "description": "Capacidad que permite generar un log de la actividad realizada por un usuario en las pantallas"
      },
      {
        "id": "19.15",
        "name": "Comunicación entre soluciones funcionales",
        "description": "Capacidad que permite compartir información entre distintas soluciones funcionales"
      },
      {
        "id": "19.16",
        "name": "Integración de dispositivo",
        "description": "Capacidad encargada de disponibilizar funcionalidad nativa de forma transparente para las SF"
      },
      {
        "id": "19.17",
        "name": "Gestión de PDF",
        "description": "Componente de visualización para poder pintar documentos PDF"
      },
      {
        "id": "19.18",
        "name": "Configuarión de Toggles",
        "description": "Capacidad que permite activar o desactivar ciertas características de una funcionalidad"
      },
      {
        "id": "19.19",
        "name": "Acciones",
        "description": "Capacidad que permite tener una serie de métodos en la contenedora que se pueden invocar desde cualquier SF"
      },
      {
        "id": "19.20",
        "name": "Login con coexistencia",
        "description": "Capacidad técnica que se integra con el login local de las web legacy de empresas para abrir sesión en la arquitectura next gen"
      },
      {
        "id": "19.21",
        "name": "Accesibilidad",
        "description": "Permitir el acceso a personas con discapacidades físicas, sensoriales,… Certificación AA"
      },
      {
        "id": "19.22",
        "name": "Sesión",
        "description": "Gestión de la sesión del canal. Controla que se mantenga la sesión si existe actividad y controla la inactividad y el tiempo máximo"
      },
      {
        "id": "19.23",
        "name": "App Setting",
        "description": "Capacidad que permite definir unas configuraciones para la aplicación que pueden ser modificadas sin despliegue"
      },
      {
        "id": "19.24",
        "name": "Gestión de redirección",
        "description": "Capacidad que permite centralizar en una sola configuración, las diferentes redirecciones disponibles"
      }
    ]
  },
  {
    "name": "20.Venta Digital",
    "functions": [
      {
        "id": "20.01",
        "name": "Espacios comerciales",
        "description": "Capacidad que habilita espacios en los canales de manera que se puedan disponibilizar campañas comerciales"
      },
      {
        "id": "20.02",
        "name": "Identificación cliente",
        "description": "Capacidad que permite identificar qué cliente navega en el canal y qué hace. Habilita el retargeting."
      },
      {
        "id": "20.03",
        "name": "Tagging",
        "description": "Capacidad que permite obtener analítica cuantitativa de navegación de clientes en el canal"
      },
      {
        "id": "20.04",
        "name": "Quantum",
        "description": "Capacidad que permite obtener analítica cualitativa de las funcionalidades"
      },
      {
        "id": "20.05",
        "name": "Deeplink",
        "description": "Capacidad que permite dirigir al cliente a una punto específico de una operativa procedente de una comunicación"
      },
      {
        "id": "20.06",
        "name": "F30V",
        "description": "También conocido como retargeting en tiempo real permite recoger interacciones de cliente y enviarselas a SFMC en 30 min."
      },
      {
        "id": "20.07",
        "name": "Tracking code",
        "description": "Capacidad de medición y atribución de campañas email, push…"
      },
      {
        "id": "20.08",
        "name": "Testing y personalización",
        "description": "Capacidad para modificar contenidos digitales sin hacer subidas a producción. Permite personalizar la experiencia."
      }
    ]
  },
  {
    "name": "21.Funcionalidad transversal",
    "functions": [
      {
        "id": "21.01",
        "name": "Espacios comerciales (opción de menú \"contratar\")",
        "description": "Landing donde se agrupan distintas contrataciones de productos (cards de productos para los que el cliente está acampañado o que el banco quiere posicionar)"
      },
      {
        "id": "21.02",
        "name": "Feedback de cliente",
        "description": "Funcionalidad que permite la recogida de feedback de cliente."
      }
    ]
  }
]);
const CONFIGURATION_VOCABULARY_UPDATE = Object.freeze({
  "version": "3.15.0",
  "relevanceRules": [
    {
      "name": "Evidencia de canal digital",
      "terms": [
        "transacciones inmediatas",
        "pagos inmediatos",
        "bre-b",
        "instant transfers",
        "pasarela de pago",
        "pasarelas de pago",
        "trends in",
        "data shows"
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
    },
    {
      "name": "Excluir avisos rutinarios y sucesos individuales",
      "terms": [],
      "remove": [
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
        "intermitencias",
        "no podian",
        "fuera de servicio",
        "no se puede iniciar"
      ]
    },
    {
      "name": "Infraestructura y servicios empresariales",
      "terms": [
        "payment processing",
        "procesamiento de pagos"
      ]
    },
    {
      "name": "Excluir información corporativa sin utilidad de canal",
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
        "quarterly results",
        "acquires",
        "para comprar la empresa",
        "adquiere la empresa",
        "compra de la compañía"
      ]
    },
    {
      "name": "Excluir guías genéricas sin movimiento de mercado",
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
        "tips for",
        "why",
        "por qué",
        "cómo la",
        "como la",
        "survey",
        "surveyed",
        "study finds",
        "report"
      ]
    },
    {
      "name": "Excluir consumo particular sin contexto empresarial",
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
        "retirement",
        "familiares y amigos",
        "friends and family"
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
        "deeplink",
        "pagos vostro",
        "cuentas vostro",
        "Quantum",
        "depósitos tokenizados",
        "pagos con stablecoins",
        "agentes de ia",
        "indisponibilidad",
        "intermitencias",
        "fallas masivas",
        "transferencias fallidas"
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
        "deep link",
        "vostro payments",
        "vostro accounts",
        "Quantum",
        "tokenized deposits",
        "tokenised deposits",
        "stablecoin payouts",
        "stablecoin payments",
        "ai agents",
        "agentic ai",
        "personal agent protocol",
        "trade finance automation",
        "automate trade finance",
        "cleareye",
        "payment gateway",
        "custody",
        "model context protocol",
        "outage",
        "service disruption",
        "payment failures",
        "delayed payments"
      ]
    }
  ],
  "taxonomy": [
    {
      "id": "17.16",
      "remove": [
        "contpaqi"
      ],
      "terms": [
        "integren banca y contabilidad",
        "integracion banca y contabilidad",
        "integra banca y contabilidad"
      ]
    }
  ]
});
const CONFIGURATION_DEFAULTS = {
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
    "newsletterEnabled": true,
    "newsletterBatch": 20,
    "newsletterSender": "news-radar.group@bbva.com",
    "newsletterSenderName": "News Radar · BBVA Empresas",
    "newsletterDailyLimit": 100,
    "newsletterAppUrl": "",
    "taxonomyCatalogUrl": "https://docs.google.com/spreadsheets/d/1hsFp-ZiiSsSt_ka73oKAWFlHEySdmJM_IrkBmK6YfH8/edit?gid=1593939800#gid=1593939800"
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
      "terms": [
        "mexicano",
        "mexicana",
        "mexicanos",
        "banxico",
        "spei",
        "cnbv",
        "condusef"
      ]
    },
    {
      "name": "Perú",
      "code": "PE",
      "language": "es-419",
      "mapId": "604",
      "enabled": true,
      "searchName": "Perú",
      "terms": [
        "peruano",
        "peruana",
        "peruanos",
        "bcrp",
        "sunat",
        "sbs peru"
      ]
    },
    {
      "name": "Colombia",
      "code": "CO",
      "language": "es-419",
      "mapId": "170",
      "enabled": true,
      "searchName": "Colombia",
      "terms": [
        "colombiano",
        "colombiana",
        "colombianos",
        "colombianas",
        "bogota",
        "medellin",
        "barranquilla",
        "bre-b",
        "superfinanciera",
        "banco de la republica",
        "ach colombia"
      ]
    },
    {
      "name": "Argentina",
      "code": "AR",
      "language": "es-419",
      "mapId": "032",
      "enabled": true,
      "searchName": "Argentina",
      "terms": [
        "argentino",
        "argentina",
        "argentinos",
        "bcra",
        "afip",
        "arca"
      ]
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
      "terms": [
        "uruguayo",
        "uruguaya",
        "uruguayos",
        "bcu"
      ]
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
      "terms": [
        "chileno",
        "chilena",
        "chilenos",
        "cmf chile"
      ]
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
        "profesional independiente",
        "trade financing",
        "import-export",
        "company",
        "companies",
        "institución",
        "instituciones",
        "institution",
        "institutions",
        "organismos públicos",
        "public sector",
        "entreprise",
        "impresa"
      ],
      "enabled": true
    }
  ],
  "signals": [
    {
      "name": "Lanzamiento de producto",
      "terms": [
        "lanza*",
        "lanzamiento",
        "estrena",
        "presenta*",
        "nuevo",
        "nueva",
        "launch*",
        "introduce*",
        "unveils",
        "yeni",
        "launches",
        "introduces",
        "unveil",
        "sunar",
        "tanıt*",
        "başlat*",
        "piyasaya"
      ],
      "context": [
        "cuenta*",
        "tarjeta*",
        "plataforma*",
        "producto*",
        "servicio*",
        "financia*",
        "préstamo*",
        "pago*",
        "depósito*",
        "hipoteca*",
        "app*",
        "account*",
        "card*",
        "product*",
        "loan*",
        "leasing*",
        "factoring*",
        "confirming*",
        "crédito*",
        "aval*",
        "seguro*",
        "inversión*",
        "fondo*",
        "monedero*",
        "wallet*",
        "terminal*",
        "tpv*",
        "programa*",
        "service*",
        "platform*",
        "payment*",
        "deposit*",
        "mortgage*",
        "insurance*",
        "investment*",
        "hesap*",
        "kart*",
        "ürün*",
        "hizmet*",
        "ödeme*",
        "kredi*",
        "mevduat*",
        "sigorta*",
        "yatırım*",
        "digital*",
        "kyb",
        "flujo*"
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
      ],
      "group": "Novedad"
    },
    {
      "name": "Mejora de oferta",
      "terms": [
        "amplía",
        "mejora",
        "renueva",
        "incorpora*",
        "reduce",
        "aumenta",
        "enhances",
        "expands",
        "improves",
        "upgrades",
        "extends",
        "yenile*",
        "geliştir*",
        "genişlet*",
        "iyileştir*"
      ],
      "context": [
        "cuenta*",
        "tarjeta*",
        "producto*",
        "servicio*",
        "comisión*",
        "tipo*",
        "plataforma*",
        "pago*",
        "financia*",
        "account*",
        "card*",
        "product*",
        "service*",
        "platform*",
        "payment*",
        "loan*",
        "deposit*",
        "mortgage*",
        "insurance*",
        "investment*",
        "hesap*",
        "kart*",
        "ürün*",
        "hizmet*",
        "ödeme*",
        "kredi*",
        "mevduat*",
        "sigorta*",
        "yatırım*",
        "digital*",
        "kyb",
        "flujo*"
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
      ],
      "group": "Novedad"
    },
    {
      "name": "Alianza estratégica",
      "terms": [
        "alianza",
        "acuerdo",
        "partnership",
        "acuerd*",
        "colabora con",
        "colaboración",
        "partners with",
        "agreement",
        "iş birliği",
        "işbirliği",
        "ortaklık*",
        "anlaşma*"
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
      ],
      "group": "Novedad"
    },
    {
      "name": "Incidencia operativa",
      "group": "Problema",
      "scope": "fullText",
      "enabled": true,
      "terms": [
        "no funciona*",
        "fuera de servicio",
        "indisponibilidad",
        "interrupción del servicio",
        "interrupcion del servicio",
        "caída de",
        "caida de",
        "caída global",
        "caida global",
        "se cayó",
        "se cayo",
        "sufrió caída",
        "sufrio caida",
        "presenta fallas",
        "presentan fallas",
        "fallas masivas",
        "outage",
        "outages",
        "goes down",
        "is down",
        "service disruption",
        "service unavailable",
        "unable to access",
        "hizmet kesintisi",
        "kesinti",
        "erişilemiyor",
        "serviço indisponível",
        "fora do ar",
        "queda do sistema",
        "no pueden acceder",
        "caída la app",
        "caida la app",
        "app down",
        "fallas en la app",
        "reporta fallas",
        "reportan fallas",
        "reportan problemas",
        "intermitencias",
        "error en los pagos",
        "errores en pagos",
        "pagos rechazados",
        "transferencias fallidas",
        "transferencias bloqueadas",
        "transferencias retrasadas",
        "cobros duplicados",
        "cargo duplicado",
        "cobran doble",
        "cobros indebidos",
        "payment failures",
        "failed payments",
        "payments fail",
        "duplicate charges",
        "delayed payments",
        "delayed transfers",
        "payment error",
        "transaction errors",
        "ödeme hatası",
        "transfer sorunu",
        "pagamentos recusados",
        "caida del servicio",
        "caida del sistema",
        "caida de la plataforma",
        "problemas de acceso",
        "no permite operar",
        "no deja entrar",
        "error al iniciar sesion",
        "fallo informatico",
        "falla en el sistema",
        "intermitencia",
        "sistema caido",
        "servicio caido",
        "banca online caida",
        "app caida",
        "problemas con las transferencias",
        "downtime",
        "system outage",
        "online banking down",
        "mobile banking down",
        "app not working"
      ],
      "context": [
        "app",
        "canal",
        "banca",
        "banking",
        "plataforma",
        "portal",
        "transferencia",
        "transferencias",
        "pago",
        "pagos",
        "cobro",
        "cobros",
        "payment",
        "payments",
        "checkout",
        "terminal",
        "merchant",
        "business",
        "empresa",
        "empresas",
        "pymes",
        "sme",
        "billetera",
        "wallet",
        "online",
        "servicio",
        "service",
        "cuenta",
        "account",
        "işletme",
        "ödeme",
        "mobil",
        "tarjeta*",
        "card*",
        "comercio*",
        "merchant*",
        "business*",
        "bank*",
        "sistema"
      ],
      "exclude": [
        "precio de la acción",
        "precio de las acciones",
        "cotización",
        "cotizacion",
        "beneficio neto",
        "resultados financieros",
        "caída del crédito",
        "caida del credito",
        "caída de ingresos",
        "caida de ingresos",
        "shares fall",
        "share price",
        "stock price",
        "net profit",
        "quarterly results",
        "riesgo de caída",
        "riesgo de caida",
        "simulacro",
        "podría fallar",
        "podria fallar",
        "could fail",
        "what to do if",
        "qué hacer si",
        "que hacer si",
        "cómo solucionar",
        "como solucionar",
        "how to fix"
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
        "deeplink",
        "pagos vostro",
        "cuentas vostro",
        "Quantum",
        "depósitos tokenizados",
        "pagos con stablecoins",
        "agentes de ia",
        "indisponibilidad",
        "intermitencias",
        "fallas masivas",
        "transferencias fallidas"
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
        "deep link",
        "vostro payments",
        "vostro accounts",
        "Quantum",
        "tokenized deposits",
        "tokenised deposits",
        "stablecoin payouts",
        "stablecoin payments",
        "ai agents",
        "personal agent protocol",
        "trade finance automation",
        "automate trade finance",
        "cleareye",
        "payment gateway",
        "custody",
        "model context protocol",
        "outage",
        "service disruption",
        "payment failures",
        "delayed payments"
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
        "mobil bankacilik",
        "hizmet kesintisi",
        "kesinti",
        "ödeme hatası",
        "transfer sorunu"
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
        "pagamentos digitais",
        "serviço indisponível",
        "fora do ar",
        "pagamentos recusados"
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
        "e-invoicing",
        "pasarela de pago",
        "pasarelas de pago"
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
        "tokenised deposits",
        "payment processing",
        "procesamiento de pagos"
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
        "quarterly results",
        "acquires",
        "para comprar la empresa",
        "adquiere la empresa",
        "compra de la compañía"
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
        "retirement",
        "familiares y amigos",
        "friends and family"
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
        "tips for",
        "why",
        "por qué",
        "cómo la",
        "como la",
        "survey",
        "surveyed",
        "study finds",
        "report",
        "trends in",
        "data shows"
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
          "terms": [
            "posicion global",
            "financial dashboard",
            "dashboard",
            "home banking",
            "digital banking solution",
            "corporate banking platform",
            "app itau empresas",
            "banca digital empresarial"
          ],
          "context": [
            "dashboard",
            "posición global",
            "posicion global",
            "visión integral",
            "vision integral",
            "vista global",
            "posicion de productos",
            "posición de productos",
            "account overview",
            "financial overview",
            "product overview",
            "aggregate",
            "aggregated"
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
          "terms": [
            "landing de cuentas",
            "dashboard de cuentas",
            "visión integral de cuentas",
            "aggregate accounts"
          ]
        },
        {
          "id": "02.02",
          "terms": [
            "movimientos de cuenta",
            "account transactions"
          ]
        },
        {
          "id": "02.03",
          "terms": [
            "estado de cuenta",
            "account statement"
          ]
        },
        {
          "id": "02.04",
          "terms": []
        },
        {
          "id": "02.05",
          "terms": [
            "camt053",
            "camt.053",
            "cuaderno 43"
          ]
        },
        {
          "id": "02.06",
          "terms": [
            "multicash",
            "bai-2"
          ]
        },
        {
          "id": "02.07",
          "terms": []
        },
        {
          "id": "02.08",
          "terms": []
        },
        {
          "id": "02.09",
          "terms": [
            "cash pooling",
            "centralizacion de cuentas"
          ]
        },
        {
          "id": "02.10",
          "terms": []
        },
        {
          "id": "02.11",
          "terms": [
            "agregacion de cuentas",
            "account aggregation",
            "multibank"
          ]
        },
        {
          "id": "02.12",
          "terms": []
        },
        {
          "id": "02.13",
          "terms": []
        },
        {
          "id": "02.14",
          "terms": [
            "segunda cuenta",
            "additional account"
          ]
        },
        {
          "id": "02.15",
          "terms": []
        },
        {
          "id": "02.16",
          "terms": []
        },
        {
          "id": "02.17",
          "terms": []
        },
        {
          "id": "02.18",
          "terms": []
        },
        {
          "id": "02.19",
          "terms": []
        },
        {
          "id": "02.20",
          "terms": []
        },
        {
          "id": "02.21",
          "terms": []
        }
      ],
      "emerging": [
        {
          "name": "Depósitos tokenizados",
          "terms": [
            "depositos tokenizados",
            "deposito tokenizado",
            "tokenized deposits",
            "tokenised deposits",
            "tokenized deposit",
            "tokenised deposit"
          ]
        }
      ]
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
          "terms": [
            "landing de pagos",
            "dashboard de pagos",
            "visión integral de pagos",
            "aggregate payments"
          ]
        },
        {
          "id": "03.02",
          "terms": []
        },
        {
          "id": "03.03",
          "terms": []
        },
        {
          "id": "03.04",
          "terms": []
        },
        {
          "id": "03.05",
          "terms": []
        },
        {
          "id": "03.06",
          "terms": [
            "transferencias masivas",
            "bulk transfers",
            "bulk payments"
          ]
        },
        {
          "id": "03.07",
          "terms": []
        },
        {
          "id": "03.08",
          "terms": []
        },
        {
          "id": "03.09",
          "terms": [
            "pagos vostro",
            "vostro payments",
            "cuentas vostro",
            "vostro accounts"
          ]
        },
        {
          "id": "03.10",
          "terms": []
        },
        {
          "id": "03.11",
          "terms": []
        },
        {
          "id": "03.12",
          "terms": []
        },
        {
          "id": "03.13",
          "terms": [
            "transferencias internacionales",
            "cross-border payments",
            "international transfers",
            "international payments",
            "pagos internacionales",
            "cross border payments",
            "international remittances",
            "remesas internacionales",
            "cross-border real-time payments",
            "x-border real-time payments",
            "cross border real time payments"
          ]
        },
        {
          "id": "03.14",
          "terms": [
            "transferencias masivas internacionales",
            "international bulk payments",
            "bulk international transfers",
            "cross-border bulk payments"
          ]
        },
        {
          "id": "03.15",
          "terms": []
        },
        {
          "id": "03.16",
          "terms": [
            "pago a proveedores",
            "supplier payments"
          ]
        },
        {
          "id": "03.17",
          "terms": []
        },
        {
          "id": "03.18",
          "terms": [
            "pagos programados",
            "scheduled payments",
            "recurring payments"
          ]
        },
        {
          "id": "03.19",
          "terms": []
        },
        {
          "id": "03.20",
          "terms": []
        },
        {
          "id": "03.21",
          "terms": [
            "transferencias en streaming"
          ]
        },
        {
          "id": "03.22",
          "terms": []
        },
        {
          "id": "03.23",
          "terms": []
        },
        {
          "id": "03.24",
          "terms": []
        },
        {
          "id": "03.25",
          "terms": [
            "iniciacion de pagos",
            "payment initiation"
          ]
        },
        {
          "id": "03.26",
          "terms": []
        },
        {
          "id": "03.27",
          "terms": [
            "swift gpi",
            "swift-gpi"
          ],
          "context": [
            "tracking",
            "trazabilidad",
            "seguimiento",
            "swift gpi",
            "swift-gpi",
            "payment trace",
            "track transfers"
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
            "stablecoin transfers",
            "stablecoin payouts",
            "stablecoin",
            "stablecoins"
          ],
          "context": [
            "pago",
            "pagos",
            "payment",
            "payments",
            "settlement",
            "liquidación",
            "treasury",
            "tesorería",
            "merchant",
            "comercio",
            "tarjetas",
            "cards",
            "remesas",
            "remittance",
            "transfer",
            "transferencias",
            "checkout",
            "payouts",
            "accept stablecoins",
            "aceptar stablecoins",
            "conversion",
            "interoperability"
          ],
          "exclude": [
            "share price",
            "stock price",
            "net profit"
          ]
        },
        {
          "name": "Pagos agénticos",
          "terms": [
            "agentic payments",
            "agentic payment",
            "pagos agénticos",
            "pagos agenticos",
            "pago agéntico",
            "pago agentico",
            "pagos desde chatgpt",
            "pago real con inteligencia artificial",
            "agentes de pago",
            "ai-agent payments",
            "ai agent payments",
            "pagos con ia",
            "pagos de agentes de ia",
            "pago real con un agente",
            "pago real con inteligencia artificial"
          ],
          "context": [
            "pago",
            "pagos",
            "payment",
            "payments",
            "checkout",
            "transacción",
            "transaction",
            "micropayments"
          ],
          "exclude": [
            "trading bots",
            "price prediction"
          ]
        },
        {
          "name": "Pagos con moneda digital de banco central (CBDC)",
          "terms": [
            "digital rupee",
            "rupia digital",
            "digital euro payments",
            "pagos con euro digital",
            "cbdc payments",
            "pagos con cbdc"
          ],
          "context": [
            "pago",
            "pagos",
            "payments",
            "payment",
            "checkout",
            "merchant",
            "corporate",
            "empresa",
            "empresas",
            "allowances",
            "offline"
          ],
          "exclude": [
            "price prediction",
            "share price"
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
          "terms": [
            "nóminas en tiempo real",
            "dashboard de nóminas en tiempo real",
            "visión integral de nóminas en tiempo real",
            "aggregate payroll"
          ]
        },
        {
          "id": "04.02",
          "terms": [
            "tracking de nominas",
            "payroll tracking"
          ]
        },
        {
          "id": "04.03",
          "terms": []
        },
        {
          "id": "04.04",
          "terms": []
        },
        {
          "id": "04.05",
          "terms": []
        },
        {
          "id": "04.06",
          "terms": []
        },
        {
          "id": "04.07",
          "terms": []
        },
        {
          "id": "04.08",
          "terms": []
        },
        {
          "id": "04.09",
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
          "terms": [
            "datos fiscales",
            "tax information"
          ]
        },
        {
          "id": "05.02",
          "terms": []
        },
        {
          "id": "05.03",
          "terms": []
        },
        {
          "id": "05.04",
          "terms": []
        },
        {
          "id": "05.05",
          "terms": []
        },
        {
          "id": "05.06",
          "terms": []
        },
        {
          "id": "05.07",
          "terms": []
        },
        {
          "id": "05.08",
          "terms": [
            "customs duty",
            "customs tax",
            "customs payments",
            "impuestos aduanales",
            "pago de aduanas",
            "icegate"
          ]
        },
        {
          "id": "05.09",
          "terms": []
        },
        {
          "id": "05.10",
          "terms": []
        },
        {
          "id": "05.11",
          "terms": []
        },
        {
          "id": "05.12",
          "terms": []
        },
        {
          "id": "05.13",
          "terms": []
        },
        {
          "id": "05.14",
          "terms": []
        },
        {
          "id": "05.15",
          "terms": []
        },
        {
          "id": "05.16",
          "terms": []
        },
        {
          "id": "05.17",
          "terms": []
        },
        {
          "id": "05.18",
          "terms": []
        },
        {
          "id": "05.19",
          "terms": []
        },
        {
          "id": "05.20",
          "terms": []
        },
        {
          "id": "05.21",
          "terms": []
        },
        {
          "id": "05.22",
          "terms": []
        },
        {
          "id": "05.23",
          "terms": [
            "impuestos provinciales",
            "provincial tax",
            "state tax payments"
          ]
        },
        {
          "id": "05.24",
          "terms": []
        },
        {
          "id": "05.25",
          "terms": []
        },
        {
          "id": "05.26",
          "terms": [
            "impuestos masivos",
            "bulk tax payments"
          ]
        },
        {
          "id": "05.27",
          "terms": []
        }
      ],
      "emerging": [
        {
          "name": "Pagos de impuestos F24 / I24",
          "terms": [
            "pagamenti f24",
            "pagamenti f24 e i24",
            "impuestos f24",
            "f24 tax",
            "f24 e i24",
            "f24 e tasso"
          ]
        }
      ]
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
          "terms": [
            "pagos individuales cie o servicios/recibos no domicilados",
            "dashboard de pagos individuales cie o servicios/recibos no domicilados",
            "visión integral de pagos individuales cie o servicios/recibos no domicilados",
            "aggregate payments"
          ]
        },
        {
          "id": "06.02",
          "terms": []
        },
        {
          "id": "06.03",
          "terms": [
            "pse pagos"
          ]
        },
        {
          "id": "06.04",
          "terms": []
        },
        {
          "id": "06.05",
          "terms": []
        },
        {
          "id": "06.06",
          "terms": [
            "request to pay",
            "request-to-pay",
            "solicitud de pago"
          ],
          "context": [
            "request to pay",
            "request-to-pay",
            "solicitud de pago",
            "petición de pago",
            "payment request",
            "codi"
          ]
        },
        {
          "id": "06.07",
          "terms": []
        },
        {
          "id": "06.08",
          "terms": []
        },
        {
          "id": "06.09",
          "terms": [
            "mandatos sepa",
            "sepa mandates"
          ]
        },
        {
          "id": "06.10",
          "terms": []
        },
        {
          "id": "06.11",
          "terms": []
        },
        {
          "id": "06.12",
          "terms": [
            "contratacion de domiciliaciones"
          ]
        },
        {
          "id": "06.13",
          "terms": []
        },
        {
          "id": "06.14",
          "terms": []
        },
        {
          "id": "06.15",
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
          "terms": [
            "landing de cobros",
            "dashboard de cobros",
            "visión integral de cobros",
            "aggregate collections"
          ]
        },
        {
          "id": "07.02",
          "terms": [
            "adeudos directos",
            "direct debit",
            "debito automatico"
          ]
        },
        {
          "id": "07.03",
          "terms": []
        },
        {
          "id": "07.04",
          "terms": []
        },
        {
          "id": "07.05",
          "terms": []
        },
        {
          "id": "07.06",
          "terms": []
        },
        {
          "id": "07.07",
          "terms": []
        },
        {
          "id": "07.08",
          "terms": []
        },
        {
          "id": "07.09",
          "terms": []
        },
        {
          "id": "07.10",
          "terms": [
            "transferencias nacionales recibidas"
          ]
        },
        {
          "id": "07.11",
          "terms": [
            "transferencias internacionales recibidas"
          ]
        },
        {
          "id": "07.12",
          "terms": []
        },
        {
          "id": "07.13",
          "terms": []
        },
        {
          "id": "07.14",
          "terms": []
        },
        {
          "id": "07.15",
          "terms": []
        },
        {
          "id": "07.16",
          "terms": []
        },
        {
          "id": "07.17",
          "terms": []
        },
        {
          "id": "07.18",
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
          "terms": [
            "landing de financiación",
            "dashboard de financiación",
            "visión integral de financiación",
            "aggregate financing"
          ]
        },
        {
          "id": "08.02",
          "terms": [
            "credito virtual",
            "virtual credit"
          ]
        },
        {
          "id": "08.03",
          "terms": []
        },
        {
          "id": "08.04",
          "terms": []
        },
        {
          "id": "08.05",
          "terms": []
        },
        {
          "id": "08.06",
          "terms": [
            "fastcash",
            "fast cash"
          ]
        },
        {
          "id": "08.07",
          "terms": []
        },
        {
          "id": "08.08",
          "terms": []
        },
        {
          "id": "08.09",
          "terms": []
        },
        {
          "id": "08.10",
          "terms": [
            "linea de credito digital",
            "digital credit line",
            "ocdl"
          ]
        },
        {
          "id": "08.11",
          "terms": [
            "cupo rotativo",
            "revolving credit"
          ]
        },
        {
          "id": "08.12",
          "terms": [
            "prestamo empresarial",
            "business loan",
            "credito simple"
          ]
        },
        {
          "id": "08.13",
          "terms": [
            "click and pay"
          ],
          "context": [
            "financiación",
            "financiamiento",
            "amortización",
            "preautorizado",
            "financing",
            "credit line",
            "loan"
          ]
        },
        {
          "id": "08.14",
          "terms": []
        },
        {
          "id": "08.15",
          "terms": []
        },
        {
          "id": "08.16",
          "terms": [
            "anticipo confirming",
            "reverse factoring advances"
          ]
        },
        {
          "id": "08.17",
          "terms": [
            "crediproveedor pyme"
          ]
        },
        {
          "id": "08.18",
          "terms": []
        },
        {
          "id": "08.19",
          "terms": [
            "descuento mercantil"
          ]
        },
        {
          "id": "08.20",
          "terms": []
        },
        {
          "id": "08.21",
          "terms": [
            "leasing"
          ]
        },
        {
          "id": "08.22",
          "terms": [
            "renting"
          ]
        },
        {
          "id": "08.23",
          "terms": []
        },
        {
          "id": "08.24",
          "terms": [
            "simulador de credito"
          ]
        },
        {
          "id": "08.25",
          "terms": [
            "prestamo tpv",
            "merchant cash advance"
          ]
        },
        {
          "id": "08.26",
          "terms": []
        },
        {
          "id": "08.27",
          "terms": []
        },
        {
          "id": "08.28",
          "terms": [
            "prestamo online negocio",
            "online business loan"
          ]
        },
        {
          "id": "08.29",
          "terms": [
            "credito pyme digital"
          ]
        },
        {
          "id": "08.30",
          "terms": []
        },
        {
          "id": "08.31",
          "terms": [
            "credito digital flexible"
          ]
        },
        {
          "id": "08.32",
          "terms": []
        },
        {
          "id": "08.33",
          "terms": [
            "solicitud de aval",
            "digital bank guarantee"
          ]
        },
        {
          "id": "08.34",
          "terms": []
        },
        {
          "id": "08.35",
          "terms": []
        },
        {
          "id": "08.36",
          "terms": []
        },
        {
          "id": "08.37",
          "terms": []
        },
        {
          "id": "08.38",
          "terms": []
        },
        {
          "id": "08.39",
          "terms": []
        },
        {
          "id": "08.40",
          "terms": []
        },
        {
          "id": "08.41",
          "terms": [
            "factoring digital",
            "invoice financing",
            "descuento de facturas"
          ]
        },
        {
          "id": "08.42",
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
          "terms": [
            "landing de tarjetas/ listado de tarjetas",
            "dashboard de tarjetas/ listado de tarjetas",
            "visión integral de tarjetas/ listado de tarjetas",
            "aggregate cards"
          ]
        },
        {
          "id": "09.02",
          "terms": []
        },
        {
          "id": "09.03",
          "terms": []
        },
        {
          "id": "09.04",
          "terms": []
        },
        {
          "id": "09.05",
          "terms": []
        },
        {
          "id": "09.06",
          "terms": [
            "bloquear tarjeta de credito",
            "credit card freeze"
          ]
        },
        {
          "id": "09.07",
          "terms": []
        },
        {
          "id": "09.08",
          "terms": []
        },
        {
          "id": "09.09",
          "terms": [],
          "context": [
            "pago de tarjeta",
            "pago de la tarjeta",
            "pagar la tarjeta",
            "pagar tarjeta",
            "pago mínimo",
            "saldar",
            "deuda de tarjeta",
            "card bill",
            "credit card bill",
            "card repayment",
            "repay credit card"
          ]
        },
        {
          "id": "09.10",
          "terms": [
            "bloquear tarjeta de debito",
            "debit card freeze"
          ]
        },
        {
          "id": "09.11",
          "terms": []
        },
        {
          "id": "09.12",
          "terms": []
        },
        {
          "id": "09.13",
          "terms": []
        },
        {
          "id": "09.14",
          "terms": []
        },
        {
          "id": "09.15",
          "terms": []
        },
        {
          "id": "09.16",
          "terms": []
        },
        {
          "id": "09.17",
          "terms": []
        },
        {
          "id": "09.18",
          "terms": []
        },
        {
          "id": "09.19",
          "terms": []
        },
        {
          "id": "09.20",
          "terms": [
            "cvv dinamico",
            "dynamic cvv"
          ]
        },
        {
          "id": "09.21",
          "terms": []
        },
        {
          "id": "09.22",
          "terms": []
        },
        {
          "id": "09.23",
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
          "terms": [
            "carta de credito de exportacion",
            "export letter of credit"
          ]
        },
        {
          "id": "10.02",
          "terms": [
            "carta de credito de importacion",
            "import letter of credit"
          ]
        },
        {
          "id": "10.03",
          "terms": []
        },
        {
          "id": "10.04",
          "terms": [
            "financiacion de importaciones",
            "export finance"
          ]
        },
        {
          "id": "10.05",
          "terms": [
            "cambio de divisas",
            "foreign exchange",
            "currency exchange"
          ]
        },
        {
          "id": "10.06",
          "terms": []
        },
        {
          "id": "10.07",
          "terms": [
            "digital trade loan",
            "digital trade finance",
            "trade finance platform"
          ]
        },
        {
          "id": "10.08",
          "terms": []
        },
        {
          "id": "10.09",
          "terms": []
        },
        {
          "id": "10.10",
          "terms": []
        },
        {
          "id": "10.11",
          "terms": []
        },
        {
          "id": "10.12",
          "terms": [
            "t-cambio"
          ]
        },
        {
          "id": "10.13",
          "terms": []
        },
        {
          "id": "10.14",
          "terms": []
        }
      ],
      "emerging": [
        {
          "name": "Automatización documental de trade finance",
          "terms": [
            "automate trade finance",
            "trade finance automation",
            "trade finance overhaul",
            "ai across trade finance",
            "ai deal for trade finance",
            "cleareye"
          ]
        }
      ]
    },
    {
      "name": "11.Adquirencia / TPVs",
      "terms": [
        "adquirencia",
        "acquiring",
        "tpv",
        "pos",
        "checkout",
        "merchant services",
        "softpos",
        "tap to phone",
        "tap to pay",
        "punto de venta móvil",
        "cobro al toque"
      ],
      "functions": [
        {
          "id": "11.01",
          "terms": [
            "landing tpvs (reportería tpvs)",
            "dashboard de tpvs (reportería tpvs)",
            "visión integral de tpvs (reportería tpvs)",
            "aggregate terminals"
          ]
        },
        {
          "id": "11.02",
          "terms": [
            "contratacion tpv",
            "digital merchant onboarding",
            "merchant acquiring onboarding",
            "alta de comercio",
            "afiliación de comercios"
          ],
          "context": [
            "alta de comercio",
            "afiliación",
            "afiliacion",
            "contratación",
            "contratacion",
            "merchant onboarding",
            "merchant registration",
            "merchant acquiring onboarding",
            "new payment terminal",
            "solicitar tpv",
            "solicitud tpv"
          ]
        },
        {
          "id": "11.03",
          "terms": []
        },
        {
          "id": "11.04",
          "terms": []
        },
        {
          "id": "11.05",
          "terms": []
        },
        {
          "id": "11.06",
          "terms": [
            "commerce 360"
          ]
        },
        {
          "id": "11.07",
          "terms": [],
          "context": [
            "argentina",
            "bbva smart"
          ]
        }
      ],
      "emerging": [
        {
          "name": "Cobro con móvil (SoftPOS)",
          "terms": [
            "cobro al toque",
            "cobro al toque bbva",
            "softpos",
            "tap to phone",
            "tap on phone",
            "smartphone payment terminal",
            "móvil como tpv",
            "movil como tpv",
            "tap-to-phone",
            "tap-on-phone",
            "phones into contactless payment terminals"
          ],
          "primary": true,
          "primaryTerms": [
            "cobro al toque"
          ],
          "context": [
            "cobro",
            "cobros",
            "merchant",
            "comercio",
            "terminal",
            "phone",
            "smartphone",
            "móvil",
            "tpv",
            "accept payments",
            "payment acceptance"
          ]
        },
        {
          "name": "Cobros biométricos en comercios",
          "terms": [
            "pay with smile",
            "facial recognition checkout",
            "facial recognition payments",
            "biometric checkout",
            "pagos biométricos",
            "pagos biometricos",
            "face pay"
          ],
          "context": [
            "comercio",
            "comercios",
            "merchant",
            "checkout",
            "store",
            "stores",
            "terminal",
            "pos",
            "purchases",
            "pay with smile"
          ]
        }
      ]
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
          "terms": [
            "inversión libre patrimonial",
            "dashboard de inversión libre patrimonial",
            "visión integral de inversión libre patrimonial",
            "aggregate investments"
          ]
        },
        {
          "id": "12.02",
          "terms": []
        },
        {
          "id": "12.03",
          "terms": []
        },
        {
          "id": "12.04",
          "terms": [
            "depositos a plazo",
            "term deposit",
            "time deposit"
          ]
        },
        {
          "id": "12.05",
          "terms": [
            "fondos de inversion",
            "investment funds"
          ]
        },
        {
          "id": "12.06",
          "terms": []
        },
        {
          "id": "12.07",
          "terms": [
            "mercados globales",
            "global markets",
            "mesa de tesoreria",
            "trading desk",
            "trading algoritmico",
            "trader algoritmico",
            "algorithmic trading"
          ]
        },
        {
          "id": "12.08",
          "terms": []
        },
        {
          "id": "12.09",
          "terms": []
        },
        {
          "id": "12.10",
          "terms": [
            "custodia de valores",
            "securities custody",
            "custody",
            "custodia"
          ]
        },
        {
          "id": "12.11",
          "terms": []
        },
        {
          "id": "12.12",
          "terms": []
        },
        {
          "id": "12.13",
          "terms": [
            "broker"
          ]
        },
        {
          "id": "12.14",
          "terms": []
        },
        {
          "id": "12.15",
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
          "terms": [
            "finanzas inteligentes",
            "factura empresarial"
          ]
        },
        {
          "id": "13.03",
          "terms": [
            "analisis financiero",
            "financial analysis"
          ]
        },
        {
          "id": "13.04",
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
          "terms": [
            "landing de seguros",
            "dashboard de seguros",
            "visión integral de seguros",
            "aggregate insurance"
          ]
        },
        {
          "id": "14.02",
          "terms": [
            "ciberseguro",
            "ciber seguro",
            "cyber insurance"
          ]
        },
        {
          "id": "14.03",
          "terms": []
        },
        {
          "id": "14.04",
          "terms": [
            "autoseguro pyme"
          ]
        },
        {
          "id": "14.05",
          "terms": []
        },
        {
          "id": "14.06",
          "terms": []
        },
        {
          "id": "14.07",
          "terms": []
        },
        {
          "id": "14.08",
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
          "terms": [
            "agenda de beneficiarios",
            "beneficiary management"
          ]
        },
        {
          "id": "15.02",
          "terms": []
        },
        {
          "id": "15.03",
          "terms": []
        },
        {
          "id": "15.04",
          "terms": []
        },
        {
          "id": "15.05",
          "terms": [
            "fideicomisos",
            "trust management"
          ]
        },
        {
          "id": "15.06",
          "terms": [
            "expediente digital",
            "gestion documental",
            "document management"
          ]
        },
        {
          "id": "15.07",
          "terms": []
        },
        {
          "id": "15.08",
          "terms": []
        },
        {
          "id": "15.09",
          "terms": []
        },
        {
          "id": "15.10",
          "terms": []
        },
        {
          "id": "15.11",
          "terms": [
            "archivos cifrados",
            "encrypted files"
          ]
        },
        {
          "id": "15.12",
          "terms": []
        },
        {
          "id": "15.13",
          "terms": [
            "mis conversaciones",
            "secure messaging"
          ]
        },
        {
          "id": "15.14",
          "terms": []
        },
        {
          "id": "15.15",
          "terms": []
        },
        {
          "id": "15.16",
          "terms": [
            "multiempresa",
            "multi-company"
          ]
        },
        {
          "id": "15.18",
          "terms": []
        },
        {
          "id": "15.19",
          "terms": [
            "comprobantes",
            "payment receipts"
          ],
          "context": [
            "descarga",
            "descargar",
            "download",
            "transaction receipt",
            "comprobante de operación",
            "comprobante de operacion",
            "comprobante de transferencia",
            "comprobante de pago",
            "payment receipt",
            "justificante bancario"
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
          "terms": [
            "login biometrico",
            "biometria",
            "biometricos",
            "biometric",
            "biometrics",
            "facial recognition"
          ],
          "context": [
            "login",
            "log in",
            "log-in",
            "inicio de sesión",
            "iniciar sesión",
            "acceso al canal",
            "acceso a la app",
            "sign in",
            "sign-in",
            "signing in",
            "authentication",
            "autenticación",
            "passkey",
            "sesión biométrica"
          ]
        },
        {
          "id": "16.02",
          "terms": [],
          "context": [
            "coexistencia",
            "coexistence"
          ]
        },
        {
          "id": "16.03",
          "terms": [
            "recuperar contrasena",
            "password recovery"
          ]
        },
        {
          "id": "16.04",
          "terms": [
            "consentimientos",
            "consent management"
          ]
        },
        {
          "id": "16.05",
          "terms": [
            "firma electronica",
            "electronic signature",
            "e-signature",
            "autorizar operaciones",
            "autorización de pagos",
            "autorizacion de pagos",
            "payment authorization",
            "approve transactions",
            "transaction signing",
            "biometric payment authorization"
          ]
        },
        {
          "id": "16.06",
          "terms": [
            "firmas pendientes",
            "pending approvals"
          ]
        },
        {
          "id": "16.07",
          "terms": []
        },
        {
          "id": "16.08",
          "terms": [
            "softtoken",
            "softoken",
            "soft token"
          ]
        },
        {
          "id": "16.09",
          "terms": []
        },
        {
          "id": "16.10",
          "terms": [
            "onboarding digital",
            "digital onboarding",
            "onboarding empresas",
            "kyb",
            "kyc",
            "onboarding"
          ],
          "context": [
            "empresa",
            "empresas",
            "pymes",
            "corporate",
            "enterprise",
            "sme",
            "smes",
            "business account",
            "business banking",
            "personas jurídicas",
            "persona jurídica",
            "sociedades"
          ]
        },
        {
          "id": "16.11",
          "terms": [
            "firma diferida"
          ]
        },
        {
          "id": "16.12",
          "terms": []
        },
        {
          "id": "16.13",
          "terms": [
            "firma out of band",
            "out-of-band signing"
          ]
        },
        {
          "id": "16.14",
          "terms": [
            "login out of band"
          ]
        },
        {
          "id": "16.15",
          "terms": []
        },
        {
          "id": "16.16",
          "terms": []
        },
        {
          "id": "16.17",
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
          "terms": [
            "preguntas frecuentes",
            "faqs"
          ]
        },
        {
          "id": "17.02",
          "terms": []
        },
        {
          "id": "17.03",
          "terms": []
        },
        {
          "id": "17.04",
          "terms": [
            "notificaciones",
            "notifications"
          ]
        },
        {
          "id": "17.05",
          "terms": []
        },
        {
          "id": "17.06",
          "terms": [
            "roles y permisos",
            "user permissions",
            "multiusuario",
            "multi-level approvals"
          ]
        },
        {
          "id": "17.07",
          "terms": []
        },
        {
          "id": "17.09",
          "terms": [
            "mensajeria a beneficiarios"
          ]
        },
        {
          "id": "17.10",
          "terms": []
        },
        {
          "id": "17.11",
          "terms": []
        },
        {
          "id": "17.12",
          "terms": [
            "auditoria del canal",
            "channel audit"
          ]
        },
        {
          "id": "17.13",
          "terms": []
        },
        {
          "id": "17.14",
          "terms": []
        },
        {
          "id": "17.15",
          "terms": [
            "h2h",
            "host to host",
            "host-to-host"
          ]
        },
        {
          "id": "17.16",
          "terms": [
            "api bancaria",
            "banking api",
            "open banking",
            "open finance",
            "api",
            "apis",
            "integracion erp",
            "erp integration",
            "mcp",
            "model context protocol",
            "embedded finance",
            "integracion contable",
            "accounting integration",
            "integren banca y contabilidad",
            "integracion banca y contabilidad",
            "integra banca y contabilidad"
          ]
        },
        {
          "id": "17.17",
          "terms": []
        }
      ],
      "emerging": [
        {
          "name": "Agentes de IA",
          "terms": [
            "agentes de ia",
            "agente de inteligencia artificial",
            "agentes de inteligencia artificial",
            "ai agents",
            "ai agent",
            "ai-agent",
            "ai-agent rail",
            "agentic ai",
            "personal agent protocol",
            "agentes de inteligencia",
            "agenti e strumenti di ia",
            "agents d'ia"
          ],
          "context": [
            "tesorería",
            "treasury",
            "cash management",
            "banca digital",
            "digital banking",
            "corporate banking",
            "asistente digital",
            "banking assistant"
          ],
          "exclude": [
            "credit assessments",
            "corporate bankers",
            "job cuts",
            "ai summit",
            "training"
          ]
        }
      ]
    },
    {
      "name": "18.Herramientas empleados",
      "terms": [
        "helpdesk",
        "monitor funcional"
      ],
      "functions": [
        {
          "id": "18.01",
          "terms": [
            "helpdesk"
          ]
        },
        {
          "id": "18.02",
          "terms": []
        },
        {
          "id": "18.03",
          "terms": [
            "monitor funcional"
          ]
        },
        {
          "id": "18.04",
          "terms": []
        },
        {
          "id": "18.05",
          "terms": []
        },
        {
          "id": "18.06",
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
          "terms": []
        },
        {
          "id": "19.02",
          "terms": []
        },
        {
          "id": "19.03",
          "terms": []
        },
        {
          "id": "19.04",
          "terms": []
        },
        {
          "id": "19.05",
          "terms": []
        },
        {
          "id": "19.06",
          "terms": []
        },
        {
          "id": "19.07",
          "terms": []
        },
        {
          "id": "19.08",
          "terms": [
            "multiidioma",
            "multilingual"
          ]
        },
        {
          "id": "19.09",
          "terms": [
            "cacheado de datos"
          ]
        },
        {
          "id": "19.10",
          "terms": [
            "modo demo",
            "demo mode"
          ]
        },
        {
          "id": "19.11",
          "terms": []
        },
        {
          "id": "19.12",
          "terms": []
        },
        {
          "id": "19.13",
          "terms": []
        },
        {
          "id": "19.14",
          "terms": [
            "semaas"
          ]
        },
        {
          "id": "19.15",
          "terms": []
        },
        {
          "id": "19.16",
          "terms": []
        },
        {
          "id": "19.17",
          "terms": []
        },
        {
          "id": "19.18",
          "terms": [
            "feature toggles"
          ]
        },
        {
          "id": "19.19",
          "terms": []
        },
        {
          "id": "19.20",
          "terms": [],
          "context": [
            "coexistencia",
            "coexistence"
          ]
        },
        {
          "id": "19.21",
          "terms": [
            "accesibilidad",
            "accessibility"
          ]
        },
        {
          "id": "19.22",
          "terms": []
        },
        {
          "id": "19.23",
          "terms": []
        },
        {
          "id": "19.24",
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
          "terms": []
        },
        {
          "id": "20.02",
          "terms": [
            "retargeting"
          ]
        },
        {
          "id": "20.03",
          "terms": [
            "analitica de navegacion",
            "web analytics"
          ]
        },
        {
          "id": "20.04",
          "terms": [
            "quantum",
            "analitica cualitativa"
          ],
          "exclude": [
            "quantum computing",
            "computación cuántica",
            "ordenador cuántico",
            "quantum computer"
          ]
        },
        {
          "id": "20.05",
          "terms": [
            "deeplink",
            "deep link",
            "deep linking"
          ]
        },
        {
          "id": "20.06",
          "terms": [
            "f30v"
          ]
        },
        {
          "id": "20.07",
          "terms": [
            "tracking code",
            "campaign attribution"
          ]
        },
        {
          "id": "20.08",
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
          "terms": []
        },
        {
          "id": "21.02",
          "terms": [
            "feedback de cliente",
            "customer feedback"
          ]
        }
      ],
      "emerging": []
    }
  ]
};
CONFIGURATION_DEFAULTS.taxonomy=functionalCatalogRules(FUNCTIONAL_CATALOG_SEED,CONFIGURATION_DEFAULTS.taxonomy);Object.freeze(CONFIGURATION_DEFAULTS);
addVocabularyTerms_(CONFIGURATION_DEFAULTS);
