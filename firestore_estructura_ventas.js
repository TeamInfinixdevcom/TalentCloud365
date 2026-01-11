// Estructura de documento para la colección 'ventas' en Firestore
// Incluye ventas de móvil y hogar

/*
Campos requeridos:
- agentId: string (ID del agente)
- orderType: string ("Komercial", "Siebel", "Simo")
- orderNumber: string (número de orden)
- plan: string (nombre del plan/producto)
- planPrice: number (precio base sin impuestos)
- imei: string (opcional, solo para terminales móviles)
- accessorySerial: string (opcional, solo para accesorios móviles)
- customerId: string (cédula del cliente)
- customerPhone: string (opcional, solo para móvil)
- homeNumber: string (opcional, solo para hogar)
- createdAt: timestamp (fecha de registro)
*/

// Ejemplo de documento para móvil
const ventaMovil = {
  agentId: "uid-del-agente",
  orderType: "Komercial",
  orderNumber: "KO-53421499",
  plan: "K1 plus",
  planPrice: 12000,
  imei: "123456789012345",
  accessorySerial: null,
  customerId: "123456789",
  customerPhone: "88889999",
  homeNumber: null,
  createdAt: new Date()
};

// Ejemplo de documento para hogar
const ventaHogar = {
  agentId: "uid-del-agente",
  orderType: "Simo",
  orderNumber: "33620704",
  plan: "Internet 100",
  planPrice: 22571,
  imei: null,
  accessorySerial: null,
  customerId: "123456789",
  customerPhone: null,
  homeNumber: "987654321",
  createdAt: new Date()
};

// Esta estructura servirá como referencia para la colección 'ventas' en Firestore.