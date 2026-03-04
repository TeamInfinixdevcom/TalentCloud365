# API local
 Talent Cloud Instructions
Instrucciones rápidas para la API que inserta ventas en Firestore.

1. Ir a la carpeta `api`:

```powershell
cd c:\Users\rumadr\Desktop\TalentCloud\api
```

2. Instalar dependencias:

```powershell
npm install
```

3. Iniciar la API:

```powershell
npm start
```

La API quedará escuchando en `http://localhost:3001`. Endpoint principal: `POST /ventas`.

Payload mínimo (JSON):

```json
{
  "agenteId": "uid-del-agente",
  "tipoPedido": "Komercial",
  "numeroPedido": "KO-53421499",
  "plan": "K2 plus",
  "cedulaCliente": "123456789",
  "numeroCliente": "88889999",
  "imei": "123456789012345"
}
```

La API agrega automáticamente `planPrice`, `createdAt` y un objeto `projections` con dos tipos de proyección (12 meses y hasta fin de año).

4. Ejecutar localmente con el Firebase Emulator (recomendado para desarrollo)

Instale `firebase-tools` si no lo tiene:

```powershell
npm install -g firebase-tools
```

Inicie el emulador Firestore desde la raíz del proyecto:

```powershell
cd C:\Users\rumadr\Desktop\TalentCloud
firebase emulators:start --only firestore --project talentcloud365
```

En otra terminal exporte la variable de entorno para que el SDK use el emulador y luego inicie la API (Windows PowerShell):

```powershell
$env:FIRESTORE_EMULATOR_HOST = 'localhost:8080'
cd C:\Users\rumadr\Desktop\TalentCloud\api
npm start
```

Con el emulador corriendo, las escrituras irán al emulador local y no requerirán habilitar la API en Google Cloud.

5. Integración con React

Copie `client/src/components/VentaForm.js` a su app React y ajuste `apiUrl` si el servidor corre en otra URL.

6. Endpoints adicionales

- `GET /ventas` — Lista ventas. Query params: `agenteId` (opcional), `limit` (por defecto 20), `startAfterId` (id de documento para paginar). Devuelve `items: [{id,...}]`.
- `GET /metrics` — Muestra métricas agregadas y proyecciones. Query params: `agenteId` (opcional).

Notas sobre ventas de hogar:
- Para ventas de tipo "hogar" (ej. pedidos desde Simo) el formulario y la API aceptan campos adicionales: `homeNumber` (teléfono o número del hogar) y `customerName` (nombre del cliente).
- Además, el cliente puede enviar `planPrice` en el payload (útil cuando el plan de hogar no está en la lista de precios). Si `planPrice` no se envía, la API buscará el precio en su tabla interna; si tampoco está, retornará error y solicitará `planPrice`.

Ejemplo `GET /metrics`:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/metrics' -Method GET
```

Respuesta ejemplo:

```json
{
  "totalPlanRevenue": 1234500,
  "totalProjection12": 14814000,
  "totalProjectionToYearEnd": 617250,
  "accessoriesCount": 12,
  "terminalsCount": 34,
  "ventasCount": 46
}
```
